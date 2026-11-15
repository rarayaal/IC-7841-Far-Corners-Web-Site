import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import type { Language } from '../types';

export interface GalleryImage {
  url: string;
  alt?: string | null;
}

/** Normaliza una lista de URLs o de imágenes con texto alternativo. */
export function toGalleryImages(
  items: (string | GalleryImage)[] | undefined,
  fallbackAlt: string
): GalleryImage[] {
  return (items ?? [])
    .map((item) => (typeof item === 'string' ? { url: item } : item))
    .filter((item) => Boolean(item.url))
    .map((item) => ({ url: item.url, alt: item.alt || fallbackAlt }));
}

interface GalleryButtonProps {
  count: number;
  language: Language;
  onClick: () => void;
  className?: string;
}

/** Botón compacto «Galería (n)» que abre el visor. No se muestra sin imágenes. */
export const GalleryButton: React.FC<GalleryButtonProps> = ({
  count,
  language,
  onClick,
  className = '',
}) => {
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-blue/60 bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-blue shadow-sm backdrop-blur transition-colors hover:text-brand-navy dark:bg-brand-navyDark/90 dark:hover:text-white ${className}`}
    >
      <Images className="h-3.5 w-3.5" aria-hidden="true" />
      {language === 'es' ? 'Galería' : 'Gallery'} ({count})
    </button>
  );
};

interface GalleryLightboxProps {
  title: string;
  images: GalleryImage[];
  language: Language;
  startIndex?: number;
  onClose: () => void;
}

/** Visor de galería: navegación con flechas, teclado (← → Esc) y miniaturas. */
export const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  title,
  images,
  language,
  startIndex = 0,
  onClose,
}) => {
  const [index, setIndex] = useState(startIndex);
  const es = language === 'es';

  const go = useCallback(
    (delta: number) =>
      setIndex((current) => (current + delta + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (images.length === 0) return null;

  const current = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${es ? 'Galería' : 'Gallery'}: ${title}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-3 backdrop-blur-md sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-white">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-lg font-bold sm:text-xl">{title}</h3>
          <p className="text-xs text-slate-300">
            {index + 1} / {images.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={es ? 'Cerrar galería' : 'Close gallery'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt={current.alt ?? title}
          className="max-h-full max-w-full rounded-xl object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={es ? 'Imagen anterior' : 'Previous image'}
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:left-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={es ? 'Imagen siguiente' : 'Next image'}
              className="absolute right-0 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:right-2"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="mt-3 flex justify-start gap-2 overflow-x-auto pb-1 sm:justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${es ? 'Ver imagen' : 'View image'} ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === index ? 'border-brand-green' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
