import { pool } from "../db.js";

export const FIELD_TYPES = [
  "text",
  "email",
  "date",
  "datetime",
  "textarea",
  "select",
  "radio",
  "checkbox",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const SUBMISSION_STATUSES = ["pending", "reviewed", "approved", "rejected"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export interface FormFieldRow {
  id: string;
  form_type: string;
  section: string;
  field_key: string;
  label: string;
  field_type: string;
  options: unknown;
  required: boolean;
  display_order: number;
}

export interface NuevoCampo {
  section: string;
  field_key: string;
  label: string;
  field_type: string;
  options?: unknown;
  required?: boolean;
  display_order?: number;
}

export interface FormRow {
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  category: string | null;
  period: string | null;
  period_en: string | null;
  requirements: unknown;
  is_published: boolean;
  is_featured: boolean;
  image_url: string | null;
  field_count: number;
  submission_count: number;
}

// Ficha pública: lo que ve un visitante en "Programas y Comunidad".
export interface FormPublicoRow {
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  category: string | null;
  period: string | null;
  period_en: string | null;
  requirements: unknown;
  is_featured: boolean;
  image_url: string | null;
}

const COLUMNAS_FICHA = `slug, title, title_en, description, description_en,
  category, period, period_en, requirements, is_published, is_featured, image_url`;

export async function listarForms(): Promise<FormRow[]> {
  const result = await pool.query(
    `SELECT f.slug, f.title, f.title_en, f.description, f.description_en,
            f.category, f.period, f.period_en, f.requirements, f.is_published, f.is_featured,
            f.image_url,
            (SELECT COUNT(*)::int FROM form_fields ff WHERE ff.form_type = f.slug) AS field_count,
            (SELECT COUNT(*)::int FROM form_submissions fs WHERE fs.form_type = f.slug) AS submission_count
       FROM forms f
      ORDER BY f.title ASC`
  );
  return result.rows;
}

export async function listarFormsPublicados(): Promise<FormPublicoRow[]> {
  const result = await pool.query(
    `SELECT slug, title, title_en, description, description_en,
            category, period, period_en, requirements, is_featured, image_url
       FROM forms
      WHERE is_published = TRUE
      ORDER BY is_featured DESC, created_at ASC, slug ASC`
  );
  return result.rows;
}

export const CAMPOS_FICHA = [
  "title",
  "title_en",
  "description",
  "description_en",
  "category",
  "period",
  "period_en",
  "requirements",
  "is_published",
  "is_featured",
  "image_url",
] as const;
export type CampoFicha = (typeof CAMPOS_FICHA)[number];

// Actualiza solo los campos de la ficha pública que vengan en el cuerpo
// (permite publicar/ocultar desde la lista sin tocar el resto de la ficha).
export async function actualizarFichaForm(
  slug: string,
  cambios: Partial<Record<CampoFicha, unknown>>
): Promise<FormRow | undefined> {
  const asignaciones: string[] = [];
  const valores: unknown[] = [slug];

  for (const campo of CAMPOS_FICHA) {
    if (!(campo in cambios)) continue;
    valores.push(campo === "requirements" && cambios[campo] != null ? JSON.stringify(cambios[campo]) : cambios[campo]);
    asignaciones.push(`${campo} = $${valores.length}`);
  }

  if (asignaciones.length === 0) {
    const result = await pool.query(
      `SELECT ${COLUMNAS_FICHA},
              (SELECT COUNT(*)::int FROM form_fields ff WHERE ff.form_type = f.slug) AS field_count,
              (SELECT COUNT(*)::int FROM form_submissions fs WHERE fs.form_type = f.slug) AS submission_count
         FROM forms f WHERE slug = $1`,
      [slug]
    );
    return result.rows[0];
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Un solo formulario destacado a la vez: al marcar uno se desmarcan los demás.
    if (cambios.is_featured === true) {
      await client.query(
        "UPDATE forms SET is_featured = FALSE WHERE is_featured = TRUE AND slug <> $1",
        [slug]
      );
    }
    const result = await client.query(
      `UPDATE forms
          SET ${asignaciones.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE slug = $1
        RETURNING ${COLUMNAS_FICHA}`,
      valores
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Copia un formulario (ficha pública + secciones + preguntas) en uno nuevo,
// oculto por defecto para que el admin lo revise antes de publicarlo.
export async function duplicarForm(
  slug: string,
  nuevoSlug: string,
  nuevoTitulo: string
): Promise<{ slug: string; title: string; is_published: boolean } | undefined> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const copia = await client.query(
      `INSERT INTO forms (slug, title, title_en, description, description_en,
                          category, period, period_en, requirements, image_url,
                          sections, is_published)
       SELECT $2, $3, title_en, description, description_en,
              category, period, period_en, requirements, image_url, sections, FALSE
         FROM forms WHERE slug = $1
       RETURNING slug, title, is_published`,
      [slug, nuevoSlug, nuevoTitulo]
    );
    if (!copia.rows[0]) {
      await client.query("ROLLBACK");
      return undefined;
    }
    await client.query(
      `INSERT INTO form_fields (form_type, section, field_key, label, field_type, options, required, display_order)
       SELECT $2, section, field_key, label, field_type, options, required, display_order
         FROM form_fields WHERE form_type = $1`,
      [slug, nuevoSlug]
    );
    await client.query("COMMIT");
    return copia.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function obtenerForm(slug: string): Promise<{ slug: string; title: string } | undefined> {
  const result = await pool.query(
    `SELECT slug, title FROM forms WHERE slug = $1`,
    [slug]
  );
  return result.rows[0];
}

export async function crearForm(slug: string, title: string): Promise<{ slug: string; title: string }> {
  const result = await pool.query(
    `INSERT INTO forms (slug, title)
     VALUES ($1, $2)
     RETURNING slug, title`,
    [slug, title]
  );
  return result.rows[0];
}

export async function eliminarForm(slug: string): Promise<{ slug: string } | undefined> {
  const result = await pool.query(`DELETE FROM forms WHERE slug = $1 RETURNING slug`, [slug]);
  return result.rows[0];
}

export interface CampoEstructura {
  field_key: string;
  label: string;
  field_type: string;
  section: string;
  options?: unknown;
  required: boolean;
}

export interface SeccionEstructura {
  name: string;
  description: string | null;
  orphan: boolean;
}

// Reemplaza por completo la estructura del formulario (título, secciones y campos)
// en una sola transacción. Cada envío guarda una copia de la estructura con la que
// fue completado, así que recrear los campos no altera los envíos anteriores.
export async function reemplazarEstructura(
  form_type: string,
  title: string,
  secciones: SeccionEstructura[],
  campos: CampoEstructura[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE forms SET title = $2, sections = $3, updated_at = CURRENT_TIMESTAMP WHERE slug = $1`,
      [form_type, title, JSON.stringify(secciones)]
    );
    await client.query(`DELETE FROM form_fields WHERE form_type = $1`, [form_type]);
    for (let i = 0; i < campos.length; i += 1) {
      const c = campos[i];
      await client.query(
        `INSERT INTO form_fields (form_type, section, field_key, label, field_type, options, required, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          form_type,
          c.section,
          c.field_key,
          c.label,
          c.field_type,
          c.options != null ? JSON.stringify(c.options) : null,
          c.required,
          i + 1,
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function obtenerCampos(form_type: string): Promise<FormFieldRow[]> {
  const result = await pool.query(
    `SELECT id, form_type, section, field_key, label, field_type, options, required, display_order
       FROM form_fields
      WHERE form_type = $1
      ORDER BY display_order ASC, field_key ASC`,
    [form_type]
  );
  return result.rows;
}

export async function obtenerSecciones(form_type: string): Promise<SeccionEstructura[]> {
  const result = await pool.query(`SELECT sections FROM forms WHERE slug = $1`, [form_type]);
  const raw = result.rows[0]?.sections;
  if (Array.isArray(raw)) {
    return raw.map((s) => ({
      name: typeof s?.name === "string" ? s.name : "",
      description: typeof s?.description === "string" ? s.description : null,
      orphan: Boolean(s?.orphan),
    }));
  }
  return [];
}

// Guarda el envío junto con una copia de la estructura vigente del formulario
// (título, secciones y campos). Así el envío conserva el formato con el que fue
// completado aunque un admin modifique o elimine campos después.
export async function crearEnvio(
  form_type: string,
  opportunity_id: string | null,
  user_id: string,
  data: unknown
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const formResult = await client.query<{ title: string; sections: unknown }>(
      `SELECT title, sections FROM forms WHERE slug = $1`,
      [form_type]
    );
    const camposResult = await client.query(
      `SELECT field_key, label, field_type, section, options, required
         FROM form_fields
        WHERE form_type = $1
        ORDER BY display_order ASC, field_key ASC`,
      [form_type]
    );
    const snapshot = {
      title: formResult.rows[0]?.title ?? form_type,
      sections: formResult.rows[0]?.sections ?? [],
      fields: camposResult.rows,
    };
    const result = await client.query(
      `INSERT INTO form_submissions (form_type, opportunity_id, user_id, data, form_snapshot)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, form_type, opportunity_id, user_id, data, form_snapshot, status, created_at`,
      [form_type, opportunity_id, user_id, JSON.stringify(data), JSON.stringify(snapshot)]
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function guardarBorrador(form_type: string, user_id: string, data: unknown): Promise<void> {
  await pool.query(
    `INSERT INTO form_drafts (form_type, user_id, data, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (form_type, user_id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
    [form_type, user_id, JSON.stringify(data)]
  );
}

export async function obtenerBorrador(form_type: string, user_id: string): Promise<unknown | null> {
  const result = await pool.query(
    `SELECT data FROM form_drafts WHERE form_type = $1 AND user_id = $2`,
    [form_type, user_id]
  );
  return result.rows[0]?.data ?? null;
}

export async function borrarBorrador(form_type: string, user_id: string): Promise<void> {
  await pool.query(`DELETE FROM form_drafts WHERE form_type = $1 AND user_id = $2`, [form_type, user_id]);
}

// Los borradores caducan: se descartan los que llevan demasiado tiempo sin
// editarse para que la tabla no crezca indefinidamente.
export async function eliminarBorradoresAntiguos(dias: number): Promise<number> {
  const result = await pool.query(
    `DELETE FROM form_drafts WHERE updated_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [dias]
  );
  return result.rowCount ?? 0;
}

export async function obtenerEnvios(form_type: string) {
  const result = await pool.query(
    `SELECT fs.id, fs.form_type, fs.opportunity_id, fs.user_id, fs.data, fs.form_snapshot, fs.status,
            fs.reviewed_by, fs.reviewed_at, fs.review_notes, fs.created_at, fs.updated_at,
            u.full_name AS user_name, u.email AS user_email,
            r.full_name AS reviewed_by_name
       FROM form_submissions fs
       JOIN users u ON u.id = fs.user_id
       LEFT JOIN users r ON r.id = fs.reviewed_by
      WHERE fs.form_type = $1
      ORDER BY fs.created_at DESC`,
    [form_type]
  );
  return result.rows;
}

export async function obtenerTodosEnvios() {
  const result = await pool.query(
    `SELECT fs.id, fs.form_type, fs.opportunity_id, fs.user_id, fs.data, fs.form_snapshot, fs.status,
            fs.reviewed_by, fs.reviewed_at, fs.review_notes, fs.created_at, fs.updated_at,
            u.full_name AS user_name, u.email AS user_email,
            r.full_name AS reviewed_by_name,
            f.title AS form_title
       FROM form_submissions fs
       JOIN forms f ON f.slug = fs.form_type
       JOIN users u ON u.id = fs.user_id
       LEFT JOIN users r ON r.id = fs.reviewed_by
      ORDER BY fs.created_at DESC`
  );
  return result.rows;
}

export async function actualizarEstadoEnvio(
  id: string,
  status: SubmissionStatus,
  reviewed_by: string | null,
  review_notes?: string | null
) {
  const result = await pool.query(
    `UPDATE form_submissions
        SET status = $2,
            reviewed_by = $3,
            reviewed_at = CURRENT_TIMESTAMP,
            review_notes = COALESCE($4, review_notes),
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, form_type, user_id, status, reviewed_by, reviewed_at, review_notes, updated_at`,
    [id, status, reviewed_by, review_notes ?? null]
  );
  return result.rows[0];
}
