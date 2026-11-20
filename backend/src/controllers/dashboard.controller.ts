import { Request, Response } from "express";
import { pool } from "../db.js";

export async function handleObtenerMetricasDashboard(_req: Request, res: Response) {
  try {
    // 1. Donaciones
    const donationsRes = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN (currency = 'CRC' OR currency IS NULL) AND status = 'completed' THEN amount ELSE 0 END), 0)::numeric as total_crc,
        COALESCE(SUM(CASE WHEN currency = 'USD' AND status = 'completed' THEN amount ELSE 0 END), 0)::numeric as total_usd,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_count,
        COUNT(*)::int as total_donations
      FROM donations;
    `);

    // 2. Boletos y Taquilla Reales (basados en tickets y compras confirmadas)
    const ticketMetricsRes = await pool.query(`
      SELECT
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END)::int as paid_tickets,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END)::int as pending_tickets,
        COUNT(CASE WHEN t.status = 'used' AND p.status = 'paid' THEN 1 END)::int as used_tickets,
        COUNT(CASE WHEN t.status = 'active' AND p.status = 'paid' THEN 1 END)::int as active_tickets,
        COUNT(*)::int as total_tickets
      FROM tickets t
      JOIN purchases p ON t.purchase_id = p.id;
    `);

    const capacityRes = await pool.query(`
      SELECT
        COALESCE(
          NULLIF((SELECT SUM(max_capacity) FROM event_performances), 0),
          (SELECT SUM(quantity_available + quantity_sold) FROM ticket_inventory WHERE currency = 'CRC' OR currency IS NULL),
          100
        )::int as total_capacity;
    `);

    const purchasesRes = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' AND (currency = 'CRC' OR currency IS NULL) THEN total_amount ELSE 0 END), 0)::numeric as total_revenue_crc,
        COALESCE(SUM(CASE WHEN status = 'paid' AND currency = 'USD' THEN total_amount ELSE 0 END), 0)::numeric as total_revenue_usd,
        COUNT(CASE WHEN status = 'paid' THEN 1 END)::int as paid_purchases,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int as pending_purchases
      FROM purchases;
    `);

    // 3. Postulaciones (Applications + Form submissions)
    let totalApplicants = 0;
    try {
      const appsRes = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM applications)::int +
          (SELECT COUNT(*) FROM form_submissions)::int as total;
      `);
      totalApplicants = Number(appsRes.rows[0]?.total || 0);
    } catch {
      const fallback = await pool.query(`SELECT COUNT(*)::int as total FROM form_submissions;`).catch(() => ({ rows: [{ total: 0 }] }));
      totalApplicants = Number(fallback.rows[0]?.total || 0);
    }

    // 4. Registros de Auditoría
    let totalAuditLogs = 0;
    try {
      const auditRes = await pool.query(`SELECT COUNT(*)::int as total FROM audit_logs;`);
      totalAuditLogs = Number(auditRes.rows[0]?.total || 0);
    } catch {}

    // 5. Total de usuarios registrados
    let totalUsers = 0;
    try {
      const usersRes = await pool.query(`SELECT COUNT(*)::int as total FROM users;`);
      totalUsers = Number(usersRes.rows[0]?.total || 0);
    } catch {}

    // 6. Ventas Reales por Obra Teatral (sin duplicar monedas ni inventarios)
    const showsRes = await pool.query(`
      SELECT
        e.id,
        e.title,
        e.season_year,
        COALESCE(
          (SELECT COUNT(*) 
           FROM tickets t 
           JOIN purchases p ON t.purchase_id = p.id 
           WHERE p.event_id = e.id AND p.status = 'paid'),
          0
        )::int as sold,
        COALESCE(
          (SELECT COUNT(*) 
           FROM tickets t 
           JOIN purchases p ON t.purchase_id = p.id 
           WHERE p.event_id = e.id AND p.status = 'pending'),
          0
        )::int as pending_sold,
        COALESCE(
          NULLIF((SELECT SUM(ep.max_capacity) FROM event_performances ep WHERE ep.event_id = e.id), 0),
          (SELECT SUM(ti.quantity_available + ti.quantity_sold) 
           FROM ticket_inventory ti 
           WHERE ti.event_id = e.id AND (ti.currency = 'CRC' OR ti.currency IS NULL)),
          100
        )::int as capacity
      FROM events e
      ORDER BY e.is_featured DESC, e.display_order ASC, e.event_date DESC
      LIMIT 6;
    `);

    const salesByShow = showsRes.rows.map((row) => {
      const sold = Number(row.sold);
      const pendingSold = Number(row.pending_sold);
      const capacity = Number(row.capacity);
      const percentage = capacity > 0 ? Math.round((sold / capacity) * 100) : 0;
      return {
        id: row.id,
        title: `${row.title}${row.season_year ? ` (${row.season_year})` : ''}`,
        sold,
        pendingSold,
        capacity: capacity > 0 ? capacity : 100,
        percentage,
      };
    });

    const ticketRow = ticketMetricsRes.rows[0] || {};
    const paidTickets = Number(ticketRow.paid_tickets || 0);
    const pendingTickets = Number(ticketRow.pending_tickets || 0);
    const usedTickets = Number(ticketRow.used_tickets || 0);
    const activeTickets = Number(ticketRow.active_tickets || 0);
    const totalCapacity = Number(capacityRes.rows[0]?.total_capacity || 100);
    const occupancyPercentage = totalCapacity > 0 ? Math.round((paidTickets / totalCapacity) * 100) : 0;

    return res.status(200).json({
      donations: {
        totalCRC: Number(donationsRes.rows[0]?.total_crc || 0),
        totalUSD: Number(donationsRes.rows[0]?.total_usd || 0),
        completedCount: Number(donationsRes.rows[0]?.completed_count || 0),
        pendingCount: Number(donationsRes.rows[0]?.pending_count || 0),
        totalCount: Number(donationsRes.rows[0]?.total_donations || 0),
      },
      tickets: {
        soldCount: paidTickets,
        pendingCount: pendingTickets,
        activeCount: activeTickets,
        usedCount: usedTickets,
        totalCapacity,
        occupancyPercentage,
        totalRevenueCRC: Number(purchasesRes.rows[0]?.total_revenue_crc || 0),
        totalRevenueUSD: Number(purchasesRes.rows[0]?.total_revenue_usd || 0),
        paidPurchases: Number(purchasesRes.rows[0]?.paid_purchases || 0),
        pendingPurchases: Number(purchasesRes.rows[0]?.pending_purchases || 0),
      },
      applicants: {
        total: totalApplicants,
      },
      users: {
        total: totalUsers,
      },
      auditLogs: {
        total: totalAuditLogs,
      },
      salesByShow,
    });
  } catch (error) {
    console.error("Error al obtener métricas del dashboard:", error);
    return res.status(500).json({ error: "Error interno al calcular las métricas del dashboard." });
  }
}
