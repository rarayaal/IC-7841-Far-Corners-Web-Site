import { Request, Response } from "express";
import {
  obtenerInventarioPorEvento,
  crearInventarioBoleto,
  actualizarInventarioBoleto,
  procesarCompraBoletos,
} from "../repositories/tickets.repository.js";

// GET /api/v1/events/:eventId/tickets
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

// POST /api/v1/events/:eventId/tickets
export async function handleCrearInventario(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { performance_id, ticket_type, price, quantity_available, currency } = req.body;

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
      price,
      quantity_available,
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

    const boletoActualizado = await actualizarInventarioBoleto(id, price, quantity_available);

    if (!boletoActualizado) {
      return res.status(404).json({ error: "Inventario de boleto no encontrado." });
    }

    return res.status(200).json(boletoActualizado);
  } catch (error) {
    console.error("Error al actualizar inventario de boleto:", error);
    return res.status(500).json({ error: "Error interno al actualizar boleto." });
  }
}

// POST /api/v1/purchases 
export async function handleAdquirirBoletos(req: Request, res: Response) {
  try {
    const {
      event_id,
      ticket_inventory_id,
      quantity,
      buyer_name,
      buyer_email,
      payment_intent_id,
      currency,
      user_id,
    } = req.body;

    if (!event_id || !ticket_inventory_id || !quantity || quantity <= 0) {
      return res.status(400).json({
        error: "event_id, ticket_inventory_id y una cantidad mayor a 0 son obligatorios.",
      });
    }

    const resultado = await procesarCompraBoletos({
      event_id,
      ticket_inventory_id,
      quantity,
      buyer_name,
      buyer_email,
      payment_intent_id,
      currency,
      user_id,
    });

    return res.status(201).json({
      message: "Compra de boletos realizada exitosamente.",
      purchase: resultado.purchase,
      tickets: resultado.tickets,
    });
  } catch (error: any) {
    if (error.message === "INSUFFICIENT_TICKETS") {
      return res.status(409).json({ error: "No hay suficientes boletos disponibles." });
    }
    if (error.message === "INVENTORY_NOT_FOUND") {
      return res.status(404).json({ error: "El boleto o evento seleccionado no existe." });
    }

    console.error("Error al procesar compra de boletos:", error);
    return res.status(500).json({ error: "Error interno al procesar la compra." });
  }
}