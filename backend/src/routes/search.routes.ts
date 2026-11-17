import { publicLocalization } from '../middlewares/public-localization.middleware.js';
import { Router } from "express";
import { buscar } from "../controllers/search.controller.js";

export const searchRouter = Router();

// Busqueda global de contenido publico (CU-23)
searchRouter.get("/", publicLocalization("search"), buscar);
