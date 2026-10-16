import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../auth.config.js';
import { obtenerUsuarioPorId } from '../repositories/users.repository.js';

export async function requerirAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.farcorners_token;

  if (typeof token !== 'string') {
    res.status(401).json({
      message: 'Debes iniciar sesión.',
    });
    return;
  }

  let usuarioId: string;

  try {
    const contenido = jwt.verify(token, authConfig.secret, {
      algorithms: ['HS256'],
      issuer: authConfig.issuer,
      audience: authConfig.audience,
    });

    if (
      typeof contenido === 'string' ||
      typeof contenido.sub !== 'string'
    ) {
      res.status(401).json({
        message: 'Token inválido.',
      });
      return;
    }

    usuarioId = contenido.sub;
  } catch {
    res.status(401).json({
      message: 'La sesión es inválida o ha expirado.',
    });
    return;
  }

  try {
    const usuario = await obtenerUsuarioPorId(usuarioId);

    if (!usuario) {
      res.status(401).json({
        message: 'El usuario de la sesión ya no existe.',
      });
      return;
    }

    if (usuario.status !== 'active' || usuario.role !== 'admin') {
      res.status(403).json({
        message: 'No tienes acceso al panel administrativo.',
      });
      return;
    }

    res.locals.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error al verificar acceso administrativo:', error);

    res.status(500).json({
      message: 'No se pudo verificar el acceso.',
    });
  }
}