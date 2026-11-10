import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import {
  obtenerUsuariosGenerales,
  obtenerUsuarioGeneralPorId,
  crearUsuarioGeneral,
  actualizarUsuarioGeneral,
  cambiarEstadoUsuarioGeneral,
} from '../repositories/general-users.repository.js';

const formatoUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validarId(id: string, res: Response): boolean {
  if (!formatoUUID.test(id)) {
    res.status(400).json({
      message: 'El identificador del usuario no es válido.',
    });
    return false;
  }

  return true;
}

function validarDatos(
  body: unknown,
  res: Response
): { nombre: string; correo: string } | null {
  const datos = body as {
    full_name?: unknown;
    email?: unknown;
  } | null;

  if (
    typeof datos?.full_name !== 'string' ||
    typeof datos?.email !== 'string'
  ) {
    res.status(400).json({
      message: 'El nombre y el correo son obligatorios.',
    });
    return null;
  }

  const nombre = datos.full_name.trim();
  const correo = datos.email.trim().toLowerCase();

  if (!nombre || nombre.length > 200) {
    res.status(400).json({
      message: 'El nombre debe contener entre 1 y 200 caracteres.',
    });
    return null;
  }

  if (
    correo.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    res.status(400).json({
      message: 'Ingresa un correo electrónico válido.',
    });
    return null;
  }

  return { nombre, correo };
}

function responderError(error: unknown, res: Response) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  ) {
    res.status(409).json({
      message: 'Ya existe una cuenta con ese correo electrónico.',
    });
    return;
  }

  console.error(
    'Error en la gestión de usuarios generales:',
    error instanceof Error ? error.name : 'Error desconocido'
  );

  res.status(500).json({
    message: 'No se pudo completar la operación.',
  });
}

export async function listarUsuariosGenerales(
  _req: Request,
  res: Response
) {
  try {
    const usuarios = await obtenerUsuariosGenerales();
    res.status(200).json(usuarios);
  } catch (error) {
    responderError(error, res);
  }
}

export async function consultarUsuarioGeneral(
  req: Request<{ id: string }>,
  res: Response
) {
  if (!validarId(req.params.id, res)) return;

  try {
    const usuario = await obtenerUsuarioGeneralPorId(req.params.id);

    if (!usuario) {
      res.status(404).json({
        message: 'El usuario general no existe.',
      });
      return;
    }

    res.status(200).json(usuario);
  } catch (error) {
    responderError(error, res);
  }
}

export async function registrarUsuarioGeneral(
  req: Request,
  res: Response
) {
  const datos = validarDatos(req.body, res);
  if (!datos) return;

  const { password } = req.body ?? {};

  if (
    typeof password !== 'string' ||
    password.length < 12 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    res.status(400).json({
      message:
        'La contraseña debe tener al menos 12 caracteres y no superar 72 bytes.',
    });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const usuario = await crearUsuarioGeneral(
      datos.nombre,
      datos.correo,
      passwordHash
    );

    if (!usuario) {
      res.status(409).json({
        message: 'Ya existe una cuenta con ese correo electrónico.',
      });
      return;
    }

    res.status(201).json({
      message: 'Usuario general creado correctamente.',
      usuario,
    });
  } catch (error) {
    responderError(error, res);
  }
}

export async function editarUsuarioGeneral(
  req: Request<{ id: string }>,
  res: Response
) {
  if (!validarId(req.params.id, res)) return;

  const datos = validarDatos(req.body, res);
  if (!datos) return;

  try {
    const usuario = await actualizarUsuarioGeneral(
      req.params.id,
      datos.nombre,
      datos.correo
    );

    if (!usuario) {
      res.status(404).json({
        message: 'El usuario general no existe.',
      });
      return;
    }

    res.status(200).json({
      message: 'Usuario actualizado correctamente.',
      usuario,
    });
  } catch (error) {
    responderError(error, res);
  }
}

export async function actualizarEstadoUsuarioGeneral(
  req: Request<{ id: string }>,
  res: Response
) {
  if (!validarId(req.params.id, res)) return;

  const { status } = req.body ?? {};

  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({
      message: 'El estado debe ser active o inactive.',
    });
    return;
  }

  try {
    const usuario = await cambiarEstadoUsuarioGeneral(
      req.params.id,
      status
    );

    if (!usuario) {
      res.status(404).json({
        message: 'El usuario general no existe.',
      });
      return;
    }

    res.status(200).json({
      message:
        status === 'active'
          ? 'Usuario reactivado correctamente.'
          : 'Usuario desactivado correctamente.',
      usuario,
    });
  } catch (error) {
    responderError(error, res);
  }
}