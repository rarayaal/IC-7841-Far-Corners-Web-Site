import type { PoolClient } from 'pg';
import { pool } from '../db.js';
import { registrarAuditoria } from './audit.repository.js';

export interface AsociacionMedia {
  project_id: string | null;
  event_id: string | null;
  content_id: string | null;
}

export interface DatosNuevaMedia extends AsociacionMedia {
  filename: string;
  url: string;
  alt_text: string | null;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
}

export interface FiltrosMedia {
  project_id?: string;
  event_id?: string;
  content_id?: string;
}

// Incluye el nombre de lo asociado para mostrarlo en la galería sin consultas extra.
const CONSULTA_BASE = `
  SELECT
    m.id,
    m.filename,
    m.url,
    m.alt_text,
    m.mime_type,
    m.size_bytes::integer AS size_bytes,
    m.project_id,
    m.event_id,
    m.content_id,
    m.uploaded_at,
    COALESCE(p.title, e.title, ic.title) AS association_label,
    ic.section AS content_section
  FROM media m
  LEFT JOIN projects p ON p.id = m.project_id
  LEFT JOIN events e ON e.id = m.event_id
  LEFT JOIN institutional_content ic ON ic.id = m.content_id
`;

export async function listarMedia(filtros: FiltrosMedia) {
  const condiciones: string[] = [];
  const valores: string[] = [];

  for (const columna of ['project_id', 'event_id', 'content_id'] as const) {
    const valor = filtros[columna];

    if (valor) {
      valores.push(valor);
      condiciones.push(`m.${columna} = $${valores.length}`);
    }
  }

  const resultado = await pool.query(
    `
      ${CONSULTA_BASE}
      ${condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''}
      ORDER BY m.uploaded_at DESC, m.id ASC
    `,
    valores
  );

  return resultado.rows;
}

export async function obtenerMedia(id: string) {
  const resultado = await pool.query(`${CONSULTA_BASE} WHERE m.id = $1`, [id]);

  return resultado.rows[0];
}

export async function existeLlave(llave: string) {
  const resultado = await pool.query(
    'SELECT 1 FROM media WHERE storage_key = $1',
    [llave]
  );

  return (resultado.rowCount ?? 0) > 0;
}

async function obtenerPorId(client: PoolClient, id: string) {
  const resultado = await client.query(`${CONSULTA_BASE} WHERE m.id = $1`, [
    id,
  ]);

  return resultado.rows[0];
}

export async function registrarMedia(
  datos: DatosNuevaMedia,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertada = await client.query(
      `
        INSERT INTO media (
          filename, url, alt_text, project_id, event_id, content_id,
          uploaded_by, storage_key, mime_type, size_bytes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        datos.filename,
        datos.url,
        datos.alt_text,
        datos.project_id,
        datos.event_id,
        datos.content_id,
        userId,
        datos.storage_key,
        datos.mime_type,
        datos.size_bytes,
      ]
    );

    const creada = await obtenerPorId(client, insertada.rows[0].id);

    await registrarAuditoria(client, {
      userId,
      action: 'create',
      tableName: 'media',
      recordId: creada.id,
      newValues: creada,
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return creada;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface DatosActualizarMedia extends AsociacionMedia {
  filename: string;
  alt_text: string | null;
}

export async function actualizarMedia(
  id: string,
  datos: DatosActualizarMedia,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const anterior = await client.query(
      'SELECT * FROM media WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (anterior.rowCount === 0) {
      await client.query('ROLLBACK');
      return undefined;
    }

    await client.query(
      `
        UPDATE media
        SET
          filename = $2,
          alt_text = $3,
          project_id = $4,
          event_id = $5,
          content_id = $6
        WHERE id = $1
      `,
      [
        id,
        datos.filename,
        datos.alt_text,
        datos.project_id,
        datos.event_id,
        datos.content_id,
      ]
    );

    const actualizada = await obtenerPorId(client, id);

    await registrarAuditoria(client, {
      userId,
      action: 'update',
      tableName: 'media',
      recordId: id,
      oldValues: anterior.rows[0],
      newValues: actualizada,
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return actualizada;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Borra el registro; el controlador elimina después el objeto del bucket.
export async function eliminarMedia(
  id: string,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await client.query(
      'DELETE FROM media WHERE id = $1 RETURNING *',
      [id]
    );

    if (resultado.rowCount === 0) {
      await client.query('ROLLBACK');
      return undefined;
    }

    await registrarAuditoria(client, {
      userId,
      action: 'delete',
      tableName: 'media',
      recordId: id,
      oldValues: resultado.rows[0],
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return resultado.rows[0] as { storage_key: string | null };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
