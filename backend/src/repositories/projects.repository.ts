import { pool } from "../db.js";

export interface ProjectInput {
  title: string;
  description?: string | null;
  country?: string | null;
  image_url?: string | null;
  display_order?: number;
  is_published?: boolean;
  project_year?: number | null;
  participants_count?: number | null;
}

export async function obtenerProyectosPublicados() {
  const result = await pool.query(`
    SELECT
      id,
      title,
      description,
      country,
      image_url,
      display_order,
      project_year,
      participants_count,
      is_published,
      created_at,
      updated_at
    FROM projects
    WHERE is_published = TRUE
    ORDER BY display_order ASC, id ASC
  `);

  return result.rows;
}

export async function obtenerTodosLosProyectos() {
  const result = await pool.query(`
    SELECT
      id,
      title,
      description,
      country,
      image_url,
      display_order,
      project_year,
      participants_count,
      is_published,
      created_at,
      updated_at
    FROM projects
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
      display_order,
      project_year,
      participants_count,
      is_published,
      created_at,
      updated_at
    FROM projects
    WHERE id = $1
    ORDER BY display_order ASC, id ASC
    `,
    [id],
  );

  return result.rows[0];
}

export async function crearProyecto(data: ProjectInput) {
  const result = await pool.query(
    `
    INSERT INTO projects (
      title,
      description,
      country,
      image_url,
      display_order,
      is_published,
      project_year,
      participants_count
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      data.title,
      data.description ?? null,
      data.country ?? null,
      data.image_url ?? null,
      data.display_order ?? 0,
      data.is_published ?? false,
      data.project_year ?? null,
      data.participants_count ?? null,
    ],
  );

  return result.rows[0];
}

export async function actualizarProyecto(id: string, data: Partial<ProjectInput>) {
  const result = await pool.query(
    `
    UPDATE projects
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      country = COALESCE($3, country),
      image_url = COALESCE($4, image_url),
      display_order = COALESCE($5, display_order),
      is_published = COALESCE($6, is_published),
      project_year = COALESCE($7, project_year),
      participants_count = COALESCE($8, participants_count),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $9
    RETURNING *
    `,
    [
      data.title ?? null,
      data.description ?? null,
      data.country ?? null,
      data.image_url ?? null,
      data.display_order ?? null,
      data.is_published ?? null,
      data.project_year ?? null,
      data.participants_count ?? null,
      id,
    ],
  );

  return result.rows[0];
}

export async function eliminarProyecto(id: string) {
  const result = await pool.query(
    `
    DELETE FROM projects
    WHERE id = $1
    RETURNING id
    `,
    [id],
  );

  return result.rows[0];
}
