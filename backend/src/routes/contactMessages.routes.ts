import { Router } from 'express';
import {
  enviarMensaje,
  listarMensajes,
  guardarRespuesta,
} from '../controllers/contactMessages.controller.js';
import { requerirAdmin } from '../middleware/auth.middleware.js';

export const contactMessagesRouter = Router();

// Público: cualquier visitante puede enviar una consulta.
contactMessagesRouter.post('/', enviarMensaje);

// Protegido: únicamente los administradores pueden leerlas.
contactMessagesRouter.get('/', requerirAdmin, listarMensajes);

contactMessagesRouter.post(
  '/:mensajeId/replies',
  requerirAdmin,
  guardarRespuesta
);