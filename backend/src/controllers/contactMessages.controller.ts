import type { Request, Response } from 'express';
import {
  crearMensaje,
  obtenerMensajes,
  crearRespuestaContacto,
  obtenerMensajePorId,
  marcarRespuestaEnviada,
  marcarRespuestaFallida,
} from '../repositories/contactMessages.repository.js';

import {
  enviarRespuestaPorCorreo,
} from '../services/mail.service.js';

export async function enviarMensaje(req: Request, res: Response) {
  try {
    const { name, email, subject, message } = req.body ?? {};

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof subject !== 'string' ||
      typeof message !== 'string'
    ) {
      res.status(400).json({
        message: 'Nombre, correo, asunto y mensaje son obligatorios.',
      });
      return;
    }

    const nombre = name.trim();
    const correo = email.trim().toLowerCase();
    const asunto = subject.trim();
    const contenido = message.trim();

    if (!nombre || nombre.length > 200) {
      res.status(400).json({
        message: 'El nombre debe tener entre 1 y 200 caracteres.',
      });
      return;
    }

    if (
      correo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      res.status(400).json({
        message: 'Ingresa un correo electrónico válido.',
      });
      return;
    }

    if (!asunto || asunto.length > 255) {
      res.status(400).json({
        message: 'El asunto debe tener entre 1 y 255 caracteres.',
      });
      return;
    }

    if (!contenido || contenido.length > 10000) {
      res.status(400).json({
        message: 'El mensaje debe tener entre 1 y 10000 caracteres.',
      });
      return;
    }

    const mensajeCreado = await crearMensaje(
      nombre,
      correo,
      asunto,
      contenido
    );

    res.status(201).json({
      message: 'Tu mensaje fue recibido correctamente.',
      mensaje: mensajeCreado,
    });
  } catch (error) {
    console.error('Error al guardar el mensaje:', error);

    res.status(500).json({
      message: 'No se pudo guardar el mensaje.',
    });
  }
}

export async function listarMensajes(_req: Request, res: Response) {
  try {
    const mensajes = await obtenerMensajes();

    res.status(200).json(mensajes);
  } catch (error) {
    console.error('Error al consultar los mensajes:', error);

    res.status(500).json({
      message: 'No se pudieron obtener los mensajes.',
    });
  }
}


export async function guardarRespuesta(
  req: Request<{ mensajeId: string }>,
  res: Response
) {
  const { mensajeId } = req.params;
  const { response_text, language } = req.body ?? {};

  const formatoUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!formatoUUID.test(mensajeId)) {
    res.status(400).json({
      message: 'El identificador del mensaje no es válido.',
    });
    return;
  }

  if (typeof response_text !== 'string') {
    res.status(400).json({
      message: 'Debes proporcionar el texto de la respuesta.',
    });
    return;
  }

  const texto = response_text.trim();

  if (!texto || texto.length > 10000) {
    res.status(400).json({
      message: 'La respuesta debe contener entre 1 y 10000 caracteres.',
    });
    return;
  }

  if (language !== 'es' && language !== 'en') {
    res.status(400).json({
      message: 'Selecciona español o inglés para la respuesta.',
    });
    return;
  }

  const administrador = req.user;

  if (!administrador) {
    res.status(401).json({
      message: 'Debes iniciar sesión.',
    });
    return;
  }

  try {
    const mensaje = await obtenerMensajePorId(mensajeId);

    if (!mensaje) {
      res.status(404).json({
        message: 'El mensaje no existe.',
      });
      return;
    }

    const respuestaGuardada = await crearRespuestaContacto(
      mensajeId,
      administrador.userId,
      texto
    );

    if (!respuestaGuardada) {
      res.status(404).json({
        message: 'El mensaje ya no está disponible.',
      });
      return;
    }

    try {
      await enviarRespuestaPorCorreo({
        destinatario: mensaje.email,
        nombre: mensaje.name,
        asuntoOriginal: mensaje.subject,
        respuesta: texto,
        idioma: language,
      });
    } catch (error) {
      console.error(
        'Error durante el envío de la respuesta:',
        error instanceof Error ? error.name : 'Error desconocido'
      );

      try {
        await marcarRespuestaFallida(respuestaGuardada.id);
      } catch {
        console.error('No se pudo registrar el fallo de envío.');
      }

      res.status(502).json({
        message:
          'La respuesta quedó guardada, pero no se pudo confirmar el envío. Revisa el estado del correo antes de intentar enviarla nuevamente.',
      });
      return;
    }

    try {
      const respuestaEnviada = await marcarRespuestaEnviada(
        respuestaGuardada.id
      );

      res.status(201).json({
        enviado: true,
        message: 'Respuesta enviada y registrada correctamente.',
        respuesta: respuestaEnviada,
      });
    } catch {
      // SMTP ya aceptó el correo: no debemos tratar este caso
      // como un fallo de envío ni enviar nuevamente.
      console.error(
        'SMTP aceptó el correo, pero no se pudo actualizar su estado en la BD.'
      );

      res.status(202).json({
        enviado: true,
        advertencia: true,
        message:
          'El servidor aceptó el correo, pero no se pudo actualizar su estado en el sistema. No vuelvas a enviarlo.',
      });
    }
  } catch (error) {
    console.error(
      'Error al preparar la respuesta:',
      error instanceof Error ? error.name : 'Error desconocido'
    );

    res.status(500).json({
      message: 'No se pudo preparar la respuesta para enviarla.',
    });
  }
}