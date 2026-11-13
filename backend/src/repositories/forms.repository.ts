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
  field_count: number;
  submission_count: number;
}

export async function listarForms(): Promise<FormRow[]> {
  const result = await pool.query(
    `SELECT f.slug, f.title,
            (SELECT COUNT(*)::int FROM form_fields ff WHERE ff.form_type = f.slug) AS field_count,
            (SELECT COUNT(*)::int FROM form_submissions fs WHERE fs.form_type = f.slug) AS submission_count
       FROM forms f
      ORDER BY f.title ASC`
  );
  return result.rows;
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
// en una sola transacción. Los envíos se referencian por field_key, no por el id del
// campo, así que recrear los campos es seguro.
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

export async function crearEnvio(
  form_type: string,
  opportunity_id: string | null,
  user_id: string,
  data: unknown
) {
  const result = await pool.query(
    `INSERT INTO form_submissions (form_type, opportunity_id, user_id, data)
     VALUES ($1, $2, $3, $4)
     RETURNING id, form_type, opportunity_id, user_id, data, status, created_at`,
    [form_type, opportunity_id, user_id, JSON.stringify(data)]
  );
  return result.rows[0];
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

export async function obtenerEnvios(form_type: string) {
  const result = await pool.query(
    `SELECT fs.id, fs.form_type, fs.opportunity_id, fs.user_id, fs.data, fs.status,
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
