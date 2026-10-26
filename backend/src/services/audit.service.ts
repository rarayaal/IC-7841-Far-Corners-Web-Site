import {
  insertAuditLog,
  findAuditLogs,
  AuditLogEntry,
  AuditLogFilters,
} from "../repositories/audit.repository.js";

/**
 * Registra una accion en la bitacora de auditoria
 */
export async function logAuditAction(
  userId: string,
  action: "create" | "update" | "delete",
  tableName: string,
  recordId: string,
  oldValues: any = null,
  newValues: any = null,
  ipAddress: string | null = null
): Promise<void> {
  // Sanitizar posibles contraseñas para no guardarlas en la bitácora
  const sanitize = (data: any) => {
    if (!data || typeof data !== "object") return data;
    const clean = { ...data };
    if ("password" in clean) clean.password = "[PROTEGIDO]";
    if ("password_hash" in clean) clean.password_hash = "[PROTEGIDO]";
    if ("temporary_password" in clean) clean.temporary_password = "[PROTEGIDO]";
    return clean;
  };

  await insertAuditLog(
    userId,
    action,
    tableName,
    recordId,
    sanitize(oldValues),
    sanitize(newValues),
    ipAddress
  );
}

/**
 * Recupera el historial de auditoria con soporte de filtros y limites
 */
export async function getAuditHistory(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
  const safeLimit = Math.min(Math.max(filters?.limit ?? 50, 1), 100);
  const safeOffset = Math.max(filters?.offset ?? 0, 0);

  return findAuditLogs({
    ...filters,
    limit: safeLimit,
    offset: safeOffset,
  });
}
