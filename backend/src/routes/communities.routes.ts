import { Router } from "express";
import {
  listarComunidades,
  registrarComunidad,
} from "../controllers/communities.controller.js";

export const communitiesRouter = Router();

communitiesRouter.get("/", listarComunidades);
communitiesRouter.post("/", registrarComunidad);
