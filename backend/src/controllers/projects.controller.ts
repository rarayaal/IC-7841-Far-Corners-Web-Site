import type { Request, Response } from "express";
import {
  obtenerProyectosPublicados,
  obtenerProyectoPorId,
} from "../repositories/projects.repository.js";

export async function listarProyectos(
  _req: Request,
  res: Response
) {
  try {
    const proyectos = await obtenerProyectosPublicados();
    res.status(200).json(proyectos);
  } catch (error) {
    console.error("Error al consultar proyectos:", error);

    res.status(500).json({
      message: "No se pudieron obtener los proyectos",
    });
  }
}

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