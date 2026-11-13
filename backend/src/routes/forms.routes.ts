import { Router } from "express";
import {
  listarFormularios,
  crearFormulario,
  renombrarFormulario,
  eliminarFormulario,
  listarCampos,
  agregarCampo,
  modificarCampo,
  borrarCampo,
  reordenar,
  renombrarSeccionHandler,
  eliminarSeccionHandler,
  guardarEstructura,
  enviarFormulario,
  listarEnvios,
  cambiarEstadoEnvio,
  obtenerBorradorHandler,
  guardarBorradorHandler,
  borrarBorradorHandler,
} from "../controllers/forms.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/rbac.middleware.js";

export const formsRouter = Router();

// Gestión de formularios (crear, renombrar, eliminar)
formsRouter.get("/", authenticateToken, requireRoles(["admin", "manager"]), listarFormularios);
formsRouter.post("/", authenticateToken, requireRoles(["admin", "manager"]), crearFormulario);
formsRouter.put("/:slug", authenticateToken, requireRoles(["admin", "manager"]), renombrarFormulario);
formsRouter.delete("/:slug", authenticateToken, requireRoles(["admin", "manager"]), eliminarFormulario);

// Estructura editable del formulario (visible para cualquier usuario con sesión)
formsRouter.get("/:formType/fields", authenticateToken, listarCampos);

// Envío de formularios (requiere cuenta)
formsRouter.post("/:formType/submissions", authenticateToken, enviarFormulario);

// Borradores automáticos (respuestas guardadas mientras se rellena el formulario)
formsRouter.get("/:formType/draft", authenticateToken, obtenerBorradorHandler);
formsRouter.put("/:formType/draft", authenticateToken, guardarBorradorHandler);
formsRouter.delete("/:formType/draft", authenticateToken, borrarBorradorHandler);

// Editor administrativo de campos (CU-05/06/07)
formsRouter.post("/:formType/fields", authenticateToken, requireRoles(["admin", "manager"]), agregarCampo);
formsRouter.put("/:formType/fields/reorder", authenticateToken, requireRoles(["admin", "manager"]), reordenar);
formsRouter.put("/:formType/fields/:id", authenticateToken, requireRoles(["admin", "manager"]), modificarCampo);
formsRouter.delete("/:formType/fields/:id", authenticateToken, requireRoles(["admin", "manager"]), borrarCampo);

// Gestión de secciones (renombrar / eliminar)
formsRouter.put("/:formType/sections/rename", authenticateToken, requireRoles(["admin", "manager"]), renombrarSeccionHandler);
formsRouter.delete("/:formType/sections", authenticateToken, requireRoles(["admin", "manager"]), eliminarSeccionHandler);

// Guardado completo de la estructura (título + descripción + campos) en una sola llamada
formsRouter.put("/:formType/structure", authenticateToken, requireRoles(["admin", "manager"]), guardarEstructura);

// Gestión de envíos
formsRouter.get("/:formType/submissions", authenticateToken, requireRoles(["admin", "manager"]), listarEnvios);
formsRouter.put("/:formType/submissions/:id/status", authenticateToken, requireRoles(["admin", "manager"]), cambiarEstadoEnvio);
