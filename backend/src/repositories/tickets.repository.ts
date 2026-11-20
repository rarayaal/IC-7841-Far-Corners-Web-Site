import { pool } from "../db.js";
import { generarPdfBoletos, TicketPdfItem } from "../services/ticket-pdf.service.js";
import { enviarBoletosPorCorreo, enviarConfirmacionCompraPendiente } from "../services/mail.service.js";

export interface TicketInventoryInput {
  event_id: string;
  performance_id?: string;
  ticket_type: string;
  price: number;
  quantity_available: number;
  currency?: string;
  ticket_type_en?: string;
}

export interface PurchaseInput {
  user_id?: string;
  event_id: string;
  performance_id?: string;
  ticket_inventory_id: string;
  quantity: number;
  buyer_name?: string;
  buyer_email?: string;
  payment_method?: 'sinpe' | 'zeffy' | 'card' | 'paypal';
  sinpe_reference?: string;
  payment_intent_id?: string;
  currency?: string;
}

/**
 * Obtener inventario de boletos por evento (con datos de función si aplica).
 */
export async function obtenerInventarioPorEvento(eventId: string) {
  const result = await pool.query(
    `
    SELECT
      ti.id,
      ti.event_id,
      ti.performance_id,
      ti.ticket_type,
      ti.ticket_type_en,
      ti.price,
      ti.quantity_available,
      ti.quantity_sold,
      ti.currency,
      ti.created_at,
      ep.starts_at,
      ep.venue
    FROM ticket_inventory ti
    LEFT JOIN event_performances ep ON ti.performance_id = ep.id
    WHERE ti.event_id = $1
    ORDER BY ti.performance_id NULLS LAST, ti.price ASC
    `,
    [eventId]
  );
  return result.rows;
}

/**
 * Métricas de funciones por evento (capacidad, vendidos, disponibles, precios en CRC y USD).
 */
export async function obtenerMetricasFuncionesPorEvento(eventId: string) {
  const result = await pool.query(
    `
    SELECT
      ep.id as performance_id,
      ep.event_id,
      ep.starts_at,
      ep.ends_at,
      ep.venue,
      ep.max_capacity,
      ep.status,
      COALESCE(SUM(ti.quantity_sold), 0)::int as total_sold,
      COALESCE(
        (SELECT ti_sub.quantity_available 
         FROM ticket_inventory ti_sub 
         WHERE ti_sub.performance_id = ep.id 
         LIMIT 1),
        ep.max_capacity - COALESCE(SUM(ti.quantity_sold), 0)
      )::int as total_available,
      COALESCE(
        (SELECT ti_crc.price 
         FROM ticket_inventory ti_crc 
         WHERE ti_crc.performance_id = ep.id AND ti_crc.currency = 'CRC' 
         LIMIT 1),
        10000
      ) as price_crc,
      COALESCE(
        (SELECT ti_usd.price 
         FROM ticket_inventory ti_usd 
         WHERE ti_usd.performance_id = ep.id AND ti_usd.currency = 'USD' 
         LIMIT 1),
        20
      ) as price_usd
    FROM event_performances ep
    LEFT JOIN ticket_inventory ti ON ti.performance_id = ep.id
    WHERE ep.event_id = $1
    GROUP BY ep.id
    ORDER BY ep.starts_at ASC
    `,
    [eventId]
  );
  return result.rows;
}

/**
 * Obtener todos los boletos vendidos / registrados para una función.
 */
export async function obtenerBoletosPorFuncion(performanceId: string) {
  const result = await pool.query(
    `
    SELECT
      t.id as ticket_id,
      t.qr_code,
      t.status as ticket_status,
      t.created_at as ticket_created_at,
      ti.ticket_type,
      ti.price,
      ti.currency,
      p.id as purchase_id,
      p.status as purchase_status,
      p.buyer_name,
      p.buyer_email,
      p.status as purchase_status,
      p.payment_intent_id,
      p.total_amount,
      p.created_at as purchase_created_at
    FROM tickets t
    JOIN ticket_inventory ti ON t.ticket_inventory_id = ti.id
    JOIN purchases p ON t.purchase_id = p.id
    WHERE ti.performance_id = $1
       OR (ti.performance_id IS NULL AND ti.event_id = (SELECT event_id FROM event_performances WHERE id = $1 LIMIT 1))
    ORDER BY t.created_at DESC
    `,
    [performanceId]
  );
  return result.rows;
}

/**
 * Crear un boleto en el inventario.
 */
export async function crearInventarioBoleto(data: TicketInventoryInput) {
  const result = await pool.query(
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
    VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
    RETURNING *
    `,
    [
      data.event_id,
      data.performance_id || null,
      data.ticket_type,
      data.ticket_type_en || null,
      data.price,
      data.quantity_available,
      data.currency || "CRC",
    ]
  );
  return result.rows[0];
}

/**
 * Actualizar inventario de boleto.
 */
export async function actualizarInventarioBoleto(
  id: string,
  price?: number,
  quantityAvailable?: number
) {
  const result = await pool.query(
    `
    UPDATE ticket_inventory
    SET
      price = COALESCE($1, price),
      quantity_available = COALESCE($2, quantity_available)
    WHERE id = $3
    RETURNING *
    `,
    [price ?? null, quantityAvailable ?? null, id]
  );
  return result.rows[0];
}

/**
 * Procesar compra de boletos con control de concurrencia y generación de PDF con QR.
 */
export async function procesarCompraBoletos(data: PurchaseInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Bloquear inventario con FOR UPDATE para prevenir sobreventa concurrente
    const inventoryResult = await client.query(
      `
      SELECT id, event_id, performance_id, price, quantity_available, quantity_sold, currency, ticket_type
      FROM ticket_inventory
      WHERE id = $1 AND event_id = $2
      FOR UPDATE
      `,
      [data.ticket_inventory_id, data.event_id]
    );

    const inventory = inventoryResult.rows[0];

    if (!inventory) {
      throw new Error("INVENTORY_NOT_FOUND");
    }

    if (inventory.quantity_available < data.quantity) {
      throw new Error("INSUFFICIENT_TICKETS");
    }

    const totalAmount = inventory.price * data.quantity;
    const isPendingValidation = ['sinpe', 'zeffy', 'paypal'].includes(data.payment_method || 'sinpe');
    // Si es SINPE, Zeffy o PayPal, la compra queda pendiente hasta verificación de comprobante
    const initialPurchaseStatus = isPendingValidation ? 'pending' : 'paid';

    let intentId = data.payment_intent_id;
    if (!intentId) {
      if (data.payment_method === 'sinpe') {
        intentId = `SINPE-${data.sinpe_reference ? data.sinpe_reference.trim() : Date.now()}`;
      } else if (data.payment_method === 'zeffy') {
        intentId = `ZEFFY-${data.sinpe_reference ? data.sinpe_reference.trim() : Date.now()}`;
      } else if (data.payment_method === 'paypal') {
        intentId = `PAYPAL-${data.sinpe_reference ? data.sinpe_reference.trim() : Date.now()}`;
      } else {
        intentId = `CARD-${Date.now()}`;
      }
    }

    // Actualizar inventario
    await client.query(
      `
      UPDATE ticket_inventory
      SET
        quantity_available = quantity_available - $1,
        quantity_sold = quantity_sold + $1
      WHERE id = $2
      `,
      [data.quantity, data.ticket_inventory_id]
    );

    // Crear registro de compra
    const purchaseResult = await client.query(
      `
      INSERT INTO purchases (
        user_id,
        event_id,
        total_amount,
        status,
        payment_intent_id,
        currency,
        buyer_name,
        buyer_email
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        data.user_id || null,
        data.event_id,
        totalAmount,
        initialPurchaseStatus,
        intentId,
        data.currency || inventory.currency || "CRC",
        data.buyer_name || null,
        data.buyer_email || null,
      ]
    );

    const purchase = purchaseResult.rows[0];

    // Obtener detalles del evento y función para el boleto
    const eventDetailsRes = await client.query(
      `
      SELECT
        e.title,
        e.season_year,
        e.venue as event_venue,
        ep.venue as perf_venue,
        ep.starts_at as perf_starts_at
      FROM events e
      LEFT JOIN event_performances ep ON ep.id = $1
      WHERE e.id = $2
      `,
      [inventory.performance_id || data.performance_id || null, data.event_id]
    );
    const eventRow = eventDetailsRes.rows[0] || {};
    const showTitle = eventRow.title || "Obra Teatral";
    const venue = eventRow.perf_venue || eventRow.event_venue || "Teatro Comunitario Far Corners";
    const startsAt = eventRow.perf_starts_at ? new Date(eventRow.perf_starts_at).toISOString() : new Date().toISOString();

    const generatedTickets = [];
    const ticketPdfItems: TicketPdfItem[] = [];

    for (let i = 0; i < data.quantity; i++) {
      const qrCode = `FC-TKT-${purchase.id.slice(0, 8)}-${Date.now()}-${i + 1}`;
      const ticketResult = await client.query(
        `
        INSERT INTO tickets (
          purchase_id,
          ticket_inventory_id,
          qr_code,
          status
        )
        VALUES ($1, $2, $3, 'active')
        RETURNING *
        `,
        [purchase.id, data.ticket_inventory_id, qrCode]
      );
      const ticket = ticketResult.rows[0];
      generatedTickets.push(ticket);

      ticketPdfItems.push({
        ticketNumber: i + 1,
        totalTickets: data.quantity,
        qrCode,
        showTitle,
        seasonYear: eventRow.season_year,
        venue,
        startsAt,
        patronName: data.buyer_name || 'Asistente Far Corners',
        patronEmail: data.buyer_email || '',
        price: inventory.price,
        currency: inventory.currency,
        purchaseId: purchase.id,
        status: initialPurchaseStatus,
      });
    }

    await client.query("COMMIT");

    // Generar PDF del boleto
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = generarPdfBoletos(ticketPdfItems);
    } catch (pdfErr) {
      console.error("Error al generar PDF de boletos:", pdfErr);
    }

    // Despachar correo al comprador
    if (data.buyer_email) {
      if (initialPurchaseStatus === 'paid' && pdfBuffer) {
        // Si el pago ya fue validado/aprobado de inmediato
        void enviarBoletosPorCorreo({
          destinatario: data.buyer_email,
          nombre: data.buyer_name || 'Espectador',
          tituloObra: showTitle,
          cantidadBoletos: data.quantity,
          pdfBuffer,
        }).catch((e) => console.error("Error en envío asíncrono de correo con boletos:", e));
      } else {
        // Notificación inmediata: solicitud de compra recibida en proceso de validación
        void enviarConfirmacionCompraPendiente({
          destinatario: data.buyer_email,
          nombre: data.buyer_name || 'Espectador',
          tituloObra: showTitle,
          cantidadBoletos: data.quantity,
          montoTotal: totalAmount,
          moneda: data.currency || inventory.currency || "CRC",
          metodoPago: data.payment_method || 'sinpe',
          referencia: data.sinpe_reference,
        }).catch((e) => console.error("Error en envío asíncrono de confirmación pendiente:", e));
      }
    }

    return {
      purchase,
      tickets: generatedTickets,
      pdfBase64: pdfBuffer ? pdfBuffer.toString('base64') : undefined,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Valida un pago SINPE pendiente, marcando la compra como 'paid' y despachando el PDF por correo.
 */
export async function validarCompraSinpe(purchaseId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const purchaseRes = await client.query(
      `
      UPDATE purchases
      SET status = 'paid', updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
      `,
      [purchaseId]
    );

    if (purchaseRes.rows.length === 0) {
      throw new Error("PURCHASE_NOT_FOUND_OR_ALREADY_PAID");
    }

    const purchase = purchaseRes.rows[0];

    // Obtener los boletos asociados
    const ticketsRes = await client.query(
      `
      SELECT
        t.id as ticket_id,
        t.qr_code,
        t.status,
        ti.price,
        ti.currency,
        e.title as show_title,
        e.season_year,
        COALESCE(ep.venue, e.venue) as venue,
        COALESCE(ep.starts_at, e.event_date) as starts_at
      FROM tickets t
      JOIN ticket_inventory ti ON t.ticket_inventory_id = ti.id
      JOIN events e ON ti.event_id = e.id
      LEFT JOIN event_performances ep ON ti.performance_id = ep.id
      WHERE t.purchase_id = $1
      ORDER BY t.created_at ASC
      `,
      [purchaseId]
    );

    const tickets = ticketsRes.rows;
    await client.query("COMMIT");

    // Generar PDF y enviar correo
    if (tickets.length > 0) {
      const pdfItems: TicketPdfItem[] = tickets.map((t, idx) => ({
        ticketNumber: idx + 1,
        totalTickets: tickets.length,
        qrCode: t.qr_code,
        showTitle: t.show_title,
        seasonYear: t.season_year,
        venue: t.venue,
        startsAt: new Date(t.starts_at).toISOString(),
        patronName: purchase.buyer_name || 'Asistente Far Corners',
        patronEmail: purchase.buyer_email || '',
        price: t.price,
        currency: t.currency,
        purchaseId: purchase.id,
        status: 'paid',
      }));

      try {
        const pdfBuffer = generarPdfBoletos(pdfItems);
        if (purchase.buyer_email) {
          const qrCodesList = tickets.map((t: any) => String(t.qr_code));
          await enviarBoletosPorCorreo({
            destinatario: purchase.buyer_email,
            nombre: purchase.buyer_name || 'Espectador',
            tituloObra: tickets[0].show_title,
            cantidadBoletos: tickets.length,
            pdfBuffer,
            qrCodes: qrCodesList,
          });
        }
      } catch (err) {
        console.error("Error al generar PDF o despachar correo con QR:", err);
      }
    }

    return purchase;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reenvía los boletos o confirmación de compra por correo al comprador.
 */
export async function reenviarCorreoBoletos(purchaseId: string, emailOpcional?: string) {
  const purchaseRes = await pool.query(
    `SELECT * FROM purchases WHERE id = $1`,
    [purchaseId]
  );

  if (purchaseRes.rows.length === 0) {
    throw new Error("PURCHASE_NOT_FOUND");
  }

  const purchase = purchaseRes.rows[0];
  const destinatario = emailOpcional?.trim() || purchase.buyer_email;

  if (!destinatario) {
    throw new Error("NO_EMAIL_PROVIDED");
  }

  if (emailOpcional && emailOpcional.trim() !== purchase.buyer_email) {
    await pool.query(
      `UPDATE purchases SET buyer_email = $1 WHERE id = $2`,
      [destinatario, purchaseId]
    );
  }

  // Obtener tickets
  const ticketsRes = await pool.query(
    `
    SELECT
      t.id as ticket_id,
      t.qr_code,
      t.status,
      ti.price,
      ti.currency,
      e.title as show_title,
      e.season_year,
      COALESCE(ep.venue, e.venue) as venue,
      COALESCE(ep.starts_at, e.event_date) as starts_at
    FROM tickets t
    JOIN ticket_inventory ti ON t.ticket_inventory_id = ti.id
    JOIN events e ON ti.event_id = e.id
    LEFT JOIN event_performances ep ON ti.performance_id = ep.id
    WHERE t.purchase_id = $1
    ORDER BY t.created_at ASC
    `,
    [purchaseId]
  );

  const tickets = ticketsRes.rows;
  const showTitle = tickets[0]?.show_title || "Obra Teatral";

  if (purchase.status === 'paid' && tickets.length > 0) {
    const pdfItems: TicketPdfItem[] = tickets.map((t, idx) => ({
      ticketNumber: idx + 1,
      totalTickets: tickets.length,
      qrCode: t.qr_code,
      showTitle: t.show_title,
      seasonYear: t.season_year,
      venue: t.venue,
      startsAt: new Date(t.starts_at).toISOString(),
      patronName: purchase.buyer_name || 'Asistente Far Corners',
      patronEmail: destinatario,
      price: t.price,
      currency: t.currency,
      purchaseId: purchase.id,
      status: 'paid',
    }));

    const pdfBuffer = generarPdfBoletos(pdfItems);
    const qrCodesList = tickets.map((t: any) => String(t.qr_code));

    const emailRes = await enviarBoletosPorCorreo({
      destinatario,
      nombre: purchase.buyer_name || 'Espectador',
      tituloObra: showTitle,
      cantidadBoletos: tickets.length,
      pdfBuffer,
      qrCodes: qrCodesList,
    });

    return {
      success: true,
      destinatario,
      status: 'paid',
      emailResult: emailRes,
    };
  } else {
    // Si la compra sigue en estado pendiente
    const emailRes = await enviarConfirmacionCompraPendiente({
      destinatario,
      nombre: purchase.buyer_name || 'Espectador',
      tituloObra: showTitle,
      cantidadBoletos: tickets.length || 1,
      montoTotal: Number(purchase.total_amount),
      moneda: purchase.currency || 'CRC',
      metodoPago: purchase.payment_intent_id?.startsWith('SINPE') ? 'SINPE Móvil' : 'Pasarela Digital',
      referencia: purchase.payment_intent_id,
    });

    return {
      success: true,
      destinatario,
      status: 'pending',
      emailResult: emailRes,
    };
  }
}

/**
 * Validador de código QR en puerta (In-App Scanner).
 */
export async function validarBoletoQr(qrCode: string, performanceId?: string) {
  const cleanCode = (qrCode || "").replace(/[\r\n\t]/g, "").trim();

  const result = await pool.query(
    `
    SELECT
      t.id as ticket_id,
      t.qr_code,
      t.status as ticket_status,
      ti.ticket_type,
      ti.performance_id,
      ti.event_id,
      ti.price,
      ti.currency,
      p.id as purchase_id,
      p.status as purchase_status,
      p.buyer_name,
      p.buyer_email,
      e.title as show_title,
      COALESCE(ep.venue, e.venue) as venue,
      COALESCE(ep.starts_at, e.event_date) as starts_at
    FROM tickets t
    JOIN ticket_inventory ti ON t.ticket_inventory_id = ti.id
    JOIN purchases p ON t.purchase_id = p.id
    JOIN events e ON ti.event_id = e.id
    LEFT JOIN event_performances ep ON ti.performance_id = ep.id
    WHERE LOWER(t.qr_code) = LOWER($1) OR t.id::text = $1
    `,
    [cleanCode]
  );

  if (result.rows.length === 0) {
    return {
      valid: false,
      error: "NOT_FOUND",
      message: "El código QR no corresponde a ningún boleto registrado.",
    };
  }

  const row = result.rows[0];

  // Si la compra no está pagada (ej. SINPE pendiente)
  if (row.purchase_status !== "paid") {
    return {
      valid: false,
      error: "PAYMENT_PENDING",
      message: "Este boleto está vinculado a una compra SINPE pendiente de validación.",
      ticket: row,
    };
  }

  // Si se especificó una función y no coincide
  if (performanceId && row.performance_id && row.performance_id !== performanceId) {
    return {
      valid: false,
      error: "WRONG_PERFORMANCE",
      message: `Este boleto corresponde a otra función (${new Date(row.starts_at).toLocaleString()}).`,
      ticket: row,
    };
  }

  // Si ya fue utilizado
  if (row.ticket_status === "used") {
    return {
      valid: false,
      error: "ALREADY_USED",
      message: "¡ALERTA! Este boleto ya fue utilizado para ingresar.",
      ticket: row,
    };
  }

  // Si fue reembolsado
  if (row.ticket_status === "refunded") {
    return {
      valid: false,
      error: "REFUNDED",
      message: "Este boleto fue cancelado o reembolsado.",
      ticket: row,
    };
  }

  // Boleto válido -> Marcar como utilizado
  await pool.query(
    `
    UPDATE tickets
    SET status = 'used'
    WHERE id = $1
    `,
    [row.ticket_id]
  );

  return {
    valid: true,
    message: "¡Boleto Válido! Acceso autorizado a la sala.",
    ticket: {
      ...row,
      ticket_status: "used",
    },
  };
}

/**
 * Obtener archivo PDF generado de una compra.
 */
export async function obtenerPdfDeCompra(purchaseId: string): Promise<{ buffer: Buffer; filename: string }> {
  const result = await pool.query(
    `
    SELECT
      t.id as ticket_id,
      t.qr_code,
      t.status,
      ti.price,
      ti.currency,
      p.id as purchase_id,
      p.status as purchase_status,
      p.buyer_name,
      p.buyer_email,
      e.title as show_title,
      e.season_year,
      COALESCE(ep.venue, e.venue) as venue,
      COALESCE(ep.starts_at, e.event_date) as starts_at
    FROM purchases p
    JOIN tickets t ON t.purchase_id = p.id
    JOIN ticket_inventory ti ON t.ticket_inventory_id = ti.id
    JOIN events e ON p.event_id = e.id
    LEFT JOIN event_performances ep ON ti.performance_id = ep.id
    WHERE p.id = $1
    ORDER BY t.created_at ASC
    `,
    [purchaseId]
  );

  if (result.rows.length === 0) {
    throw new Error("PURCHASE_NOT_FOUND");
  }

  const rows = result.rows;
  if (rows[0].purchase_status !== "paid") {
    throw new Error("PURCHASE_NOT_VALIDATED");
  }
  const pdfItems: TicketPdfItem[] = rows.map((r, idx) => ({
    ticketNumber: idx + 1,
    totalTickets: rows.length,
    qrCode: r.qr_code,
    showTitle: r.show_title,
    seasonYear: r.season_year,
    venue: r.venue,
    startsAt: new Date(r.starts_at).toISOString(),
    patronName: r.buyer_name || 'Asistente Far Corners',
    patronEmail: r.buyer_email || '',
    price: r.price,
    currency: r.currency,
    purchaseId: r.purchase_id,
    status: r.status,
  }));

  const buffer = generarPdfBoletos(pdfItems);
  const cleanTitle = rows[0].show_title.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    buffer,
    filename: `Boletos_${cleanTitle}_${purchaseId.slice(0, 8)}.pdf`,
  };
}
