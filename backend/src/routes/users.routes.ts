import { Router } from 'express';
import { insertarUser, iniciarSesionAdmin } from '../controllers/users.controller.js';
import { requerirAdmin } from '../middleware/auth.middleware.js';

export const usersRouter = Router();

usersRouter.post('/register', insertarUser);
usersRouter.post('/loginAdmin', iniciarSesionAdmin);
usersRouter.get('/admin/me', requerirAdmin, (_req, res) => {
  res.status(200).json({
    usuario: res.locals.usuario,
  });
});