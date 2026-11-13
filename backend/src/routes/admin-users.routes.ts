import { Router } from "express";
import {
  listAdminUsersController,
  getAdminUserByIdController,
  createAdminUserController,
  updateAdminUserController,
  updateAdminStatusController,
  updateAdminRolesController,
  updateParticipantTypeController,
} from "../controllers/admin-users.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles, requirePermission } from "../middlewares/rbac.middleware.js";

export const adminUsersRouter = Router();

// Gestion unificada de usuarios: admin y manager con permiso users:manage
// pueden ver y editar a todos los usuarios del sistema.
adminUsersRouter.use(
  authenticateToken,
  requireRoles(["admin", "manager"]),
  requirePermission("users:manage")
);

adminUsersRouter.get("/users", listAdminUsersController);

adminUsersRouter.get("/users/:id", getAdminUserByIdController);

adminUsersRouter.patch(
  "/users/:id/status",
  updateAdminStatusController
);

adminUsersRouter.patch(
  "/users/:id/participant-type",
  updateParticipantTypeController
);

// Crear usuarios, cambiar roles y asignar permisos queda restringido a admin.
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
  "/users/:id/roles",
  requireRoles(["admin"]),
  updateAdminRolesController
);
