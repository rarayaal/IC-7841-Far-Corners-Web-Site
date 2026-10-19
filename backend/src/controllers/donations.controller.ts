import { Request, Response } from "express";
import {
  obtenerTodasLasDonaciones,
  obtenerDonacionPorId,
  crearDonacion,
  actualizarEstadoDonacion,
} from "../repositories/donations.repository.js";

// GET /api/v1/donations
export async function handleObtenerDonaciones(req: Request, res: Response) {
  try {
    const donations = await obtenerTodasLasDonaciones();
    return res.status(200).json(donations);
  } catch (error) {
    console.error("Error al obtener donaciones:", error);
    return res.status(500).json({ error: "Error interno al obtener donaciones." });
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