import { Router } from "express";
import {
  loginLocalController,
  loginGoogleController,
  logoutController,
  getMyProfileController,
  updateMyProfileController,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

// Rutas de autenticacion
authRouter.post("/login", loginLocalController);
authRouter.post("/google", loginGoogleController);
authRouter.post("/logout", authenticateToken, logoutController);

export const profileRouter = Router();

// Rutas del perfil del usuario autenticado
profileRouter.get("/", authenticateToken, getMyProfileController);
profileRouter.put("/", authenticateToken, updateMyProfileController);
