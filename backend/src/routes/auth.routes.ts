import { Router } from "express";
import {
  loginLocalController,
  loginGoogleController,
  logoutController,
  getMyProfileController,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

// Rutas de autenticacion
authRouter.post("/login", loginLocalController);
authRouter.post("/google", loginGoogleController);
authRouter.post("/logout", authenticateToken, logoutController);

export const usersRouter = Router();

// Rutas de usuarios
usersRouter.get("/me", authenticateToken, getMyProfileController);
