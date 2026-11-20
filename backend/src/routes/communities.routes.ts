import { publicLocalization } from '../middlewares/public-localization.middleware.js';
import { Router } from "express";
import {
  listarComunidades,
  registrarComunidad,
  modificarComunidad,
  borrarComunidad,
} from "../controllers/communities.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const communitiesRouter = Router();

// Consulta publica de comunidades
communitiesRouter.get("/", publicLocalization("communities"), listarComunidades);

// Gestion administrativa de comunidades (CU-07)
communitiesRouter.post("/", authenticateToken, requireRoles(["admin", "manager"]), registrarComunidad);
communitiesRouter.put("/:id", authenticateToken, requireRoles(["admin", "manager"]), modificarComunidad);
communitiesRouter.delete("/:id", authenticateToken, requireRoles(["admin", "manager"]), borrarComunidad);
