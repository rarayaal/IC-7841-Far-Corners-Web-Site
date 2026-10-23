import { Router } from 'express';
import {
  listarGaleria,
  solicitarUrlPrefirmada,
  confirmarCarga,
  modificarMedia,
  borrarMedia,
} from '../controllers/media.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  requireRoles,
  requirePermission,
} from '../middlewares/rbac.middleware.js';

export const mediaRouter = Router();

// Toda la galería es administrativa (CU-22). Las imágenes se consumen
// públicamente a través del contenido al que están asociadas.
mediaRouter.use(
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('media:manage')
);

mediaRouter.get('/', listarGaleria);
mediaRouter.post('/presign', solicitarUrlPrefirmada);
mediaRouter.post('/confirm', confirmarCarga);
mediaRouter.put('/:id', modificarMedia);
mediaRouter.delete('/:id', borrarMedia);
