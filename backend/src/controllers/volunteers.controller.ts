import type { Request, Response } from "express";
import { obtenerVoluntarios, crearPerfilVoluntario } from "../repositories/volunteers.repository.js";

export async function listarVoluntarios(_req: Request, res: Response) {
  try {
    const voluntarios = await obtenerVoluntarios();
    res.status(200).json(voluntarios);
  } catch (error) {
    console.error("Error al consultar voluntarios:", error);
    res.status(500).json({ message: "No se pudieron obtener los voluntarios" });
  }
}

export async function registrarVoluntario(req: Request, res: Response) {
  try {
    const { user_id, interests, availability } = req.body ?? {};

    if (!user_id) {
      res.status(400).json({ message: 'El ID de usuario es obligatorio.' });
      return;
    }

    const nuevoPerfil = await crearPerfilVoluntario(
      user_id,
      interests ? String(interests).trim() : null,
      availability ? String(availability).trim() : null
    );

    res.status(201).json(nuevoPerfil);
  } catch (error) {
    console.error("Error al registrar perfil de voluntario:", error);
    res.status(500).json({ message: "No se pudo registrar el perfil del voluntario" });
  }
}
