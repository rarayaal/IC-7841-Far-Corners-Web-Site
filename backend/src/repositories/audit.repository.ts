import { pool } from "../db.js";

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  action: "create" | "update" | "delete";
  table_name: string;
  record_id: string;
  old_values: any | null;
  new_values: any | null;
  ip_address: string | null;
  created_at: Date;
}

export interface AuditLogFilters {
  limit?: number;
  offset?: number;
  tableName?: string;
  userId?: string;
  action?: "create" | "update" | "delete";
}

/**
 * Inserta un registro inmutable en la bitacora de auditoria
 */
export async function insertAuditLog(
  userId: string,
  action: "create" | "update" | "delete",
  tableName: string,
  recordId: string,
  oldValues: any = null,
  newValues: any = null,
  ipAddress: string | null = null
): Promise<void> {
  await pool.query(
    `
    INSERT INTO audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `,
    [
      userId,
      action,
      tableName,
      recordId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
    ]
  );
}

/**
 * Consulta la bitacora de auditoria con paginacion y filtros opcionales (CU-25)
 */
export async function findAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;
  const params: any[] = [limit, offset];
  const conditions: string[] = [];

  if (filters?.tableName) {
    params.push(filters.tableName);
    conditions.push(`a.table_name = $${params.length}`);
  }

  if (filters?.userId) {
    params.push(filters.userId);
    conditions.push(`a.user_id = $${params.length}`);
  }

  if (filters?.action) {
    params.push(filters.action);
    conditions.push(`a.action = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      a.id,
      a.user_id,
      u.full_name as user_name,
      u.email as user_email,
      a.action,
      a.table_name,
      a.record_id,
      a.old_values,
      a.new_values,
      a.ip_address,
      a.created_at
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2;
  `;

  const result = await pool.query<AuditLogEntry>(query, params);
  return result.rows;
}