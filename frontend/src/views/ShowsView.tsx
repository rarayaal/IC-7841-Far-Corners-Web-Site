import React, { useState } from 'react';
import { Language, Show } from '../types';
import { showsData } from '../data/mockData';
import { Ticket, Calendar, Users, Info, X, FileText } from 'lucide-react';
import { hasTickets, openProgram } from '../lib/shows';

interface ShowsViewProps {
  language: Language;
  onOpenTickets: (show: Show) => void;
}

export const ShowsView: React.FC<ShowsViewProps> = ({ language, onOpenTickets }) => {
  const [filter, setFilter] = useState<'all' | 'current' | 'past'>('current');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  // Put 2026 shows first
  const currentShows = showsData.filter(s => s.status === 'current');
  const pastShows = showsData.filter(s => s.status === 'past');
  const allShows = [...currentShows, ...pastShows];

  const filteredShows = filter === 'current'
    ? currentShows
    : filter === 'past'
    ? pastShows
    : allShows;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-lime text-xs font-bold uppercase tracking-wider border border-brand-green/40">
          {language === 'es' ? 'Cartelera Teatral 2026 & Archivo' : 'Theatrical Repertory 2026'}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
          {language === 'es' ? 'Cartelera de Obras Teatrales' : 'Shows & Musical Productions'}
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          {language === 'es'
            ? 'Explora las producciones de la Temporada 2026 y el repertorio histórico del Teatro Comunitario Far Corners.'
            : 'Explore the 2026 season productions and historical archive of Far Corners Community Theatre.'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-xl bg-brand-navy border border-brand-border text-xs font-bold space-x-1">
          <button
            onClick={() => setFilter('current')}
            className={`px-5 py-2 rounded-lg transition-all ${
              filter === 'current'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {language === 'es' ? 'Cartelera 2026' : '2026 Season'}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {language === 'es' ? 'Todas las Obras' : 'All Shows'}
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-5 py-2 rounded-lg transition-all ${
              filter === 'past'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {language === 'es' ? 'Archivo Histórico' : 'Historical Archive'}
          </button>
        </div>
      </div>

      {/* Shows Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className="bg-brand-navy border border-brand-border rounded-2xl overflow-hidden hover:border-brand-green/60 transition-all duration-300 hover:-translate-y-1 shadow-card-dark flex flex-col justify-between group"
          >
            <div>
              {/* Poster image container */}
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setSelectedShow(show)}>
                <img
                  src={show.poster}
                  alt={show.title}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent"></div>

                {show.status === 'current' ? (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-green text-brand-navy text-xs font-extrabold uppercase tracking-wider shadow-lg">
                    CARTELERA 2026
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded bg-brand-navyDark/80 text-slate-300 text-xs font-mono border border-white/10">
                    {show.year}
                  </span>
                )}

                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-brand-navyDark/90 text-brand-lime text-xs font-mono font-bold border border-brand-border">
                  ₡10,000 CRC
                </span>
              </div>

              {/* Card info */}
              <div className="p-6 space-y-3">
                <h3
                  onClick={() => setSelectedShow(show)}
                  className="font-serif text-2xl font-bold text-white group-hover:text-brand-green transition-colors cursor-pointer"
                >
                  {show.title} ({show.year})
                </h3>

                <div className="flex items-center space-x-2 text-xs text-brand-blue">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{show.dates}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {language === 'es' ? show.synopsis : show.synopsisEn}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setSelectedShow(show)}
                  className="text-xs text-slate-300 hover:text-white font-medium flex items-center space-x-1"
                >
                  <Info className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Ver Ficha</span>
                </button>

                {hasTickets(show) ? (
                  <button
                    onClick={() => onOpenTickets(show)}
                    className="px-4 py-2.5 btn-green text-brand-navy hover:text-white text-xs font-extrabold rounded-lg shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider"
                  >
                    <Ticket className="w-3.5 h-3.5 text-brand-navy fill-current" />
                    <span>{language === 'es' ? 'Comprar Boletos' : 'Buy Tickets'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openProgram(show, () => setSelectedShow(show))}
                    className="px-4 py-2.5 bg-brand-navyDark hover:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 uppercase tracking-wider transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Ver programa de mano' : 'View program'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show Detail Modal */}
      {selectedShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-brand-navy border border-brand-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-brand-cream max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-white/10 bg-brand-navyDark flex items-center justify-between shrink-0">
              <h3 className="font-serif text-xl font-bold text-white">
                {selectedShow.title} ({selectedShow.year})
              </h3>
              <button onClick={() => setSelectedShow(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-48 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-white/10">
                  <img src={selectedShow.poster} alt={selectedShow.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-3 flex-1">
                  <span className="text-xs font-mono text-brand-lime block font-bold">{selectedShow.dates}</span>
                  <h4 className="font-serif text-2xl font-bold text-white">{selectedShow.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'es' ? selectedShow.synopsis : selectedShow.synopsisEn}
                  </p>
                  <div className="pt-2 text-xs text-slate-300 space-y-1">
                    <p><strong className="text-white">Teatro / Lugar:</strong> {selectedShow.location}</p>
                    <p><strong className="text-white">Dirección:</strong> {selectedShow.director}</p>
                  </div>
                </div>
              </div>

              {/* Cast List */}
              {selectedShow.cast && selectedShow.cast.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h5 className="font-serif text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-blue" />
                    <span>Elenco y Solistas Principales</span>
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedShow.cast.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-brand-navyDark border border-brand-border text-xs">
                        <span className="font-bold text-white block">{c.name}</span>
                        <span className="text-slate-300 text-[11px]">{c.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Price Card */}
              <div className="p-4 rounded-xl bg-brand-navyDark border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Entrada General</span>
                  <span className="text-slate-300 text-[11px]">Acceso completo a la función</span>
                </div>
                <span className="font-mono text-base font-bold text-brand-lime">₡10,000 CRC</span>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 bg-brand-navyDark border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedShow(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold"
              >
                Cerrar
              </button>
              {hasTickets(selectedShow) ? (
                <button
                  onClick={() => {
                    const s = selectedShow;
                    setSelectedShow(null);
                    onOpenTickets(s);
                  }}
                  className="px-6 py-2.5 rounded-xl btn-green text-brand-navy hover:text-white text-xs font-extrabold shadow-glow-green flex items-center space-x-2 uppercase tracking-wider"
                >
                  <Ticket className="w-4 h-4 text-brand-navy fill-current" />
                  <span>Adquirir Boletos</span>
                </button>
              ) : (
                selectedShow.programUrl && (
                  <a
                    href={selectedShow.programUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-xl bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-white text-xs font-bold flex items-center space-x-2 uppercase tracking-wider"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver programa de mano</span>
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
