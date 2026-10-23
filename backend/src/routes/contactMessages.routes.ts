import { Router } from 'express';
import {
  enviarMensaje,
  listarMensajes,
  guardarRespuesta,
} from '../controllers/contactMessages.controller.js';
import {
  authenticateToken,
} from '../middlewares/auth.middleware.js';
import {
  requireRoles,
  requirePermission,
} from '../middlewares/rbac.middleware.js';

export const contactMessagesRouter = Router();

// Público.
contactMessagesRouter.post('/', enviarMensaje);

// Leer mensajes.
contactMessagesRouter.get(
  '/',
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('contact_messages:read'),
  listarMensajes
);

// Guardar una respuesta.
contactMessagesRouter.post(
  '/:mensajeId/replies',
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('contact_messages:read'),
  requirePermission('contact_messages:reply'),
  guardarRespuesta
);