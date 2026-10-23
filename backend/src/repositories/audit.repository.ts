import type { PoolClient } from 'pg';

export interface EntradaAuditoria {
  userId: string;
  action: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
}

// Se ejecuta con el cliente de la transacción para que el cambio y su
// registro en la bitácora se confirmen o se reviertan juntos.
export async function registrarAuditoria(
  client: PoolClient,
  entrada: EntradaAuditoria
) {
  await client.query(
    `
      INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      entrada.userId,
      entrada.action,
      entrada.tableName,
      entrada.recordId,
      entrada.oldValues ? JSON.stringify(entrada.oldValues) : null,
      entrada.newValues ? JSON.stringify(entrada.newValues) : null,
      entrada.ipAddress?.slice(0, 45) ?? null,
    ]
  );
}
