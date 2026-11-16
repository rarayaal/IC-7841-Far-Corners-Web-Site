import { Router } from "express";
import {
  handleListarEventos,
  handleObtenerEventoDestacado,
  handleObtenerEventoPorId,
  handleCrearEvento,
  handleActualizarEvento,
  handleMarcarComoPrincipal,
  handleEliminarEvento,
} from "../controllers/events.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const eventsRouter = Router();

// Consultas públicas
eventsRouter.get("/featured", handleObtenerEventoDestacado);
eventsRouter.get("/", handleListarEventos);
eventsRouter.get("/:id", handleObtenerEventoPorId);

// Gestión administrativa de producciones teatrales (CU-03 / CU-04 / RF-04)
eventsRouter.post(
  "/",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleCrearEvento
);

eventsRouter.put(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleActualizarEvento
);

eventsRouter.patch(
  "/:id/featured",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleMarcarComoPrincipal
);

eventsRouter.delete(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleEliminarEvento
);
