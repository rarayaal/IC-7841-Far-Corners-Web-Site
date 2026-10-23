import type { Request, Response } from "express";
import {
  obtenerVoluntarios,
  crearPerfilVoluntario,
  actualizarPerfilVoluntario,
  eliminarPerfilVoluntario,
  obtenerUsuariosSinPerfilVoluntario,
} from "../repositories/volunteers.repository.js";

export async function listarVoluntarios(_req: Request, res: Response) {
  try {
    const voluntarios = await obtenerVoluntarios();
    res.status(200).json(voluntarios);
  } catch (error) {
    console.error("Error al consultar voluntarios:", error);
    res.status(500).json({ message: "No se pudieron obtener los voluntarios" });
  }
}

const ESTADOS_VALIDOS = ['active', 'inactive', 'pending'] as const;

export async function listarCandidatosVoluntario(_req: Request, res: Response) {
  try {
    const candidatos = await obtenerUsuariosSinPerfilVoluntario();
    res.status(200).json(candidatos);
  } catch (error) {
    console.error("Error al consultar candidatos a voluntario:", error);
    res.status(500).json({ message: "No se pudieron obtener los candidatos" });
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

export async function modificarVoluntario(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const { interests, availability, status } = req.body ?? {};

    let estado: string | null = null;
    if (status !== undefined && status !== null) {
      if (typeof status !== 'string' || !(ESTADOS_VALIDOS as readonly string[]).includes(status)) {
        res.status(400).json({ message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
        return;
      }
      estado = status;
    }

    const actualizado = await actualizarPerfilVoluntario(
      id,
      interests ? String(interests).trim() : null,
      availability ? String(availability).trim() : null,
      estado
    );

    if (!actualizado) {
      res.status(404).json({ message: 'Perfil de voluntario no encontrado' });
      return;
    }

    res.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al modificar perfil de voluntario:", error);
    res.status(500).json({ message: "No se pudo modificar el perfil del voluntario" });
  }
}

export async function borrarVoluntario(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;

    const eliminado = await eliminarPerfilVoluntario(id);

    if (!eliminado) {
      res.status(404).json({ message: 'Perfil de voluntario no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar perfil de voluntario:", error);
    res.status(500).json({ message: "No se pudo eliminar el perfil del voluntario" });
  }
}
