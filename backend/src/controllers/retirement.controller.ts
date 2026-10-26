import type { NextFunction, Request, Response } from 'express';
import {
  TIPOS_RETIRABLES,
  esTipoRetirable,
  listarRetirables,
  consultarConsecuencias,
  cambiarPublicacion,
  type TipoRetirable,
} from '../repositories/retirement.repository.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

const formatoUUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El permiso depende del tipo: quien gestiona proyectos retira proyectos, etc.
// El administrador general siempre tiene acceso (ver requirePermission).
export function requerirPermisoDelTipo(
  req: Request<{ type: string }>,
  res: Response,
  next: NextFunction
) {
  const { type } = req.params;

  if (!esTipoRetirable(type)) {
    responderTipoInvalido(res);
    return;
  }

  requirePermission(TIPOS_RETIRABLES[type].permiso)(req, res, next);
}

function responderTipoInvalido(res: Response) {
  res.status(404).json({
    message: `El tipo de contenido no existe. Use: ${Object.keys(TIPOS_RETIRABLES).join(', ')}.`,
  });
}

function validarParametros(
  type: string,
  id: string | undefined,
  res: Response
): type is TipoRetirable {
  if (!esTipoRetirable(type)) {
    responderTipoInvalido(res);
    return false;
  }

  if (id !== undefined && !formatoUUID.test(id)) {
    res.status(400).json({ message: 'El identificador no es válido.' });
    return false;
  }

  return true;
}

export async function listarContenido(
  req: Request<{ type: string }>,
  res: Response
) {
  const { type } = req.params;

  if (!validarParametros(type, undefined, res)) return;

  const estado = req.query.status ?? 'published';

  if (estado !== 'published' && estado !== 'withdrawn') {
    res.status(400).json({ message: "El estado debe ser 'published' o 'withdrawn'." });
    return;
  }

  try {
    res.status(200).json(await listarRetirables(type, estado === 'published'));
  } catch (error) {
    console.error('Error al listar contenido retirable:', error);

    res.status(500).json({ message: 'No se pudo obtener el contenido.' });
  }
}

export async function verConsecuencias(
  req: Request<{ type: string; id: string }>,
  res: Response
) {
  const { type, id } = req.params;

  if (!validarParametros(type, id, res)) return;

  try {
    const consecuencias = await consultarConsecuencias(type, id);

    if (!consecuencias) {
      res.status(404).json({ message: 'El contenido no existe.' });
      return;
    }

    res.status(200).json(consecuencias);
  } catch (error) {
    console.error('Error al calcular consecuencias del retiro:', error);

    res.status(500).json({ message: 'No se pudo evaluar el retiro.' });
  }
}

async function aplicarCambio(
  req: Request<{ type: string; id: string }>,
  res: Response,
  publicar: boolean
) {
  const { type, id } = req.params;

  if (!validarParametros(type, id, res)) return;

  const { confirm, reason } = req.body ?? {};

  if (reason != null && (typeof reason !== 'string' || reason.length > 500)) {
    res.status(400).json({ message: 'El motivo admite hasta 500 caracteres.' });
    return;
  }

  try {
    const resultado = await cambiarPublicacion({
      tipo: type,
      id,
      publicar,
      confirmado: confirm === true,
      motivo: typeof reason === 'string' ? reason.trim() || null : null,
      userId: req.user!.userId,
      ip: req.ip ?? null,
    });

    switch (resultado.estado) {
      case 'no_existe':
        res.status(404).json({ message: 'El contenido no existe.' });
        return;

      case 'sin_cambio':
        res.status(409).json({
          code: 'unchanged',
          message: publicar
            ? 'El contenido ya está publicado.'
            : 'El contenido ya fue retirado.',
        });
        return;

      case 'bloqueado':
        res.status(409).json({
          code: 'blocked',
          message:
            'El contenido no puede retirarse porque está asociado con otro proceso activo.',
          ...resultado.consecuencias,
        });
        return;

      case 'requiere_confirmacion':
        res.status(409).json({
          code: 'confirmation_required',
          message: 'Confirme el retiro para continuar.',
          ...resultado.consecuencias,
        });
        return;

      default:
        res.status(200).json({
          message: publicar
            ? 'Contenido restaurado correctamente.'
            : 'Contenido retirado correctamente.',
          contenido: resultado.registro,
        });
    }
  } catch (error) {
    console.error('Error al cambiar la publicación:', error);

    res.status(500).json({
      message: publicar
        ? 'No se pudo restaurar el contenido.'
        : 'No se pudo retirar el contenido.',
    });
  }
}

export const retirarContenido = (
  req: Request<{ type: string; id: string }>,
  res: Response
) => aplicarCambio(req, res, false);

export const restaurarContenido = (
  req: Request<{ type: string; id: string }>,
  res: Response
) => aplicarCambio(req, res, true);
