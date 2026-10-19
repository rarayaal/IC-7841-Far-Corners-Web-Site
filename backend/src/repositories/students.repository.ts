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
