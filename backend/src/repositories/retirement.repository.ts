import type { PoolClient } from 'pg';
import { pool } from '../db.js';
import { registrarAuditoria } from './audit.repository.js';

// CU-24: el retiro es lógico. El registro se conserva y solo deja de estar
// publicado (is_published = FALSE), por lo que puede restaurarse.
//
// Los nombres de tabla y columna salen de este mapa y nunca de la petición.
export const TIPOS_RETIRABLES = {
  institutional: {
    tabla: 'institutional_content',
    titulo: 'title',
    detalle: `section || ' · ' || upper(language)`,
    fecha: 'updated_at',
    permiso: 'content:manage',
  },
  project: {
    tabla: 'projects',
    titulo: 'title',
    detalle: `COALESCE(country, '')`,
    fecha: 'updated_at',
    permiso: 'projects:manage',
  },
  event: {
    tabla: 'events',
    titulo: 'title',
    detalle: `COALESCE(season_year::text, '')`,
    fecha: 'updated_at',
    permiso: 'events:manage',
  },
  media: {
    tabla: 'media',
    titulo: 'filename',
    detalle: `COALESCE(mime_type, '')`,
    fecha: 'uploaded_at',
    permiso: 'media:manage',
  },
} as const;

export type TipoRetirable = keyof typeof TIPOS_RETIRABLES;

export function esTipoRetirable(valor: string): valor is TipoRetirable {
  return Object.hasOwn(TIPOS_RETIRABLES, valor);
}

export interface Consecuencia {
  code: string;
  count: number;
}

export interface Consecuencias {
  blocking: Consecuencia[];
  warnings: Consecuencia[];
}

type Consulta = Pick<PoolClient, 'query'>;

async function contar(consulta: Consulta, sql: string, valores: unknown[]) {
  const resultado = await consulta.query(sql, valores);

  return Number(resultado.rows[0].total);
}

// Qué ocurre con otros procesos si se retira el contenido. Lo que impide el
// retiro va en blocking; lo que solo debe saber la persona, en warnings.
export async function calcularConsecuencias(
  consulta: Consulta,
  tipo: TipoRetirable,
  id: string
): Promise<Consecuencias> {
  const blocking: Consecuencia[] = [];
  const warnings: Consecuencia[] = [];

  const agregar = (lista: Consecuencia[], code: string, count: number) => {
    if (count > 0) lista.push({ code, count });
  };

  const imagenesAsociadas = (columna: string) =>
    contar(
      consulta,
      `SELECT COUNT(*) AS total FROM media WHERE ${columna} = $1 AND is_published`,
      [id]
    );

  if (tipo === 'institutional') {
    agregar(warnings, 'images', await imagenesAsociadas('content_id'));
  }

  if (tipo === 'project') {
    agregar(
      warnings,
      'opportunities',
      await contar(
        consulta,
        `SELECT COUNT(*) AS total FROM opportunities WHERE project_id = $1 AND is_published`,
        [id]
      )
    );
    agregar(warnings, 'images', await imagenesAsociadas('project_id'));
  }

  if (tipo === 'event') {
    // Una obra con compras pagadas y funciones por venir no puede desaparecer.
    agregar(
      blocking,
      'paid_purchases',
      await contar(
        consulta,
        `
          SELECT COUNT(*) AS total
          FROM purchases p
          JOIN events e ON e.id = p.event_id
          WHERE p.event_id = $1
            AND p.status = 'paid'
            AND (
              e.event_date > NOW()
              OR EXISTS (
                SELECT 1 FROM event_performances ep
                WHERE ep.event_id = e.id
                  AND ep.status = 'scheduled'
                  AND ep.starts_at > NOW()
              )
            )
        `,
        [id]
      )
    );
    agregar(
      warnings,
      'upcoming_performances',
      await contar(
        consulta,
        `SELECT COUNT(*) AS total FROM event_performances WHERE event_id = $1 AND status = 'scheduled' AND starts_at > NOW()`,
        [id]
      )
    );
    agregar(warnings, 'images', await imagenesAsociadas('event_id'));
  }

  return { blocking, warnings };
}

export async function listarRetirables(
  tipo: TipoRetirable,
  publicado: boolean
) {
  const { tabla, titulo, detalle, fecha } = TIPOS_RETIRABLES[tipo];

  const resultado = await pool.query(
    `
      SELECT
        id,
        ${titulo} AS title,
        ${detalle} AS detail,
        is_published,
        ${fecha} AS changed_at
      FROM ${tabla}
      WHERE is_published = $1
      ORDER BY ${fecha} DESC, id ASC
    `,
    [publicado]
  );

  return resultado.rows;
}

export async function consultarConsecuencias(tipo: TipoRetirable, id: string) {
  const { tabla } = TIPOS_RETIRABLES[tipo];

  const existe = await pool.query(`SELECT 1 FROM ${tabla} WHERE id = $1`, [id]);

  if (existe.rowCount === 0) return undefined;

  return calcularConsecuencias(pool, tipo, id);
}

export type ResultadoCambio =
  | { estado: 'no_existe' }
  | { estado: 'sin_cambio' }
  | { estado: 'bloqueado'; consecuencias: Consecuencias }
  | { estado: 'requiere_confirmacion'; consecuencias: Consecuencias }
  | { estado: 'ok'; registro: Record<string, unknown> };

interface CambioPublicacion {
  tipo: TipoRetirable;
  id: string;
  publicar: boolean;
  confirmado: boolean;
  motivo: string | null;
  userId: string;
  ip: string | null;
}

// Retira (publicar = false) o restaura (publicar = true) dentro de una
// transacción con bloqueo de fila, para que las comprobaciones sigan vigentes
// al momento de escribir.
export async function cambiarPublicacion(
  cambio: CambioPublicacion
): Promise<ResultadoCambio> {
  const { tabla, titulo, fecha } = TIPOS_RETIRABLES[cambio.tipo];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const actual = await client.query(
      `SELECT id, ${titulo} AS title, is_published FROM ${tabla} WHERE id = $1 FOR UPDATE`,
      [cambio.id]
    );

    if (actual.rowCount === 0) {
      await client.query('ROLLBACK');
      return { estado: 'no_existe' };
    }

    if (actual.rows[0].is_published === cambio.publicar) {
      await client.query('ROLLBACK');
      return { estado: 'sin_cambio' };
    }

    if (!cambio.publicar) {
      const consecuencias = await calcularConsecuencias(
        client,
        cambio.tipo,
        cambio.id
      );

      if (consecuencias.blocking.length > 0) {
        await client.query('ROLLBACK');
        return { estado: 'bloqueado', consecuencias };
      }

      if (consecuencias.warnings.length > 0 && !cambio.confirmado) {
        await client.query('ROLLBACK');
        return { estado: 'requiere_confirmacion', consecuencias };
      }
    }

    // institutional_content exige saber quién hizo el último cambio.
    const actualizado = await client.query(
      `
        UPDATE ${tabla}
        SET is_published = $2${cambio.tipo === 'institutional' ? ', updated_by = $3' : ''}
        WHERE id = $1
        RETURNING id, ${titulo} AS title, is_published, ${fecha} AS changed_at
      `,
      cambio.tipo === 'institutional'
        ? [cambio.id, cambio.publicar, cambio.userId]
        : [cambio.id, cambio.publicar]
    );

    await registrarAuditoria(client, {
      userId: cambio.userId,
      action: 'update',
      tableName: tabla,
      recordId: cambio.id,
      oldValues: { is_published: !cambio.publicar },
      newValues: {
        is_published: cambio.publicar,
        operation: cambio.publicar ? 'restore' : 'withdraw',
        reason: cambio.motivo,
      },
      ipAddress: cambio.ip,
    });

    await client.query('COMMIT');

    return { estado: 'ok', registro: actualizado.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
