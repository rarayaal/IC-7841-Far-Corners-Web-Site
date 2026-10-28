import type { Request, Response } from 'express';
import {
  ErrorMailchimp,
  suscribirAlBoletin,
  obtenerContactosNewsletter,
  type EstadoNewsletter,
} from '../services/mailchimp.service.js';

export async function suscribirNewsletter(req: Request, res: Response) {
  const { email, first_name, last_name, consent } = req.body ?? {};

  if (
    typeof email !== 'string' ||
    typeof first_name !== 'string' ||
    typeof last_name !== 'string'
  ) {
    res.status(400).json({
      message: 'Nombre, apellido y correo son obligatorios.',
    });
    return;
  }

  const correo = email.trim().toLowerCase();
  const nombre = first_name.trim();
  const apellido = last_name.trim();

  if (
    correo.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    res.status(400).json({
      message: 'Ingresa un correo electrónico válido.',
    });
    return;
  }

  if (!nombre || nombre.length > 100) {
    res.status(400).json({
      message: 'El nombre debe contener entre 1 y 100 caracteres.',
    });
    return;
  }

  if (!apellido || apellido.length > 100) {
    res.status(400).json({
      message: 'El apellido debe contener entre 1 y 100 caracteres.',
    });
    return;
  }

  if (consent !== true) {
    res.status(400).json({
      message: 'Debes aceptar recibir el boletín para suscribirte.',
    });
    return;
  }

  try {
    await suscribirAlBoletin({
      email: correo,
      first_name: nombre,
      last_name: apellido,
    });

    res.status(202).json({
      message:
        'Revisa tu correo para confirmar la suscripción al boletín.',
    });
  } catch (error) {
    if (
      error instanceof ErrorMailchimp &&
      error.titulo === 'Member Exists'
    ) {
      res.status(200).json({
        message:
          'Este correo ya está registrado en la audiencia. Si tienes una confirmación pendiente, revisa tu correo.',
      });
      return;
    }

    // Registra únicamente información técnica, sin credenciales
    // ni datos personales del formulario.
    if (error instanceof ErrorMailchimp) {
      console.error('Error de Mailchimp:', {
        status: error.status,
        titulo: error.titulo,
      });
    } else {
      console.error(
        'Error de conexión o configuración del boletín:',
        error instanceof Error ? error.name : 'Error desconocido'
      );
    }

    res.status(503).json({
      message:
        'No se pudo procesar la suscripción. Inténtalo más tarde.',
    });
  }
}


const estadosPermitidos: EstadoNewsletter[] = [
  'subscribed',
  'pending',
  'unsubscribed',
  'cleaned',
  'transactional',
];

export async function listarContactosNewsletter(
  req: Request,
  res: Response
) {
  const paginaTexto = req.query.pagina ?? '1';
  const limiteTexto = req.query.limite ?? '20';
  const estadoTexto = req.query.estado;

  const busquedaTexto = req.query.busqueda;

    if (
    busquedaTexto !== undefined &&
    (
        typeof busquedaTexto !== 'string' ||
        busquedaTexto.trim().length > 254
    )
    ) {
    res.status(400).json({
        message: 'La búsqueda debe ser un texto de hasta 254 caracteres.',
    });
    return;
    }

    const busqueda =
    typeof busquedaTexto === 'string'
        ? busquedaTexto.trim()
        : '';

  if (
    typeof paginaTexto !== 'string' ||
    typeof limiteTexto !== 'string' ||
    !/^[1-9]\d*$/.test(paginaTexto) ||
    !/^[1-9]\d*$/.test(limiteTexto)
  ) {
    res.status(400).json({
      message: 'La página y el límite deben ser números enteros positivos.',
    });
    return;
  }

  const pagina = Number(paginaTexto);
  const limite = Number(limiteTexto);

  if (
    !Number.isSafeInteger(pagina) ||
    !Number.isSafeInteger(limite) ||
    limite > 100 ||
    !Number.isSafeInteger((pagina - 1) * limite)
  ) {
    res.status(400).json({
      message: 'La paginación no es válida. El límite máximo es 100.',
    });
    return;
  }

  let estado: EstadoNewsletter | undefined;

  if (estadoTexto !== undefined) {
    if (
      typeof estadoTexto !== 'string' ||
      !estadosPermitidos.includes(estadoTexto as EstadoNewsletter)
    ) {
      res.status(400).json({
        message: 'El estado de suscripción no es válido.',
      });
      return;
    }

    estado = estadoTexto as EstadoNewsletter;
  }

  try {
    const resultado = await obtenerContactosNewsletter({
        pagina,
        limite,
        ...(estado ? { estado } : {}),
        ...(busqueda ? { busqueda } : {}),
    });

    res.status(200).json(resultado);
  } catch (error) {

    if (
        error instanceof ErrorMailchimp &&
        error.titulo === 'Search Too Broad'
        ) {
        res.status(422).json({
            message:
            'Hay demasiadas coincidencias. Escribe un nombre más específico o el correo completo.',
        });
        return;
    }
    if (error instanceof ErrorMailchimp) {
      console.error('Error al consultar el boletín:', {
        status: error.status,
        titulo: error.titulo,
      });
    } else {
      console.error(
        'Error de conexión o configuración del boletín:',
        error instanceof Error ? error.name : 'Error desconocido'
      );
    }

    res.status(503).json({
      message: 'No se pudieron consultar los contactos del boletín.',
    });
  }
}