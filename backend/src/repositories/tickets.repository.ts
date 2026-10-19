import { pool } from "../db.js";

export interface TicketInventoryInput {
  event_id: string;
  performance_id?: string;
  ticket_type: string;
  price: number;
  quantity_available: number;
  currency?: string;
}

export interface PurchaseInput {
  user_id?: string;
  event_id: string;
  ticket_inventory_id: string;
  quantity: number;
  buyer_name?: string;
  buyer_email?: string;
  payment_intent_id?: string;
  currency?: string;
}

// Obtener inventario de boletos
export async function obtenerInventarioPorEvento(eventId: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      event_id,
      performance_id,
      ticket_type,
      price,
      quantity_available,
      quantity_sold,
      currency,
      created_at
    FROM ticket_inventory
    WHERE event_id = $1
    ORDER BY price ASC
    `,
    [eventId]
  );
  return result.rows;
}

// crear un boleto en el inventario
export async function crearInventarioBoleto(data: TicketInventoryInput) {
  const result = await pool.query(
    `
    INSERT INTO ticket_inventory (
      event_id,
      performance_id,
      ticket_type,
      price,
      quantity_available,
      quantity_sold,
      currency
    )
    VALUES ($1, $2, $3, $4, $5, 0, $6)
    RETURNING *
    `,
    [
      data.event_id,
      data.performance_id || null,
      data.ticket_type,
      data.price,
      data.quantity_available,
      data.currency || "CRC",
    ]
  );
  return result.rows[0];
}

// actualizar cantidad o presio
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


// realizar la compra de boletos con control de concurrecia de 20 a 100 usuarios a la vez.
export async function procesarCompraBoletos(data: PurchaseInput) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const inventoryResult = await client.query(
      `
      SELECT id, price, quantity_available, quantity_sold, currency
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
      VALUES ($1, $2, $3, 'paid', $4, $5, $6, $7)
      RETURNING *
      `,
      [
        data.user_id || null,
        data.event_id,
        totalAmount,
        data.payment_intent_id || `TXN-${Date.now()}`,
        data.currency || inventory.currency || "CRC",
        data.buyer_name || null,
        data.buyer_email || null,
      ]
    );

    const purchase = purchaseResult.rows[0];

    const generatedTickets = [];
    for (let i = 0; i < data.quantity; i++) {
      const qrCode = `QR-${purchase.id.slice(0, 8)}-${Date.now()}-${i + 1}`;
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
      generatedTickets.push(ticketResult.rows[0]);
    }

    await client.query("COMMIT");

    return {
      purchase,
      tickets: generatedTickets,
    };
  } catch (error) {
    
    await client.query("ROLLBACK");
    throw error;
  } finally {

    client.release();
  }
}