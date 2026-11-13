import { Request, Response } from "express";
import bcrypt from "bcrypt";
import * as argon2 from "argon2";
import { authenticateLocal, authenticateGoogle, getCurrentUserProfile } from "../services/auth.service.js";
import {
  actualizarUsuarioPorId,
  obtenerUsuarioPorIdConPassword,
  actualizarPasswordUsuario,
} from "../repositories/users.repository.js";

/**
 * PUT /api/v1/me - Actualización del perfil del usuario autenticado
 */
export async function updateMyProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { full_name, current_password, new_password } = req.body ?? {};

    if (!userId) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      res.status(400).json({ message: "El nombre es obligatorio" });
      return;
    }

    const updatedUser = await actualizarUsuarioPorId(userId, full_name.trim());

    // Cambio de contrasena opcional en la misma solicitud de autoservicio
    if (new_password !== undefined) {
      if (typeof new_password !== "string" || new_password.length < 10 || new_password.length > 128) {
        res.status(400).json({ message: "La contraseña debe tener entre 10 y 128 caracteres" });
        return;
      }

      const userWithPassword = await obtenerUsuarioPorIdConPassword(userId);

      if (!userWithPassword) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }

      // Si ya tiene una contrasena local, se exige verificar la actual antes de cambiarla
      if (userWithPassword.password_hash) {
        if (typeof current_password !== "string" || current_password === "") {
          res.status(400).json({ message: "La contraseña actual es obligatoria para cambiarla" });
          return;
        }

        const isMatch = userWithPassword.password_hash.startsWith("$argon2")
          ? await argon2.verify(userWithPassword.password_hash, current_password)
          : await bcrypt.compare(current_password, userWithPassword.password_hash);

        if (!isMatch) {
          res.status(400).json({ message: "La contraseña actual es incorrecta" });
          return;
        }
      }

      const passwordHash = await argon2.hash(new_password, { type: argon2.argon2id });
      await actualizarPasswordUsuario(userId, passwordHash);
    }

    res.status(200).json({
      message: "Perfil actualizado correctamente",
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "No se pudo actualizar el perfil" });
  }
}

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
 * GET /api/v1/me - Consulta del perfil del usuario autenticado
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
