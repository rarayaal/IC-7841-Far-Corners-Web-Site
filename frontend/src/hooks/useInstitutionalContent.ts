import { useEffect, useState } from 'react';
import type { Language } from '../types';
import {
  fetchInstitutionalContent,
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

    fetchInstitutionalContent(section, language, controller.signal)
      .then(setItems)
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [section, language]);

  return { items, loading };
}
