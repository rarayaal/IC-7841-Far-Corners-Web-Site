import { pool } from "../db.js";

export interface UserEntity {
    id: string;
    full_name: string;
    email: string;
    password_hash: string | null;
    role: "admin" | "manager" | "user";
    participant_type: "internship" | "volunteer" | "camp" | null;
    status: "active" | "inactive";
    google_id: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface UserWithPermissions extends Omit<UserEntity, "password_hash"> {
  permissions: string[];
}
/**
 * Consulta un usuario por correo electronico para validacion de credenciales.
 */
export async function findUserByEmail(email: string): Promise<UserEntity | null> {
  const result = await pool.query<UserEntity>(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      role,
      participant_type,
      status,
      google_id,
      created_at,
      updated_at
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
    `,
    [email]
  );
  return result.rows[0] ?? null;
}
/**
 * Consulta un usuario mediante su identificador de Google OAuth.
 */
export async function findUserByGoogleId(googleId: string): Promise<UserEntity | null> {
  const result = await pool.query<UserEntity>(
    `
    SELECT
      id,
      full_name,
      email,
      password_hash,
      role,
      participant_type,
      status,
      google_id,
      created_at,
      updated_at
    FROM users
    WHERE google_id = $1
    LIMIT 1;
    `,
    [googleId]
  );
  return result.rows[0] ?? null;
}
/**
 * Vincula un identificador de Google OAuth a una cuenta de usuario existente.
 */
export async function linkGoogleIdToUser(userId: string, googleId: string): Promise<void> {
  await pool.query(
    `
    UPDATE users
    SET google_id = $1
    WHERE id = $2;
    `,
    [googleId, userId]
  );
}
/**
 * Crea un nuevo usuario registrado a traves de Google OAuth federado.
 */
export async function createGoogleUser(
  fullName: string,
  email: string,
  googleId: string
): Promise<UserEntity> {
  const result = await pool.query<UserEntity>(
    `
    INSERT INTO users (
      full_name,
      email,
      google_id,
      role,
      status
    )
    VALUES ($1, LOWER($2), $3, 'user', 'active')
    RETURNING
      id,
      full_name,
      email,
      password_hash,
      role,
      participant_type,
      status,
      google_id,
      created_at,
      updated_at;
    `,
    [fullName || "Usuario Far Corners", email, googleId]
  );
  return result.rows[0];
}
/**
 * Obtiene los codigos de permisos asignados a un usuario a traves de la tabla puente.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const result = await pool.query<{ code: string }>(
    `
    SELECT p.code
    FROM permissions p
    INNER JOIN user_permissions up ON p.id = up.permission_id
    WHERE up.user_id = $1
    ORDER BY p.code ASC;
    `,
    [userId]
  );
  return result.rows.map((row) => row.code);
}
/**
 * Obtiene la informacion del usuario y sus permisos, omitiendo el hash de contrasena.
 */
export async function getUserWithPermissionsById(userId: string): Promise<UserWithPermissions | null> {
  const userResult = await pool.query<Omit<UserEntity, "password_hash">>(
    `
    SELECT
      id,
      full_name,
      email,
      role,
      participant_type,
      status,
      google_id,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    LIMIT 1;
    `,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) return null;
  const permissions = await getUserPermissions(userId);
  return {
    ...user,
    permissions,
  };
}