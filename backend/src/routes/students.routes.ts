import { Router } from "express";
import {
  listarEstudiantes,
  registrarEstudiante,
} from "../controllers/students.controller.js";

export const studentsRouter = Router();

studentsRouter.get("/", listarEstudiantes);
studentsRouter.post("/", registrarEstudiante);
