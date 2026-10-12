import { pool } from "../db.js";

export async function obtenerProyectosPublicados() {
	const result = await pool.query(`
    SELECT
      id,
      title,
      description,
      country,
      image_url,
      display_order
    FROM projects
    WHERE is_published = TRUE
    ORDER BY display_order ASC, id ASC
  `);

	return result.rows;
}

export async function obtenerProyectoPorId(id: string) {
	const result = await pool.query(
		`
    SELECT
      id,
      title,
      description,
      country,
      image_url,
      display_order
    FROM projects
    WHERE id = $1 and is_published = TRUE
    ORDER BY display_order ASC, id ASC
    `,
		[id],
	);

	return result.rows[0];
}
