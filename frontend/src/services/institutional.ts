import type { Language } from '../types';

export type InstitutionalSection =
  | 'history'
  | 'impact'
  | 'future'
  | 'footer'
  | 'board'
  | 'production';

/** Secciones donde cada fila es una persona (nombre, cargo, biografía y foto). */
export const PEOPLE_SECTIONS: InstitutionalSection[] = ['board', 'production'];

export interface InstitutionalContent {
  id: string;
  page_slug: string;
  section: InstitutionalSection;
  language: Language;
  title: string;
  subtitle: string | null;
  content: string;
  cta_label: string | null;
  cta_target: string | null;
  display_order: number;
  is_published: boolean;
  updated_at: string;
  /** Imágenes de la galería asociadas (solo en la lectura pública). */
  images?: { id: string; url: string; alt_text: string | null }[];
}

/** Alcances de contenido: page_slug 'about' es general; el impacto se separa por país. */
export const SCOPES_BY_SECTION: Record<InstitutionalSection, string[]> = {
  history: ['about'],
  impact: ['about', 'impact-cr', 'impact-cn', 'impact-mz'],
  future: ['about'],
  footer: ['footer'],
  // Una fila por persona: el identificador (page_slug) lo escribe el administrador.
  board: [],
  production: [],
};

/** Lee el contenido publicado de una sección (sin sesión). */
export async function fetchInstitutionalContent(
  section: InstitutionalSection,
  language: Language,
  signal?: AbortSignal
): Promise<InstitutionalContent[]> {
  const respuesta = await fetch(
    `/api/v1/institutional/${section}?lang=${language}`,
    { signal }
  );

  if (!respuesta.ok) {
    throw new Error('No se pudo cargar el contenido institucional.');
  }

  const datos: unknown = await respuesta.json();

  if (!Array.isArray(datos)) {
    throw new Error('La API no devolvió una lista de contenido.');
  }

  return datos as InstitutionalContent[];
}
