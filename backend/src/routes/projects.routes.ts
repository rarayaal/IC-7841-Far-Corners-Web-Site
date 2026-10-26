import { Router } from "express";
import {
  listarProyectos,
  consultarProyecto,
  registrarProyecto,
  modificarProyecto,
  borrarProyecto,
} from "../controllers/projects.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const projectsRouter = Router();

// Consulta publica
projectsRouter.get("/", listarProyectos);
projectsRouter.get("/:id", consultarProyecto);

// Gestion administrativa de proyectos (CU-04 / RF-04)
projectsRouter.post(
  "/",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  registrarProyecto
);

projectsRouter.put(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  modificarProyecto
);

projectsRouter.delete(
  "/:id",
  authenticateToken,
  requireRoles(["admin", "manager"]),
  borrarProyecto
);