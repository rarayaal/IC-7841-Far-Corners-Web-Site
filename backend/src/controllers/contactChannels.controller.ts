import type { Request, Response } from 'express';
import {
  obtenerContactosPublicados,
  obtenerTodosLosContactos,
  actualizarContacto,
} from '../repositories/contactChannels.repository.js';


export async function listarContactosPublicos(
  _req: Request,
  res: Response
) {
  try {
    const contactos = await obtenerContactosPublicados();

    res.status(200).json(contactos);
  } catch (error) {
    console.error('Error al consultar medios de contacto:', error);

    res.status(500).json({
      message: 'No se pudieron obtener los medios de contacto.',
    });
  }
}

export async function listarContactosAdmin(
  _req: Request,
  res: Response
) {
  try {
    const contactos = await obtenerTodosLosContactos();

    res.status(200).json(contactos);
  } catch (error) {
    console.error('Error al consultar contactos para administración:', error);

    res.status(500).json({
      message: 'No se pudieron obtener los medios de contacto.',
    });
  }
}

export async function editarContacto(
  req: Request<{ id: string }>,
  res: Response
) {
  const { id } = req.params;

  const formatoUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!formatoUUID.test(id)) {
    res.status(400).json({
      message: 'El identificador del contacto no es válido.',
    });
    return;
  }

  const {
    label,
    label_en,
    value,
    value_en,
    link_url,
    display_order,
    is_published,
  } = req.body ?? {};

  if (
    typeof label !== 'string' ||
    !label.trim() ||
    label.trim().length > 200
  ) {
    res.status(400).json({
      message: 'El título debe contener entre 1 y 200 caracteres.',
    });
    return;
  }

  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.trim().length > 10000
  ) {
    res.status(400).json({
      message: 'El contenido debe contener entre 1 y 10000 caracteres.',
    });
    return;
  }

  // Los campos opcionales pueden omitirse o enviarse como null.
  if (
    (label_en != null && typeof label_en !== 'string') ||
    (value_en != null && typeof value_en !== 'string') ||
    (link_url != null && typeof link_url !== 'string')
  ) {
    res.status(400).json({
      message: 'Las traducciones y el enlace deben ser texto.',
    });
    return;
  }

  const tituloIngles = label_en?.trim() || null;
  const contenidoIngles = value_en?.trim() || null;
  const enlace = link_url?.trim() || null;

  if (
    (tituloIngles && tituloIngles.length > 200) ||
    (contenidoIngles && contenidoIngles.length > 10000)
  ) {
    res.status(400).json({
      message:
        'La traducción del título admite hasta 200 caracteres y la del contenido hasta 10000.',
    });
    return;
  }

  if (enlace) {
    let enlaceValido = false;

    try {
      const url = new URL(enlace);

      enlaceValido =
        enlace.length <= 2048 &&
        ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol);
    } catch {
      enlaceValido = false;
    }

    if (!enlaceValido) {
      res.status(400).json({
        message:
          'El enlace debe ser una URL válida con https:, http:, mailto: o tel:, de hasta 2048 caracteres.',
      });
      return;
    }
  }

  if (
    typeof display_order !== 'number' ||
    !Number.isInteger(display_order) ||
    display_order < 0 ||
    display_order > 2147483647
  ) {
    res.status(400).json({
      message: 'El orden debe ser un número entero entre 0 y 2147483647.',
    });
    return;
  }

  if (typeof is_published !== 'boolean') {
    res.status(400).json({
      message: 'La visibilidad debe ser true o false.',
    });
    return;
  }

  try {
    const contacto = await actualizarContacto(id, {
      label: label.trim(),
      label_en: tituloIngles,
      value: value.trim(),
      value_en: contenidoIngles,
      link_url: enlace,
      display_order,
      is_published,
    });

    if (!contacto) {
      res.status(404).json({
        message: 'El contacto no existe.',
      });
      return;
    }

    res.status(200).json({
      message: 'Contacto actualizado correctamente.',
      contacto,
    });
  } catch (error) {
    console.error('Error al actualizar el contacto:', error);

    res.status(500).json({
      message: 'No se pudo actualizar el contacto.',
    });
  }
}
