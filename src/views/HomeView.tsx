import React from 'react';
import { Language, Show, PageView } from '../types';
import { showsData, projectsData } from '../data/mockData';
import { Ticket, Users, Sparkles, ChevronRight, Star } from 'lucide-react';

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
    <div className="space-y-20 pb-16 animate-fadeIn">
      {/* Brand Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-radial-gradient">
        {/* Background stage image & gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentShow.banner || '/recursos/IMG_2903.PNG'}
            alt="Theater Stage"
            className="w-full h-full object-cover object-center opacity-30 scale-105 filter contrast-125 brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00162e] via-[#00162e]/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#00162e] via-transparent to-[#00162e]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 pb-20">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#77C65E]/20 border border-[#77C65E]/50 text-[#DCEB4F] text-xs font-extrabold uppercase tracking-wider mb-6 shadow-glow-green">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Arte que Conecta Comunidades • Costa Rica</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none">
            {language === 'es' ? (
              <>
                Far Corners <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#77C65E] via-[#DCEB4F] to-[#4A90D6]">Teatro Comunitario</span>
              </>
            ) : (
              <>
                Far Corners <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#77C65E] via-[#DCEB4F] to-[#4A90D6]">Community Theatre</span>
              </>
            )}
          </h1>

          <p className="mt-6 text-base sm:text-xl text-[#F8F8F2]/90 max-w-3xl mx-auto leading-relaxed font-sans">
            {language === 'es'
              ? 'Creemos en el poder del arte para transformar, inspirar y unir personas. Creamos experiencias escénicas que fortalecen la comunidad y abren espacios de expresión para todos.'
              : 'People, Stories, Community Through Art. Creating stage experiences that empower youth and celebrate diversity.'}
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenTickets(currentShow)}
              className="w-full sm:w-auto px-8 py-4 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all transform hover:-translate-y-1 flex items-center justify-center space-x-3 text-base uppercase tracking-wider"
            >
              <Ticket className="w-5 h-5 text-[#002244] fill-current" />
              <span>{language === 'es' ? 'Comprar Boletos 2026' : 'Buy Tickets 2026'}</span>
            </button>

            <button
              onClick={() => setCurrentPage('participate')}
              className="w-full sm:w-auto px-7 py-4 bg-[#002244]/90 hover:bg-[#002d57] border border-[#4A90D6]/60 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 text-base backdrop-blur-md"
            >
              <Users className="w-5 h-5 text-[#4A90D6]" />
              <span>{language === 'es' ? 'Programa de Pasantías' : 'Internship Opportunities'}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#002244]/90 border border-[#1e4066] backdrop-blur-md max-w-4xl mx-auto shadow-2xl">
            <div className="text-center p-2 border-r border-white/10 last:border-r-0">
              <span className="block font-mono text-3xl font-extrabold text-[#77C65E]">3</span>
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Países de Impacto' : 'Countries'}
              </span>
            </div>
            <div className="text-center p-2 border-r border-white/10 last:border-r-0">
              <span className="block font-mono text-3xl font-extrabold text-[#4A90D6]">+15</span>
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Obras Producidas' : 'Shows Produced'}
              </span>
            </div>
            <div className="text-center p-2 border-r border-white/10 last:border-r-0">
              <span className="block font-mono text-3xl font-extrabold text-[#DCEB4F]">+5,000</span>
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Jóvenes Beneficiados' : 'Youth Impacted'}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="block font-mono text-3xl font-extrabold text-[#77C65E]">100%</span>
              <span className="text-xs text-slate-300 uppercase font-semibold">
                {language === 'es' ? 'Becas Sociales' : 'Social Scholarships'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Season Production Banner (Current Show) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#002244] via-[#002d57] to-[#002244] rounded-3xl border border-[#77C65E]/40 p-8 lg:p-12 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-glow-green border border-white/10 group">
              <img
                src={currentShow.poster}
                alt={currentShow.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute top-4 left-4 bg-[#77C65E] text-[#002244] px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg">
              {language === 'es' ? 'EN CARTELERA 2026' : 'NOW PLAYING 2026'}
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-bold text-[#DCEB4F] uppercase tracking-widest block mb-1">
                {currentShow.dates} • {currentShow.location}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
                {currentShow.title}
              </h2>
            </div>

            <p className="text-slate-200 text-base leading-relaxed">
              {language === 'es' ? currentShow.synopsis : currentShow.synopsisEn}
            </p>

            <div className="p-4 rounded-xl bg-[#00162e]/90 border border-[#1e4066] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Dirección General:</span>
                <span className="text-white font-semibold">{currentShow.director}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Boletos Disponibles:</span>
                <span className="text-[#77C65E] font-mono font-bold">{currentShow.availableTickets} entradas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Precio de Entrada:</span>
                <span className="text-[#DCEB4F] font-mono font-bold">₡10,000 CRC</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onOpenTickets(currentShow)}
                className="px-8 py-3.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all flex items-center space-x-2 text-xs uppercase tracking-wider"
              >
                <Ticket className="w-5 h-5 text-[#002244] fill-current" />
                <span>{language === 'es' ? 'Reservar Boletos Ahora' : 'Reserve Tickets Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Shows Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#1e4066] pb-4">
          <div>
            <span className="text-xs font-bold text-[#77C65E] uppercase tracking-wider block mb-1">
              {language === 'es' ? 'Repertorio Teatral' : 'Production Archives'}
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              {language === 'es' ? 'Nuestras Obras Teatrales' : 'Our Theatrical History'}
            </h2>
          </div>
          <button
            onClick={() => setCurrentPage('shows')}
            className="text-xs font-bold text-[#4A90D6] hover:text-[#77C65E] flex items-center space-x-1 transition-colors"
          >
            <span>{language === 'es' ? 'Ver cartelera completa' : 'View full catalog'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingShows.map((show) => (
            <div
              key={show.id}
              className="bg-[#002244] border border-[#1e4066] rounded-2xl overflow-hidden hover:border-[#77C65E]/60 transition-all duration-300 hover:-translate-y-1 group shadow-card-dark flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[16/9] relative overflow-hidden bg-slate-900">
                  <img
                    src={show.banner || show.poster}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002244] via-transparent to-transparent"></div>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#00162e]/90 text-[#DCEB4F] text-xs font-mono font-bold border border-[#1e4066]">
                    {show.year}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-[#77C65E] transition-colors">
                    {show.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-3">
                    {language === 'es' ? show.synopsis : show.synopsisEn}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-white/5 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-300">
                  {show.location}
                </span>
                <button
                  onClick={() => onOpenTickets(show)}
                  className="px-3.5 py-1.5 bg-[#77C65E]/20 hover:bg-[#77C65E] text-[#77C65E] hover:text-[#002244] text-xs font-bold rounded-lg border border-[#77C65E]/40 transition-all"
                >
                  {language === 'es' ? 'Adquirir Boletos' : 'Buy Tickets'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Global Impact Highlights */}
      <section className="bg-[#002244] border-y border-[#1e4066] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold text-[#DCEB4F] uppercase tracking-wider block mb-2">
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
              <div key={proj.id} className="bg-[#00162e] border border-[#1e4066] rounded-2xl p-6 space-y-4 hover:border-[#77C65E]/50 transition-all">
                <div className="h-44 rounded-xl overflow-hidden bg-slate-900 border border-white/10 relative">
                  <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 px-3 py-1 rounded bg-[#77C65E] text-[#002244] text-xs font-extrabold">
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
                      <Star className="w-3.5 h-3.5 text-[#DCEB4F] shrink-0" />
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
        <div className="bg-gradient-to-r from-[#002244] via-[#002d57] to-[#00162e] rounded-3xl p-8 sm:p-12 text-center text-white space-y-6 border border-[#77C65E]/40 shadow-glow-green relative overflow-hidden">
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
              className="px-8 py-3.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl shadow-lg transition-all uppercase tracking-wider text-xs"
            >
              {language === 'es' ? 'Postularse a Pasantía' : 'Apply for Internship'}
            </button>
            <button
              onClick={onOpenDonate}
              className="px-8 py-3.5 bg-[#00162e] text-[#4A90D6] hover:bg-[#002244] border border-[#4A90D6]/50 font-bold rounded-xl shadow-lg transition-all text-xs"
            >
              {language === 'es' ? 'Hacer una Donación' : 'Make a Donation'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
