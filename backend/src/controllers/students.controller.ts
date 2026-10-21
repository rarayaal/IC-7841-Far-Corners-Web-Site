import type { Request, Response } from "express";
import {
  obtenerEstudiantes,
  crearPerfilEstudiante,
  actualizarPerfilEstudiante,
  eliminarPerfilEstudiante,
} from "../repositories/students.repository.js";

export async function listarEstudiantes(_req: Request, res: Response) {
  try {
    const estudiantes = await obtenerEstudiantes();
    res.status(200).json(estudiantes);
  } catch (error) {
    console.error("Error al consultar estudiantes:", error);
    res.status(500).json({ message: "No se pudieron obtener los estudiantes" });
  }
}

export async function registrarEstudiante(req: Request, res: Response) {
  try {
    const { user_id, university, start_date, end_date } = req.body ?? {};

    if (!user_id) {
      res.status(400).json({ message: 'El ID de usuario es obligatorio.' });
      return;
    }

    const nuevoPerfil = await crearPerfilEstudiante(
      user_id,
      university ? String(university).trim() : null,
      start_date || null,
      end_date || null
    );

    res.status(201).json(nuevoPerfil);
  } catch (error) {
    console.error("Error al registrar perfil de estudiante:", error);
    res.status(500).json({ message: "No se pudo registrar el perfil del estudiante" });
  }
}

export async function modificarEstudiante(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const { university, start_date, end_date } = req.body ?? {};

    const actualizado = await actualizarPerfilEstudiante(
      id,
      university ? String(university).trim() : null,
      start_date || null,
      end_date || null
    );

    if (!actualizado) {
      res.status(404).json({ message: 'Perfil de estudiante no encontrado' });
      return;
    }

    res.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al modificar perfil de estudiante:", error);
    res.status(500).json({ message: "No se pudo modificar el perfil del estudiante" });
  }
}

export async function borrarEstudiante(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;

    const eliminado = await eliminarPerfilEstudiante(id);

    if (!eliminado) {
      res.status(404).json({ message: 'Perfil de estudiante no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar perfil de estudiante:", error);
    res.status(500).json({ message: "No se pudo eliminar el perfil del estudiante" });
  }
}
