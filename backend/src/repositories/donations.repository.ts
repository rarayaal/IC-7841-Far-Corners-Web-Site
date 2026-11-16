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

// CU-14: Obtener todas las donaciones con filtros opcionales (Admin)
export interface FiltrosDonaciones {
  metodo?: string;
  estado?: string;
  montoMin?: number;
  montoMax?: number;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
}

export async function obtenerTodasLasDonaciones(filtros?: FiltrosDonaciones) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let paramIndex = 1;

  if (filtros?.metodo && filtros.metodo !== 'all') {
    condiciones.push(`(payment_method = $${paramIndex} OR payment_provider = $${paramIndex})`);
    valores.push(filtros.metodo.toLowerCase());
    paramIndex++;
  }

  if (filtros?.estado && filtros.estado !== 'all') {
    condiciones.push(`status = $${paramIndex}`);
    valores.push(filtros.estado.toLowerCase());
    paramIndex++;
  }

  if (filtros?.montoMin !== undefined && !isNaN(filtros.montoMin)) {
    condiciones.push(`amount >= $${paramIndex}`);
    valores.push(filtros.montoMin);
    paramIndex++;
  }

  if (filtros?.montoMax !== undefined && !isNaN(filtros.montoMax)) {
    condiciones.push(`amount <= $${paramIndex}`);
    valores.push(filtros.montoMax);
    paramIndex++;
  }

  if (filtros?.fechaInicio) {
    condiciones.push(`created_at >= $${paramIndex}`);
    valores.push(filtros.fechaInicio);
    paramIndex++;
  }

  if (filtros?.fechaFin) {
    condiciones.push(`created_at <= $${paramIndex}`);
    valores.push(filtros.fechaFin);
    paramIndex++;
  }

  if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
    const q = `%${filtros.busqueda.trim()}%`;
    condiciones.push(`(
      donor_name ILIKE $${paramIndex}
      OR donor_email ILIKE $${paramIndex}
      OR payment_reference ILIKE $${paramIndex}
      OR transaction_id ILIKE $${paramIndex}
    )`);
    valores.push(q);
    paramIndex++;
  }

  const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const query = `
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
    ${whereClause}
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, valores);
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

// Consultar donaciones de un usuario autenticado (por su correo electrónico)
export async function obtenerDonacionesDeUsuario(email: string) {
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
      verified_at
    FROM donations
    WHERE LOWER(donor_email) = LOWER($1)
    ORDER BY created_at DESC
    `,
    [email]
  );
  return result.rows;
}

// Modificar donación de un usuario: SOLO si status === 'pending'
export async function actualizarDonacionUsuario(
  id: string,
  email: string,
  data: {
    donor_name?: string;
    amount?: number;
    currency?: string;
    payment_reference?: string;
    message?: string;
  }
) {
  const query = `
    UPDATE donations
    SET
      donor_name = COALESCE($1, donor_name),
      amount = COALESCE($2, amount),
      currency = COALESCE($3, currency),
      payment_reference = COALESCE($4, payment_reference),
      message = COALESCE($5, message)
    WHERE id = $6 AND LOWER(donor_email) = LOWER($7) AND status = 'pending'
    RETURNING *;
  `;

  const values = [
    data.donor_name || null,
    data.amount ?? null,
    data.currency || null,
    data.payment_reference || null,
    data.message || null,
    id,
    email,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Eliminar donación de un usuario: SOLO si status === 'pending'
export async function eliminarDonacionUsuario(id: string, email: string) {
  const query = `
    DELETE FROM donations
    WHERE id = $1 AND LOWER(donor_email) = LOWER($2) AND status = 'pending'
    RETURNING id;
  `;

  const result = await pool.query(query, [id, email]);
  return result.rows[0];
}

// Donaciones públicas para muro de transparencia (ordenadas por monto descendente)
export async function obtenerDonacionesPublicas() {
  const query = `
    SELECT
      id,
      COALESCE(NULLIF(TRIM(donor_name), ''), 'Donante Anónimo') AS donor_name,
      amount,
      currency,
      created_at
    FROM donations
    WHERE status != 'failed'
    ORDER BY amount DESC, created_at DESC
    LIMIT 100;
  `;

  const result = await pool.query(query);
  return result.rows;
}
