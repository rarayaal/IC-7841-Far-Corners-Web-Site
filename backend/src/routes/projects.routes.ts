import { Router } from "express";
import {
  listarProyectos,
  consultarProyecto,
} from "../controllers/projects.controller.js";

export const projectsRouter = Router();

projectsRouter.get("/", listarProyectos);
projectsRouter.get("/:id", consultarProyecto);