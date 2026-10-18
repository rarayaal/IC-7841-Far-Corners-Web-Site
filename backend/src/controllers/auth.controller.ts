import { Request, Response } from "express";
import { authenticateLocal, authenticateGoogle, getCurrentUserProfile } from "../services/auth.service.js";

/**
 * POST /api/v1/auth/login - Inicio de sesion mediante credenciales locales
 */
export async function loginLocalController(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/bad-request",
        title: "Datos incompletos",
        status: 400,
        detail: "Se requiere ingresar correo electrónico y contraseña",
      });
      return;
    }

    const authResult = await authenticateLocal(email, password);

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      data: authResult,
    });
  } catch (error: any) {
    res.status(401).json({
      type: "https://farcornerscr.org/errors/invalid-credentials",
      title: "Error de autenticación",
      status: 401,
      detail: error.message ?? "Credenciales inválidas",
    });
  }
}

/**
 * POST /api/v1/auth/google - Inicio de sesion federado con Google OAuth 2.0
 */
export async function loginGoogleController(req: Request, res: Response): Promise<void> {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/bad-request",
        title: "Token faltante",
        status: 400,
        detail: "Se requiere el 'idToken' proporcionado por Google",
      });
      return;
    }

    const authResult = await authenticateGoogle(idToken);

    res.status(200).json({
      message: "Inicio de sesión con Google exitoso",
      data: authResult,
    });
  } catch (error: any) {
    res.status(401).json({
      type: "https://farcornerscr.org/errors/google-auth-failed",
      title: "Error de autenticación con Google",
      status: 401,
      detail: error.message ?? "No se pudo verificar la cuenta de Google",
    });
  }
}

/**
 * POST /api/v1/auth/logout - Cierre de sesion
 */
export async function logoutController(_req: Request, res: Response): Promise<void> {
  // Al utilizar autenticacion stateless con JWT, la invalidacion ocurre en el cliente
  res.status(204).send();
}

/**
 * GET /api/v1/users/me - Consulta del perfil del usuario autenticado
 */
export async function getMyProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        type: "https://farcornerscr.org/errors/unauthorized",
        title: "No autorizado",
        status: 401,
        detail: "No se identificó la sesión del usuario",
      });
      return;
    }

    const profile = await getCurrentUserProfile(userId);

    res.status(200).json({
      data: profile,
    });
  } catch (error: any) {
    res.status(404).json({
      type: "https://farcornerscr.org/errors/user-not-found",
      title: "Usuario no encontrado",
      status: 404,
      detail: error.message ?? "No fue posible recuperar el perfil solicitado",
    });
  }
}
