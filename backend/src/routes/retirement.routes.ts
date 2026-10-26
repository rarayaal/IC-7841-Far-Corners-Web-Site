import { Router } from 'express';
import {
  requerirPermisoDelTipo,
  listarContenido,
  verConsecuencias,
  retirarContenido,
  restaurarContenido,
} from '../controllers/retirement.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

export const retirementRouter = Router();

// CU-24. Tipos: institutional, project, event, media.
retirementRouter.use(authenticateToken, requireRoles(['admin', 'manager']));

retirementRouter.get('/:type', requerirPermisoDelTipo, listarContenido);

retirementRouter.get(
  '/:type/:id/consequences',
  requerirPermisoDelTipo,
  verConsecuencias
);

retirementRouter.post(
  '/:type/:id/withdraw',
  requerirPermisoDelTipo,
  retirarContenido
);

retirementRouter.post(
  '/:type/:id/restore',
  requerirPermisoDelTipo,
  restaurarContenido
);
