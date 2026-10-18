import { Request, Response, NextFunction } from "express";
import { verifyAuthToken, TokenPayload } from "../services/auth.service.js";

// Extender la interfaz Request de Express para tipar el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware para validar el token JWT en el encabezado Authorization
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    res.status(401).json({
      type: "https://farcornerscr.org/errors/unauthorized",
      title: "No autorizado",
      status: 401,
      detail: "Se requiere un token de autenticación válido para acceder a este recurso",
    });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      type: "https://farcornerscr.org/errors/token-expired-or-invalid",
      title: "Token inválido o expirado",
      status: 401,
      detail: "La sesión ha expirado o el token es inválido. Por favor inicie sesión nuevamente",
    });
  }
}
