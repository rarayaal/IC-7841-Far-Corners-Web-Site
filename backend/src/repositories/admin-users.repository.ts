import { pool } from "../db.js";

export interface AdminUserSummary {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "manager" | "visitor" | "user";
  status: "active" | "inactive";
  participant_type: string | null;
  created_at: Date;
  updated_at: Date;
  permissions: string[];
}

/**
 * Obtiene la lista completa de usuarios administrativos junto con sus permisos asignados
 */
export async function findAllAdminUsers(): Promise<AdminUserSummary[]> {
  const result = await pool.query<AdminUserSummary>(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.status,
      u.participant_type,
      u.created_at,
      u.updated_at,
      COALESCE(
        ARRAY_AGG(p.code) FILTER (WHERE p.code IS NOT NULL),
        '{}'
      ) AS permissions
    FROM users u
    LEFT JOIN user_permissions up ON u.id = up.user_id
    LEFT JOIN permissions p ON up.permission_id = p.id
    WHERE u.role IN ('admin', 'manager')
    GROUP BY u.id
    ORDER BY u.created_at ASC;
  `);

  return result.rows;
}

/**
 * Busca un usuario por su identificador unico
 */
export async function findUserById(id: string): Promise<AdminUserSummary | null> {
  const result = await pool.query<AdminUserSummary>(
    `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.status,
      u.participant_type,
      u.created_at,
      u.updated_at,
      COALESCE(
        ARRAY_AGG(p.code) FILTER (WHERE p.code IS NOT NULL),
        '{}'
      ) AS permissions
    FROM users u
    LEFT JOIN user_permissions up ON u.id = up.user_id
    LEFT JOIN permissions p ON up.permission_id = p.id
    WHERE u.id = $1
    GROUP BY u.id;
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

/**
 * Cuenta la cantidad de usuarios activos con rol 'admin' (Administrador General)
 */
export async function countActiveAdmins(): Promise<number> {
  const result = await pool.query<{ count: string }>(`
    SELECT COUNT(*) AS count
    FROM users
    WHERE role = 'admin' AND status = 'active';
  `);

  return parseInt(result.rows[0]?.count ?? "0", 10);
}

/**
 * Inserta un nuevo usuario administrativo en la base de datos
 */
export async function createAdminUser(
  fullName: string,
  email: string,
  passwordHash: string,
  role: "admin" | "manager"
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      role,
      status
    ) VALUES ($1, $2, $3, $4, 'active')
    RETURNING id;
    `,
    [fullName, email, passwordHash, role]
  );

  return result.rows[0].id;
}

/**
 * Actualiza los datos generales de un usuario administrativo
 */
export async function updateAdminUser(
  id: string,
  fullName: string,
  email: string,
  role: "admin" | "manager"
): Promise<void> {
  await pool.query(
    `
    UPDATE users
    SET
      full_name = $1,
      email = $2,
      role = $3
    WHERE id = $4;
    `,
    [fullName, email, role, id]
  );
}

/**
 * Modifica el estado de un usuario (baja logica: active / inactive)
 */
export async function updateAdminStatus(id: string, status: "active" | "inactive"): Promise<void> {
  await pool.query(
    `
    UPDATE users
    SET status = $1
    WHERE id = $2;
    `,
    [status, id]
  );
}

/**
 * Reemplaza los permisos asignados a un usuario de forma atomica dentro de una transaccion
 */
export async function syncUserPermissions(userId: string, permissionCodes: string[]): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Eliminar permisos asignados previamente
    await client.query(
      `
      DELETE FROM user_permissions
      WHERE user_id = $1;
      `,
      [userId]
    );

    // 2. Asociar los nuevos permisos a partir de sus codigos
    if (permissionCodes.length > 0) {
      await client.query(
        `
        INSERT INTO user_permissions (user_id, permission_id)
        SELECT $1, p.id
        FROM permissions p
        WHERE p.code = ANY($2::text[]);
        `,
        [userId, permissionCodes]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
