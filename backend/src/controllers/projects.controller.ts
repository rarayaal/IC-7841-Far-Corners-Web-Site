import type { Request, Response } from "express";
import {
  obtenerProyectosPublicados,
  obtenerTodosLosProyectos,
  obtenerProyectoPorId,
  crearProyecto,
  actualizarProyecto,
  eliminarProyecto,
} from "../repositories/projects.repository.js";

// GET /api/v1/projects (Publico: solo publicados, o admin: todos con query flag)
export async function listarProyectos(req: Request, res: Response) {
  try {
    const soloAdmin = req.query.admin === "true";
    const proyectos = soloAdmin
      ? await obtenerTodosLosProyectos()
      : await obtenerProyectosPublicados();

    res.status(200).json(proyectos);
  } catch (error) {
    console.error("Error al consultar proyectos:", error);
    res.status(500).json({
      message: "No se pudieron obtener los proyectos",
    });
  }
}

// GET /api/v1/projects/:id
export async function consultarProyecto(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const proyecto = await obtenerProyectoPorId(req.params.id);

    if (!proyecto) {
      res.status(404).json({
        message: "Proyecto no encontrado",
      });
      return;
    }

    res.status(200).json(proyecto);
  } catch (error) {
    console.error("Error al consultar el proyecto:", error);
    res.status(500).json({
      message: "No se pudo obtener el proyecto",
    });
  }
}

// POST /api/v1/projects (Admin / Manager)
export async function registrarProyecto(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      country,
      image_url,
      display_order,
      is_published,
      project_year,
      participants_count,
    } = req.body ?? {};

    if (typeof title !== "string" || title.trim() === "") {
      res.status(400).json({ message: "El título del proyecto es obligatorio." });
      return;
    }

    if (country && typeof country === "string") {
      const code = country.trim().toUpperCase();
      if (!["CR", "CN", "MZ"].includes(code)) {
        res.status(400).json({ message: "El país debe ser uno de los permitidos: CR, CN o MZ." });
        return;
      }
    }

    const nuevo = await crearProyecto({
      title: title.trim(),
      description: description ? String(description).trim() : null,
      country: country ? String(country).trim().toUpperCase() : null,
      image_url: image_url ? String(image_url).trim() : null,
      display_order: Number.isInteger(display_order) ? Number(display_order) : 0,
      is_published: !!is_published,
      project_year: project_year ? Number(project_year) : null,
      participants_count: participants_count !== undefined && participants_count !== null ? Number(participants_count) : null,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al registrar proyecto:", error);
    res.status(500).json({ message: "No se pudo crear el proyecto" });
  }
}

// PUT /api/v1/projects/:id (Admin / Manager)
export async function modificarProyecto(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      country,
      image_url,
      display_order,
      is_published,
      project_year,
      participants_count,
    } = req.body ?? {};

    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
      res.status(400).json({ message: "El título no puede estar vacío." });
      return;
    }

    if (country && typeof country === "string") {
      const code = country.trim().toUpperCase();
      if (!["CR", "CN", "MZ"].includes(code)) {
        res.status(400).json({ message: "El país debe ser uno de los permitidos: CR, CN o MZ." });
        return;
      }
    }

    const actualizado = await actualizarProyecto(id, {
      title: title ? title.trim() : undefined,
      description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
      country: country !== undefined ? (country ? String(country).trim().toUpperCase() : null) : undefined,
      image_url: image_url !== undefined ? (image_url ? String(image_url).trim() : null) : undefined,
      display_order: display_order !== undefined ? Number(display_order) : undefined,
      is_published: is_published !== undefined ? !!is_published : undefined,
      project_year: project_year !== undefined ? (project_year ? Number(project_year) : null) : undefined,
      participants_count: participants_count !== undefined ? (participants_count !== null ? Number(participants_count) : null) : undefined,
    });

    if (!actualizado) {
      res.status(404).json({ message: "Proyecto no encontrado" });
      return;
    }

    res.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al modificar proyecto:", error);
    res.status(500).json({ message: "No se pudo actualizar el proyecto" });
  }
}

// DELETE /api/v1/projects/:id (Admin / Manager)
export async function borrarProyecto(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;
    const eliminado = await eliminarProyecto(id);

    if (!eliminado) {
      res.status(404).json({ message: "Proyecto no encontrado" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    res.status(500).json({ message: "No se pudo eliminar el proyecto" });
  }
}