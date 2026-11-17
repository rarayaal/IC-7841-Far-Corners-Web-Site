import { pool } from "../db.js";

/**
 * Busca contenido publico por texto, de forma agrupada por tipo.
 * El parametro `q` se convierte en un patron ILIKE con comodines.
 */
export async function buscarContenido(q: string) {
  const patron = `%${q}%`;

  const [eventos, proyectos, comunidades, oportunidades] = await Promise.all([
    pool.query(
      `
      SELECT id, title, description, event_date, venue
      FROM events
      WHERE is_published = TRUE
        AND (title ILIKE $1 OR description ILIKE $1)
      ORDER BY title ASC
      LIMIT 20
      `,
      [patron]
    ),
    pool.query(
      `
      SELECT id, title, description, country
      FROM projects
      WHERE is_published = TRUE
        AND (title ILIKE $1 OR description ILIKE $1)
      ORDER BY title ASC
      LIMIT 20
      `,
      [patron]
    ),
    pool.query(
      `
      SELECT id, name, description
      FROM communities
      WHERE is_published = TRUE
        AND (name ILIKE $1 OR description ILIKE $1)
      ORDER BY name ASC
      LIMIT 20
      `,
      [patron]
    ),
    pool.query(
      `
      SELECT id, title, title_en, description, description_en, type, location
      FROM opportunities
      WHERE is_published = TRUE
        AND (title ILIKE $1 OR description ILIKE $1)
      ORDER BY title ASC
      LIMIT 20
      `,
      [patron]
    ),
  ]);

  return {
    events: eventos.rows,
    projects: proyectos.rows,
    communities: comunidades.rows,
    opportunities: oportunidades.rows,
  };
}
