import type { Request, Response } from 'express';
import {
  listarMedia,
  obtenerMedia,
  existeLlave,
  registrarMedia,
  actualizarMedia,
  eliminarMedia,
  type AsociacionMedia,
} from '../repositories/media.repository.js';
import {
  AlmacenamientoNoConfiguradoError,
  EXPIRACION_URL_SEGUNDOS,
  FORMATO_LLAVE,
  consultarObjeto,
  eliminarObjeto,
  esImagen,
  generarLlave,
  limitePorMime,
  prefirmarSubida,
  urlPublica,
} from '../services/storage.service.js';

const formatoUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CODIGO_VIOLACION_UNICA = '23505';
const CODIGO_VIOLACION_LLAVE_FORANEA = '23503';

function codigoError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}

function limiteLegible(bytes: number) {
  return `${bytes / (1024 * 1024)} MB`;
}

// Quita rutas y caracteres de control; el nombre es solo descriptivo.
function normalizarNombre(valor: unknown) {
  if (typeof valor !== 'string') return null;

  const nombre = valor
    .split(/[\\/]/)
    .pop()!
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

  return nombre && nombre.length <= 255 ? nombre : null;
}

function responderAlmacenamiento(error: unknown, res: Response) {
  if (error instanceof AlmacenamientoNoConfiguradoError) {
    res.status(503).json({ message: error.message });
    return true;
  }

  return false;
}

// Exige exactamente un destino: proyecto, obra o contenido institucional.
function validarAsociacion(
  body: Record<string, unknown>
): { error: string } | { asociacion: AsociacionMedia } {
  const campos = ['project_id', 'event_id', 'content_id'] as const;
  const indicados = campos.filter((campo) => body[campo] != null);

  if (indicados.length !== 1) {
    return {
      error:
        'Indique exactamente una asociación: project_id, event_id o content_id.',
    };
  }

  const asociacion: AsociacionMedia = {
    project_id: null,
    event_id: null,
    content_id: null,
  };

  const valor = body[indicados[0]];

  if (typeof valor !== 'string' || !formatoUUID.test(valor)) {
    return { error: `El campo ${indicados[0]} no es un identificador válido.` };
  }

  asociacion[indicados[0]] = valor;

  return { asociacion };
}

function validarTextoAlternativo(valor: unknown, obligatorio: boolean) {
  if (valor != null && typeof valor !== 'string') {
    return { error: 'El texto alternativo debe ser texto.' };
  }

  const texto = typeof valor === 'string' ? valor.trim() : '';

  if (texto.length > 500) {
    return { error: 'El texto alternativo admite hasta 500 caracteres.' };
  }

  if (obligatorio && !texto) {
    return { error: 'Las imágenes requieren un texto alternativo.' };
  }

  return { alt_text: texto || null };
}

export async function listarGaleria(req: Request, res: Response) {
  const filtros: Record<string, string> = {};

  for (const campo of ['project_id', 'event_id', 'content_id']) {
    const valor = req.query[campo];

    if (valor === undefined) continue;

    if (typeof valor !== 'string' || !formatoUUID.test(valor)) {
      res.status(400).json({ message: `El filtro ${campo} no es válido.` });
      return;
    }

    filtros[campo] = valor;
  }

  try {
    res.status(200).json(await listarMedia(filtros));
  } catch (error) {
    console.error('Error al listar la galería:', error);

    res.status(500).json({ message: 'No se pudo obtener la galería.' });
  }
}

// Paso 1 de la carga: valida tipo y tamaño y entrega la URL prefirmada.
export async function solicitarUrlPrefirmada(req: Request, res: Response) {
  const { filename, mime_type, size_bytes } = req.body ?? {};

  const nombre = normalizarNombre(filename);

  if (!nombre) {
    res.status(400).json({
      message: 'El nombre del archivo debe contener entre 1 y 255 caracteres.',
    });
    return;
  }

  const limite = typeof mime_type === 'string' ? limitePorMime(mime_type) : undefined;

  if (!limite) {
    res.status(422).json({
      message: 'Formato no permitido. Use WebP, JPEG, PNG o PDF.',
    });
    return;
  }

  if (
    typeof size_bytes !== 'number' ||
    !Number.isInteger(size_bytes) ||
    size_bytes <= 0
  ) {
    res.status(400).json({
      message: 'El tamaño del archivo debe ser un entero positivo en bytes.',
    });
    return;
  }

  if (size_bytes > limite) {
    res.status(422).json({
      message: `El archivo supera el límite de ${limiteLegible(limite)} para este formato.`,
    });
    return;
  }

  try {
    const key = generarLlave(mime_type);
    const upload_url = await prefirmarSubida(key, mime_type, size_bytes);

    res.status(200).json({
      key,
      upload_url,
      method: 'PUT',
      headers: { 'Content-Type': mime_type },
      expires_in: EXPIRACION_URL_SEGUNDOS,
    });
  } catch (error) {
    if (responderAlmacenamiento(error, res)) return;

    console.error('Error al generar la URL prefirmada:', error);

    res.status(500).json({
      message: 'No se pudo preparar la carga del archivo.',
    });
  }
}

// Paso 2: el cliente avisa que terminó y el servidor verifica el objeto antes de registrarlo.
export async function confirmarCarga(req: Request, res: Response) {
  const body = req.body ?? {};
  const { key, filename, usage_authorized } = body;

  if (typeof key !== 'string' || !FORMATO_LLAVE.test(key)) {
    res.status(400).json({ message: 'La llave del archivo no es válida.' });
    return;
  }

  const nombre = normalizarNombre(filename);

  if (!nombre) {
    res.status(400).json({
      message: 'El nombre del archivo debe contener entre 1 y 255 caracteres.',
    });
    return;
  }

  if (usage_authorized !== true) {
    res.status(400).json({
      message:
        'Debe confirmar que el contenido cuenta con autorización de uso.',
    });
    return;
  }

  const asociacion = validarAsociacion(body);

  if ('error' in asociacion) {
    res.status(400).json({ message: asociacion.error });
    return;
  }

  try {
    if (await existeLlave(key)) {
      res.status(409).json({ message: 'Este archivo ya fue registrado.' });
      return;
    }

    const objeto = await consultarObjeto(key);

    if (!objeto) {
      res.status(422).json({
        message:
          'No se encontró el archivo subido. Vuelva a intentar la carga.',
      });
      return;
    }

    const limite = limitePorMime(objeto.mime);

    if (!limite || objeto.bytes <= 0 || objeto.bytes > limite) {
      await eliminarObjeto(key).catch((error) =>
        console.error('No se pudo descartar el objeto inválido:', error)
      );

      res.status(422).json({
        message: 'El archivo subido no cumple el formato o tamaño permitido.',
      });
      return;
    }

    const texto = validarTextoAlternativo(body.alt_text, esImagen(objeto.mime));

    if ('error' in texto) {
      res.status(400).json({ message: texto.error });
      return;
    }

    const media = await registrarMedia(
      {
        ...asociacion.asociacion,
        filename: nombre,
        url: urlPublica(key),
        alt_text: texto.alt_text,
        storage_key: key,
        mime_type: objeto.mime,
        size_bytes: objeto.bytes,
      },
      req.user!.userId,
      req.ip ?? null
    );

    res.status(201).json({ message: 'Archivo registrado correctamente.', media });
  } catch (error) {
    if (responderAlmacenamiento(error, res)) return;

    if (codigoError(error) === CODIGO_VIOLACION_LLAVE_FORANEA) {
      res.status(422).json({
        message: 'El elemento al que se intenta asociar el archivo no existe.',
      });
      return;
    }

    if (codigoError(error) === CODIGO_VIOLACION_UNICA) {
      res.status(409).json({ message: 'Este archivo ya fue registrado.' });
      return;
    }

    console.error('Error al confirmar la carga:', error);

    res.status(500).json({ message: 'No se pudo registrar el archivo.' });
  }
}

export async function modificarMedia(
  req: Request<{ id: string }>,
  res: Response
) {
  const { id } = req.params;

  if (!formatoUUID.test(id)) {
    res.status(400).json({ message: 'El identificador no es válido.' });
    return;
  }

  const body = req.body ?? {};
  const nombre = normalizarNombre(body.filename);

  if (!nombre) {
    res.status(400).json({
      message: 'El nombre del archivo debe contener entre 1 y 255 caracteres.',
    });
    return;
  }

  const asociacion = validarAsociacion(body);

  if ('error' in asociacion) {
    res.status(400).json({ message: asociacion.error });
    return;
  }

  try {
    const actual = await obtenerMedia(id);

    if (!actual) {
      res.status(404).json({ message: 'El archivo no existe.' });
      return;
    }

    const texto = validarTextoAlternativo(
      body.alt_text,
      typeof actual.mime_type === 'string' && esImagen(actual.mime_type)
    );

    if ('error' in texto) {
      res.status(400).json({ message: texto.error });
      return;
    }

    const media = await actualizarMedia(
      id,
      { ...asociacion.asociacion, filename: nombre, alt_text: texto.alt_text },
      req.user!.userId,
      req.ip ?? null
    );

    if (!media) {
      res.status(404).json({ message: 'El archivo no existe.' });
      return;
    }

    res.status(200).json({
      message: 'Archivo actualizado correctamente.',
      media,
    });
  } catch (error) {
    if (codigoError(error) === CODIGO_VIOLACION_LLAVE_FORANEA) {
      res.status(422).json({
        message: 'El elemento al que se intenta asociar el archivo no existe.',
      });
      return;
    }

    console.error('Error al actualizar el archivo:', error);

    res.status(500).json({ message: 'No se pudo actualizar el archivo.' });
  }
}

export async function borrarMedia(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!formatoUUID.test(id)) {
    res.status(400).json({ message: 'El identificador no es válido.' });
    return;
  }

  try {
    const eliminada = await eliminarMedia(id, req.user!.userId, req.ip ?? null);

    if (!eliminada) {
      res.status(404).json({ message: 'El archivo no existe.' });
      return;
    }

    // El registro ya no existe; si falla el borrado en el bucket solo queda un
    // objeto huérfano, por lo que se avisa sin deshacer la operación.
    if (eliminada.storage_key) {
      try {
        await eliminarObjeto(eliminada.storage_key);
      } catch (error) {
        console.error('No se pudo eliminar el objeto del bucket:', error);

        res.status(200).json({
          message:
            'Archivo eliminado, pero no se pudo borrar del almacenamiento.',
          warning: true,
        });
        return;
      }
    }

    res.status(200).json({ message: 'Archivo eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el archivo:', error);

    res.status(500).json({ message: 'No se pudo eliminar el archivo.' });
  }
}
