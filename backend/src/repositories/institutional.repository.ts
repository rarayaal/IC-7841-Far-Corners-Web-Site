import { pool } from '../db.js';
import { registrarAuditoria } from './audit.repository.js';
import { urlVigente } from '../services/storage.service.js';

// CU-01 historia, CU-02 impacto y CU-03 visión de futuro comparten la tabla
// institutional_content y se distinguen por la columna section. También se
// administran aquí el pie de página (footer), la junta directiva (board) y el
// equipo de producción (production): una fila por persona (title = nombre,
// subtitle = cargo, content = biografía, imágenes = foto).
export const SECCIONES_INSTITUCIONALES = [
  'history',
  'impact',
  'future',
  'footer',
  'board',
  'production',
  'gallery',
] as const;

export type SeccionInstitucional = (typeof SECCIONES_INSTITUCIONALES)[number];

export const IDIOMAS_INSTITUCIONALES = ['es', 'en'] as const;

export type IdiomaInstitucional = (typeof IDIOMAS_INSTITUCIONALES)[number];

export interface DatosContenidoInstitucional {
  page_slug: string;
  language: IdiomaInstitucional;
  title: string;
  subtitle: string | null;
  subtitle_en?: string | null;
  content: string;
  content_en?: string | null;
  image_url?: string | null;
  cta_label: string | null;
  cta_target: string | null;
  display_order: number;
  is_published: boolean;
}

const COLUMNAS = `
  id,
  page_slug,
  section,
  language,
  title,
  subtitle,
  subtitle_en,
  content,
  content_en,
  image_url,
  cta_label,
  cta_target,
  display_order,
  is_published,
  updated_at
`;

let institutionalColumnsEnsured = false;
async function ensureInstitutionalColumns() {
  if (institutionalColumnsEnsured) return;
  try {
    // 1. Asegurar que el constraint de sección permita 'board' y 'production'
    await pool.query(`
      ALTER TABLE institutional_content DROP CONSTRAINT IF EXISTS institutional_content_section_check;
      ALTER TABLE institutional_content ADD CONSTRAINT institutional_content_section_check CHECK (section IN (
        'history', 'impact', 'future', 'students', 'volunteers',
        'internships', 'communities', 'donations', 'contact',
        'hero', 'intro', 'cta', 'camp', 'values', 'team', 'schedule',
        'payment_instructions', 'footer', 'board', 'production', 'gallery'
      ));
    `).catch(() => {});

    // 2. Asegurar columnas adicionales
    await pool.query(`
      ALTER TABLE institutional_content ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE institutional_content ADD COLUMN IF NOT EXISTS content_en TEXT;
      ALTER TABLE institutional_content ADD COLUMN IF NOT EXISTS subtitle_en TEXT;
    `).catch(() => {});

    // 3. Asegurar usuario base para la llave foránea updated_by
    await pool.query(`
      INSERT INTO users (
        id, full_name, email, password_hash, role, status
      ) VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Administrador General Far Corners',
        'admin@farcornerscr.org',
        '$2b$12$tCIZuiLE8m5WKsu39TJdmeLliZmMWnPDsuQXo8aevwtW98XgtOFOW',
        'admin',
        'active'
      ) ON CONFLICT (email) DO NOTHING;
    `).catch(() => {});

    // 4. Sembrado automático de Junta Directiva inicial si la sección está vacía
    await pool.query(`
      INSERT INTO institutional_content (
        page_slug, section, language, title, subtitle, subtitle_en, content, content_en, image_url, display_order, is_published, updated_by
      )
      SELECT
        v.slug, 'board', 'es', v.title, v.subtitle, v.subtitle_en, v.content, v.content_en, v.img, v.ord, TRUE,
        COALESCE((SELECT id FROM users WHERE role = 'admin' LIMIT 1), (SELECT id FROM users LIMIT 1), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
      FROM (VALUES
        ('jose-pablo-arias', 'José Pablo Arias Mora', 'Presidente', 'President', 'Líder comunitario y gestor cultural con amplia trayectoria en el desarrollo del teatro musical y proyectos comunitarios en Monteverde.', 'Community leader and cultural manager with extensive experience developing musical theatre and community initiatives in Monteverde.', '/recursos/IMG_2908.PNG', 1),
        ('isaac-matamoros', 'Isaac Matamoros Trejos', 'Vicepresidente', 'Vice President', 'Comprometido con la formación artística de jóvenes y el fortalecimiento de la educación escénica accesible.', 'Dedicated to artistic youth development and strengthening accessible performing arts education.', '/recursos/IMG_2909.PNG', 2),
        ('luis-dario-villalobos', 'Luis Dario Villalobos Castro', 'Tesorero', 'Treasurer', 'Especialista en administración financiera y gestión de fondos transparentes para organizaciones sin fines de lucro.', 'Specialist in financial administration and transparent non-profit fund management.', '/recursos/IMG_2910.PNG', 3),
        ('stacy-ohrt', 'Stacy Ohrt-Billingslea', 'Vocal', 'Board member', 'Impulsora de vínculos internacionales y programas de intercambio para jóvenes talentos escénicos.', 'Promoter of international partnerships and exchange programs for young stage talent.', '/recursos/IMG_2911.PNG', 4),
        ('susu-gray', 'Susu Gray', 'Vocal', 'Board member', 'Promotora de las artes escénicas en comunidades rurales y conservación de la memoria histórica comunitaria.', 'Advocate for performing arts in rural communities and community historic preservation.', '/recursos/IMG_2912.PNG', 5),
        ('shanae-wise', 'Shanae Wise', 'Vocal', 'Board member', 'Gestora de voluntariado, alianzas con centros educativos y proyectos de inclusión comunitaria.', 'Coordinator of volunteering, educational partnerships, and community inclusion initiatives.', '/recursos/IMG_2913.PNG', 6)
      ) AS v(slug, title, subtitle, subtitle_en, content, content_en, img, ord)
      WHERE NOT EXISTS (SELECT 1 FROM institutional_content WHERE section = 'board');

      -- Sembrado automático de Equipo de Producción si está vacío
      INSERT INTO institutional_content (
        page_slug, section, language, title, subtitle, subtitle_en, content, content_en, image_url, display_order, is_published, updated_by
      )
      SELECT
        v.slug, 'production', 'es', v.title, v.subtitle, v.subtitle_en, v.content, v.content_en, v.img, v.ord, TRUE,
        COALESCE((SELECT id FROM users WHERE role = 'admin' LIMIT 1), (SELECT id FROM users LIMIT 1), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
      FROM (VALUES
        ('direccion-general', 'Dirección Escénica', 'Dirección general', 'General direction', 'Liderazgo artístico, conceptualización de montajes y guía interpretativa para el elenco comunitario.', 'Artistic leadership, show conceptualization, and performance guidance for the community cast.', '/recursos/IMG_2914.PNG', 1),
        ('direccion-musical', 'Dirección Musical', 'Dirección musical', 'Music direction', 'Preparación vocal, ensamble coral y coordinación de instrumentación en vivo para las temporadas.', 'Vocal coaching, choral arrangement, and live orchestration coordination for our production seasons.', '/recursos/IMG_2916.PNG', 2),
        ('coreografia', 'Coreografía y Danza', 'Coreografía', 'Choreography', 'Diseño de rutinas de baile adaptadas a todas las edades y niveles de experiencia escénica.', 'Designing dance routines tailored to all age groups and experience levels.', '/recursos/IMG_2917.PNG', 3),
        ('produccion-tecnica', 'Producción Técnica', 'Producción técnica y escenografía', 'Technical production & stage design', 'Iluminación, diseño sonoro, escenografía e infraestructura teatral comunitaria.', 'Lighting, sound design, set construction, and theatre technical infrastructure.', '/recursos/IMG_2918.PNG', 4)
      ) AS v(slug, title, subtitle, subtitle_en, content, content_en, img, ord)
      WHERE NOT EXISTS (SELECT 1 FROM institutional_content WHERE section = 'production');

      -- Sembrado inicial de Historia si la sección está completamente vacía
      INSERT INTO institutional_content (
        page_slug, section, language, title, subtitle, content, display_order, is_published, updated_by
      )
      SELECT
        'about', 'history', 'es', 'Nuestra Historia y Misión', 'Dos décadas de arte, comunidad y transformación social',
        'Far Corners Community Musical Theatre nació como un proyecto comunitario enfocado en unir culturas y personas a través de las artes escénicas. Desde nuestras primeras producciones en Monteverde, hemos brindado oportunidades a cientos de jóvenes y adultos para descubrir su talento, aprender inglés y crear vínculos para toda la vida.',
        1, TRUE,
        COALESCE((SELECT id FROM users WHERE role = 'admin' LIMIT 1), (SELECT id FROM users LIMIT 1), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid)
      WHERE NOT EXISTS (SELECT 1 FROM institutional_content WHERE section = 'history');
    `);
    institutionalColumnsEnsured = true;
  } catch (err) {
    console.error('[institutional.repository] ensureInstitutionalColumns error:', err);
  }
}

// Imágenes asociadas al contenido (galería, CU-22), listas para mostrarse.
const IMAGENES_PUBLICAS = `
  COALESCE((
    SELECT json_agg(
      json_build_object('id', m.id, 'url', m.url, 'key', m.storage_key, 'alt_text', m.alt_text)
      ORDER BY m.uploaded_at, m.id
    )
    FROM media m
    WHERE m.content_id = institutional_content.id
      AND m.mime_type LIKE 'image/%'
      AND m.is_published
  ), '[]'::json) AS images
`;

// Calcula la URL de cada imagen con el dominio vigente y no expone la llave interna.
function conImagenesVigentes<T extends { images?: unknown }>(fila: T) {
  if (!Array.isArray(fila.images)) return fila;

  const images = fila.images.map(
    (img: { id: string; url: string; key?: string | null; alt_text: string | null }) => ({
      id: img.id,
      url: urlVigente(img.url, img.key),
      alt_text: img.alt_text,
    })
  );

  return { ...fila, images };
}

// Devuelve el contenido publicado de una sección. Si una página no tiene
// traducción al idioma pedido se usa la otra versión publicada.
export async function obtenerContenidoPublicado(
  section: SeccionInstitucional,
  language: IdiomaInstitucional
) {
  await ensureInstitutionalColumns();
  const resultado = await pool.query(
    `
      SELECT DISTINCT ON (page_slug) ${COLUMNAS}, ${IMAGENES_PUBLICAS}
      FROM institutional_content
      WHERE section = $1
        AND is_published = TRUE
        AND language IN ('es', 'en')
      ORDER BY page_slug, (language = $2) DESC
    `,
    [section, language]
  );

  return resultado.rows
    .map(conImagenesVigentes)
    .sort(
      (a, b) =>
        a.display_order - b.display_order ||
        a.page_slug.localeCompare(b.page_slug)
    );
}

export async function obtenerContenidoAdmin(section: SeccionInstitucional) {
  await ensureInstitutionalColumns();
  const resultado = await pool.query(
    `
      SELECT ${COLUMNAS}
      FROM institutional_content
      WHERE section = $1
      ORDER BY display_order ASC, page_slug ASC, language ASC
    `,
    [section]
  );

  return resultado.rows;
}

export async function crearContenido(
  section: SeccionInstitucional,
  datos: DatosContenidoInstitucional,
  userId: string,
  ip: string | null
) {
  await ensureInstitutionalColumns();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await client.query(
      `
        INSERT INTO institutional_content (
          page_slug, section, language, title, subtitle, subtitle_en, content, content_en, image_url,
          cta_label, cta_target, display_order, is_published, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING ${COLUMNAS}
      `,
      [
        datos.page_slug,
        section,
        datos.language,
        datos.title,
        datos.subtitle,
        datos.subtitle_en || null,
        datos.content,
        datos.content_en || null,
        datos.image_url || null,
        datos.cta_label,
        datos.cta_target,
        datos.display_order,
        datos.is_published,
        userId,
      ]
    );

    const creado = resultado.rows[0];

    await registrarAuditoria(client, {
      userId,
      action: 'create',
      tableName: 'institutional_content',
      recordId: creado.id,
      newValues: creado,
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return creado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarContenido(
  id: string,
  section: SeccionInstitucional,
  datos: DatosContenidoInstitucional,
  userId: string,
  ip: string | null
) {
  await ensureInstitutionalColumns();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const anterior = await client.query(
      `
        SELECT ${COLUMNAS}
        FROM institutional_content
        WHERE id = $1 AND section = $2
        FOR UPDATE
      `,
      [id, section]
    );

    if (anterior.rowCount === 0) {
      await client.query('ROLLBACK');
      return undefined;
    }

    const resultado = await client.query(
      `
        UPDATE institutional_content
        SET
          page_slug = $3,
          language = $4,
          title = $5,
          subtitle = $6,
          subtitle_en = $7,
          content = $8,
          content_en = $9,
          image_url = $10,
          cta_label = $11,
          cta_target = $12,
          display_order = $13,
          is_published = $14,
          updated_by = $15
        WHERE id = $1 AND section = $2
        RETURNING ${COLUMNAS}
      `,
      [
        id,
        section,
        datos.page_slug,
        datos.language,
        datos.title,
        datos.subtitle,
        datos.subtitle_en || null,
        datos.content,
        datos.content_en || null,
        datos.image_url || null,
        datos.cta_label,
        datos.cta_target,
        datos.display_order,
        datos.is_published,
        userId,
      ]
    );

    const actualizado = resultado.rows[0];

    // Propagar image_url a todas las versiones de idioma de este slug en la sección
    if (datos.image_url !== undefined) {
      await client.query(
        `
          UPDATE institutional_content
          SET image_url = $1
          WHERE page_slug = $2 AND section = $3 AND id != $4
        `,
        [datos.image_url || null, datos.page_slug, section, id]
      );
    }

    await registrarAuditoria(client, {
      userId,
      action: 'update',
      tableName: 'institutional_content',
      recordId: id,
      oldValues: anterior.rows[0],
      newValues: actualizado,
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return actualizado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Eliminación definitiva (CU-01/02/03). El retiro lógico es el CU-24.
export async function eliminarContenido(
  id: string,
  section: SeccionInstitucional,
  userId: string,
  ip: string | null
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await client.query(
      `
        DELETE FROM institutional_content
        WHERE id = $1 AND section = $2
        RETURNING ${COLUMNAS}
      `,
      [id, section]
    );

    if (resultado.rowCount === 0) {
      await client.query('ROLLBACK');
      return undefined;
    }

    await registrarAuditoria(client, {
      userId,
      action: 'delete',
      tableName: 'institutional_content',
      recordId: id,
      oldValues: resultado.rows[0],
      ipAddress: ip,
    });

    await client.query('COMMIT');

    return resultado.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
