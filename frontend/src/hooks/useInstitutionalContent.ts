import { loadPublicContent } from '../services/publicLocalization';
import { useEffect, useState } from 'react';
import type { Language } from '../types';
import {
  type InstitutionalContent,
  type InstitutionalSection,
} from '../services/institutional';

/**
 * Contenido publicado de una sección. Mientras carga, o si la API falla,
 * devuelve una lista vacía para que la vista muestre su texto por defecto.
 */
export function useInstitutionalContent(
  section: InstitutionalSection,
  language: Language
) {
  const [items, setItems] = useState<InstitutionalContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);

    void loadPublicContent<InstitutionalContent[]>(
      `/api/v1/institutional/${section}`, language, controller.signal,
      data => { setItems(data); setLoading(false); }
    ).catch((error) => {
      if (!controller.signal.aborted) {
        console.warn(`No se pudo cargar la sección «${section}»:`, error);
        setItems([]);
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [section, language]);

  return { items, loading };
}
