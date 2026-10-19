import { pool } from "../db.js";

export interface Community {
  id: string;
  name: string;
  description: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function obtenerComunidades() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      description,
      is_published,
      created_at,
      updated_at
    FROM communities
    ORDER BY created_at DESC
  `);

  return result.rows as Community[];
}

export async function crearComunidad(name: string, description: string | null, is_published: boolean) {
  const result = await pool.query(
    `
    INSERT INTO communities (name, description, is_published)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, description, is_published]
  );

  return result.rows[0] as Community;
}
