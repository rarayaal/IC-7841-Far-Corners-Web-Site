import type { Request, Response } from "express";
import { obtenerComunidades, crearComunidad } from "../repositories/communities.repository.js";

export async function listarComunidades(_req: Request, res: Response) {
  try {
    const comunidades = await obtenerComunidades();
    res.status(200).json(comunidades);
  } catch (error) {
    console.error("Error al consultar comunidades:", error);
    res.status(500).json({ message: "No se pudieron obtener las comunidades" });
  }
}

export async function registrarComunidad(req: Request, res: Response) {
  try {
    const { name, description, is_published } = req.body ?? {};

    if (typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ message: 'El nombre es obligatorio.' });
      return;
    }

    const nuevaComunidad = await crearComunidad(
      name.trim(),
      description ? String(description).trim() : null,
      !!is_published
    );

    res.status(201).json(nuevaComunidad);
  } catch (error) {
    console.error("Error al registrar comunidad:", error);
    res.status(500).json({ message: "No se pudo registrar la comunidad" });
  }
}
