import { pool } from "../db.js";

export interface StudentProfile {
  id: string;
  user_id: string;
  university: string | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function obtenerEstudiantes() {
  const result = await pool.query(`
    SELECT
      sp.id,
      sp.user_id,
      u.full_name as student_name,
      u.email as student_email,
      sp.university,
      sp.start_date,
      sp.end_date,
      sp.status
    FROM student_profiles sp
    JOIN users u ON sp.user_id = u.id
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

export async function crearPerfilEstudiante(
  user_id: string,
  university: string | null,
  start_date: string | null,
  end_date: string | null
) {
  const result = await pool.query(
    `
    INSERT INTO student_profiles (user_id, university, start_date, end_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [user_id, university, start_date, end_date]
  );

  return result.rows[0];
}

export async function actualizarPerfilEstudiante(
  id: string,
  university: string | null,
  start_date: string | null,
  end_date: string | null,
  status: string | null
) {
  const result = await pool.query(
    `
    UPDATE student_profiles
    SET university = $1, start_date = $2, end_date = $3, status = COALESCE($4, status)
    WHERE id = $5
    RETURNING *
    `,
    [university, start_date, end_date, status, id]
  );

  return result.rows[0];
}

export async function obtenerUsuariosSinPerfilEstudiante() {
  const result = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.participant_type
    FROM users u
    WHERE u.participant_type = 'internship'
      AND NOT EXISTS (
        SELECT 1 FROM student_profiles sp WHERE sp.user_id = u.id
      )
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

export async function eliminarPerfilEstudiante(id: string) {
  const result = await pool.query(
    `
    WITH borrado AS (
      DELETE FROM student_profiles
      WHERE id = $1
      RETURNING user_id
    )
    UPDATE users u
       SET participant_type = NULL, updated_at = CURRENT_TIMESTAMP
      FROM borrado b
     WHERE u.id = b.user_id
       AND u.participant_type = 'internship'
    RETURNING u.id
    `,
    [id]
  );

  return result.rows[0];
}
