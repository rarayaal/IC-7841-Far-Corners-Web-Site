import { Request, Response } from "express";
import {
  obtenerTodasLasDonaciones,
  obtenerDonacionPorId,
  crearDonacion,
  actualizarEstadoDonacion,
  obtenerDonacionesDeUsuario,
  actualizarDonacionUsuario,
  eliminarDonacionUsuario,
  obtenerDonacionesPublicas,
} from "../repositories/donations.repository.js";

// GET /api/v1/donations (Admin / Manager con filtros opcionales)
export async function handleObtenerDonaciones(req: Request, res: Response) {
  try {
    const { metodo, estado, montoMin, montoMax, fechaInicio, fechaFin, busqueda } = req.query;

    const filtros = {
      metodo: typeof metodo === "string" ? metodo : undefined,
      estado: typeof estado === "string" ? estado : undefined,
      montoMin: montoMin ? parseFloat(montoMin as string) : undefined,
      montoMax: montoMax ? parseFloat(montoMax as string) : undefined,
      fechaInicio: typeof fechaInicio === "string" ? fechaInicio : undefined,
      fechaFin: typeof fechaFin === "string" ? fechaFin : undefined,
      busqueda: typeof busqueda === "string" ? busqueda : undefined,
    };

    const donations = await obtenerTodasLasDonaciones(filtros);
    return res.status(200).json(donations);
  } catch (error) {
    console.error("Error al obtener donaciones:", error);
    return res.status(500).json({ error: "Error interno al obtener donaciones." });
  }
}

// GET /api/v1/donations/my-donations (Usuario registrado autenticado)
export async function handleObtenerMisDonaciones(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    const donaciones = await obtenerDonacionesDeUsuario(email);
    return res.status(200).json(donaciones);
  } catch (error) {
    console.error("Error al obtener donaciones del usuario:", error);
    return res.status(500).json({ error: "Error interno al obtener donaciones del usuario." });
  }
}

// PUT /api/v1/donations/my-donations/:id (Usuario registrado autenticado)
export async function handleActualizarMiDonacion(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    const { id } = req.params;

    if (!email) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "El ID de la donación no es válido." });
    }

    // Verificar si la donación existe
    const donacionExistente = await obtenerDonacionPorId(id);
    if (!donacionExistente) {
      return res.status(404).json({ error: "Donación no encontrada." });
    }

    // Verificar pertenencia al usuario
    if (donacionExistente.donor_email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta donación." });
    }

    // Regla de negocio estricta: solo editable si status es 'pending'
    if (donacionExistente.status !== "pending") {
      return res.status(400).json({
        error: "Solo se pueden editar donaciones en estado 'en revisión' (pendiente). Las donaciones ya validadas no pueden modificarse.",
      });
    }

    const { donor_name, amount, currency, payment_reference, message } = req.body;

    const donacionActualizada = await actualizarDonacionUsuario(id, email, {
      donor_name,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      currency,
      payment_reference,
      message,
    });

    return res.status(200).json(donacionActualizada);
  } catch (error) {
    console.error("Error al actualizar donación del usuario:", error);
    return res.status(500).json({ error: "Error interno al actualizar la donación." });
  }
}

// DELETE /api/v1/donations/my-donations/:id (Usuario registrado autenticado)
export async function handleEliminarMiDonacion(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    const { id } = req.params;

    if (!email) {
      return res.status(401).json({ error: "Usuario no autenticado." });
    }

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "El ID de la donación no es válido." });
    }

    // Verificar si la donación existe
    const donacionExistente = await obtenerDonacionPorId(id);
    if (!donacionExistente) {
      return res.status(404).json({ error: "Donación no encontrada." });
    }

    // Verificar pertenencia al usuario
    if (donacionExistente.donor_email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta donación." });
    }

    // Regla de negocio estricta: solo eliminable si status es 'pending'
    if (donacionExistente.status !== "pending") {
      return res.status(400).json({
        error: "Solo se pueden eliminar donaciones en estado 'en revisión' (pendiente). Las donaciones ya validadas no pueden eliminarse.",
      });
    }

    await eliminarDonacionUsuario(id, email);
    return res.status(200).json({ message: "Donación cancelada y eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar donación del usuario:", error);
    return res.status(500).json({ error: "Error interno al eliminar la donación." });
  }
}

// GET /api/v1/donations/:id
export async function handleObtenerDonacionPorId(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "El parámetro id debe ser una cadena válida." });
    }

    const donation = await obtenerDonacionPorId(id);

    if (!donation) {
      return res.status(404).json({ error: "Donación no encontrada." });
    }

    return res.status(200).json(donation);
  } catch (error) {
    console.error("Error al obtener la donación:", error);
    return res.status(500).json({ error: "Error interno al obtener la donación." });
  }
}

// POST /api/v1/donations
export async function handleCrearDonacion(req: Request, res: Response) {
  try {
    const {
      donor_name,
      donor_email,
      amount,
      payment_provider,
      transaction_id,
      status,
      message,
      currency,
      payment_method,
      payment_reference,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "El monto de la donación debe ser mayor a 0." });
    }

    if (!payment_provider) {
      return res.status(400).json({ error: "El proveedor de pago es requerido." });
    }

    const nuevaDonacion = await crearDonacion({
      donor_name,
      donor_email,
      amount,
      payment_provider,
      transaction_id,
      status,
      message,
      currency,
      payment_method,
      payment_reference,
    });

    return res.status(201).json(nuevaDonacion);
  } catch (error) {
    console.error("Error al registrar la donación:", error);
    return res.status(500).json({ error: "Error interno al registrar la donación." });
  }
}

// PATCH /api/v1/donations/:id/status
export async function handleActualizarEstadoDonacion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, verified_by } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "El parámetro id debe ser una cadena válida." });
    }

    if (!status) {
      return res.status(400).json({ error: "El campo status es requerido." });
    }

    const donacionActualizada = await actualizarEstadoDonacion(id, status, verified_by);

    if (!donacionActualizada) {
      return res.status(404).json({ error: "Donación no encontrada." });
    }

    return res.status(200).json(donacionActualizada);
  } catch (error) {
    console.error("Error al actualizar el estado de la donación:", error);
    return res.status(500).json({ error: "Error interno al actualizar el estado." });
  }
}

// GET /api/v1/donations/public - Muro público de donaciones ordenadas por monto
export async function handleObtenerDonacionesPublicas(_req: Request, res: Response) {
  try {
    const donaciones = await obtenerDonacionesPublicas();
    return res.status(200).json(donaciones);
  } catch (error) {
    console.error("Error al obtener donaciones públicas:", error);
    return res.status(500).json({ error: "Error interno al obtener donaciones públicas." });
  }
}