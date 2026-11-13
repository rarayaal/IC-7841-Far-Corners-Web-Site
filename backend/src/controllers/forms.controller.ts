import type { Request, Response } from "express";
import {
  FIELD_TYPES,
  SUBMISSION_STATUSES,
  listarForms,
  obtenerForm,
  crearForm,
  eliminarForm,
  obtenerCampos,
  obtenerSecciones,
  reemplazarEstructura,
  crearEnvio,
  obtenerEnvios,
  actualizarEstadoEnvio,
  guardarBorrador,
  obtenerBorrador,
  borrarBorrador,
} from "../repositories/forms.repository.js";

const REGEX_SLUG = /^[a-z0-9][a-z0-9-]*$/;

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function asegurarForm(slug: string, res: Response): Promise<boolean> {
  const form = await obtenerForm(slug);
  if (!form) {
    res.status(404).json({ message: "Formulario no encontrado." });
    return false;
  }
  return true;
}

function validarFieldType(fieldType: unknown, res: Response): fieldType is string {
  if (typeof fieldType !== "string" || !(FIELD_TYPES as readonly string[]).includes(fieldType)) {
    res.status(400).json({ message: `Tipo de campo inválido. Debe ser uno de: ${FIELD_TYPES.join(", ")}` });
    return false;
  }
  return true;
}

// ----- Gestión de formularios -----

// GET /api/v1/forms
export async function listarFormularios(_req: Request, res: Response) {
  try {
    const forms = await listarForms();
    res.status(200).json(forms);
  } catch (error) {
    console.error("Error al listar los formularios:", error);
    res.status(500).json({ message: "No se pudieron obtener los formularios" });
  }
}

// POST /api/v1/forms
export async function crearFormulario(req: Request, res: Response) {
  const { title, slug } = req.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ message: "El título es obligatorio." });
    return;
  }

  const slugBase =
    typeof slug === "string" && slug.trim() ? slug.trim().toLowerCase() : slugify(title.trim());
  if (!REGEX_SLUG.test(slugBase)) {
    res.status(400).json({ message: "El identificador debe contener solo letras minúsculas, números y guiones." });
    return;
  }

  try {
    let slugFinal = slugBase;
    let intentos = 0;
    let form;
    // Si el slug ya existe (p. ej. varios "Sin título"), se agrega un sufijo.
    while (true) {
      try {
        form = await crearForm(slugFinal, title.trim());
        break;
      } catch (error) {
        if ((error as { code?: string })?.code === "23505" && intentos < 50) {
          intentos += 1;
          slugFinal = `${slugBase}-${intentos + 1}`;
          continue;
        }
        throw error;
      }
    }
    res.status(201).json(form);
  } catch (error) {
    console.error("Error al crear el formulario:", error);
    res.status(500).json({ message: "No se pudo crear el formulario" });
  }
}

// DELETE /api/v1/forms/:slug
export async function eliminarFormulario(req: Request<{ slug: string }>, res: Response) {
  const { slug } = req.params;
  try {
    const eliminado = await eliminarForm(slug);
    if (!eliminado) {
      res.status(404).json({ message: "Formulario no encontrado." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar el formulario:", error);
    res.status(500).json({ message: "No se pudo eliminar el formulario" });
  }
}

// ----- Estructura editable del formulario -----

// GET /api/v1/forms/:formType/fields
export async function listarCampos(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  try {
    if (!(await asegurarForm(formType, res))) return;
    const [sections, fields] = await Promise.all([obtenerSecciones(formType), obtenerCampos(formType)]);
    res.status(200).json({ sections, fields });
  } catch (error) {
    console.error("Error al obtener los campos del formulario:", error);
    res.status(500).json({ message: "No se pudieron obtener los campos del formulario" });
  }
}

// PUT /api/v1/forms/:formType/structure
export async function guardarEstructura(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  const { title, sections, fields } = req.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ message: "El título es obligatorio." });
    return;
  }
  if (!Array.isArray(fields)) {
    res.status(400).json({ message: "Se requiere la lista de campos." });
    return;
  }

  const secs: { name: string; description: string | null; orphan: boolean }[] = [];
  if (sections !== undefined) {
    if (!Array.isArray(sections)) {
      res.status(400).json({ message: "Las secciones deben ser una lista." });
      return;
    }
    for (const s of sections) {
      if (!s || typeof s !== "object" || typeof s.name !== "string") {
        res.status(400).json({ message: "Cada sección debe ser un objeto con un nombre." });
        return;
      }
      secs.push({
        name: s.name,
        description: typeof s.description === "string" && s.description.trim() ? s.description.trim() : null,
        orphan: Boolean(s.orphan),
      });
    }
  }

  const campos: { field_key: string; label: string; field_type: string; section: string; options: unknown; required: boolean }[] = [];
  for (const f of fields) {
    if (!f || typeof f !== "object") {
      res.status(400).json({ message: "Cada campo debe ser un objeto." });
      return;
    }
    if (typeof f.field_key !== "string" || !/^[a-z0-9_]+$/.test(f.field_key)) {
      res.status(400).json({ message: "El identificador del campo es inválido." });
      return;
    }
    if (typeof f.label !== "string" || !f.label.trim()) {
      res.status(400).json({ message: "La etiqueta es obligatoria." });
      return;
    }
    if (!validarFieldType(f.field_type, res)) return;
    if (f.options !== undefined && f.options !== null && !Array.isArray(f.options)) {
      res.status(400).json({ message: "Las opciones deben ser una lista." });
      return;
    }
    campos.push({
      field_key: f.field_key.trim(),
      label: f.label.trim(),
      field_type: f.field_type,
      section: typeof f.section === "string" ? f.section : "",
      options: f.options ?? null,
      required: Boolean(f.required),
    });
  }

  try {
    if (!(await asegurarForm(formType, res))) return;
    await reemplazarEstructura(
      formType,
      title.trim(),
      secs,
      campos
    );
    res.status(200).json({ message: "Formulario guardado" });
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      res.status(409).json({ message: "Hay identificadores de campo duplicados en el formulario." });
      return;
    }
    console.error("Error al guardar el formulario:", error);
    res.status(500).json({ message: "No se pudo guardar el formulario" });
  }
}

// ----- Envíos -----

// POST /api/v1/forms/:formType/submissions
export async function enviarFormulario(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  const { opportunity_id, data } = req.body ?? {};

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    res.status(400).json({ message: "Los datos del formulario son obligatorios." });
    return;
  }
  if (opportunity_id !== undefined && opportunity_id !== null && typeof opportunity_id !== "string") {
    res.status(400).json({ message: "El identificador de oportunidad es inválido." });
    return;
  }

  try {
    if (!(await asegurarForm(formType, res))) return;
    const envio = await crearEnvio(formType, opportunity_id ?? null, req.user!.userId, data);
    res.status(201).json(envio);
  } catch (error) {
    console.error("Error al guardar el envío del formulario:", error);
    res.status(500).json({ message: "No se pudo guardar el formulario" });
  }
}

// GET /api/v1/forms/:formType/draft
export async function obtenerBorradorHandler(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  try {
    if (!(await asegurarForm(formType, res))) return;
    const data = await obtenerBorrador(formType, req.user!.userId);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Error al obtener el borrador del formulario:", error);
    res.status(500).json({ message: "No se pudo obtener el borrador del formulario" });
  }
}

// PUT /api/v1/forms/:formType/draft
export async function guardarBorradorHandler(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  const { data } = req.body ?? {};

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    res.status(400).json({ message: "Los datos del borrador son obligatorios." });
    return;
  }

  try {
    if (!(await asegurarForm(formType, res))) return;
    await guardarBorrador(formType, req.user!.userId, data);
    res.status(200).json({ message: "Borrador guardado" });
  } catch (error) {
    console.error("Error al guardar el borrador del formulario:", error);
    res.status(500).json({ message: "No se pudo guardar el borrador del formulario" });
  }
}

// DELETE /api/v1/forms/:formType/draft
export async function borrarBorradorHandler(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  try {
    await borrarBorrador(formType, req.user!.userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error al borrar el borrador del formulario:", error);
    res.status(500).json({ message: "No se pudo borrar el borrador del formulario" });
  }
}

// GET /api/v1/forms/:formType/submissions
export async function listarEnvios(req: Request<{ formType: string }>, res: Response) {
  const { formType } = req.params;
  try {
    if (!(await asegurarForm(formType, res))) return;
    const envios = await obtenerEnvios(formType);
    res.status(200).json(envios);
  } catch (error) {
    console.error("Error al obtener los envíos:", error);
    res.status(500).json({ message: "No se pudieron obtener los envíos del formulario" });
  }
}

// PUT /api/v1/forms/:formType/submissions/:id/status
export async function cambiarEstadoEnvio(req: Request<{ formType: string; id: string }>, res: Response) {
  const { formType, id } = req.params;
  const { status, review_notes } = req.body ?? {};
  if (typeof status !== "string" || !(SUBMISSION_STATUSES as readonly string[]).includes(status)) {
    res.status(400).json({ message: `El estado debe ser uno de: ${SUBMISSION_STATUSES.join(", ")}` });
    return;
  }

  try {
    if (!(await asegurarForm(formType, res))) return;
    const actualizado = await actualizarEstadoEnvio(
      id,
      status as (typeof SUBMISSION_STATUSES)[number],
      req.user!.userId,
      typeof review_notes === "string" ? review_notes : null
    );
    if (!actualizado) {
      res.status(404).json({ message: "Envío no encontrado" });
      return;
    }
    res.status(200).json(actualizado);
  } catch (error) {
    console.error("Error al actualizar el estado del envío:", error);
    res.status(500).json({ message: "No se pudo actualizar el estado del envío" });
  }
}
