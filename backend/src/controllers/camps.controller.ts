import type { Request, Response } from "express";
import {
  obtenerCampistas,
  crearPerfilCampista,
  actualizarPerfilCampista,
  eliminarPerfilCampista,
  obtenerUsuariosSinPerfilCampista,
} from "../repositories/camps.repository.js";

export async function listarCampistas(_req: Request, res: Response) {
  try {
    const campistas = await obtenerCampistas();
    res.status(200).json(campistas);
  } catch (error) {
    console.error("Error al consultar campistas:", error);
    res.status(500).json({ message: "No se pudieron obtener los campistas" });
  }
}

const ESTADOS_VALIDOS = ['active', 'inactive'] as const;

export async function listarCandidatosCampista(_req: Request, res: Response) {
  try {
    const candidatos = await obtenerUsuariosSinPerfilCampista();
    res.status(200).json(candidatos);
  } catch (error) {
    console.error("Error al consultar candidatos a campista:", error);
    res.status(500).json({ message: "No se pudieron obtener los candidatos" });
  }
}

export async function registrarCampista(req: Request, res: Response) {
  try {
    const { user_id, school, grade, session } = req.body ?? {};

    if (!user_id) {
      res.status(400).json({ message: 'El ID de usuario es obligatorio.' });
      return;
    }

    const nuevoPerfil = await crearPerfilCampista(
      user_id,
      school ? String(school).trim() : null,
      grade ? String(grade).trim() : null,
      session ? String(session).trim() : null
    );

    res.status(201).json(nuevoPerfil);
  } catch (error) {
    console.error("Error al registrar perfil de campista:", error);
    res.status(500).json({ message: "No se pudo registrar el perfil del campista" });
  }
}

export async function modificarCampista(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;
    const { school, grade, session, status } = req.body ?? {};

    let estado: string | null = null;
    if (status !== undefined && status !== null) {
      if (typeof status !== 'string' || !(ESTADOS_VALIDOS as readonly string[]).includes(status)) {
        res.status(400).json({ message: `El estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
        return;
      }
      estado = status;
    }

    const actualizado = await actualizarPerfilCampista(
      id,
      school ? String(school).trim() : null,
      grade ? String(grade).trim() : null,
      session ? String(session).trim() : null,
      estado
    );

    if (!actualizado) {
      res.status(404).json({ message: 'Perfil de campista no encontrado' });
      return;
    }

    res.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al modificar perfil de campista:", error);
    res.status(500).json({ message: "No se pudo modificar el perfil del campista" });
  }
}

export async function borrarCampista(req: Request<{ id: string }>, res: Response) {
  try {
    const { id } = req.params;

    const eliminado = await eliminarPerfilCampista(id);

    if (!eliminado) {
      res.status(404).json({ message: 'Perfil de campista no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar perfil de campista:", error);
    res.status(500).json({ message: "No se pudo eliminar el perfil del campista" });
  }
}
