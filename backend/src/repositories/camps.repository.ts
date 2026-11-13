import { pool } from "../db.js";

export async function obtenerCampistas() {
  const result = await pool.query(`
    SELECT
      cp.id,
      cp.user_id,
      u.full_name as camper_name,
      u.email as camper_email,
      cp.school,
      cp.grade,
      cp.session,
      cp.status
    FROM camp_profiles cp
    JOIN users u ON cp.user_id = u.id
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

export async function crearPerfilCampista(
  user_id: string,
  school: string | null,
  grade: string | null,
  session: string | null
) {
  const result = await pool.query(
    `
    INSERT INTO camp_profiles (user_id, school, grade, session)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [user_id, school, grade, session]
  );

  return result.rows[0];
}

export async function actualizarPerfilCampista(
  id: string,
  school: string | null,
  grade: string | null,
  session: string | null,
  status: string | null
) {
  const result = await pool.query(
    `
    UPDATE camp_profiles
    SET school = $1, grade = $2, session = $3, status = COALESCE($4, status)
    WHERE id = $5
    RETURNING *
    `,
    [school, grade, session, status, id]
  );

  return result.rows[0];
}

export async function obtenerUsuariosSinPerfilCampista() {
  const result = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.participant_type
    FROM users u
    WHERE u.participant_type = 'camp'
      AND NOT EXISTS (
        SELECT 1 FROM camp_profiles cp WHERE cp.user_id = u.id
      )
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

export async function eliminarPerfilCampista(id: string) {
  const result = await pool.query(
    `
    WITH borrado AS (
      DELETE FROM camp_profiles
      WHERE id = $1
      RETURNING user_id
    )
    UPDATE users u
       SET participant_type = NULL, updated_at = CURRENT_TIMESTAMP
      FROM borrado b
     WHERE u.id = b.user_id
       AND u.participant_type = 'camp'
    RETURNING u.id
    `,
    [id]
  );

  return result.rows[0];
}
