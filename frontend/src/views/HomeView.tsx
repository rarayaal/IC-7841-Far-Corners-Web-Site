import React from 'react';
import { Language, Show, PageView } from '../types';
import { showsData, projectsData } from '../data/mockData';
import { Ticket, Users, Sparkles, ChevronRight, Star, FileText } from 'lucide-react';
import { CountUp } from '../components/CountUp';
import { ShowsCarousel } from '../components/ShowsCarousel';
import { hasTickets, openProgram } from '../lib/shows';

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
  const currentShow = showsData.find(s => s.status === 'current') || showsData[0];
  const upcomingShows = showsData.slice(0, 3);

  return (
    <div className="space-y-12 sm:space-y-16 pb-12 sm:pb-16 animate-fadeIn">
      {/* Brand Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-radial-gradient">
        {/* Background stage image & gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentShow.banner || '/recursos/IMG_2903.PNG'}
            alt="Theater Stage"
            className="w-full h-full object-cover object-center opacity-30 scale-105 filter contrast-125 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navyDark via-brand-navyDark/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navyDark via-transparent to-brand-navyDark"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 pb-20">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-green/20 border border-brand-green/50 text-brand-lime text-xs font-extrabold uppercase tracking-wider mb-6 shadow-glow-green">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Arte que Conecta Comunidades • Costa Rica</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none">
            {language === 'es' ? (
              <>
                Far Corners <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-lime to-brand-blue">Teatro Comunitario</span>
              </>
            ) : (
              <>
                Far Corners <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-lime to-brand-blue">Community Theatre</span>
              </>
            )}
          </h1>

          <p className="mt-6 text-base sm:text-xl text-brand-cream/90 max-w-3xl mx-auto leading-relaxed font-sans">
            {language === 'es'
              ? 'Creemos en el poder del arte para transformar, inspirar y unir personas. Creamos experiencias escénicas que fortalecen la comunidad y abren espacios de expresión para todos.'
              : 'People, Stories, Community Through Art. Creating stage experiences that empower youth and celebrate diversity.'}
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenTickets(currentShow)}
              className="w-full sm:w-auto px-8 py-4 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3 text-base uppercase tracking-wider"
            >
              <Ticket className="w-5 h-5 text-brand-navy fill-current" />
              <span>{language === 'es' ? 'Comprar Boletos 2026' : 'Buy Tickets 2026'}</span>
            </button>

            <button
              onClick={() => setCurrentPage('participate')}
              className="w-full sm:w-auto px-7 py-4 bg-brand-navy/90 hover:bg-brand-navyCard border border-brand-blue/60 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 text-base backdrop-blur-md"
            >
              <Users className="w-5 h-5 text-brand-blue" />
              <span>{language === 'es' ? 'Programa de Pasantías' : 'Internship Opportunities'}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-brand-navy/90 border border-brand-border backdrop-blur-md max-w-4xl mx-auto shadow-2xl">
            <div className="text-center p-2 border-r border-white/10 last:border-r-0">
              <CountUp value="3" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-green" />
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Países de Impacto' : 'Countries'}
              </span>
            </div>
            <div className="text-center p-2 border-r border-white/10 last:border-r-0">
              <CountUp value="+15" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-blue" />
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Obras Producidas' : 'Shows Produced'}
              </span>
            </div>
            <div className="text-center p-2 border-r border-white/10 last:border-r-0">
              <CountUp value="+5,000" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-lime" />
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Jóvenes Beneficiados' : 'Youth Impacted'}
              </span>
            </div>
            <div className="text-center p-2">
              <CountUp value="100%" className="block font-mono text-4xl sm:text-5xl font-extrabold text-brand-green" />
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Becas Sociales' : 'Social Scholarships'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Season Production Banner (Current Show) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-navy via-brand-navyCard to-brand-navy rounded-3xl border border-brand-green/40 p-6 lg:p-8 shadow-2xl relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="md:col-span-4 relative max-w-xs mx-auto w-full">
            <div className="aspect-[3/4] max-h-[420px] rounded-2xl overflow-hidden shadow-glow-green border border-white/10 group">
              <img
                src={currentShow.poster}
                alt={currentShow.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute top-4 left-4 bg-brand-green text-brand-navy px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg">
              {language === 'es' ? 'EN CARTELERA 2026' : 'NOW PLAYING 2026'}
            </div>
          </div>

          <div className="md:col-span-8 space-y-5">
            <div>
              <span className="text-xs font-bold text-brand-lime uppercase tracking-widest block mb-1">
                {currentShow.dates} • {currentShow.location}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {currentShow.title}
              </h2>
            </div>

            <p className="text-slate-200 text-base leading-relaxed">
              {language === 'es' ? currentShow.synopsis : currentShow.synopsisEn}
            </p>

            <div className="p-4 rounded-xl bg-brand-navyDark/90 border border-brand-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Dirección General:</span>
                <span className="text-white font-semibold">{currentShow.director}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Boletos Disponibles:</span>
                <span className="text-brand-green font-mono font-bold">{currentShow.availableTickets} entradas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Precio de Entrada:</span>
                <span className="text-brand-lime font-mono font-bold">₡10,000 CRC</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenTickets(currentShow)}
                className="px-8 py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all flex items-center space-x-2 text-xs uppercase tracking-wider"
              >
                <Ticket className="w-5 h-5 text-brand-navy fill-current" />
                <span>{language === 'es' ? 'Reservar Boletos Ahora' : 'Reserve Tickets Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Shows Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-brand-border pb-4">
          <div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block mb-1">
              {language === 'es' ? 'Repertorio Teatral' : 'Production Archives'}
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              {language === 'es' ? 'Nuestras Obras Teatrales' : 'Our Theatrical History'}
            </h2>
          </div>
          <button
            onClick={() => setCurrentPage('shows')}
            className="text-xs font-bold text-brand-blue hover:text-brand-green flex items-center space-x-1 py-2.5 transition-colors"
          >
            <span>{language === 'es' ? 'Ver cartelera completa' : 'View full catalog'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

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
                {language === 'es' ? 'Adquirir Boletos' : 'Buy Tickets'}
              </button>
            ) : (
              <button
                onClick={() => openProgram(show, () => setCurrentPage('shows'))}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-navyDark hover:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-colors"
              >
                <FileText className="w-4 h-4" />
                {language === 'es' ? 'Ver programa de mano' : 'View program'}
              </button>
            )
          }
        />
      </section>

      {/* Global Impact Highlights */}
      <section className="bg-brand-navy border-y border-brand-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-brand-lime uppercase tracking-wider block mb-2">
              {language === 'es' ? 'Presencia e Impacto' : 'Global Outreach'}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              {language === 'es' ? 'Proyectos en Costa Rica, China y Mozambique' : 'Projects in Costa Rica, China & Mozambique'}
            </h2>
            <p className="text-slate-300 text-sm mt-3">
              Far Corners conecta comunidades y abre espacios de expresión para todos a través del teatro musical.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {projectsData.map((proj) => (
              <div key={proj.id} className="bg-brand-navyDark border border-brand-border rounded-2xl p-6 space-y-4 hover:border-brand-green/50 transition-all">
                <div className="h-44 rounded-xl overflow-hidden bg-slate-900 border border-white/10 relative">
                  <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded bg-brand-green text-brand-navy text-xs font-extrabold">
                    {proj.country}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-bold text-white">
                  {language === 'es' ? proj.title : proj.titleEn}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'es' ? proj.summary : proj.summaryEn}
                </p>

                <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300">
                  {proj.impactMetrics.map((m, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Star className="w-3.5 h-3.5 text-brand-lime shrink-0" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-navy via-brand-navyCard to-brand-navyDark rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 border border-brand-green/40 shadow-glow-green relative overflow-hidden">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            {language === 'es' ? '¿Quieres Ser Parte de Nuestra Historia?' : 'Ready to Join Our Journey?'}
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-200">
            {language === 'es'
              ? 'Únete como voluntario, postulante a pasantías internacionales o apoyando nuestras becas para jóvenes comunitarios.'
              : 'Join as an international intern, cyber volunteer, or sponsor a young student scholarship.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentPage('participate')}
              className="px-8 py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-lg transition-all uppercase tracking-wider text-xs"
            >
              {language === 'es' ? 'Postularse a Pasantía' : 'Apply for Internship'}
            </button>
            <button
              onClick={onOpenDonate}
              className="px-8 py-3.5 bg-brand-navyDark text-brand-blue hover:bg-brand-navy border border-brand-blue/50 font-bold rounded-xl shadow-lg transition-all text-xs"
            >
              {language === 'es' ? 'Hacer una Donación' : 'Make a Donation'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
