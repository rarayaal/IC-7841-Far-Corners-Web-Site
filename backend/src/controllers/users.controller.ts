import type { Request, Response } from 'express';
import * as argon2 from 'argon2';
import { crearUsuario, obtenerUsuarioCorreo } from '../repositories/users.repository.js';
import jwt from 'jsonwebtoken';
import { authConfig } from '../auth.config.js';

export async function insertarUser(req: Request, res: Response) {
  try {
    const { full_name, email, contrasenia } = req.body ?? {};

    // Comprobamos los tipos antes de usar métodos como trim().
    if (
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof contrasenia !== 'string'
    ) {
      res.status(400).json({
        message: 'Nombre, correo y contraseña son obligatorios.',
      });
      return;
    }

    const nombre = full_name.trim();
    const correo = email.trim().toLowerCase();

    if (!nombre || nombre.length > 200) {
      res.status(400).json({
        message: 'El nombre debe tener entre 1 y 200 caracteres.',
      });
      return;
    }

    if (
      correo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      res.status(400).json({
        message: 'Ingresa un correo electrónico válido.',
      });
      return;
    }

    if (contrasenia.length < 10 || contrasenia.length > 128) {
      res.status(400).json({
        message: 'La contraseña debe tener entre 15 y 128 caracteres.',
      });
      return;
    }

    const passwordHash = await argon2.hash(contrasenia, {
      type: argon2.argon2id,
    });

    const insertado = await crearUsuario(
      nombre,
      correo,
      passwordHash
    );

    if (!insertado) {
      res.status(409).json({
        message: 'Ya existe una cuenta con ese correo electrónico.',
      });
      return;
    }

    res.status(201).json(insertado);
  } catch (error) {
    console.error('Error al registrar el usuario:', error);

    res.status(500).json({
      message: 'No se pudo registrar el usuario.',
    });
  }
}


export async function iniciarSesionAdmin(req: Request, res: Response) {
  try {
    const { email, contrasenia } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof contrasenia !== 'string'
    ) {
      res.status(400).json({
        message: 'El correo y la contraseña son obligatorios.',
      });
      return;
    }

    const correo = email.trim().toLowerCase();

    if (
      !correo ||
      correo.length > 254 ||
      !contrasenia ||
      contrasenia.length > 128
    ) {
      res.status(400).json({
        message: 'Ingresa un correo y una contraseña válidos.',
      });
      return;
    }

    const usuario = await obtenerUsuarioCorreo(correo);

    if (!usuario || !usuario.password_hash) {
      res.status(401).json({
        message: 'Correo o contraseña incorrectos.',
      });
      return;
    }

    const passwordCorrecta = await argon2.verify(
      usuario.password_hash,
      contrasenia
    );

    if (!passwordCorrecta) {
      res.status(401).json({
        message: 'Correo o contraseña incorrectos.',
      });
      return;
    }

    if (usuario.status !== 'active') {
      res.status(403).json({
        message: 'Tu cuenta está inactiva.',
      });
      return;
    }

    if (usuario.role !== 'admin') {
      res.status(403).json({
        message: 'No tienes permisos para acceder al panel administrativo.',
      });
      return;
    }
    const token = jwt.sign(
      {},
      authConfig.secret,
      {
        algorithm: 'HS256',
        subject: usuario.id,
        expiresIn: authConfig.expiresInSeconds,
        issuer: authConfig.issuer,
        audience: authConfig.audience,
      }
    );

    res.cookie('farcorners_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: authConfig.expiresInSeconds * 1000,
    });

    res.status(200).json({
      message: 'Sesión iniciada correctamente.',
      usuario: {
        id: usuario.id,
        full_name: usuario.full_name,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error('Error al iniciar sesión administrativa:', error);

    res.status(500).json({
      message: 'No se pudo iniciar sesión.',
    });
  }
}