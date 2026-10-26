import { Router } from "express";
import {
  handleObtenerInventario,
  handleCrearInventario,
  handleActualizarInventario,
  handleAdquirirBoletos,
} from "../controllers/tickets.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

const router = Router();

// CU-16 / RF-16: Gestión de inventario por evento (Admin)
// GET  /api/v1/tickets/events/:eventId  → consultar disponibilidad (público)
// POST /api/v1/tickets/events/:eventId  → crear tipo de boleto (admin)
router.get(
  ["/events/:eventId", "/events/:eventId/tickets"],
  handleObtenerInventario
);

router.post(
  ["/events/:eventId", "/events/:eventId/tickets"],
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleCrearInventario
);

// PUT /api/v1/tickets/:id  → editar precio o disponibilidad (admin)
router.put(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleActualizarInventario
);

// CU-17 / RF-17: Adquirir boletos (público)
// POST /api/v1/tickets/purchases
router.post("/purchases", handleAdquirirBoletos);

export default router;