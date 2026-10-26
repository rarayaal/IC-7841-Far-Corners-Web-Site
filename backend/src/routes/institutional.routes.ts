import { Router } from 'express';
import {
  consultarContenidoPublico,
  listarContenidoAdmin,
  registrarContenido,
  modificarContenido,
  borrarContenido,
} from '../controllers/institutional.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  requireRoles,
  requirePermission,
} from '../middlewares/rbac.middleware.js';

export const institutionalRouter = Router();

const soloGestorDeContenido = [
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('content:manage'),
];

// Público: contenido publicado de history, impact o future.
institutionalRouter.get('/:section', consultarContenidoPublico);

// Administración (CU-01, CU-02, CU-03).
institutionalRouter.get(
  '/:section/admin',
  ...soloGestorDeContenido,
  listarContenidoAdmin
);

institutionalRouter.post(
  '/:section',
  ...soloGestorDeContenido,
  registrarContenido
);

institutionalRouter.put(
  '/:section/:id',
  ...soloGestorDeContenido,
  modificarContenido
);

institutionalRouter.delete(
  '/:section/:id',
  ...soloGestorDeContenido,
  borrarContenido
);
