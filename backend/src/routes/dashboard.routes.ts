import { Router } from "express";
import { handleObtenerMetricasDashboard } from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/metrics",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleObtenerMetricasDashboard
);

export default dashboardRouter;
