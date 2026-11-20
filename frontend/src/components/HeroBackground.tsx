import { useEffect, useState } from 'react';

interface HeroBackgroundProps {
  images: string[];
  /** Milisegundos entre fotos. */
  interval?: number;
}

/**
 * Fondo fotográfico del hero: fotos de las producciones en fundido cruzado,
 * cubiertas por un velo que mantiene el contraste del texto en claro y oscuro.
 * Sin rotación si la persona prefiere menos movimiento.
 */
export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  images,
  interval = 7000,
}) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % images.length),
      interval
    );

    return () => window.clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {/* Velo: asegura contraste del texto sobre cualquier foto */}
      <div className="absolute inset-0 bg-[#F8F8F2]/85 dark:bg-brand-navyDark/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#F8F8F2] via-transparent to-transparent dark:from-brand-navyDark" />
    </div>
  );
};
