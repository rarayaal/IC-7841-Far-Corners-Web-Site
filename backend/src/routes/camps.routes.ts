import { Router } from "express";
import {
  listarCampistas,
  registrarCampista,
  modificarCampista,
  borrarCampista,
  listarCandidatosCampista,
} from "../controllers/camps.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const campsRouter = Router();

// Gestion administrativa de campistas
campsRouter.get("/", authenticateToken, requireRoles(["admin", "manager"]), listarCampistas);
campsRouter.get("/candidates", authenticateToken, requireRoles(["admin", "manager"]), listarCandidatosCampista);
campsRouter.post("/", authenticateToken, requireRoles(["admin", "manager"]), registrarCampista);
campsRouter.put("/:id", authenticateToken, requireRoles(["admin", "manager"]), modificarCampista);
campsRouter.delete("/:id", authenticateToken, requireRoles(["admin", "manager"]), borrarCampista);
