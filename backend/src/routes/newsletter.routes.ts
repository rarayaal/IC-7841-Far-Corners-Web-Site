import { Router } from 'express';
import {
  suscribirNewsletter,
  listarContactosNewsletter,
} from '../controllers/newsletter.controller.js';
import {
  authenticateToken,
} from '../middlewares/auth.middleware.js';
import {
  requireRoles,
  requirePermission,
} from '../middlewares/rbac.middleware.js';

export const newsletterRouter = Router();

// Suscripción pública.
newsletterRouter.post('/subscribe', suscribirNewsletter);

// Consulta protegida para administración.
newsletterRouter.get(
  '/contacts',
  authenticateToken,
  requireRoles(['admin', 'manager']),
  requirePermission('newsletter:read'),
  listarContactosNewsletter
);