import { Router } from "express";
import {
  handleObtenerDonaciones,
  handleObtenerDonacionPorId,
  handleCrearDonacion,
  handleActualizarEstadoDonacion,
} from "../controllers/donations.controller.js";

const router = Router();

router.get("/", handleObtenerDonaciones);
router.get("/:id", handleObtenerDonacionPorId);
router.post("/", handleCrearDonacion);
router.patch("/:id/status", handleActualizarEstadoDonacion);

export default router;