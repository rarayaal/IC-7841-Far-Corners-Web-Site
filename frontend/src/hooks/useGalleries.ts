import { useCallback, useEffect, useState } from 'react';
import type { GalleryImage } from '../components/GalleryLightbox';
import { fetchInstitutionalContent } from '../services/institutional';

/**
 * Galerías de obras y proyectos publicadas desde el panel (sección «gallery»,
 * fotos en R2). `galleryFor(id, respaldo)` devuelve las fotos del bucket si
 * existen; si no, las fotos locales de respaldo.
 */
export function useGalleries() {
  const [byId, setById] = useState<Record<string, GalleryImage[]>>({});

  useEffect(() => {
    const controller = new AbortController();

    Promise.all(
      (['es', 'en'] as const).map((lang) =>
        fetchInstitutionalContent('gallery', lang, controller.signal).catch(() => [])
      )
    ).then((listas) => {
      const mapa: Record<string, GalleryImage[]> = {};

      for (const item of listas.flat()) {
        const imagenes = (item.images ?? []).map((img) => ({
          url: img.url,
          alt: img.alt_text || item.title,
        }));

        if (imagenes.length > 0 && !mapa[item.page_slug]) {
          mapa[item.page_slug] = imagenes;
        }
      }

      if (!controller.signal.aborted) setById(mapa);
    });

    return () => controller.abort();
  }, []);

  const galleryFor = useCallback(
    (id: string, respaldo?: string[]): (string | GalleryImage)[] =>
      byId[id] ?? respaldo ?? [],
    [byId]
  );

  return { galleryFor };
}
