import { pool } from "../db.js";

export interface PerformanceInput {
  id?: string;
  starts_at: string; // ISO date string
  ends_at?: string | null;
  venue: string;
  max_capacity: number;
  status?: 'scheduled' | 'cancelled' | 'completed';
  price_crc?: number;
  price_usd?: number;
}

export interface CastMemberInput {
  id?: string;
  person_id?: string;
  full_name: string;
  role: string;
  role_en?: string;
  biography?: string;
  biography_en?: string;
  photo_url?: string;
  display_order?: number;
}

export interface EventInput {
  title: string;
  description?: string | null;
  event_date?: string;
  venue?: string | null;
  max_capacity?: number;
  poster_url?: string | null;
  banner_url?: string | null;
  director?: string | null;
  season_year?: number | null;
  status?: 'upcoming' | 'current' | 'past' | 'cancelled';
  dates_label?: string | null;
  display_order?: number;
  is_published?: boolean;
  is_featured?: boolean;
  zeffy_url?: string | null;
  paypal_url?: string | null;
  sinpe_phone?: string | null;
  payment_methods?: string | string[] | null;
  performances?: PerformanceInput[];
  cast?: CastMemberInput[];
  media_ids?: string[];
}

export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  max_capacity: number;
  poster_url: string | null;
  banner_url: string | null;
  director: string | null;
  season_year: number | null;
  status: string;
  dates_label: string | null;
  display_order: number;
  is_published: boolean;
  is_featured: boolean;
  zeffy_url?: string | null;
  paypal_url?: string | null;
  sinpe_phone?: string | null;
  payment_methods?: string | string[] | null;
  created_at: string;
  updated_at: string;
  performances?: any[];
  cast?: any[];
  media?: any[];
  inventory?: any[];
}

let paymentColumnsEnsured = false;
async function ensurePaymentColumns() {
  if (paymentColumnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS zeffy_url TEXT;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS paypal_url TEXT;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS sinpe_phone VARCHAR(50) DEFAULT '7131-7013';
      ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_methods VARCHAR(255) DEFAULT 'sinpe,zeffy,paypal';
    `);
    paymentColumnsEnsured = true;
  } catch (err) {
    // Si falla o la base no está lista, continuará sin bloquear
  }
}

// Obtener lista de eventos (obras) con sus funciones y elenco
export async function obtenerEventos(soloPublicados = true): Promise<EventRow[]> {
  await ensurePaymentColumns();
  const whereClause = soloPublicados ? "WHERE e.is_published = TRUE" : "";
  const query = `
    SELECT
      e.id,
      e.title,
      e.description,
      e.event_date,
      e.venue,
      e.max_capacity,
      e.poster_url,
      e.banner_url,
      e.director,
      e.season_year,
      e.status,
      e.dates_label,
      e.display_order,
      e.is_published,
      e.is_featured,
      e.zeffy_url,
      e.paypal_url,
      e.sinpe_phone,
      e.payment_methods,
      e.created_at,
      e.updated_at,
      COALESCE(
        (
          SELECT json_agg(p)
          FROM (
            SELECT
              ep.id,
              ep.starts_at,
              ep.ends_at,
              ep.venue,
              ep.max_capacity,
              ep.status,
              COALESCE(
                (
                  SELECT json_agg(ti)
                  FROM (
                    SELECT
                      id,
                      ticket_type,
                      price,
                      currency,
                      quantity_available,
                      quantity_sold
                    FROM ticket_inventory
                    WHERE performance_id = ep.id
                  ) ti
                ),
                '[]'::json
              ) AS inventory
            FROM event_performances ep
            WHERE ep.event_id = e.id
            ORDER BY ep.starts_at ASC
          ) p
        ),
        '[]'::json
      ) AS performances,
      COALESCE(
        (
          SELECT json_agg(c)
          FROM (
            SELECT
              ec.id,
              ec.person_id,
              p.full_name,
              ec.role,
              ec.role_en,
              p.photo_url,
              p.biography,
              ec.display_order
            FROM event_cast ec
            JOIN people p ON p.id = ec.person_id
            WHERE ec.event_id = e.id
            ORDER BY ec.display_order ASC
          ) c
        ),
        '[]'::json
      ) AS cast,
      COALESCE(
        (
          SELECT json_agg(m)
          FROM (
            SELECT
              id,
              filename,
              url,
              alt_text
            FROM media
            WHERE event_id = e.id AND is_published = TRUE
            ORDER BY uploaded_at DESC
          ) m
        ),
        '[]'::json
      ) AS media,
      COALESCE(
        (
          SELECT json_agg(inv)
          FROM (
            SELECT
              id,
              ticket_type,
              price,
              currency,
              quantity_available,
              quantity_sold
            FROM ticket_inventory
            WHERE event_id = e.id AND performance_id IS NULL
          ) inv
        ),
        '[]'::json
      ) AS inventory
    FROM events e
    ${whereClause}
    ORDER BY e.is_featured DESC, e.display_order ASC, e.event_date DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

// Obtener el evento marcado como principal (is_featured = TRUE)
export async function obtenerEventoDestacado(): Promise<EventRow | null> {
  const eventos = await obtenerEventos(true);
  const destacado = eventos.find((e) => e.is_featured);
  return destacado || eventos[0] || null;
}

// Obtener un evento por ID
export async function obtenerEventoPorId(id: string): Promise<EventRow | null> {
  await ensurePaymentColumns();
  const query = `
    SELECT
      e.id,
      e.title,
      e.description,
      e.event_date,
      e.venue,
      e.max_capacity,
      e.poster_url,
      e.banner_url,
      e.director,
      e.season_year,
      e.status,
      e.dates_label,
      e.display_order,
      e.is_published,
      e.is_featured,
      e.zeffy_url,
      e.paypal_url,
      e.sinpe_phone,
      e.payment_methods,
      e.created_at,
      e.updated_at,
      COALESCE(
        (
          SELECT json_agg(p)
          FROM (
            SELECT
              ep.id,
              ep.starts_at,
              ep.ends_at,
              ep.venue,
              ep.max_capacity,
              ep.status,
              COALESCE(
                (
                  SELECT json_agg(ti)
                  FROM (
                    SELECT
                      id,
                      ticket_type,
                      price,
                      currency,
                      quantity_available,
                      quantity_sold
                    FROM ticket_inventory
                    WHERE performance_id = ep.id
                  ) ti
                ),
                '[]'::json
              ) AS inventory
            FROM event_performances ep
            WHERE ep.event_id = e.id
            ORDER BY ep.starts_at ASC
          ) p
        ),
        '[]'::json
      ) AS performances,
      COALESCE(
        (
          SELECT json_agg(c)
          FROM (
            SELECT
              ec.id,
              ec.person_id,
              p.full_name,
              ec.role,
              ec.role_en,
              p.photo_url,
              p.biography,
              ec.display_order
            FROM event_cast ec
            JOIN people p ON p.id = ec.person_id
            WHERE ec.event_id = e.id
            ORDER BY ec.display_order ASC
          ) c
        ),
        '[]'::json
      ) AS cast,
      COALESCE(
        (
          SELECT json_agg(m)
          FROM (
            SELECT
              id,
              filename,
              url,
              alt_text
            FROM media
            WHERE event_id = e.id AND is_published = TRUE
            ORDER BY uploaded_at DESC
          ) m
        ),
        '[]'::json
      ) AS media,
      COALESCE(
        (
          SELECT json_agg(inv)
          FROM (
            SELECT
              id,
              ticket_type,
              price,
              currency,
              quantity_available,
              quantity_sold
            FROM ticket_inventory
            WHERE event_id = e.id AND performance_id IS NULL
          ) inv
        ),
        '[]'::json
      ) AS inventory
    FROM events e
    WHERE e.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// Crear un nuevo evento completo con funciones, elenco y precios de manera transaccional
export async function crearEvento(data: EventInput): Promise<EventRow> {
  await ensurePaymentColumns();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Si viene marcado como principal, desmarcar los anteriores
    if (data.is_featured) {
      await client.query("UPDATE events SET is_featured = FALSE");
    }

    const eventDate = data.event_date
      ? new Date(data.event_date).toISOString()
      : (data.performances && data.performances[0]?.starts_at
          ? new Date(data.performances[0].starts_at).toISOString()
          : new Date().toISOString());

    const venue = data.venue || (data.performances && data.performances[0]?.venue) || "Teatro Comunitario";
    const maxCapacity = data.max_capacity
      ? parseInt(String(data.max_capacity), 10)
      : (data.performances && data.performances[0]?.max_capacity
          ? parseInt(String(data.performances[0].max_capacity), 10)
          : 100);

    const seasonYear = data.season_year
      ? parseInt(String(data.season_year), 10)
      : new Date().getFullYear();

    const displayOrder = data.display_order !== undefined
      ? parseInt(String(data.display_order), 10)
      : 0;

    const eventInsertQuery = `
      INSERT INTO events (
        title,
        description,
        event_date,
        venue,
        max_capacity,
        poster_url,
        banner_url,
        director,
        season_year,
        status,
        dates_label,
        display_order,
        is_published,
        is_featured,
        zeffy_url,
        paypal_url,
        sinpe_phone,
        payment_methods
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;

    const eventValues = [
      data.title,
      data.description || null,
      eventDate,
      venue,
      maxCapacity,
      data.poster_url || null,
      data.banner_url || null,
      data.director || null,
      seasonYear,
      data.status || 'current',
      data.dates_label || null,
      displayOrder,
      data.is_published !== undefined ? data.is_published : true,
      !!data.is_featured,
      data.zeffy_url || null,
      data.paypal_url || null,
      data.sinpe_phone || '7131-7013',
      Array.isArray(data.payment_methods) ? data.payment_methods.join(',') : (data.payment_methods || 'sinpe,zeffy,paypal'),
    ];

    const eventResult = await client.query(eventInsertQuery, eventValues);
    const createdEvent = eventResult.rows[0];

    // 1. Insertar Funciones (performances) e Inventario de Boletos
    const perfsValidas = (data.performances || []).filter(
      (p) => p && p.starts_at && p.venue && p.venue.trim() !== ''
    );

    if (perfsValidas.length > 0) {
      for (const perf of perfsValidas) {
        let fechaInicio: string;
        try {
          const d = new Date(perf.starts_at);
          fechaInicio = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch {
          fechaInicio = new Date().toISOString();
        }

        const perfResult = await client.query(
          `
          INSERT INTO event_performances (
            event_id,
            starts_at,
            ends_at,
            venue,
            max_capacity,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
          `,
          [
            createdEvent.id,
            fechaInicio,
            perf.ends_at ? new Date(perf.ends_at).toISOString() : null,
            perf.venue.trim(),
            perf.max_capacity && perf.max_capacity > 0 ? perf.max_capacity : maxCapacity,
            perf.status || 'scheduled',
          ]
        );
        const createdPerf = perfResult.rows[0];

        // Inventario de boletos por función en Colones (CRC)
        const priceCrc = perf.price_crc !== undefined && perf.price_crc !== null ? perf.price_crc : 10000;
        await client.query(
          `
          INSERT INTO ticket_inventory (
            event_id,
            performance_id,
            ticket_type,
            ticket_type_en,
            price,
            quantity_available,
            quantity_sold,
            currency
          )
          VALUES ($1, $2, 'General', 'General Admission', $3, $4, 0, 'CRC');
          `,
          [createdEvent.id, createdPerf.id, priceCrc, createdPerf.max_capacity]
        );

        // Inventario de boletos por función en Dólares (USD)
        const priceUsd = perf.price_usd !== undefined && perf.price_usd !== null ? perf.price_usd : 20;
        await client.query(
          `
          INSERT INTO ticket_inventory (
            event_id,
            performance_id,
            ticket_type,
            ticket_type_en,
            price,
            quantity_available,
            quantity_sold,
            currency
          )
          VALUES ($1, $2, 'General USD', 'General Admission USD', $3, $4, 0, 'USD');
          `,
          [createdEvent.id, createdPerf.id, priceUsd, createdPerf.max_capacity]
        );
      }
    } else {
      // Si no vienen funciones específicas, crear inventario general del evento
      await client.query(
        `
        INSERT INTO ticket_inventory (
          event_id,
          ticket_type,
          price,
          quantity_available,
          quantity_sold,
          currency
        )
        VALUES ($1, 'General', 10000, $2, 0, 'CRC'), ($1, 'General USD', 20, $2, 0, 'USD');
        `,
        [createdEvent.id, maxCapacity]
      );
    }

    // 2. Insertar Elenco (cast + people)
    const castValido = (data.cast || []).filter(
      (c) => c && c.full_name && c.full_name.trim() !== '' && c.role && c.role.trim() !== ''
    );

    if (castValido.length > 0) {
      for (let i = 0; i < castValido.length; i++) {
        const c = castValido[i];
        let personId = c.person_id;

        if (!personId) {
          // Buscar si la persona ya existe por nombre o crearla
          const personCheck = await client.query(
            "SELECT id FROM people WHERE LOWER(full_name) = LOWER($1)",
            [c.full_name.trim()]
          );

          if (personCheck.rows.length > 0) {
            personId = personCheck.rows[0].id;
            await client.query(
              `UPDATE people SET photo_url = COALESCE($1, photo_url), biography = COALESCE($2, biography) WHERE id = $3`,
              [c.photo_url || null, c.biography ? c.biography.trim() : null, personId]
            );
          } else {
            const personInsert = await client.query(
              `
              INSERT INTO people (full_name, photo_url, biography, biography_en)
              VALUES ($1, $2, $3, $4)
              RETURNING id;
              `,
              [c.full_name.trim(), c.photo_url || null, c.biography ? c.biography.trim() : null, c.biography_en ? c.biography_en.trim() : null]
            );
            personId = personInsert.rows[0].id;
          }
        }

        await client.query(
          `
          INSERT INTO event_cast (
            event_id,
            person_id,
            role,
            role_en,
            display_order
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (event_id, person_id, role) DO UPDATE
            SET role_en = EXCLUDED.role_en, display_order = EXCLUDED.display_order;
          `,
          [createdEvent.id, personId, c.role.trim(), c.role_en ? c.role_en.trim() : c.role.trim(), c.display_order ?? i]
        );
      }
    }

    // 3. Asociar elementos de multimedia (galería) si se proporcionaron IDs
    if (data.media_ids && data.media_ids.length > 0) {
      await client.query(
        `UPDATE media SET event_id = $1, project_id = NULL, content_id = NULL WHERE id = ANY($2::uuid[])`,
        [createdEvent.id, data.media_ids]
      );
    }

    await client.query("COMMIT");
    let enriquecido = createdEvent;
    try {
      const eventoDetallado = await obtenerEventoPorId(createdEvent.id);
      if (eventoDetallado) enriquecido = eventoDetallado;
    } catch (e) {
      console.warn("No se pudo obtener evento con subqueries JSON, usando createdEvent:", e);
    }
    return enriquecido;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Actualizar evento existente
export async function actualizarEvento(id: string, data: Partial<EventInput>): Promise<EventRow | null> {
  await ensurePaymentColumns();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (data.is_featured) {
      await client.query("UPDATE events SET is_featured = FALSE WHERE id <> $1", [id]);
    }

    const campos: string[] = [];
    const valores: any[] = [];
    let idx = 1;

    if (data.title !== undefined) {
      campos.push(`title = $${idx++}`);
      valores.push(data.title);
    }
    if (data.description !== undefined) {
      campos.push(`description = $${idx++}`);
      valores.push(data.description);
    }
    if (data.event_date !== undefined) {
      campos.push(`event_date = $${idx++}`);
      valores.push(data.event_date);
    }
    if (data.venue !== undefined) {
      campos.push(`venue = $${idx++}`);
      valores.push(data.venue);
    }
    if (data.max_capacity !== undefined) {
      campos.push(`max_capacity = $${idx++}`);
      valores.push(data.max_capacity);
    }
    if (data.poster_url !== undefined) {
      campos.push(`poster_url = $${idx++}`);
      valores.push(data.poster_url);
    }
    if (data.banner_url !== undefined) {
      campos.push(`banner_url = $${idx++}`);
      valores.push(data.banner_url);
    }
    if (data.director !== undefined) {
      campos.push(`director = $${idx++}`);
      valores.push(data.director);
    }
    if (data.season_year !== undefined) {
      campos.push(`season_year = $${idx++}`);
      valores.push(data.season_year);
    }
    if (data.status !== undefined) {
      campos.push(`status = $${idx++}`);
      valores.push(data.status);
    }
    if (data.dates_label !== undefined) {
      campos.push(`dates_label = $${idx++}`);
      valores.push(data.dates_label);
    }
    if (data.display_order !== undefined) {
      campos.push(`display_order = $${idx++}`);
      valores.push(data.display_order);
    }
    if (data.is_published !== undefined) {
      campos.push(`is_published = $${idx++}`);
      valores.push(data.is_published);
    }
    if (data.is_featured !== undefined) {
      campos.push(`is_featured = $${idx++}`);
      valores.push(data.is_featured);
    }
    if (data.zeffy_url !== undefined) {
      campos.push(`zeffy_url = $${idx++}`);
      valores.push(data.zeffy_url || null);
    }
    if (data.paypal_url !== undefined) {
      campos.push(`paypal_url = $${idx++}`);
      valores.push(data.paypal_url || null);
    }
    if (data.sinpe_phone !== undefined) {
      campos.push(`sinpe_phone = $${idx++}`);
      valores.push(data.sinpe_phone || '7131-7013');
    }
    if (data.payment_methods !== undefined) {
      campos.push(`payment_methods = $${idx++}`);
      valores.push(Array.isArray(data.payment_methods) ? data.payment_methods.join(',') : (data.payment_methods || 'sinpe,zeffy,paypal'));
    }

    if (campos.length > 0) {
      campos.push("updated_at = CURRENT_TIMESTAMP");
      valores.push(id);
      await client.query(
        `UPDATE events SET ${campos.join(", ")} WHERE id = $${idx}`,
        valores
      );
    }

    // Actualizar funciones (performances) e inventario si vienen definidas
    if (data.performances && data.performances.length > 0) {
      const perfsValidas = data.performances.filter(
        (p) => p && p.starts_at && p.venue && p.venue.trim() !== ''
      );

      for (const perf of perfsValidas) {
        let fechaInicio: string;
        try {
          const d = new Date(perf.starts_at);
          fechaInicio = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        } catch {
          fechaInicio = new Date().toISOString();
        }

        const priceCrc = perf.price_crc !== undefined && perf.price_crc !== null ? perf.price_crc : 10000;
        const priceUsd = perf.price_usd !== undefined && perf.price_usd !== null ? perf.price_usd : 20;
        const capacity = perf.max_capacity && perf.max_capacity > 0 ? perf.max_capacity : 100;

        if (perf.id) {
          await client.query(
            `
            UPDATE event_performances
            SET
              starts_at = $1,
              ends_at = $2,
              venue = $3,
              max_capacity = $4,
              status = $5,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND event_id = $7
            `,
            [
              fechaInicio,
              perf.ends_at ? new Date(perf.ends_at).toISOString() : null,
              perf.venue.trim(),
              capacity,
              perf.status || 'scheduled',
              perf.id,
              id,
            ]
          );

          // Actualizar precios en inventario existente
          await client.query(
            `UPDATE ticket_inventory SET price = $1, quantity_available = $2 WHERE performance_id = $3 AND currency = 'CRC'`,
            [priceCrc, capacity, perf.id]
          );
          await client.query(
            `UPDATE ticket_inventory SET price = $1, quantity_available = $2 WHERE performance_id = $3 AND currency = 'USD'`,
            [priceUsd, capacity, perf.id]
          );
        } else {
          // Crear nueva función
          const newPerfRes = await client.query(
            `
            INSERT INTO event_performances (event_id, starts_at, ends_at, venue, max_capacity, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [
              id,
              fechaInicio,
              perf.ends_at ? new Date(perf.ends_at).toISOString() : null,
              perf.venue.trim(),
              capacity,
              perf.status || 'scheduled',
            ]
          );
          const newPerf = newPerfRes.rows[0];

          await client.query(
            `
            INSERT INTO ticket_inventory (event_id, performance_id, ticket_type, ticket_type_en, price, quantity_available, currency)
            VALUES ($1, $2, 'General', 'General Admission', $3, $4, 'CRC'),
                   ($1, $2, 'General USD', 'General Admission USD', $5, $4, 'USD')
            `,
            [id, newPerf.id, priceCrc, capacity, priceUsd]
          );
        }
      }
    }

    // Actualizar elenco si viene definido
    if (data.cast) {
      await client.query("DELETE FROM event_cast WHERE event_id = $1", [id]);
      const castValido = data.cast.filter(
        (c) => c && c.full_name && c.full_name.trim() !== '' && c.role && c.role.trim() !== ''
      );

      for (let i = 0; i < castValido.length; i++) {
        const c = castValido[i];
        let personId = c.person_id;

        if (!personId) {
          const personCheck = await client.query(
            "SELECT id FROM people WHERE LOWER(full_name) = LOWER($1)",
            [c.full_name.trim()]
          );

          if (personCheck.rows.length > 0) {
            personId = personCheck.rows[0].id;
            await client.query(
              `UPDATE people SET photo_url = COALESCE($1, photo_url), biography = COALESCE($2, biography) WHERE id = $3`,
              [c.photo_url || null, c.biography ? c.biography.trim() : null, personId]
            );
          } else {
            const personInsert = await client.query(
              `
              INSERT INTO people (full_name, photo_url, biography, biography_en)
              VALUES ($1, $2, $3, $4)
              RETURNING id;
              `,
              [c.full_name.trim(), c.photo_url || null, c.biography ? c.biography.trim() : null, c.biography_en ? c.biography_en.trim() : null]
            );
            personId = personInsert.rows[0].id;
          }
        } else {
          await client.query(
            `UPDATE people SET photo_url = COALESCE($1, photo_url), biography = COALESCE($2, biography) WHERE id = $3`,
            [c.photo_url || null, c.biography ? c.biography.trim() : null, personId]
          );
        }

        await client.query(
          `
          INSERT INTO event_cast (
            event_id,
            person_id,
            role,
            role_en,
            display_order
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (event_id, person_id, role) DO UPDATE
            SET role_en = EXCLUDED.role_en, display_order = EXCLUDED.display_order;
          `,
          [id, personId, c.role.trim(), c.role_en ? c.role_en.trim() : c.role.trim(), c.display_order ?? i]
        );
      }
    }

    // Asociar fotos de galería seleccionadas
    if (data.media_ids && data.media_ids.length > 0) {
      await client.query(
        `UPDATE media SET event_id = $1, project_id = NULL, content_id = NULL WHERE id = ANY($2::uuid[])`,
        [id, data.media_ids]
      );
    }

    await client.query("COMMIT");
    return await obtenerEventoPorId(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Marcar un evento como principal (is_featured = TRUE) para que salga al frente en la portada
export async function marcarEventoComoPrincipal(id: string): Promise<EventRow | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE events SET is_featured = FALSE");
    await client.query("UPDATE events SET is_featured = TRUE, status = 'current', is_published = TRUE WHERE id = $1", [id]);
    await client.query("COMMIT");
    return await obtenerEventoPorId(id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Eliminar evento con eliminación en cascada transaccional de dependencias
export async function eliminarEvento(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Eliminar boletos vinculados a compras o inventarios de este evento
    await client.query(
      `
      DELETE FROM tickets
      WHERE ticket_inventory_id IN (SELECT id FROM ticket_inventory WHERE event_id = $1)
         OR purchase_id IN (SELECT id FROM purchases WHERE event_id = $1)
      `,
      [id]
    );

    // 2. Eliminar compras del evento
    await client.query("DELETE FROM purchases WHERE event_id = $1", [id]);

    // 3. Eliminar inventario de boletos
    await client.query("DELETE FROM ticket_inventory WHERE event_id = $1", [id]);

    // 4. Eliminar funciones (performances)
    await client.query("DELETE FROM event_performances WHERE event_id = $1", [id]);

    // 5. Eliminar elenco (cast)
    await client.query("DELETE FROM event_cast WHERE event_id = $1", [id]);

    // 6. Desvincular archivos multimedia
    await client.query("UPDATE media SET event_id = NULL WHERE event_id = $1", [id]);

    // 7. Eliminar el evento
    const result = await client.query("DELETE FROM events WHERE id = $1 RETURNING id", [id]);

    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
