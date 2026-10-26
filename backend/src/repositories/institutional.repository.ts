import { pool } from '../db.js';
import { registrarAuditoria } from './audit.repository.js';

// CU-01 historia, CU-02 impacto y CU-03 visión de futuro comparten la tabla
// institutional_content y se distinguen por la columna section.
export const SECCIONES_INSTITUCIONALES = ['history', 'impact', 'future'] as const;

export type SeccionInstitucional = (typeof SECCIONES_INSTITUCIONALES)[number];

export const IDIOMAS_INSTITUCIONALES = ['es', 'en'] as const;

export type IdiomaInstitucional = (typeof IDIOMAS_INSTITUCIONALES)[number];

export interface DatosContenidoInstitucional {
  page_slug: string;
  language: IdiomaInstitucional;
  title: string;
  subtitle: string | null;
  content: string;
  cta_label: string | null;
  cta_target: string | null;
  display_order: number;
  is_published: boolean;
}

const COLUMNAS = `
  id,
  page_slug,
  section,
  language,
  title,
  subtitle,
  content,
  cta_label,
  cta_target,
  display_order,
  is_published,
  updated_at
`;

// Devuelve el contenido publicado de una sección. Si una página no tiene
// traducción al idioma pedido se usa la versión en español.
export async function obtenerContenidoPublicado(
  section: SeccionInstitucional,
  language: IdiomaInstitucional
) {
  const resultado = await pool.query(
    `
      SELECT DISTINCT ON (page_slug) ${COLUMNAS}
      FROM institutional_content
      WHERE section = $1
        AND is_published = TRUE
        AND language IN ($2, 'es')
      ORDER BY page_slug, (language = $2) DESC
    `,
    [section, language]
  );

  return resultado.rows.sort(
    (a, b) =>
      a.display_order - b.display_order ||
      a.page_slug.localeCompare(b.page_slug)
  );
}

export async function obtenerContenidoAdmin(section: SeccionInstitucional) {
  const resultado = await pool.query(
    `
      SELECT ${COLUMNAS}
      FROM institutional_content
      WHERE section = $1
      ORDER BY display_order ASC, page_slug ASC, language ASC
    `,
    [section]
  );

  return resultado.rows;
}

export async function crearContenido(
  section: SeccionInstitucional,
  datos: DatosContenidoInstitucional,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await client.query(
      `
        INSERT INTO institutional_content (
          page_slug, section, language, title, subtitle, content,
          cta_label, cta_target, display_order, is_published, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING ${COLUMNAS}
      `,
      [
        datos.page_slug,
        section,
        datos.language,
        datos.title,
        datos.subtitle,
        datos.content,
        datos.cta_label,
        datos.cta_target,
        datos.display_order,
        datos.is_published,
        userId,
      ]
    );

    const creado = resultado.rows[0];

    await registrarAuditoria(client, {
      userId,
      action: 'create',
      tableName: 'institutional_content',
      recordId: creado.id,
      newValues: creado,
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return creado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarContenido(
  id: string,
  section: SeccionInstitucional,
  datos: DatosContenidoInstitucional,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const anterior = await client.query(
      `
        SELECT ${COLUMNAS}
        FROM institutional_content
        WHERE id = $1 AND section = $2
        FOR UPDATE
      `,
      [id, section]
    );

    if (anterior.rowCount === 0) {
      await client.query('ROLLBACK');
      return undefined;
    }

    const resultado = await client.query(
      `
        UPDATE institutional_content
        SET
          page_slug = $3,
          language = $4,
          title = $5,
          subtitle = $6,
          content = $7,
          cta_label = $8,
          cta_target = $9,
          display_order = $10,
          is_published = $11,
          updated_by = $12
        WHERE id = $1 AND section = $2
        RETURNING ${COLUMNAS}
      `,
      [
        id,
        section,
        datos.page_slug,
        datos.language,
        datos.title,
        datos.subtitle,
        datos.content,
        datos.cta_label,
        datos.cta_target,
        datos.display_order,
        datos.is_published,
        userId,
      ]
    );

    const actualizado = resultado.rows[0];

    await registrarAuditoria(client, {
      userId,
      action: 'update',
      tableName: 'institutional_content',
      recordId: id,
      oldValues: anterior.rows[0],
      newValues: actualizado,
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return actualizado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Eliminación definitiva (CU-01/02/03). El retiro lógico es el CU-24.
export async function eliminarContenido(
  id: string,
  section: SeccionInstitucional,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await client.query(
      `
        DELETE FROM institutional_content
        WHERE id = $1 AND section = $2
        RETURNING ${COLUMNAS}
      `,
      [id, section]
    );

    if (resultado.rowCount === 0) {
      await client.query('ROLLBACK');
      return undefined;
    }

    await registrarAuditoria(client, {
      userId,
      action: 'delete',
      tableName: 'institutional_content',
      recordId: id,
      oldValues: resultado.rows[0],
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return resultado.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
