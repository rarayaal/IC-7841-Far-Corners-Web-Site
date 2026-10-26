import { Request, Response } from "express";
import {
  getAdminUsersList,
  getAdminUserDetail,
  registerAdminUser,
  modifyAdminUser,
  changeAdminStatus,
  updateAdminPermissions,
} from "../services/admin-users.service.js";
import { logAuditAction } from "../services/audit.service.js";

/**
 * GET /api/v1/admin/users - Listar usuarios administrativos
 */
export async function listAdminUsersController(_req: Request, res: Response): Promise<void> {
  try {
    const users = await getAdminUsersList();
    res.status(200).json({ data: users });
  } catch (error: any) {
    res.status(500).json({
      type: "https://farcornerscr.org/errors/internal-server-error",
      title: "Error interno del servidor",
      status: 500,
      detail: error.message ?? "No fue posible listar los usuarios administrativos",
    });
  }
}

/**
 * GET /api/v1/admin/users/:id - Obtener detalle de un usuario administrativo
 */
export async function getAdminUserByIdController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const user = await getAdminUserDetail(id);
    res.status(200).json({ data: user });
  } catch (error: any) {
    res.status(404).json({
      type: "https://farcornerscr.org/errors/user-not-found",
      title: "Usuario no encontrado",
      status: 404,
      detail: error.message ?? "El usuario administrativo solicitado no existe",
    });
  }
}

/**
 * POST /api/v1/admin/users - Crear un nuevo usuario administrativo
 */
export async function createAdminUserController(req: Request, res: Response): Promise<void> {
  try {
    const { full_name, email, temporary_password, role, permissions } = req.body;

    if (!full_name || !email || !temporary_password || !role) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/bad-request",
        title: "Datos incompletos",
        status: 400,
        detail: "Se requiere ingresar nombre completo, correo, contraseña temporal y rol ('admin' o 'manager')",
      });
      return;
    }

    if (!["admin", "manager"].includes(role)) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/invalid-role",
        title: "Rol no permitido",
        status: 400,
        detail: "El rol administrativo debe ser 'admin' o 'manager'",
      });
      return;
    }

    const createdUser = await registerAdminUser(
      full_name,
      email,
      temporary_password,
      role,
      Array.isArray(permissions) ? permissions : []
    );

    // Registrar accion en bitacora de auditoria
    await logAuditAction(
      req.user?.userId ?? "sistema",
      "create",
      "users",
      createdUser.id,
      null,
      { full_name: createdUser.full_name, email: createdUser.email, role: createdUser.role },
      req.ip ?? null
    );

    res.status(201).json({
      message: "Usuario administrativo registrado exitosamente",
      data: createdUser,
    });
  } catch (error: any) {
    res.status(400).json({
      type: "https://farcornerscr.org/errors/bad-request",
      title: "Error al registrar usuario",
      status: 400,
      detail: error.message ?? "No se pudo registrar el usuario administrativo",
    });
  }
}

/**
 * PUT /api/v1/admin/users/:id - Actualizar datos de un usuario administrativo
 */
export async function updateAdminUserController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { full_name, email, role } = req.body;

    if (!full_name || !email || !role) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/bad-request",
        title: "Datos incompletos",
        status: 400,
        detail: "Se requiere nombre completo, correo y rol ('admin' o 'manager')",
      });
      return;
    }

    if (!["admin", "manager"].includes(role)) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/invalid-role",
        title: "Rol no permitido",
        status: 400,
        detail: "El rol administrativo debe ser 'admin' o 'manager'",
      });
      return;
    }

    const updatedUser = await modifyAdminUser(id, full_name, email, role);

    // Registrar accion en bitacora de auditoria
    await logAuditAction(
      req.user?.userId ?? "sistema",
      "update",
      "users",
      updatedUser.id,
      null,
      { full_name: updatedUser.full_name, email: updatedUser.email, role: updatedUser.role },
      req.ip ?? null
    );

    res.status(200).json({
      message: "Usuario administrativo actualizado exitosamente",
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      type: "https://farcornerscr.org/errors/bad-request",
      title: "Error al actualizar usuario",
      status: 400,
      detail: error.message ?? "No se pudo actualizar el usuario administrativo",
    });
  }
}

/**
 * PATCH /api/v1/admin/users/:id/status - Cambiar estado de cuenta
 */
export async function updateAdminStatusController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const currentUserId = req.user?.userId;

    if (!status || !["active", "inactive"].includes(status)) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/invalid-status",
        title: "Estado inválido",
        status: 400,
        detail: "El estado debe ser 'active' o 'inactive'",
      });
      return;
    }

    await changeAdminStatus(id, status, currentUserId ?? "");

    // Registrar accion en bitacora de auditoria
    await logAuditAction(
      currentUserId ?? "sistema",
      "update",
      "users",
      id,
      null,
      { status },
      req.ip ?? null
    );

    res.status(200).json({
      message: `El estado del usuario se actualizó a '${status}' exitosamente`,
    });
  } catch (error: any) {
    res.status(400).json({
      type: "https://farcornerscr.org/errors/bad-request",
      title: "Error al modificar estado",
      status: 400,
      detail: error.message ?? "No fue posible modificar el estado del usuario",
    });
  }
}

/**
 * PATCH /api/v1/admin/users/:id/roles - Asignar permisos y roles granulares
 */
export async function updateAdminRolesController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/bad-request",
        title: "Formato incorrecto",
        status: 400,
        detail: "El campo 'permissions' debe ser una lista de códigos de permisos",
      });
      return;
    }

    const updatedUser = await updateAdminPermissions(id, permissions);

        // Registrar accion en bitacora de auditoria (CU-25)
    await logAuditAction(
      req.user?.userId ?? "sistema",
      "update",
      "user_permissions",
      id,
      null,
      { permissions },
      req.ip ?? null
    );

    res.status(200).json({
      message: "Permisos del usuario actualizados exitosamente",
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      type: "https://farcornerscr.org/errors/bad-request",
      title: "Error al actualizar permisos",
      status: 400,
      detail: error.message ?? "No se pudieron actualizar los permisos del usuario",
    });
  }
}
