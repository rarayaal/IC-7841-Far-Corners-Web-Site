import { pool } from "../db.js";
import type { RowDataPacket } from "mysql2";

export async function obtenerProyectosPublicados() {
  const [proyectos] = await pool.execute<RowDataPacket[]>(`
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

  return proyectos;
}

export async function obtenerProyectoPorId(id: string){
    const [proyectos] = await pool.execute<RowDataPacket[]>(`
    SELECT
      id,
      title,
      description,
      country,
      image_url,
      display_order
    FROM projects
    WHERE id = ? and is_published = TRUE
    ORDER BY display_order ASC, id ASC

    `, [id]);
    

    return proyectos[0];
}