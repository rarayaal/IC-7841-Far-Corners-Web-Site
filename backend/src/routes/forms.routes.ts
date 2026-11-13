import { Router } from "express";
import {
  listarFormularios,
  listarFormulariosPublicados,
  crearFormulario,
  duplicarFormulario,
  eliminarFormulario,
  actualizarPublicacion,
  listarCampos,
  guardarEstructura,
  enviarFormulario,
  listarEnvios,
  listarTodosEnvios,
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
formsRouter.delete("/:slug", authenticateToken, requireRoles(["admin", "manager"]), eliminarFormulario);

// Ficha pública en "Programas y Comunidad" (sin sesión: la página es pública)
formsRouter.get("/published", listarFormulariosPublicados);
formsRouter.post("/:slug/duplicate", authenticateToken, requireRoles(["admin", "manager"]), duplicarFormulario);
formsRouter.patch("/:slug/publication", authenticateToken, requireRoles(["admin", "manager"]), actualizarPublicacion);

// Estructura editable del formulario (visible para cualquier usuario con sesión)
formsRouter.get("/:formType/fields", authenticateToken, listarCampos);

// Envío de formularios (requiere cuenta)
formsRouter.post("/:formType/submissions", authenticateToken, enviarFormulario);

// Borradores automáticos (respuestas guardadas mientras se rellena el formulario)
formsRouter.get("/:formType/draft", authenticateToken, obtenerBorradorHandler);
formsRouter.put("/:formType/draft", authenticateToken, guardarBorradorHandler);
formsRouter.delete("/:formType/draft", authenticateToken, borrarBorradorHandler);

// Guardado completo de la estructura (título + secciones + campos) en una sola llamada
formsRouter.put("/:formType/structure", authenticateToken, requireRoles(["admin", "manager"]), guardarEstructura);

// Gestión de envíos
// Bandeja unificada: todas las postulaciones de todos los formularios.
formsRouter.get("/submissions", authenticateToken, requireRoles(["admin", "manager"]), listarTodosEnvios);
formsRouter.get("/:formType/submissions", authenticateToken, requireRoles(["admin", "manager"]), listarEnvios);
formsRouter.put("/:formType/submissions/:id/status", authenticateToken, requireRoles(["admin", "manager"]), cambiarEstadoEnvio);
