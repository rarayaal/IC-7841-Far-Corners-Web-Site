import { Router } from 'express';
import {
  listarContactosPublicos,
  listarContactosAdmin,
  editarContacto,
} from '../controllers/contactChannels.controller.js';
import { requerirAdmin } from '../middleware/auth.middleware.js';

export const contactChannelsRouter = Router();

contactChannelsRouter.get('/', listarContactosPublicos);

contactChannelsRouter.get(
  '/admin',
  requerirAdmin,
  listarContactosAdmin
);


contactChannelsRouter.put(
  '/:id',
  requerirAdmin,
  editarContacto
);