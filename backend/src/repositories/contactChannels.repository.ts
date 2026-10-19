import { pool } from '../db.js';

export async function obtenerContactosPublicados() {
  const resultado = await pool.query(`
    SELECT
      id,
      channel_type,
      label,
      label_en,
      value,
      value_en,
      link_url,
      display_order
    FROM contact_channels
    WHERE is_published = TRUE
    ORDER BY display_order ASC, id ASC
  `);

  return resultado.rows;
}

export async function obtenerTodosLosContactos() {
  const resultado = await pool.query(`
    SELECT
      id,
      channel_type,
      label,
      label_en,
      value,
      value_en,
      link_url,
      display_order,
      is_published
    FROM contact_channels
    ORDER BY display_order ASC, id ASC
  `);

  return resultado.rows;
}


export interface DatosActualizarContacto {
  label: string;
  label_en: string | null;
  value: string;
  value_en: string | null;
  link_url: string | null;
  display_order: number;
  is_published: boolean;
}

export async function actualizarContacto(
  id: string,
  datos: DatosActualizarContacto
) {
  const resultado = await pool.query(
    `
      UPDATE contact_channels
      SET
        label = $2,
        label_en = $3,
        value = $4,
        value_en = $5,
        link_url = $6,
        display_order = $7,
        is_published = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        id,
        channel_type,
        label,
        label_en,
        value,
        value_en,
        link_url,
        display_order,
        is_published
    `,
    [
      id,
      datos.label,
      datos.label_en,
      datos.value,
      datos.value_en,
      datos.link_url,
      datos.display_order,
      datos.is_published,
    ]
  );

  return resultado.rows[0];
}