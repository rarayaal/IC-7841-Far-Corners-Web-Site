import { Router } from "express";
import {
  listarVoluntarios,
  registrarVoluntario,
  modificarVoluntario,
  borrarVoluntario,
} from "../controllers/volunteers.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const volunteersRouter = Router();

// Gestion administrativa de voluntarios y pasantes (CU-06)
volunteersRouter.get("/", authenticateToken, requireRoles(["admin", "manager"]), listarVoluntarios);
volunteersRouter.post("/", authenticateToken, requireRoles(["admin", "manager"]), registrarVoluntario);
volunteersRouter.put("/:id", authenticateToken, requireRoles(["admin", "manager"]), modificarVoluntario);
volunteersRouter.delete("/:id", authenticateToken, requireRoles(["admin", "manager"]), borrarVoluntario);
