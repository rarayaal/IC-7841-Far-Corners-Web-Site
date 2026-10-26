import { Router } from "express";
import { getAuditLogsController } from "../controllers/audit.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles, requirePermission } from "../middlewares/rbac.middleware.js";

export const auditRouter = Router();

// Endpoint de bitacora protegido
auditRouter.get(
  "/logs",
  authenticateToken,
  requireRoles(["admin"]),
  getAuditLogsController
);
