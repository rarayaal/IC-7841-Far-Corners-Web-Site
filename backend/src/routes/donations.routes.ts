import { Router } from "express";
import {
  handleObtenerDonaciones,
  handleObtenerDonacionPorId,
  handleCrearDonacion,
  handleActualizarEstadoDonacion,
} from "../controllers/donations.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

const router = Router();

// Registro publico de donaciones (CU-15 / RF-15)
router.post("/", handleCrearDonacion);

// Gestion administrativa de donaciones (CU-14 / RF-14)
router.get(
  "/",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleObtenerDonaciones
);

router.get(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleObtenerDonacionPorId
);

router.patch(
  "/:id/status",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleActualizarEstadoDonacion
);

export default router;