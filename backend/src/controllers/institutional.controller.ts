import type { Request, Response } from 'express';
import {
  IDIOMAS_INSTITUCIONALES,
  SECCIONES_INSTITUCIONALES,
  obtenerContenidoPublicado,
  obtenerContenidoAdmin,
  crearContenido,
  actualizarContenido,
  eliminarContenido,
  type DatosContenidoInstitucional,
  type IdiomaInstitucional,
  type SeccionInstitucional,
} from '../repositories/institutional.repository.js';

const formatoUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatoSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CODIGO_VIOLACION_UNICA = '23505';
const CODIGO_VIOLACION_LLAVE_FORANEA = '23503';

function esSeccion(valor: string): valor is SeccionInstitucional {
  return (SECCIONES_INSTITUCIONALES as readonly string[]).includes(valor);
}

function esIdioma(valor: unknown): valor is IdiomaInstitucional {
  return (IDIOMAS_INSTITUCIONALES as readonly unknown[]).includes(valor);
}

function codigoError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

// Un enlace puede ser una ruta interna del sitio (/donar) o una URL externa.
function enlaceValido(enlace: string) {
  if (enlace.length > 2048) return false;

  if (enlace.startsWith('/') && !enlace.startsWith('//')) return true;

  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(
      new URL(enlace).protocol
    );
  } catch {
    return false;
  }
}

// La imagen puede ser una ruta del sitio (/obras/foto.jpg) o una URL http(s).
function imagenValida(imagen: string) {
  if (imagen.length > 2048) return false;

  if (imagen.startsWith('/') && !imagen.startsWith('//')) return true;

  try {
    return ['https:', 'http:'].includes(new URL(imagen).protocol);
  } catch {
    return false;
  }
}

function textoOpcional(valor: unknown) {
  return typeof valor === 'string' ? valor.trim() || null : null;
}

// Valida el cuerpo de creación y edición. Devuelve el mensaje de error o los
// datos ya normalizados.
function validarCuerpo(
  body: Record<string, unknown> | undefined
): { error: string } | { datos: DatosContenidoInstitucional } {
  const {
    page_slug,
    language,
    title,
    subtitle,
    subtitle_en,
    content,
    content_en,
    image_url,
    cta_label,
    cta_target,
    display_order,
    is_published,
  } = body ?? {};

  const slug = page_slug === undefined ? 'about' : page_slug;

  if (
    typeof slug !== 'string' ||
    slug.length > 191 ||
    !formatoSlug.test(slug)
  ) {
    return {
      error:
        'La página debe usar minúsculas, números y guiones (hasta 191 caracteres).',
    };
  }

  if (!esIdioma(language)) {
    return { error: "El idioma debe ser 'es' o 'en'." };
  }

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 255
  ) {
    return { error: 'El título debe contener entre 1 y 255 caracteres.' };
  }

  if (
    typeof content !== 'string' ||
    !content.trim() ||
    content.trim().length > 20000
  ) {
    return { error: 'El contenido debe contener entre 1 y 20000 caracteres.' };
  }

  if (
    (subtitle != null && typeof subtitle !== 'string') ||
    (cta_label != null && typeof cta_label !== 'string') ||
    (cta_target != null && typeof cta_target !== 'string')
  ) {
    return { error: 'El subtítulo y el botón deben ser texto.' };
  }

  const subtitulo = textoOpcional(subtitle);
  const etiquetaBoton = textoOpcional(cta_label);
  const destinoBoton = textoOpcional(cta_target);

  if (subtitulo && subtitulo.length > 1000) {
    return { error: 'El subtítulo admite hasta 1000 caracteres.' };
  }

  if (etiquetaBoton && etiquetaBoton.length > 150) {
    return { error: 'El texto del botón admite hasta 150 caracteres.' };
  }

  if (Boolean(etiquetaBoton) !== Boolean(destinoBoton)) {
    return { error: 'El botón requiere texto y destino, o ninguno de los dos.' };
  }

  if (destinoBoton && !enlaceValido(destinoBoton)) {
    return {
      error:
        'El destino del botón debe ser una ruta del sitio (/ruta) o una URL con https:, http:, mailto: o tel: de hasta 2048 caracteres.',
    };
  }

  if (image_url != null && typeof image_url !== 'string') {
    return { error: 'La imagen debe ser texto.' };
  }

  const imagen = textoOpcional(image_url);

  if (imagen && !imagenValida(imagen)) {
    return {
      error:
        'La imagen debe ser una ruta del sitio (/ruta) o una URL con https: o http: de hasta 2048 caracteres.',
    };
  }

  const orden = display_order === undefined ? 0 : display_order;

  if (
    typeof orden !== 'number' ||
    !Number.isInteger(orden) ||
    orden < 0 ||
    orden > 2147483647
  ) {
    return {
      error: 'El orden debe ser un número entero entre 0 y 2147483647.',
    };
  }

  if (typeof is_published !== 'boolean') {
    return { error: 'La visibilidad debe ser true o false.' };
  }

  return {
    datos: {
      page_slug: slug,
      language,
      title: title.trim(),
      subtitle: subtitulo,
      subtitle_en: textoOpcional(subtitle_en),
      content: content.trim(),
      content_en: textoOpcional(content_en),
      image_url: imagen,
      cta_label: etiquetaBoton,
      cta_target: destinoBoton,
      display_order: orden,
      is_published,
    },
  };
}

function responderSeccionInvalida(res: Response) {
  res.status(404).json({
    message: `La sección no existe. Use: ${SECCIONES_INSTITUCIONALES.join(', ')}.`,
  });
}

export async function consultarContenidoPublico(
  req: Request<{ section: string }>,
  res: Response
) {
  const { section } = req.params;

  if (!esSeccion(section)) {
    responderSeccionInvalida(res);
    return;
  }

  const idioma = req.query.lang ?? 'es';

  if (!esIdioma(idioma)) {
    res.status(400).json({ message: "El idioma debe ser 'es' o 'en'." });
    return;
  }

  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json(await obtenerContenidoPublicado(section, idioma));
  } catch (error) {
    console.error('Error al consultar contenido institucional:', error);

    res.status(500).json({
      message: 'No se pudo obtener el contenido institucional.',
    });
  }
}

export async function listarContenidoAdmin(
  req: Request<{ section: string }>,
  res: Response
) {
  const { section } = req.params;

  if (!esSeccion(section)) {
    responderSeccionInvalida(res);
    return;
  }

  try {
    res.status(200).json(await obtenerContenidoAdmin(section));
  } catch (error) {
    console.error('Error al listar contenido institucional:', error);

    res.status(500).json({
      message: 'No se pudo obtener el contenido institucional.',
    });
  }
}

export async function registrarContenido(
  req: Request<{ section: string }>,
  res: Response
) {
  const { section } = req.params;

  if (!esSeccion(section)) {
    responderSeccionInvalida(res);
    return;
  }

  const validacion = validarCuerpo(req.body);

  if ('error' in validacion) {
    res.status(400).json({ message: validacion.error });
    return;
  }

  try {
    const contenido = await crearContenido(
      section,
      validacion.datos,
      req.user!.userId,
      req.ip ?? null
    );

    res.status(201).json({
      message: 'Contenido creado correctamente.',
      contenido,
    });
  } catch (error) {
    if (codigoError(error) === CODIGO_VIOLACION_UNICA) {
      res.status(409).json({
        message:
          'Ya existe contenido para esa página e idioma en esta sección. Edítelo en lugar de crear otro.',
      });
      return;
    }

    console.error('Error al crear contenido institucional:', error);

    res.status(500).json({
      message: 'No se pudo crear el contenido institucional.',
    });
  }
}

export async function modificarContenido(
  req: Request<{ section: string; id: string }>,
  res: Response
) {
  const { section, id } = req.params;

  if (!esSeccion(section)) {
    responderSeccionInvalida(res);
    return;
  }

  if (!formatoUUID.test(id)) {
    res.status(400).json({
      message: 'El identificador del contenido no es válido.',
    });
    return;
  }

  const validacion = validarCuerpo(req.body);

  if ('error' in validacion) {
    res.status(400).json({ message: validacion.error });
    return;
  }

  try {
    const contenido = await actualizarContenido(
      id,
      section,
      validacion.datos,
      req.user!.userId,
      req.ip ?? null
    );

    if (!contenido) {
      res.status(404).json({ message: 'El contenido no existe.' });
      return;
    }

    res.status(200).json({
      message: 'Contenido actualizado correctamente.',
      contenido,
    });
  } catch (error) {
    if (codigoError(error) === CODIGO_VIOLACION_UNICA) {
      res.status(409).json({
        message:
          'Ya existe contenido para esa página e idioma en esta sección.',
      });
      return;
    }

    console.error('Error al actualizar contenido institucional:', error);

    res.status(500).json({
      message: 'No se pudo actualizar el contenido institucional.',
    });
  }
}

export async function borrarContenido(
  req: Request<{ section: string; id: string }>,
  res: Response
) {
  const { section, id } = req.params;

  if (!esSeccion(section)) {
    responderSeccionInvalida(res);
    return;
  }

  if (!formatoUUID.test(id)) {
    res.status(400).json({
      message: 'El identificador del contenido no es válido.',
    });
    return;
  }

  try {
    const eliminado = await eliminarContenido(
      id,
      section,
      req.user!.userId,
      req.ip ?? null
    );

    if (!eliminado) {
      res.status(404).json({ message: 'El contenido no existe.' });
      return;
    }

    res.status(200).json({ message: 'Contenido eliminado correctamente.' });
  } catch (error) {
    if (codigoError(error) === CODIGO_VIOLACION_LLAVE_FORANEA) {
      res.status(409).json({
        message:
          'El contenido tiene recursos multimedia asociados. Elimine o desvincule las imágenes, o retire el contenido en lugar de borrarlo.',
      });
      return;
    }

    console.error('Error al eliminar contenido institucional:', error);

    res.status(500).json({
      message: 'No se pudo eliminar el contenido institucional.',
    });
  }
}
