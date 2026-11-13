import bcrypt from "bcrypt";
import {
  findAllUsersPaginated,
  findUserById,
  countActiveAdmins,
  createAdminUser,
  updateAdminUser,
  updateAdminStatus,
  syncUserPermissions,
  setUserParticipantType,
  AdminUserSummary,
  UserRole,
  ParticipantType,
} from "../repositories/admin-users.repository.js";
import { findUserByEmail } from "../repositories/auth.repository.js";

/**
 * Obtiene la lista paginada de usuarios con filtros por rol y busqueda
 */
export async function getAdminUsersList(filters: {
  role?: UserRole;
  search?: string;
  page: number;
  pageSize: number;
}) {
  return findAllUsersPaginated(filters);
}

/**
 * Obtiene el detalle de un usuario administrativo por su identificador
 */
export async function getAdminUserDetail(id: string): Promise<AdminUserSummary> {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("Usuario administrativo no encontrado");
  }

  return user;
}

/**
 * Registra un nuevo usuario administrativo con contrasena hasheada y rol
 */
export async function registerAdminUser(
  fullName: string,
  email: string,
  temporaryPassword: string,
  role: UserRole,
  permissions: string[] = []
): Promise<AdminUserSummary> {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("Ya existe un usuario registrado con este correo electrónico");
  }

  // Cifrado de la contrasena temporal mediante bcrypt con coste 12
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const newUserId = await createAdminUser(fullName, email, passwordHash, role);

  // Si se definieron permisos iniciales, se asignan
  if (permissions.length > 0) {
    await syncUserPermissions(newUserId, permissions);
  }

  const createdUser = await findUserById(newUserId);
  return createdUser!;
}

/**
 * Actualiza los datos generales de un administrador
 */
export async function modifyAdminUser(
  id: string,
  fullName: string,
  email: string,
  newRole: UserRole
): Promise<AdminUserSummary> {
  const user = await findUserById(id);

  if (!user) {
    throw new Error("Usuario administrativo no encontrado");
  }

  // Regla de negocio: evitar degradar al ultimo Administrador General activo
  if (user.role === "admin" && newRole !== "admin") {
    const activeAdmins = await countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new Error("No es posible degradar el rol del único Administrador General activo del sistema");
    }
  }

  // Validar unicidad del correo si se modifica
  if (email.toLowerCase() !== user.email.toLowerCase()) {
    const emailInUse = await findUserByEmail(email);
    if (emailInUse) {
      throw new Error("El correo electrónico ya se encuentra asignado a otra cuenta");
    }
  }

  await updateAdminUser(id, fullName, email, newRole);

  const updatedUser = await findUserById(id);
  return updatedUser!;
}

/**
 * Cambia el estado de la cuenta (baja logica o reactivacion)
 */
export async function changeAdminStatus(
  targetUserId: string,
  newStatus: "active" | "inactive",
  currentUserId: string
): Promise<void> {
  const user = await findUserById(targetUserId);

  if (!user) {
    throw new Error("Usuario administrativo no encontrado");
  }

  // Regla de negocio: no auto-desactivarse
  if (targetUserId === currentUserId && newStatus === "inactive") {
    throw new Error("No puede desactivar su propia cuenta administrativa");
  }

  // Regla de negocio: evitar dejar al sistema sin Administrador General
  if (user.role === "admin" && newStatus === "inactive") {
    const activeAdmins = await countActiveAdmins();
    if (activeAdmins <= 1) {
      throw new Error("No es posible desactivar al único Administrador General activo del sistema");
    }
  }

  await updateAdminStatus(targetUserId, newStatus);
}

/**
 * Actualiza los permisos granulares asignados a un usuario administrativo
 */
export async function updateAdminPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<AdminUserSummary> {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("Usuario administrativo no encontrado");
  }

  await syncUserPermissions(userId, permissionCodes);

  const updatedUser = await findUserById(userId);
  return updatedUser!;
}

/**
 * Asigna o limpia el tipo de participante de un usuario
 */
export async function setParticipantType(
  userId: string,
  participantType: ParticipantType | null
): Promise<AdminUserSummary> {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  await setUserParticipantType(userId, participantType);

  const updatedUser = await findUserById(userId);
  return updatedUser!;
}
