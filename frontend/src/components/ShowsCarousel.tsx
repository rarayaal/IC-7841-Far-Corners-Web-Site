import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language, Show } from '../types';

interface ShowsCarouselProps {
  shows: Show[];
  language: Language;
  /** Acción principal de cada obra: comprar boletos o ver el programa de mano. */
  renderAction: (show: Show) => React.ReactNode;
}

/** Carrusel horizontal: foto destacada de la obra a un lado y su información al otro. */
export const ShowsCarousel: React.FC<ShowsCarouselProps> = ({ shows, language, renderAction }) => {
  const pista = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;

    const alDesplazar = () => setIndice(Math.round(el.scrollLeft / el.clientWidth));

    el.addEventListener('scroll', alDesplazar, { passive: true });
    return () => el.removeEventListener('scroll', alDesplazar);
  }, []);

  const irA = (destino: number) => {
    const el = pista.current;
    if (!el) return;

    const limitado = (destino + shows.length) % shows.length;
    el.scrollTo({ left: limitado * el.clientWidth, behavior: 'smooth' });
  };

  const es = language === 'es';

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carrusel"
      aria-label={es ? 'Obras teatrales' : 'Theatre productions'}
    >
      <div
        ref={pista}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-3xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy shadow-lg dark:shadow-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shows.map((show, i) => (
          <article
            key={show.id}
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} / ${shows.length}`}
            className="w-full shrink-0 snap-center grid grid-cols-1 md:grid-cols-2"
          >
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[360px] bg-slate-100 dark:bg-brand-navyDark">
              <img
                src={show.banner || show.poster}
                alt={show.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/50" />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-white/90 text-brand-navy dark:bg-brand-navyDark/90 dark:text-brand-lime text-xs font-mono font-bold border border-slate-200 dark:border-brand-border shadow-sm">
                {show.year}
              </span>
            </div>

            <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
              <span className="text-xs font-bold text-brand-forest dark:text-brand-lime uppercase tracking-widest">{show.dates}</span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">{show.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-5">
                {es ? show.synopsis : show.synopsisEn}
              </p>
              <div className="pt-2">{renderAction(show)}</div>
            </div>
          </article>
        ))}
      </div>

      {shows.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => irA(indice - 1)}
            aria-label={es ? 'Obra anterior' : 'Previous production'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-brand-navy dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            {shows.map((show, i) => (
              <button
                key={show.id}
                type="button"
                onClick={() => irA(i)}
                aria-label={`${es ? 'Ir a' : 'Go to'} ${show.title}`}
                aria-current={i === indice}
                className="flex h-8 w-6 items-center justify-center"
              >
                <span
                  className={`h-2 rounded-full transition-all ${i === indice ? 'w-6 bg-brand-green' : 'w-2 bg-black/20 dark:bg-white/30'}`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => irA(indice + 1)}
            aria-label={es ? 'Obra siguiente' : 'Next production'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-brand-navy dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
