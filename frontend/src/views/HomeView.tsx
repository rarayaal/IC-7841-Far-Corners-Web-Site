import React, { useState, useEffect } from 'react';
import { usePublicProjects } from '../hooks/usePublicProjects';
import { Language, Show, PageView } from '../types';
import { Ticket, Users, Sparkles, ChevronRight, Star, FileText } from 'lucide-react';
import { CountUp } from '../components/CountUp';
import { ShowsCarousel } from '../components/ShowsCarousel';
import { HeroBackground } from '../components/HeroBackground';
import { hasTickets, openProgram, mapearEventoAShow } from '../lib/shows';
import { getTranslations } from '../lib/i18n';
import { useGalleries } from '../hooks/useGalleries';
import { GalleryButton, GalleryLightbox, toGalleryImages } from '../components/GalleryLightbox';

/** Fotos de escena (public/obras) para el fondo del hero. */
const HERO_IMAGES = [
  '/obras/addams-2026/addams-2026-02.jpg',
  '/obras/mamma-mia-2024/mamma-mia-2024-02.jpg',
  '/obras/jcs-2022/jcs-2022-02.jpg',
  '/obras/fiddler-2017/fiddler-2017-02.jpg',
  '/obras/in-the-heights-2013/in-the-heights-2013-02.jpg',
];

interface HomeViewProps {
  language: Language;
  setCurrentPage: (page: PageView) => void;
  onOpenTickets: (show?: Show) => void;
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  language,
  setCurrentPage,
  onOpenTickets,
  onOpenDonate,
  onOpenVolunteer,
}) => {
  const projects = usePublicProjects(language);
  const t = getTranslations(language).views.home;
  const { galleryFor } = useGalleries();
  const [galleryProject, setGalleryProject] = useState<
    (typeof projects)[number] | null
  >(null);
  const [currentShow, setCurrentShow] = useState<Show | null>(null);
  const [upcomingShows, setUpcomingShows] = useState<Show[]>([]);
  const [loadingShows, setLoadingShows] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function cargarObras() {
      setLoadingShows(true);
      try {
        const res = await fetch('/api/v1/events');
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data)) {
            const showsMapeados = data.map(mapearEventoAShow);
            const destacado = showsMapeados.find(s => s.status === 'current') || showsMapeados[0] || null;
            setCurrentShow(destacado);
            setUpcomingShows(showsMapeados);
          }
        }
      } catch (err) {
        console.error('Error al cargar obras en Home:', err);
      } finally {
        if (mounted) setLoadingShows(false);
      }
    }
    void cargarObras();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16 pb-12 sm:pb-16">
      {/* Brand Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-radial-gradient">
        {/* Background stage image & gradient overlay */}
        <HeroBackground images={HERO_IMAGES} />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 pb-20">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-green/20 border border-brand-green/60 text-brand-forest dark:text-brand-lime text-xs font-extrabold uppercase tracking-wider mb-6 shadow-sm dark:shadow-glow-green">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.tagline}</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-brand-navy dark:text-white leading-none">
            Far Corners <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-forest via-brand-green to-brand-blue dark:from-brand-green dark:via-brand-lime dark:to-brand-blue">{t.titleCommunity}</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-700 dark:text-brand-cream/90 max-w-3xl mx-auto leading-relaxed font-sans">
            {t.heroDescription}
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (currentShow && hasTickets(currentShow)) {
                  onOpenTickets(currentShow);
                } else {
                  setCurrentPage('shows');
                }
              }}
              className="w-full sm:w-auto px-8 py-4 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3 text-base uppercase tracking-wider"
            >
              <Ticket className="w-5 h-5 text-brand-navy fill-current" />
              <span>{t.buyTicketsBtn}</span>
            </button>

            <button
              onClick={() => setCurrentPage('participate')}
              className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 border-2 border-brand-blue text-brand-navy dark:bg-brand-navy/90 dark:hover:bg-brand-navyCard dark:border-brand-blue/60 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 text-base shadow-sm backdrop-blur-md"
            >
              <Users className="w-5 h-5 text-brand-blue" />
              <span>{t.internshipBtn}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4 p-6 rounded-2xl bg-white/90 border border-slate-200 dark:bg-brand-navy/90 dark:border-brand-border backdrop-blur-md max-w-5xl mx-auto shadow-xl dark:shadow-2xl">
            <div className="text-center p-2 border-r border-slate-200 dark:border-white/10 last:border-r-0">
              <CountUp value={String(projects.length || 1)} className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-green" />
              <span className="text-xs text-slate-600 dark:text-slate-300 uppercase font-semibold">
                {t.stats.countries}
              </span>
            </div>
            <div className="text-center p-2 border-r border-slate-200 dark:border-white/10 last:border-r-0">
              <CountUp value={String(upcomingShows.length)} className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-blue" />
              <span className="text-xs text-slate-600 dark:text-slate-300 uppercase font-semibold">
                {t.stats.showsProduced}
              </span>
            </div>
            <div className="text-center p-2 border-r border-slate-200 dark:border-white/10 last:border-r-0">
              <CountUp value="+5,000" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-forest dark:text-brand-lime" />
              <span className="text-xs text-slate-600 dark:text-slate-300 uppercase font-semibold">
                {t.stats.youthImpacted}
              </span>
            </div>
            <div className="text-center p-2 border-r border-slate-200 dark:border-white/10 last:border-r-0">
              <CountUp value="+9,000" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-blue" />
              <span className="text-xs text-slate-600 dark:text-slate-300 uppercase font-semibold">
                {t.stats.attendance}
              </span>
            </div>
            <div className="text-center p-2 col-span-2 md:col-span-1">
              <CountUp value="100%" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-green" />
              <span className="text-xs text-slate-600 dark:text-slate-300 uppercase font-semibold">
                {t.stats.freeAccess}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Season Production Banner (Current Show) */}
      {currentShow && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gradient-to-r dark:from-brand-navy dark:via-brand-navyCard dark:to-brand-navy rounded-3xl border border-slate-200 dark:border-brand-green/40 p-6 lg:p-8 shadow-xl dark:shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="md:col-span-4 relative max-w-xs mx-auto w-full">
              <div className="aspect-[3/4] max-h-[420px] rounded-2xl overflow-hidden shadow-glow-green border border-slate-200 dark:border-white/10 group">
                <img
                  src={currentShow.poster}
                  alt={currentShow.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute top-4 left-4 bg-brand-green text-brand-navy px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg">
                {t.nowPlaying}
              </div>
            </div>

            <div className="md:col-span-8 space-y-5">
              <div>
                <span className="text-xs font-bold text-brand-forest dark:text-brand-lime uppercase tracking-widest block mb-1">
                  {currentShow.dates} • {currentShow.location}
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy dark:text-white tracking-tight">
                  {currentShow.title}
                </h2>
              </div>

              <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed">
                {language === 'es' ? currentShow.synopsis : currentShow.synopsisEn}
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-brand-navyDark/90 border border-slate-200 dark:border-brand-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.generalDirection}</span>
                  <span className="text-brand-navy dark:text-white font-semibold">
                    {currentShow.director || (language === 'es' ? 'Equipo Far Corners' : 'Far Corners Team')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{language === 'es' ? 'Boletos Disponibles:' : 'Available Tickets:'}</span>
                  <span className="text-brand-forest dark:text-brand-green font-mono font-bold">
                    {t.availableTickets(currentShow.availableTickets)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{t.ticketPrice}</span>
                  <span className="text-brand-navy dark:text-brand-lime font-mono font-bold">
                    {currentShow.priceGeneral ? `₡${currentShow.priceGeneral.toLocaleString()} CRC` : '₡10,000 CRC'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenTickets(currentShow)}
                  className="px-8 py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all flex items-center space-x-2 text-xs uppercase tracking-wider"
                >
                  <Ticket className="w-5 h-5 text-brand-navy fill-current" />
                  <span>{t.reserveTicketsNow}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Shows Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 dark:border-brand-border pb-4">
          <div>
            <span className="text-xs font-bold text-brand-forest dark:text-brand-green uppercase tracking-wider block mb-1">
              {t.repertoryBadge}
            </span>
            <h2 className="font-serif text-3xl font-bold text-brand-navy dark:text-white">
              {t.theatricalHistory}
            </h2>
          </div>
          <button
            onClick={() => setCurrentPage('shows')}
            className="text-xs font-bold text-brand-blue hover:text-brand-forest dark:hover:text-brand-green flex items-center space-x-1 py-2.5 transition-colors"
          >
            <span>{t.viewFullCatalog}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loadingShows ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-brand-navy rounded-3xl border border-slate-200 dark:border-brand-border">
            {language === 'es' ? 'Cargando obras en cartelera...' : 'Loading productions...'}
          </div>
        ) : upcomingShows.length > 0 ? (
          <ShowsCarousel
            shows={upcomingShows}
            language={language}
            renderAction={(show) =>
              hasTickets(show) ? (
                <button
                  onClick={() => onOpenTickets(show)}
                  className="btn-green inline-flex items-center gap-2 px-6 py-3 text-brand-navy hover:text-white text-xs font-extrabold rounded-xl uppercase tracking-wider"
                >
                  <Ticket className="w-4 h-4 fill-current" />
                  {t.buyTickets}
                </button>
              ) : (
                <button
                  onClick={() => openProgram(show, () => setCurrentPage('shows'))}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-brand-navyDark hover:bg-slate-50 dark:hover:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-brand-navy dark:hover:text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  {t.viewProgram}
                </button>
              )
            }
          />
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white dark:bg-brand-navy rounded-3xl border border-slate-200 dark:border-brand-border text-sm">
            {language === 'es'
              ? 'Próximamente estaremos publicando las nuevas obras y producciones teatrales.'
              : 'Upcoming theatre productions will be announced soon.'}
          </div>
        )}
      </section>

      {/* Global Impact Highlights */}
      <section className="bg-slate-100 dark:bg-brand-navy border-y border-slate-200 dark:border-brand-border py-16 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider block mb-2">
              {t.presenceBadge}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy dark:text-white">
              {t.projectsTitle}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-3">
              {t.projectsDesc}
            </p>
          </div>

          {projects.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-8 ${
                projects.length === 1
                  ? 'max-w-lg mx-auto'
                  : 'md:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-2xl p-6 space-y-4 hover:border-brand-green/50 shadow-sm dark:shadow-none transition-all">
                  <div className="h-44 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 relative">
                    {proj.image && <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />}
                    {proj.country && (
                      <span className="absolute bottom-3 left-3 px-3 py-1 rounded bg-brand-green text-brand-navy text-xs font-extrabold">
                        {proj.country}
                      </span>
                    )}
                    <GalleryButton
                      count={galleryFor(proj.id, proj.gallery, proj.title).length}
                      language={language}
                      onClick={() => setGalleryProject(proj)}
                      className="absolute bottom-3 right-3"
                    />
                  </div>

                  <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                    {language === 'es' ? proj.title : proj.titleEn}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {language === 'es' ? proj.summary : proj.summaryEn}
                  </p>

                  {proj.impactMetrics && proj.impactMetrics.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {proj.impactMetrics.map((m, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Star className="w-3.5 h-3.5 text-brand-forest dark:text-brand-lime shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-brand-navyDark rounded-2xl border border-slate-200 dark:border-brand-border text-sm max-w-lg mx-auto">
              {language === 'es'
                ? 'No hay proyecciones comunitarias registradas actualmente.'
                : 'No community projects recorded at this time.'}
            </div>
          )}
        </div>
      </section>

      {galleryProject && (
        <GalleryLightbox
          title={language === 'es' ? galleryProject.title : galleryProject.titleEn}
          images={toGalleryImages(galleryFor(galleryProject.id, galleryProject.gallery, galleryProject.title), galleryProject.title)}
          language={language}
          onClose={() => setGalleryProject(null)}
        />
      )}

      {/* Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gradient-to-r dark:from-brand-navy dark:via-brand-navyCard dark:to-brand-navyDark rounded-3xl p-8 sm:p-12 text-center text-brand-navy dark:text-white space-y-6 border border-slate-200 dark:border-brand-green/40 shadow-xl dark:shadow-glow-green relative overflow-hidden">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            {t.ctaTitle}
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-200">
            {t.ctaDesc}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentPage('participate')}
              className="px-8 py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-lg transition-all uppercase tracking-wider text-xs"
            >
              {t.applyInternship}
            </button>
            <button
              onClick={onOpenDonate}
              className="px-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-brand-navy border-2 border-brand-blue dark:bg-brand-navyDark dark:text-brand-blue dark:hover:bg-brand-navy dark:border-brand-blue/50 font-bold rounded-xl shadow-sm dark:shadow-lg transition-all text-xs"
            >
              {t.makeDonation}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
