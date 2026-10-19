import { Router } from "express";
import {
  listAdminUsersController,
  getAdminUserByIdController,
  createAdminUserController,
  updateAdminUserController,
  updateAdminStatusController,
  updateAdminRolesController,
} from "../controllers/admin-users.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles, requirePermission } from "../middlewares/rbac.middleware.js";

export const adminUsersRouter = Router();

// Todas las rutas de administracion requieren autenticacion previa
adminUsersRouter.use(authenticateToken);

// Gestion de cuentas administrativas
adminUsersRouter.get(
  "/users",
  requireRoles(["admin"]),
  listAdminUsersController
);

adminUsersRouter.get(
  "/users/:id",
  requireRoles(["admin"]),
  getAdminUserByIdController
);

adminUsersRouter.post(
  "/users",
  requireRoles(["admin"]),
  createAdminUserController
);

adminUsersRouter.put(
  "/users/:id",
  requireRoles(["admin"]),
  updateAdminUserController
);

adminUsersRouter.patch(
  "/users/:id/status",
  requireRoles(["admin"]),
  updateAdminStatusController
);

// Gestion granular de roles y permisos (CU-11)
adminUsersRouter.patch(
  "/users/:id/roles",
  requireRoles(["admin"]),
  updateAdminRolesController
);
