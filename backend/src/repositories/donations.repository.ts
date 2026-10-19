import { pool } from "../db.js";

export interface DonationInput {
  donor_name?: string;
  donor_email?: string;
  amount: number;
  payment_provider: string; // 'sinpe', 'zeffy', 'paypal', 'stripe'
  transaction_id?: string;
  status?: string; // 'pending', 'completed', 'failed'
  message?: string;
  currency?: string; // 'USD', 'CRC'
  payment_method?: string; // 'sinpe', 'zeffy', 'card', 'paypal', 'other'
  payment_reference?: string;
}

// CU-14: Obtener todas las donaciones
export async function obtenerTodasLasDonaciones() {
  const result = await pool.query(`
    SELECT
      id,
      donor_name,
      donor_email,
      amount,
      payment_provider,
      transaction_id,
      status,
      message,
      created_at,
      currency,
      payment_method,
      payment_reference,
      verified_by,
      verified_at
    FROM donations
    ORDER BY created_at DESC
  `);

  return result.rows;
}

// CU-14: Obtener donación por ID
export async function obtenerDonacionPorId(id: string) {
  const result = await pool.query(
    `
    SELECT
      id,
      donor_name,
      donor_email,
      amount,
      payment_provider,
      transaction_id,
      status,
      message,
      created_at,
      currency,
      payment_method,
      payment_reference,
      verified_by,
      verified_at
    FROM donations
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
}

// CU-15: Registrar una nueva donación
export async function crearDonacion(data: DonationInput) {
  const query = `
    INSERT INTO donations (
      donor_name,
      donor_email,
      amount,
      payment_provider,
      transaction_id,
      status,
      message,
      currency,
      payment_method,
      payment_reference
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  const values = [
    data.donor_name || null,
    data.donor_email || null,
    data.amount,
    data.payment_provider,
    data.transaction_id || null,
    data.status || "pending",
    data.message || null,
    data.currency || "CRC",
    data.payment_method || null,
    data.payment_reference || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// CU-14: Actualizar el estado de la donación
export async function actualizarEstadoDonacion(id: string, status: string, verifiedBy?: string) {
  const query = `
    UPDATE donations
    SET
      status = $1,
      verified_by = COALESCE($2, verified_by),
      verified_at = CASE WHEN $2 IS NOT NULL THEN CURRENT_TIMESTAMP ELSE verified_at END
    WHERE id = $3
    RETURNING *;
  `;

  const result = await pool.query(query, [status, verifiedBy || null, id]);
  return result.rows[0];
}