import { Router } from "express";
import {
  listarEstudiantes,
  registrarEstudiante,
  modificarEstudiante,
  borrarEstudiante,
} from "../controllers/students.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const studentsRouter = Router();

// Gestion administrativa de estudiantes internacionales (CU-05)
studentsRouter.get("/", authenticateToken, requireRoles(["admin", "manager"]), listarEstudiantes);
studentsRouter.post("/", authenticateToken, requireRoles(["admin", "manager"]), registrarEstudiante);
studentsRouter.put("/:id", authenticateToken, requireRoles(["admin", "manager"]), modificarEstudiante);
studentsRouter.delete("/:id", authenticateToken, requireRoles(["admin", "manager"]), borrarEstudiante);
