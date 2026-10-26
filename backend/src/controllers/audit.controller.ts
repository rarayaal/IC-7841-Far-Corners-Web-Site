import { Request, Response } from "express";
import { getAuditHistory } from "../services/audit.service.js";

/**
 * GET /api/v1/audit/logs - Consulta la bitacora de auditoria
 */
export async function getAuditLogsController(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;
    const tableName = req.query.tableName ? String(req.query.tableName) : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const action = req.query.action as "create" | "update" | "delete" | undefined;

    const logs = await getAuditHistory({
      limit,
      offset,
      tableName,
      userId,
      action,
    });

    res.status(200).json({ data: logs });
  } catch (error: any) {
    res.status(500).json({
      type: "https://farcornerscr.org/errors/internal-server-error",
      title: "Error al consultar bitácora",
      status: 500,
      detail: error.message ?? "No fue posible obtener los registros de auditoría",
    });
  }
}
