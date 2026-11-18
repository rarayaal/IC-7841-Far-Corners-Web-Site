import { Router } from "express";
import {
  handleObtenerInventario,
  handleObtenerMetricasFunciones,
  handleObtenerBoletosPorFuncion,
  handleCrearInventario,
  handleActualizarInventario,
  handleAdquirirBoletos,
  handleValidarCompraSinpe,
  handleValidarQr,
  handleDescargarPdfCompra,
  handleReenviarCorreoBoletos,
} from "../controllers/tickets.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

const router = Router();

// Consultar disponibilidad e inventario por evento (público)
router.get(
  ["/events/:eventId", "/events/:eventId/tickets"],
  handleObtenerInventario
);

// Métricas de funciones por evento (capacidad, vendidos, disponibles, precios CRC/USD)
router.get(
  "/events/:eventId/performances-metrics",
  handleObtenerMetricasFunciones
);

// Lista de boletos por función (Admin)
router.get(
  "/performances/:performanceId/tickets",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleObtenerBoletosPorFuncion
);

// Crear tipo de boleto / inventario (Admin)
router.post(
  ["/events/:eventId", "/events/:eventId/tickets"],
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleCrearInventario
);

// Actualizar precio o cupos de inventario (Admin)
router.put(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleActualizarInventario
);

// Realizar compra de boletos (Público)
router.post(
  ["/purchases", "/"],
  handleAdquirirBoletos
);

// Validar compra SINPE (Admin)
router.patch(
  "/purchases/:purchaseId/validate-sinpe",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleValidarCompraSinpe
);

// In-App Escáner QR para validación en puerta (Admin)
router.post(
  "/validate-qr",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleValidarQr
);

// Descargar boletos en PDF (Público con ID de compra)
router.get(
  "/purchases/:purchaseId/pdf",
  handleDescargarPdfCompra
);

// Reenviar boletos por correo (Admin)
router.post(
  "/purchases/:purchaseId/resend-email",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  handleReenviarCorreoBoletos
);

export default router;
