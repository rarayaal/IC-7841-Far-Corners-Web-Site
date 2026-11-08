import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  findUserByEmail,
  findUserByGoogleId,
  getUserPermissions,
  linkGoogleIdToUser,
  createGoogleUser,
  getUserWithPermissionsById,
  UserWithPermissions,
} from "../repositories/auth.repository.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_super_secret_jwt_key_far_corners_2026_tec";
const JWT_EXPIRATION_HOURS = Number(process.env.JWT_EXPIRATION_HOURS ?? 8);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthSuccessResponse {
  token: string;
  expiresIn: string;
  user: UserWithPermissions;
}

/**
 * Genera un token JWT firmado simetricamente con HMAC-SHA256
 */
export function generateAuthToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${JWT_EXPIRATION_HOURS}h`,
  });
}

/**
 * Valida un token JWT y devuelve el contenido del payload
 */
export function verifyAuthToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Procesa el inicio de sesion local con credenciales de correo y contrasena
 */
export async function authenticateLocal(email: string, password: string): Promise<AuthSuccessResponse> {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Credenciales inválidas");
  }

  if (user.status !== "active") {
    throw new Error("Esta cuenta se encuentra inactiva. Contacte al Administrador General");
  }

  if (!user.password_hash) {
    throw new Error("La cuenta no tiene contraseña local configurada. Inicie sesión con Google");
  }

  // Compara la contrasena recibida contra el hash bcrypt
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error("Credenciales inválidas");
  }

  const permissions = await getUserPermissions(user.id);

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions,
  };

  const token = generateAuthToken(payload);

  const { password_hash, ...safeUser } = user;

  return {
    token,
    expiresIn: `${JWT_EXPIRATION_HOURS}h`,
    user: {
      ...safeUser,
      permissions,
    },
  };
}

/**
 * Procesa el inicio de sesion federado con Google OAuth 2.0
 */
export async function authenticateGoogle(idToken: string): Promise<AuthSuccessResponse> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("La integración con Google OAuth no está configurada en las variables de entorno");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });

  const googlePayload = ticket.getPayload();
  if (!googlePayload || !googlePayload.email) {
    throw new Error("Token de Google inválido");
  }

  const email = googlePayload.email;
  const googleId = googlePayload.sub;

  // 1. Buscar si ya existe por google_id
  let user = await findUserByGoogleId(googleId);

  // 2. Si no existe por google_id, buscar por email y vincular google_id
  if (!user) {
    user = await findUserByEmail(email);
    if (user) {
      await linkGoogleIdToUser(user.id, googleId);
      user.google_id = googleId;
    }
  }

  // 3. Si no existe la cuenta, crearla automaticamente como visitante (visitor)
  if (!user) {
    const fullName = googlePayload.name || (email.split("@")[0] ?? "Usuario Far Corners");
    user = await createGoogleUser(fullName, email, googleId);
  }

  if (user.status !== "active") {
    throw new Error("Esta cuenta se encuentra inactiva. Contacte al Administrador General");
  }

  const permissions = await getUserPermissions(user.id);

  const token = generateAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions,
  });

  const { password_hash, ...safeUser } = user;

  return {
    token,
    expiresIn: `${JWT_EXPIRATION_HOURS}h`,
    user: {
      ...safeUser,
      permissions,
    },
  };
}

/**
 * Recupera el perfil del usuario autenticado actual
 */
export async function getCurrentUserProfile(userId: string): Promise<UserWithPermissions> {
  const user = await getUserWithPermissionsById(userId);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  return user;
}
