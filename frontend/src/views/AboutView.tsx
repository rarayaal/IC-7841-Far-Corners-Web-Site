import React, { useState } from 'react';
import { Language, PageView } from '../types';
import { projectsData } from '../data/mockData';
import { Globe, Heart, Users, Lightbulb, Feather } from 'lucide-react';
import { useInstitutionalContent } from '../hooks/useInstitutionalContent';
import { ContentParagraphs } from '../components/ContentParagraphs';
import { getTranslations } from '../lib/i18n';
import {
  GalleryButton,
  GalleryLightbox,
  toGalleryImages,
  type GalleryImage,
} from '../components/GalleryLightbox';
import type { InstitutionalContent } from '../services/institutional';

interface AboutViewProps {
  language: Language;
  setCurrentPage: (page: PageView) => void;
  onOpenDonate: () => void;
}

interface PersonCardData {
  key: string;
  name: string;
  role: string | null;
  bio?: string;
  photo?: GalleryImage;
}

const PersonCard: React.FC<{ person: PersonCardData }> = ({ person }) => (
  <div className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border hover:border-brand-blue/60 transition-all space-y-2">
    {person.photo ? (
      <img
        src={person.photo.url}
        alt={person.photo.alt ?? person.name}
        loading="lazy"
        className="w-16 h-16 rounded-full object-cover border border-brand-green/40"
      />
    ) : (
      <div className="w-16 h-16 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-green flex items-center justify-center font-serif font-bold text-xl border border-brand-green/40">
        {person.name.charAt(0)}
      </div>
    )}
    <h3 className="font-serif text-base font-bold text-brand-navy dark:text-white">{person.name}</h3>
    {person.role && (
      <p className="text-xs text-brand-forest dark:text-brand-lime font-bold">{person.role}</p>
    )}
    {person.bio && (
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
        {person.bio}
      </p>
    )}
  </div>
);

/** Convierte filas de contenido institucional (una por persona) en tarjetas. */
function toPeople(items: InstitutionalContent[]): PersonCardData[] {
  return items.map((item) => ({
    key: item.id,
    name: item.title,
    role: item.subtitle,
    bio: item.content,
    photo: item.images?.[0]
      ? { url: item.images[0].url, alt: item.images[0].alt_text ?? item.title }
      : undefined,
  }));
}

export const AboutView: React.FC<AboutViewProps> = ({
  language,
  setCurrentPage,
}) => {
  const t = getTranslations(language).views.about;
  const es = language === 'es';
  const { items: historyItems } = useInstitutionalContent('history', language);
  const { items: impactItems } = useInstitutionalContent('impact', language);
  const { items: futureItems } = useInstitutionalContent('future', language);
  const { items: boardItems } = useInstitutionalContent('board', language);
  const { items: productionItems } = useInstitutionalContent('production', language);
  const [gallery, setGallery] = useState<{ title: string; images: GalleryImage[] } | null>(null);

  const history = historyItems[0];
  const futureVision = futureItems[0];

  // Las rutas internas del botón (/donate) usan la navegación del sitio; el resto son enlaces.
  const openCta = (target: string) => {
    const page = target.replace(/^\//, '') as PageView;
    if (target.startsWith('/') && ['home', 'about', 'shows', 'participate', 'donate', 'contact'].includes(page)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const brandValues = [
    {
      title: es ? 'Comunidad' : 'Community',
      desc: es
        ? 'Creamos experiencias escénicas que fortalecen el tejido comunitario y celebran la diversidad.'
        : 'We create stage experiences that strengthen the community fabric and celebrate diversity.',
      icon: Users,
    },
    {
      title: es ? 'Creatividad' : 'Creativity',
      desc: es
        ? 'Fomentamos la imaginación y el talento artístico a través del teatro musical.'
        : 'We foster imagination and artistic talent through musical theatre.',
      icon: Lightbulb,
    },
    {
      title: es ? 'Inclusión' : 'Inclusion',
      desc: es
        ? 'No son becas: son oportunidades para participar o ser voluntario sin importar el trasfondo de las personas, y no solo para jóvenes.'
        : 'These are not scholarships: they are opportunities to take part or volunteer regardless of background, and not only for young people.',
      icon: Heart,
    },
    {
      title: es ? 'Expresión' : 'Expression',
      desc: es
        ? 'Abrimos espacios seguros de desarrollo personal, voz propia y confianza escénica.'
        : 'We open safe spaces for personal growth, finding your own voice and stage confidence.',
      icon: Feather,
    },
    {
      title: es ? 'Impacto' : 'Impact',
      desc: es
        ? 'Generamos un impacto que puede impulsar el cambio social en las zonas donde hemos estado, a través del arte.'
        : 'We create an impact that can drive social change in the places where we have worked, through art.',
      icon: Globe,
    },
  ];

  // Respaldo mientras la sección «Junta directiva» del panel no tenga filas publicadas.
  const defaultBoard: PersonCardData[] = [
    { key: 'presidente', name: 'José Pablo Arias', role: es ? 'Presidente' : 'President' },
    { key: 'vicepresidente', name: 'Isaac Matamoros Trejos', role: es ? 'Vicepresidente' : 'Vice President' },
    { key: 'tesorero', name: 'Luis Dario Villalobos Castro', role: es ? 'Tesorero' : 'Treasurer' },
    { key: 'vocal-1', name: 'Stacy Ohrt-Billingslea', role: es ? 'Vocal' : 'Board member' },
    { key: 'vocal-2', name: 'Susu Gray', role: es ? 'Vocal' : 'Board member' },
    { key: 'vocal-3', name: 'Shanae Wise', role: es ? 'Vocal' : 'Board member' },
  ];

  const boardPeople = boardItems.length > 0 ? toPeople(boardItems) : defaultBoard;
  const productionPeople = toPeople(productionItems);

  const openGallery = (title: string, images: GalleryImage[]) => setGallery({ title, images });

  const impactCount = impactItems.length > 0 ? impactItems.length : projectsData.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-lime text-xs font-bold uppercase tracking-wider border border-brand-green/40">
          {t.badge}
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-brand-navy dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
          {t.desc}
        </p>
      </div>

      {/* Main Story */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="border-l-4 border-brand-green pl-4">
            <h2 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
              {history?.title ?? t.originsTitle}
            </h2>
            <p className="text-xs text-brand-forest dark:text-brand-lime font-mono mt-0.5">
              {history?.subtitle ?? (es ? 'Monteverde, Costa Rica • 2005 - Presente' : 'Monteverde, Costa Rica • 2005 - Present')}
            </p>
          </div>

          {history ? (
            <ContentParagraphs text={history.content} />
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {es
                  ? 'Far Corners Community Musical Theatre nació en Monteverde en 2005, con el propósito de brindar oportunidades a nivel global para que la juventud de zonas rurales y de comunidades con pocos recursos también pueda participar en las artes escénicas.'
                  : 'Far Corners Community Musical Theatre was born in Monteverde in 2005 with the goal of offering global opportunities so that youth from rural areas and under-resourced communities can also take part in the performing arts.'}
              </p>

              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {es
                  ? 'La organización cuenta con el apoyo de voluntarios que trabajan en dirección, música, coreografía y producción.'
                  : 'The organization is supported by volunteers who work in directing, music, choreography and production.'}
              </p>
            </>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white dark:bg-brand-navy p-4 rounded-xl border border-slate-200 dark:border-brand-border">
              <span className="font-mono text-2xl font-bold text-brand-green block">100%</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {es ? 'Acceso comunitario libre para participantes locales' : 'Free community access for local participants'}
              </span>
            </div>
            <div className="bg-white dark:bg-brand-navy p-4 rounded-xl border border-slate-200 dark:border-brand-border">
              <span className="font-mono text-2xl font-bold text-brand-blue block">+150</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {es ? 'Pasantes internacionales capacitados' : 'International interns trained'}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-brand-green/50 shadow-2xl group">
            <img
              src={history?.images?.[0]?.url ?? '/recursos/IMG_2904.PNG'}
              alt={history?.images?.[0]?.alt_text ?? 'Ensayo Far Corners'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Brand Essence Values Grid */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl font-bold text-brand-navy dark:text-white">
            {es ? 'Nuestra Esencia & Valores de Marca' : 'Our Essence & Brand Values'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {es
              ? 'Valores institucionales definidos en la Guía de Marca oficial de Far Corners.'
              : 'Institutional values defined in the official Far Corners Brand Guide.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {brandValues.map((val, idx) => {
            const IconComp = val.icon;
            return (
              <div key={idx} className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border hover:border-brand-green transition-all space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-green">
                  <IconComp className="w-5 h-5 text-brand-forest dark:text-brand-lime" />
                </div>
                <h3 className="font-serif text-base font-bold text-brand-navy dark:text-white">{val.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Impact */}
      <div className="bg-white dark:bg-brand-navy rounded-3xl p-8 border border-slate-200 dark:border-brand-border space-y-8">
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <span className="text-xs font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider block">
            {t.geoReach}
          </span>
          <h2 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
            Costa Rica
          </h2>
        </div>

        <div
          className={`grid grid-cols-1 gap-6 ${
            impactCount === 1 ? 'max-w-2xl mx-auto' : 'md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {impactItems.length > 0
            ? impactItems.map((item) => {
                const images = toGalleryImages(
                  item.images?.map((img) => ({ url: img.url, alt: img.alt_text })),
                  item.title
                );

                return (
                  <div key={item.id} className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-serif text-lg font-bold text-brand-navy dark:text-white">{item.title}</span>
                      {item.subtitle && <span className="text-xs font-mono text-brand-green">{item.subtitle}</span>}
                    </div>
                    <ContentParagraphs text={item.content} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed" />

                    {images.length > 0 && (
                      <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {images.slice(0, 3).map((img, i) => (
                            <button
                              key={`${img.url}-${i}`}
                              type="button"
                              onClick={() => openGallery(item.title, images)}
                              aria-label={`${es ? 'Abrir galería' : 'Open gallery'}: ${item.title} ${i + 1}`}
                              className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 dark:border-white/10"
                            >
                              <img src={img.url} alt={img.alt ?? item.title} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />
                            </button>
                          ))}
                        </div>
                        <GalleryButton
                          count={images.length}
                          language={language}
                          onClick={() => openGallery(item.title, images)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            : projectsData.map((p) => {
                const images = toGalleryImages(p.gallery, p.title);
                const title = es ? p.title : p.titleEn;

                return (
                  <div key={p.id} className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-lg font-bold text-brand-navy dark:text-white">{p.country}</span>
                      <span className="text-xs font-mono text-brand-green">{p.year}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{es ? p.summary : p.summaryEn}</p>

                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {p.impactMetrics.map((metric) => (
                        <p key={metric}>• {metric}</p>
                      ))}
                    </div>

                    {images.length > 0 && (
                      <GalleryButton
                        count={images.length}
                        language={language}
                        onClick={() => openGallery(title, images)}
                      />
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* Future Vision */}
      {futureVision && (
        <div className="bg-[#002244] rounded-3xl p-6 sm:p-8 border border-[#77C65E]/40 space-y-4 text-center max-w-4xl mx-auto">
          <span className="text-xs font-bold text-[#DCEB4F] uppercase tracking-wider block">
            {t.futureVision}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">{futureVision.title}</h2>
          {futureVision.subtitle && <p className="text-sm text-[#77C65E] font-bold">{futureVision.subtitle}</p>}
          <div className="space-y-3 text-left">
            <ContentParagraphs text={futureVision.content} />
          </div>
          {futureVision.cta_label && futureVision.cta_target && (
            <button
              type="button"
              onClick={() => openCta(futureVision.cta_target!)}
              className="px-6 py-3 rounded-xl bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-sm font-extrabold transition-colors"
            >
              {futureVision.cta_label}
            </button>
          )}
        </div>
      )}

      {/* Junta directiva */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider block mb-1">
            {es ? 'Liderazgo' : 'Leadership'}
          </span>
          <h2 className="font-serif text-3xl font-bold text-brand-navy dark:text-white">
            {es ? 'Junta Directiva' : 'Board of Directors'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boardPeople.map((person) => (
            <PersonCard key={person.key} person={person} />
          ))}
        </div>
      </div>

      {/* Equipo de producción (aparece cuando hay personas publicadas) */}
      {productionPeople.length > 0 && (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block mb-1">
              {es ? 'Detrás del escenario' : 'Behind the stage'}
            </span>
            <h2 className="font-serif text-3xl font-bold text-brand-navy dark:text-white">
              {es ? 'Equipo de Producción' : 'Production Team'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productionPeople.map((person) => (
              <PersonCard key={person.key} person={person} />
            ))}
          </div>
        </div>
      )}

      {gallery && (
        <GalleryLightbox
          title={gallery.title}
          images={gallery.images}
          language={language}
          onClose={() => setGallery(null)}
        />
      )}
    </div>
  );
};
