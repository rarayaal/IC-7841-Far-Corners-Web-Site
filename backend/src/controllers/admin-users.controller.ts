import { Request, Response } from "express";
import {
  getAdminUsersList,
  getAdminUserDetail,
  registerAdminUser,
  modifyAdminUser,
  changeAdminStatus,
  updateAdminPermissions,
  setParticipantType,
} from "../services/admin-users.service.js";
import { logAuditAction } from "../services/audit.service.js";

const ROLES_VALIDOS = ["admin", "manager", "user"] as const;
const PARTICIPANT_TYPES_VALIDOS = [
  "internship",
  "volunteer",
  "camp",
] as const;

/**
 * GET /api/v1/admin/users - Listar usuarios con paginacion, busqueda y filtro por rol
 */
export async function listAdminUsersController(req: Request, res: Response): Promise<void> {
  try {
    const roleParam = req.query.role;
    const role =
      typeof roleParam === "string" && ROLES_VALIDOS.includes(roleParam as (typeof ROLES_VALIDOS)[number])
        ? (roleParam as (typeof ROLES_VALIDOS)[number])
        : undefined;

    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const pageSize = Math.max(
      1,
      Math.min(parseInt(String(req.query.pageSize ?? "20"), 10) || 20, 100)
    );

    const result = await getAdminUsersList({ role, search, page, pageSize });

    res.status(200).json({
      data: result.rows,
      total: result.total,
      page,
      pageSize,
    });
  } catch (error: any) {
    res.status(500).json({
      type: "https://farcornerscr.org/errors/internal-server-error",
      title: "Error interno del servidor",
      status: 500,
      detail: error.message ?? "No fue posible listar los usuarios",
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
        detail: "Se requiere ingresar nombre completo, correo, contraseña temporal y rol ('admin', 'manager' o 'user')",
      });
      return;
    }

    if (!["admin", "manager", "user"].includes(role)) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/invalid-role",
        title: "Rol no permitido",
        status: 400,
        detail: "El rol debe ser 'admin', 'manager' o 'user'",
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
        detail: "Se requiere nombre completo, correo y rol ('admin', 'manager' o 'user')",
      });
      return;
    }

    if (!["admin", "manager", "user"].includes(role)) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/invalid-role",
        title: "Rol no permitido",
        status: 400,
        detail: "El rol debe ser 'admin', 'manager' o 'user'",
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

/**
 * PATCH /api/v1/admin/users/:id/participant-type - Asignar o limpiar el tipo de participante
 */
export async function updateParticipantTypeController(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params.id);
    const { participant_type } = req.body;

    if (
      participant_type !== null &&
      !PARTICIPANT_TYPES_VALIDOS.includes(
        participant_type as (typeof PARTICIPANT_TYPES_VALIDOS)[number]
      )
    ) {
      res.status(400).json({
        type: "https://farcornerscr.org/errors/invalid-participant-type",
        title: "Tipo de participante inválido",
        status: 400,
        detail: "El tipo de participante debe ser 'internship', 'volunteer', 'camp' o null",
      });
      return;
    }

    const updatedUser = await setParticipantType(
      id,
      participant_type as (typeof PARTICIPANT_TYPES_VALIDOS)[number] | null
    );

    await logAuditAction(
      req.user?.userId ?? "sistema",
      "update",
      "users",
      id,
      null,
      { participant_type },
      req.ip ?? null
    );

    res.status(200).json({
      message: "Tipo de participante actualizado exitosamente",
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(400).json({
      type: "https://farcornerscr.org/errors/bad-request",
      title: "Error al actualizar tipo de participante",
      status: 400,
      detail: error.message ?? "No se pudo actualizar el tipo de participante",
    });
  }
}
