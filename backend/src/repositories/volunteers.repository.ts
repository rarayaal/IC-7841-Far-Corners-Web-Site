import { pool } from "../db.js";

export interface VolunteerProfile {
  id: string;
  user_id: string;
  interests: string | null;
  availability: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function obtenerVoluntarios() {
  const result = await pool.query(`
    SELECT
      vp.id,
      vp.user_id,
      u.full_name as volunteer_name,
      u.email as volunteer_email,
      vp.interests,
      vp.availability,
      vp.status
    FROM volunteer_profiles vp
    JOIN users u ON vp.user_id = u.id
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

export async function crearPerfilVoluntario(
  user_id: string,
  interests: string | null,
  availability: string | null
) {
  const result = await pool.query(
    `
    INSERT INTO volunteer_profiles (user_id, interests, availability)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [user_id, interests, availability]
  );

  return result.rows[0];
}

export async function actualizarPerfilVoluntario(
  id: string,
  interests: string | null,
  availability: string | null,
  status: string | null
) {
  const result = await pool.query(
    `
    UPDATE volunteer_profiles
    SET interests = $1, availability = $2, status = COALESCE($3, status)
    WHERE id = $4
    RETURNING *
    `,
    [interests, availability, status, id]
  );

  return result.rows[0];
}

export async function obtenerUsuariosSinPerfilVoluntario() {
  const result = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.participant_type
    FROM users u
    WHERE u.participant_type IN ('volunteer', 'intern')
      AND NOT EXISTS (
        SELECT 1 FROM volunteer_profiles vp WHERE vp.user_id = u.id
      )
    ORDER BY u.full_name ASC
  `);

  return result.rows;
}

export async function eliminarPerfilVoluntario(id: string) {
  const result = await pool.query(
    `
    DELETE FROM volunteer_profiles
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  return result.rows[0];
}
