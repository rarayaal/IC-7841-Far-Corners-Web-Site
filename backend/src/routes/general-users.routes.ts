import { Router } from 'express';
import {
  listarUsuariosGenerales,
  consultarUsuarioGeneral,
  registrarUsuarioGeneral,
  editarUsuarioGeneral,
  actualizarEstadoUsuarioGeneral,
} from '../controllers/general-users.controller.js';
import {
  authenticateToken,
} from '../middlewares/auth.middleware.js';
import {
  requireRoles,
  requirePermission,
} from '../middlewares/rbac.middleware.js';

export const generalUsersRouter = Router();

generalUsersRouter.use(
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('users:manage')
);

generalUsersRouter.get('/', listarUsuariosGenerales);

generalUsersRouter.get('/:id', consultarUsuarioGeneral);

generalUsersRouter.post('/', registrarUsuarioGeneral);

generalUsersRouter.put('/:id', editarUsuarioGeneral);

generalUsersRouter.patch(
  '/:id/status',
  actualizarEstadoUsuarioGeneral
);