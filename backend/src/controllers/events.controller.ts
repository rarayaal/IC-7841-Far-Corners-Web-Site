import { Request, Response } from "express";
import {
  obtenerEventos,
  obtenerEventoDestacado,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  marcarEventoComoPrincipal,
  eliminarEvento,
} from "../repositories/events.repository.js";

// GET /api/v1/events
export async function handleListarEventos(req: Request, res: Response) {
  try {
    const soloAdmin = req.query.admin === "true";
    const eventos = await obtenerEventos(!soloAdmin);
    return res.status(200).json(eventos);
  } catch (error: any) {
    console.error("Error al obtener eventos:", error);
    return res.status(500).json({
      error: error?.message || "Error interno al obtener eventos.",
      detail: error?.detail || undefined,
    });
  }
}

// GET /api/v1/events/featured
export async function handleObtenerEventoDestacado(_req: Request, res: Response) {
  try {
    const destacado = await obtenerEventoDestacado();
    if (!destacado) {
      return res.status(404).json({ error: "No hay ninguna producción destacada actualmente." });
    }
    return res.status(200).json(destacado);
  } catch (error) {
    console.error("Error al obtener producción destacada:", error);
    return res.status(500).json({ error: "Error interno al obtener la producción destacada." });
  }
}

// GET /api/v1/events/:id
export async function handleObtenerEventoPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "El ID del evento no es válido." });
    }

    const evento = await obtenerEventoPorId(id);
    if (!evento) {
      return res.status(404).json({ error: "Producción / Evento no encontrado." });
    }

    return res.status(200).json(evento);
  } catch (error) {
    console.error("Error al consultar evento por id:", error);
    return res.status(500).json({ error: "Error interno al consultar el evento." });
  }
}

// POST /api/v1/events (Admin / Manager)
export async function handleCrearEvento(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      event_date,
      venue,
      max_capacity,
      poster_url,
      banner_url,
      director,
      season_year,
      status,
      dates_label,
      display_order,
      is_published,
      is_featured,
      zeffy_url,
      paypal_url,
      sinpe_phone,
      payment_methods,
      performances,
      cast,
      media_ids,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "El título de la producción es obligatorio." });
    }

    const nuevoEvento = await crearEvento({
      title: title.trim(),
      description: description ? String(description).trim() : null,
      event_date,
      venue,
      max_capacity: max_capacity ? parseInt(max_capacity, 10) : undefined,
      poster_url: poster_url || null,
      banner_url: banner_url || null,
      director: director || null,
      season_year: season_year ? parseInt(season_year, 10) : undefined,
      status: status || 'current',
      dates_label: dates_label || null,
      display_order: display_order !== undefined ? parseInt(display_order, 10) : 0,
      is_published: is_published !== undefined ? !!is_published : true,
      is_featured: !!is_featured,
      zeffy_url: zeffy_url ? String(zeffy_url).trim() : null,
      paypal_url: paypal_url ? String(paypal_url).trim() : null,
      sinpe_phone: sinpe_phone ? String(sinpe_phone).trim() : '7131-7013',
      payment_methods: payment_methods || 'sinpe,zeffy,paypal',
      performances: Array.isArray(performances) ? performances : [],
      cast: Array.isArray(cast) ? cast : [],
      media_ids: Array.isArray(media_ids) ? media_ids : [],
    });

    return res.status(201).json(nuevoEvento);
  } catch (error: any) {
    console.error("Error al registrar producción teatral:", error);
    return res.status(500).json({
      error: error?.message || "Error interno al crear la producción.",
      detail: error?.detail || undefined,
    });
  }
}

// PUT /api/v1/events/:id (Admin / Manager)
export async function handleActualizarEvento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID inválido." });
    }

    const eventoActualizado = await actualizarEvento(id, req.body);
    if (!eventoActualizado) {
      return res.status(404).json({ error: "Producción no encontrada." });
    }

    return res.status(200).json(eventoActualizado);
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return res.status(500).json({ error: "Error interno al actualizar la producción." });
  }
}

// PATCH /api/v1/events/:id/featured (Admin / Manager)
export async function handleMarcarComoPrincipal(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID inválido." });
    }

    const actualizado = await marcarEventoComoPrincipal(id);
    if (!actualizado) {
      return res.status(404).json({ error: "Producción no encontrada." });
    }

    return res.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al marcar como principal:", error);
    return res.status(500).json({ error: "Error interno al marcar producción como principal." });
  }
}

// DELETE /api/v1/events/:id (Admin / Manager)
export async function handleEliminarEvento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID inválido." });
    }

    const eliminado = await eliminarEvento(id);
    if (!eliminado) {
      return res.status(404).json({ error: "Producción no encontrada." });
    }

    return res.status(200).json({ message: "Producción eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return res.status(500).json({ error: "Error interno al eliminar producción." });
  }
}
