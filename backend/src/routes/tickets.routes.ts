import { Router } from "express";
import {
  handleObtenerInventario,
  handleCrearInventario,
  handleActualizarInventario,
  handleAdquirirBoletos,
} from "../controllers/tickets.controller.js";

const router = Router();

// Obtener y crear inventario por evento
router.get("/events/:eventId/tickets", handleObtenerInventario);
router.post("/events/:eventId/tickets", handleCrearInventario);

// Editar precio/disponibilidad de un tipo de boleto
router.put("/tickets/:id", handleActualizarInventario);

// Adquirir boletos 
router.post("/purchases", handleAdquirirBoletos);

export default router;