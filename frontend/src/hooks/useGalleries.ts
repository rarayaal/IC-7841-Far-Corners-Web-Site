import { useCallback, useEffect, useState } from 'react';
import type { GalleryImage } from '../components/GalleryLightbox';
import { fetchInstitutionalContent } from '../services/institutional';

function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

  // Una galería se enlaza por el id de la obra/proyecto o por su nombre
  // («The Addams Family» -> the-addams-family), lo que resulte más cómodo.
  const galleryFor = useCallback(
    (id: string, respaldo?: string[], titulo?: string): (string | GalleryImage)[] =>
      byId[id] ?? (titulo ? byId[slugify(titulo)] : undefined) ?? respaldo ?? [],
    [byId]
  );

  return { galleryFor };
}
