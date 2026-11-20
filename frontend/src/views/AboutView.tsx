import React, { useState, useEffect } from 'react';
import { usePublicProjects } from '../hooks/usePublicProjects';
import { Language, PageView } from '../types';
import { Globe, Heart, Users, Lightbulb, Feather, X } from 'lucide-react';
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

const PersonCard: React.FC<{
  person: PersonCardData;
  language: Language;
  onSelect: (person: PersonCardData) => void;
}> = ({ person, language, onSelect }) => {
  const es = language === 'es';
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [person.key, person.photo?.url]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(person)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(person);
        }
      }}
      className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border hover:border-brand-green hover:shadow-lg transition-all space-y-3 cursor-pointer group flex flex-col justify-between"
    >
      <div className="space-y-2">
        {person.photo && !imgError ? (
          <img
            key={`${person.key}-${person.photo.url}`}
            src={person.photo.url}
            alt={person.photo.alt ?? person.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-green/40 group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-green flex items-center justify-center font-serif font-bold text-xl border-2 border-brand-green/40 group-hover:scale-105 transition-transform">
            {person.name.charAt(0)}
          </div>
        )}
        <h3 className="font-serif text-base font-bold text-brand-navy dark:text-white group-hover:text-brand-forest dark:group-hover:text-brand-lime transition-colors">
          {person.name}
        </h3>
        {person.role && (
          <p className="text-xs text-brand-forest dark:text-brand-lime font-bold">
            {person.role}
          </p>
        )}
      </div>

      <div className="pt-2 text-[11px] font-bold text-brand-blue group-hover:text-brand-forest dark:group-hover:text-brand-lime flex items-center space-x-1 border-t border-slate-100 dark:border-white/5">
        <span>{es ? 'Ver reseña completa' : 'View full biography'}</span>
        <span>→</span>
      </div>
    </div>
  );
};

const PersonDetailModal: React.FC<{
  person: PersonCardData;
  language: Language;
  onClose: () => void;
}> = ({ person, language, onClose }) => {
  const es = language === 'es';
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [person.key, person.photo?.url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        key={person.key}
        className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-brand-navy dark:hover:text-white transition-colors"
          aria-label={es ? 'Cerrar' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
          {person.photo && !imgError ? (
            <img
              key={`${person.key}-${person.photo.url}`}
              src={person.photo.url}
              alt={person.photo.alt ?? person.name}
              onError={() => setImgError(true)}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-brand-green shadow-md shrink-0 animate-fadeIn"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brand-green/20 text-brand-forest dark:text-brand-green flex items-center justify-center font-serif font-black text-4xl border-2 border-brand-green shrink-0 shadow-sm">
              {person.name.charAt(0)}
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white leading-tight">
              {person.name}
            </h3>
            {person.role && (
              <span className="inline-block px-3 py-1 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-lime text-xs font-bold border border-brand-green/40">
                {person.role}
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-forest dark:text-brand-lime block">
            {es ? 'Reseña y Trayectoria' : 'Biography & Background'}
          </span>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {person.bio || (es ? 'Sin descripción disponible.' : 'No description available.')}
          </p>
        </div>
      </div>
    </div>
  );
};

/** Convierte filas de contenido institucional (una por persona) en tarjetas, usando el idioma seleccionado y fotos de respaldo. */
function toPeople(items: InstitutionalContent[], language: Language, defaults: PersonCardData[]): PersonCardData[] {
  const isEn = language === 'en';
  const defaultMap = new Map(defaults.map((d) => [d.key, d]));

  return items.map((item) => {
    const fallback = defaultMap.get(item.page_slug) || defaultMap.get(item.id);
    const photoUrl = item.image_url || item.images?.[0]?.url || fallback?.photo?.url;

    return {
      key: item.page_slug || item.id,
      name: item.title,
      role: (isEn && item.subtitle_en) ? item.subtitle_en : (item.subtitle || fallback?.role || null),
      bio: (isEn && item.content_en) ? item.content_en : (item.content || fallback?.bio || ''),
      photo: photoUrl ? { url: photoUrl, alt: item.title } : undefined,
    };
  });
}

export const AboutView: React.FC<AboutViewProps> = ({
  language,
  setCurrentPage,
}) => {
  const projects = usePublicProjects(language);
  const t = getTranslations(language).views.about;
  const es = language === 'es';
  const { items: historyItems } = useInstitutionalContent('history', language);
  const { items: impactItems } = useInstitutionalContent('impact', language);
  const { items: futureItems } = useInstitutionalContent('future', language);
  const { items: boardItems } = useInstitutionalContent('board', language);
  const { items: productionItems } = useInstitutionalContent('production', language);
  const [gallery, setGallery] = useState<{ title: string; images: GalleryImage[] } | null>(null);
  const [selectedPersonKey, setSelectedPersonKey] = useState<string | null>(null);

  const history = historyItems[0];

  // Fotos de la sección «Nuestra historia»: las subidas desde el panel tienen
  // prioridad; si no hay, se usan fotos reales de producciones de 2005 a 2024.
  const historyFallback: GalleryImage[] = [
    { url: '/obras/mamma-mia-2024/mamma-mia-2024-03.jpg', alt: 'Mamma Mia! (2024)' },
    { url: '/obras/guys-and-dolls-2005/guys-and-dolls-2005-03.jpg', alt: 'Guys & Dolls (2005)' },
    { url: '/obras/urinetown-2009/urinetown-2009-03.jpg', alt: 'Urinetown (2009)' },
    { url: '/obras/fiddler-2017/fiddler-2017-03.jpg', alt: 'Fiddler on the Roof (2017)' },
    { url: '/obras/jcs-2022/jcs-2022-03.jpg', alt: 'Jesus Christ Superstar (2022)' },
  ];
  const historyUploaded = toGalleryImages(
    history?.images?.map((img) => ({ url: img.url, alt: img.alt_text })),
    history?.title ?? ''
  );
  const historyPhotos = historyUploaded.length > 0 ? historyUploaded : historyFallback;
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

  // Respaldo con fotografías oficiales mientras la sección del panel no tenga filas publicadas.
  const defaultBoard: PersonCardData[] = [
    {
      key: 'jose-pablo-arias',
      name: 'José Pablo Arias Mora',
      role: es ? 'Presidente' : 'President',
      photo: { url: '/recursos/IMG_2908.PNG', alt: 'José Pablo Arias Mora' },
      bio: es
        ? 'Líder comunitario y gestor cultural con amplia trayectoria en el desarrollo del teatro musical y proyectos comunitarios en Monteverde.'
        : 'Community leader and cultural manager with extensive experience developing musical theatre and community initiatives in Monteverde.',
    },
    {
      key: 'isaac-matamoros',
      name: 'Isaac Matamoros Trejos',
      role: es ? 'Vicepresidente' : 'Vice President',
      photo: { url: '/recursos/IMG_2909.PNG', alt: 'Isaac Matamoros Trejos' },
      bio: es
        ? 'Comprometido con la formación artística de jóvenes y el fortalecimiento de la educación escénica accesible.'
        : 'Dedicated to artistic youth development and strengthening accessible performing arts education.',
    },
    {
      key: 'luis-dario-villalobos',
      name: 'Luis Dario Villalobos Castro',
      role: es ? 'Tesorero' : 'Treasurer',
      photo: { url: '/recursos/IMG_2910.PNG', alt: 'Luis Dario Villalobos Castro' },
      bio: es
        ? 'Especialista en administración financiera y gestión de fondos transparentes para organizaciones sin fines de lucro.'
        : 'Specialist in financial administration and transparent non-profit fund management.',
    },
    {
      key: 'stacy-ohrt',
      name: 'Stacy Ohrt-Billingslea',
      role: es ? 'Vocal' : 'Board member',
      photo: { url: '/recursos/IMG_2911.PNG', alt: 'Stacy Ohrt-Billingslea' },
      bio: es
        ? 'Impulsora de vínculos internacionales y programas de intercambio para jóvenes talentos escénicos.'
        : 'Promoter of international partnerships and exchange programs for young stage talent.',
    },
    {
      key: 'susu-gray',
      name: 'Susu Gray',
      role: es ? 'Vocal' : 'Board member',
      photo: { url: '/recursos/IMG_2912.PNG', alt: 'Susu Gray' },
      bio: es
        ? 'Promotora de las artes escénicas en comunidades rurales y conservación de la memoria histórica comunitaria.'
        : 'Advocate for performing arts in rural communities and community historic preservation.',
    },
    {
      key: 'shanae-wise',
      name: 'Shanae Wise',
      role: es ? 'Vocal' : 'Board member',
      photo: { url: '/recursos/IMG_2913.PNG', alt: 'Shanae Wise' },
      bio: es
        ? 'Gestora de voluntariado, alianzas con centros educativos y proyectos de inclusión comunitaria.'
        : 'Coordinator of volunteering, educational partnerships, and community inclusion initiatives.',
    },
  ];

  const defaultProduction: PersonCardData[] = [
    {
      key: 'direccion-general',
      name: 'Dirección Escénica',
      role: es ? 'Dirección general' : 'General direction',
      photo: { url: '/recursos/IMG_2914.PNG', alt: 'Dirección Escénica' },
      bio: es
        ? 'Liderazgo artístico, conceptualización de montajes y guía interpretativa para el elenco comunitario.'
        : 'Artistic leadership, show conceptualization, and performance guidance for the community cast.',
    },
    {
      key: 'direccion-musical',
      name: 'Dirección Musical',
      role: es ? 'Dirección musical' : 'Music direction',
      photo: { url: '/recursos/IMG_2916.PNG', alt: 'Dirección Musical' },
      bio: es
        ? 'Preparación vocal, ensamble coral y coordinación de instrumentación en vivo para las temporadas.'
        : 'Vocal coaching, choral arrangement, and live orchestration coordination for our production seasons.',
    },
    {
      key: 'coreografia',
      name: 'Coreografía y Danza',
      role: es ? 'Coreografía' : 'Choreography',
      photo: { url: '/recursos/IMG_2917.PNG', alt: 'Coreografía y Danza' },
      bio: es
        ? 'Diseño de rutinas de baile adaptadas a todas las edades y niveles de experiencia escénica.'
        : 'Designing dance routines tailored to all age groups and experience levels.',
    },
    {
      key: 'produccion-tecnica',
      name: 'Producción Técnica',
      role: es ? 'Producción técnica y escenografía' : 'Technical production & stage design',
      photo: { url: '/recursos/IMG_2918.PNG', alt: 'Producción Técnica' },
      bio: es
        ? 'Iluminación, diseño sonoro, escenografía e infraestructura teatral comunitaria.'
        : 'Lighting, sound design, set construction, and theatre technical infrastructure.',
    },
  ];

  const boardPeople = boardItems.length > 0 ? toPeople(boardItems, language, defaultBoard) : defaultBoard;
  const productionPeople = productionItems.length > 0 ? toPeople(productionItems, language, defaultProduction) : defaultProduction;
  const allPeople = [...boardPeople, ...productionPeople];
  const selectedPerson = allPeople.find((p) => p.key === selectedPersonKey) ?? null;

  const openGallery = (title: string, images: GalleryImage[]) => setGallery({ title, images });

  const impactCount = impactItems.length > 0
  ? impactItems.length
  : projects.length;

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

        {/* Fotos de la historia: las del panel (si hay) o fotos reales de las producciones */}
        <div className="relative">
          {historyPhotos.length > 0 && (
            <div className="grid grid-cols-3 grid-rows-2 gap-2 sm:gap-3 aspect-[4/3]">
              {historyPhotos.slice(0, 5).map((photo, i) => (
                <button
                  key={`${photo.url}-${i}`}
                  type="button"
                  onClick={() => openGallery(history?.title ?? t.originsTitle, historyPhotos)}
                  aria-label={`${es ? 'Ver fotos de nuestra historia' : 'View photos of our history'} (${i + 1}/${historyPhotos.length})`}
                  className={`group relative overflow-hidden rounded-2xl border border-brand-green/50 shadow-lg ${
                    i === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.alt ?? ''}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
          {historyPhotos.length > 1 && (
            <GalleryButton
              count={historyPhotos.length}
              language={language}
              onClick={() => openGallery(history?.title ?? t.originsTitle, historyPhotos)}
              className="absolute bottom-3 right-3"
            />
          )}
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
            : projects.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                      {p.country}
                    </span>
                    <span className="text-xs font-mono text-brand-green">
                      {p.year}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {es ? p.summary : p.summaryEn}
                  </p>

                  {p.participants != null && (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="text-brand-navy dark:text-white font-bold">
                        {p.participants}+
                      </span>{' '}
                      {es
                        ? 'participantes registrados'
                        : 'registered participants'}
                    </div>
                  )}
                </div>
              ))}
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
            <PersonCard
              key={person.key}
              person={person}
              language={language}
              onSelect={(p) => setSelectedPersonKey(p.key)}
            />
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
              <PersonCard
                key={person.key}
                person={person}
                language={language}
                onSelect={(p) => setSelectedPersonKey(p.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal / Ficha Desplegada de Persona Ampliada */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          language={language}
          onClose={() => setSelectedPersonKey(null)}
        />
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
