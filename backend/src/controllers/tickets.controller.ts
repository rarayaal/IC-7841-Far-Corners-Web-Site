import { Request, Response } from "express";
import {
  obtenerInventarioPorEvento,
  obtenerMetricasFuncionesPorEvento,
  obtenerBoletosPorFuncion,
  crearInventarioBoleto,
  actualizarInventarioBoleto,
  procesarCompraBoletos,
  validarCompraSinpe,
  validarBoletoQr,
  obtenerPdfDeCompra,
  reenviarCorreoBoletos,
} from "../repositories/tickets.repository.js";

// GET /api/v1/tickets/events/:eventId
export async function handleObtenerInventario(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "El parámetro eventId es requerido." });
    }

    const inventory = await obtenerInventarioPorEvento(eventId);
    return res.status(200).json(inventory);
  } catch (error) {
    console.error("Error al obtener inventario de boletos:", error);
    return res.status(500).json({ error: "Error interno al obtener inventario." });
  }
}

// GET /api/v1/tickets/events/:eventId/performances-metrics
export async function handleObtenerMetricasFunciones(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "El parámetro eventId es requerido." });
    }

    const metricas = await obtenerMetricasFuncionesPorEvento(eventId);
    return res.status(200).json(metricas);
  } catch (error) {
    console.error("Error al obtener métricas de funciones:", error);
    return res.status(500).json({ error: "Error interno al obtener métricas." });
  }
}

// GET /api/v1/tickets/performances/:performanceId/tickets
export async function handleObtenerBoletosPorFuncion(req: Request, res: Response) {
  try {
    const { performanceId } = req.params;

    if (!performanceId || typeof performanceId !== "string") {
      return res.status(400).json({ error: "El parámetro performanceId es requerido." });
    }

    const boletos = await obtenerBoletosPorFuncion(performanceId);
    return res.status(200).json(boletos);
  } catch (error) {
    console.error("Error al obtener boletos de la función:", error);
    return res.status(500).json({ error: "Error interno al obtener boletos de la función." });
  }
}

// POST /api/v1/tickets/events/:eventId
export async function handleCrearInventario(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { performance_id, ticket_type, ticket_type_en, price, quantity_available, currency } = req.body;

    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "El parámetro eventId es requerido." });
    }

    if (!ticket_type || price === undefined || !quantity_available) {
      return res.status(400).json({
        error: "Los campos ticket_type, price y quantity_available son obligatorios.",
      });
    }

    const nuevoBoleto = await crearInventarioBoleto({
      event_id: eventId,
      performance_id,
      ticket_type,
      ticket_type_en,
      price: parseFloat(price),
      quantity_available: parseInt(quantity_available, 10),
      currency,
    });

    return res.status(201).json(nuevoBoleto);
  } catch (error) {
    console.error("Error al crear inventario de boleto:", error);
    return res.status(500).json({ error: "Error interno al crear boleto." });
  }
}

// PUT /api/v1/tickets/:id 
export async function handleActualizarInventario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { price, quantity_available } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "El parámetro id es requerido." });
    }

    const boletoActualizado = await actualizarInventarioBoleto(
      id,
      price !== undefined ? parseFloat(price) : undefined,
      quantity_available !== undefined ? parseInt(quantity_available, 10) : undefined
    );

    if (!boletoActualizado) {
      return res.status(404).json({ error: "Inventario de boleto no encontrado." });
    }

    return res.status(200).json(boletoActualizado);
  } catch (error) {
    console.error("Error al actualizar inventario de boleto:", error);
    return res.status(500).json({ error: "Error interno al actualizar boleto." });
  }
}

// Mapa en memoria para rate-limiting de compras (30 segundos entre compras)
const purchaseCooldownMap = new Map<string, number>();

function cleanPurchaseCooldowns() {
  const now = Date.now();
  for (const [key, timestamp] of purchaseCooldownMap.entries()) {
    if (now - timestamp > 60000) {
      purchaseCooldownMap.delete(key);
    }
  }
}

// POST /api/v1/tickets/purchases (o /api/v1/purchases)
export async function handleAdquirirBoletos(req: Request, res: Response) {
  try {
    const {
      event_id,
      performance_id,
      ticket_inventory_id,
      quantity,
      buyer_name,
      buyer_email,
      payment_method,
      sinpe_reference,
      payment_intent_id,
      currency,
      user_id,
    } = req.body;

    if (!event_id || !ticket_inventory_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: "event_id, ticket_inventory_id y una cantidad mayor a 0 son obligatorios.",
      });
    }

    // Rate-limiting: evitar más de una compra en 30 segundos
    const clientIp = req.ip || req.socket.remoteAddress || "ip_desconocida";
    const userIdentifier = buyer_email ? String(buyer_email).trim().toLowerCase() : (user_id ? String(user_id) : clientIp);
    const cooldownKey = `cooldown_${userIdentifier}`;
    const now = Date.now();
    const lastPurchaseTime = purchaseCooldownMap.get(cooldownKey);

    if (lastPurchaseTime && now - lastPurchaseTime < 30000) {
      const waitSeconds = Math.ceil((30000 - (now - lastPurchaseTime)) / 1000);
      return res.status(429).json({
        error: `Por seguridad de la taquilla, debes esperar ${waitSeconds} segundos antes de realizar otra compra.`,
      });
    }

    const resultado = await procesarCompraBoletos({
      event_id,
      performance_id,
      ticket_inventory_id,
      quantity: parseInt(String(quantity), 10),
      buyer_name,
      buyer_email,
      payment_method,
      sinpe_reference,
      payment_intent_id,
      currency,
      user_id,
    });

    // Registrar tiempo de la compra para cooldown
    purchaseCooldownMap.set(cooldownKey, now);
    if (purchaseCooldownMap.size > 1000) {
      cleanPurchaseCooldowns();
    }

    return res.status(201).json({
      message: "Compra de boletos registrada exitosamente.",
      purchase: resultado.purchase,
      tickets: resultado.tickets,
      pdfBase64: resultado.pdfBase64,
    });
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_TICKETS") {
      return res.status(409).json({ error: "No hay suficientes boletos disponibles para esta función." });
    }
    if (error.message === "INVENTORY_NOT_FOUND") {
      return res.status(404).json({ error: "El boleto o evento seleccionado no existe." });
    }

    console.error("Error al procesar compra de boletos:", error);
    return res.status(500).json({ error: "Error interno al procesar la compra." });
  }
}

// PATCH /api/v1/tickets/purchases/:purchaseId/validate-sinpe
export async function handleValidarCompraSinpe(req: Request, res: Response) {
  try {
    const purchaseId = String(req.params.purchaseId || '');

    if (!purchaseId) {
      return res.status(400).json({ error: "El parámetro purchaseId es requerido." });
    }

    const updatedPurchase = await validarCompraSinpe(purchaseId);
    return res.status(200).json({
      message: "Compra SINPE validada y boletos despachados exitosamente.",
      purchase: updatedPurchase,
    });
  } catch (error: any) {
    if (error.message === "PURCHASE_NOT_FOUND_OR_ALREADY_PAID") {
      return res.status(404).json({ error: "La compra no existe o ya fue validada previamente." });
    }
    console.error("Error al validar compra SINPE:", error);
    return res.status(500).json({ error: "Error interno al validar comprobante SINPE." });
  }
}

// POST /api/v1/tickets/validate-qr
export async function handleValidarQr(req: Request, res: Response) {
  try {
    const { qr_code, performance_id } = req.body;

    if (!qr_code || typeof qr_code !== "string") {
      return res.status(400).json({ error: "El campo qr_code es requerido." });
    }

    const resultado = await validarBoletoQr(qr_code, performance_id);

    if (!resultado.valid) {
      return res.status(400).json(resultado);
    }

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al validar código QR:", error);
    return res.status(500).json({ error: "Error interno al validar el código QR." });
  }
}

// GET /api/v1/tickets/purchases/:purchaseId/pdf
export async function handleDescargarPdfCompra(req: Request, res: Response) {
  try {
    const purchaseId = String(req.params.purchaseId || '');

    if (!purchaseId) {
      return res.status(400).json({ error: "El parámetro purchaseId es requerido." });
    }

    const { buffer, filename } = await obtenerPdfDeCompra(purchaseId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error: any) {
    if (error.message === "PURCHASE_NOT_FOUND") {
      return res.status(404).json({ error: "Compra no encontrada." });
    }
    if (error.message === "PURCHASE_NOT_VALIDATED") {
      return res.status(403).json({
        error: "Los boletos y códigos QR se habilitarán una vez que el pago sea validado por el equipo de administración.",
      });
    }
    console.error("Error al generar PDF de la compra:", error);
    return res.status(500).json({ error: "Error interno al generar el PDF del boleto." });
  }
}

// POST /api/v1/tickets/purchases/:purchaseId/resend-email
export async function handleReenviarCorreoBoletos(req: Request, res: Response) {
  try {
    const purchaseId = String(req.params.purchaseId || '');
    const { email } = req.body || {};

    if (!purchaseId) {
      return res.status(400).json({ error: "El parámetro purchaseId es requerido." });
    }

    const resultado = await reenviarCorreoBoletos(purchaseId, email);

    return res.status(200).json({
      message: `Correo de boletos reenviado exitosamente a ${resultado.destinatario}.`,
      destinatario: resultado.destinatario,
      status: resultado.status,
      emailResult: resultado.emailResult,
    });
  } catch (error: any) {
    if (error.message === "PURCHASE_NOT_FOUND") {
      return res.status(404).json({ error: "La compra no existe." });
    }
    if (error.message === "NO_EMAIL_PROVIDED") {
      return res.status(400).json({ error: "Esta compra no posee una dirección de correo válida registrada." });
    }
    console.error("Error al reenviar correo de boletos:", error);
    return res.status(500).json({ error: "Error interno al reenviar el correo de boletos." });
  }
}
