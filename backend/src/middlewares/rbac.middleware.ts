import { Request, Response, NextFunction } from "express";

/**
 * Middleware para validar que el usuario autenticado posea uno de los roles permitidos
 */
export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        type: "https://farcornerscr.org/errors/unauthorized",
        title: "No autorizado",
        status: 401,
        detail: "No se encontró una sesión activa",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        type: "https://farcornerscr.org/errors/forbidden",
        title: "Acceso prohibido",
        status: 403,
        detail: `Su rol (${req.user.role}) no tiene permisos para realizar esta acción`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware para validar que el usuario posea un permiso granular especifico
 */
export function requirePermission(permissionCode: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        type: "https://farcornerscr.org/errors/unauthorized",
        title: "No autorizado",
        status: 401,
        detail: "No se encontró una sesión activa",
      });
      return;
    }

    // El Administrador General cuenta con autorizacion para todas las funciones
    if (req.user.role === "admin") {
      return next();
    }

    const hasPermission = req.user.permissions?.includes(permissionCode);

    if (!hasPermission) {
      res.status(403).json({
        type: "https://farcornerscr.org/errors/forbidden",
        title: "Permiso insuficiente",
        status: 403,
        detail: `Se requiere el permiso '${permissionCode}' para acceder a esta función`,
      });
      return;
    }

    next();
  };
}
