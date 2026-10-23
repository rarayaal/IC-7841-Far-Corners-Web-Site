import { Router } from 'express';
import {
  listarContactosPublicos,
  listarContactosAdmin,
  editarContacto,
} from '../controllers/contactChannels.controller.js';
import {
  authenticateToken,
} from '../middlewares/auth.middleware.js';
import {
  requireRoles,
  requirePermission,
} from '../middlewares/rbac.middleware.js';

export const contactChannelsRouter = Router();

// Público.
contactChannelsRouter.get('/', listarContactosPublicos);

// Consultar contactos desde el administrador.
contactChannelsRouter.get(
  '/admin',
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('contact_channels:manage'),
  listarContactosAdmin
);

// Editar un contacto.
contactChannelsRouter.put(
  '/:id',
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('contact_channels:manage'),
  editarContacto
);