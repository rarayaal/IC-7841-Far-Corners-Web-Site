import { Router } from "express";
import {
  listarVoluntarios,
  registrarVoluntario,
} from "../controllers/volunteers.controller.js";

export const volunteersRouter = Router();

volunteersRouter.get("/", listarVoluntarios);
volunteersRouter.post("/", registrarVoluntario);
