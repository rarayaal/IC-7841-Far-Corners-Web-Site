import { pool } from "../db.js";

export type UserRole = "admin" | "manager" | "user";
export type ParticipantType = "internship" | "volunteer" | "camp";

export interface AdminUserSummary {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive";
  participant_type: ParticipantType | null;
  created_at: Date;
  updated_at: Date;
  permissions: string[];
}

export interface UserListFilters {
  role?: UserRole;
  search?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedUsers {
  rows: AdminUserSummary[];
  total: number;
}

/**
 * Lista paginada de todos los usuarios (admin, manager y user) con busqueda
 * por nombre o correo y filtro opcional por rol.
 */
export async function findAllUsersPaginated(
  filters: UserListFilters
): Promise<PaginatedUsers> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.role) {
    values.push(filters.role);
    conditions.push(`u.role = $${values.length}`);
  }

  if (filters.search && filters.search.trim() !== "") {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`
    );
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const limit = Math.max(1, Math.min(filters.pageSize, 100));
  const offset = Math.max(0, (filters.page - 1) * limit);

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM users u ${where}`,
    values
  );

  values.push(limit, offset);
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

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
    ${where}
    GROUP BY u.id
    ORDER BY u.created_at DESC, u.id DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `,
    values
  );

  return {
    rows: result.rows,
    total: parseInt(countResult.rows[0]?.total ?? "0", 10),
  };
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
  role: UserRole
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
  role: UserRole
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
 * Asigna o limpia el tipo de participante de un usuario y mantiene sincronizado
 * su perfil: 'internship' crea el perfil de estudiante, 'volunteer' el de
 * voluntario, 'camp' el de campista y cualquier otro valor lo retira de las
 * tres pestanas.
 */
export async function setUserParticipantType(
  id: string,
  participantType: ParticipantType | null
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE users
      SET participant_type = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
      `,
      [id, participantType]
    );

    if (participantType === "internship") {
      await client.query(
        `
        INSERT INTO student_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
        `,
        [id]
      );
      await client.query(`DELETE FROM volunteer_profiles WHERE user_id = $1;`, [id]);
      await client.query(`DELETE FROM camp_profiles WHERE user_id = $1;`, [id]);
    } else if (participantType === "volunteer") {
      await client.query(
        `
        INSERT INTO volunteer_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
        `,
        [id]
      );
      await client.query(`DELETE FROM student_profiles WHERE user_id = $1;`, [id]);
      await client.query(`DELETE FROM camp_profiles WHERE user_id = $1;`, [id]);
    } else if (participantType === "camp") {
      await client.query(
        `
        INSERT INTO camp_profiles (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING;
        `,
        [id]
      );
      await client.query(`DELETE FROM student_profiles WHERE user_id = $1;`, [id]);
      await client.query(`DELETE FROM volunteer_profiles WHERE user_id = $1;`, [id]);
    } else {
      await client.query(`DELETE FROM student_profiles WHERE user_id = $1;`, [id]);
      await client.query(`DELETE FROM volunteer_profiles WHERE user_id = $1;`, [id]);
      await client.query(`DELETE FROM camp_profiles WHERE user_id = $1;`, [id]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
