import React, { useState } from 'react';
import { Language, Show } from '../types';
import { showsData, projectsData, opportunitiesData } from '../data/mockData';
import { Search, X, Ticket, Globe, Briefcase, ChevronRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectShow: (show: Show) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectShow,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredShows = query.trim() === ''
    ? showsData.slice(0, 3)
    : showsData.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.synopsis.toLowerCase().includes(query.toLowerCase()) ||
        s.year.toString().includes(query)
      );

  const filteredProjects = query.trim() === ''
    ? projectsData
    : projectsData.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.country.toLowerCase().includes(query.toLowerCase()) ||
        p.summary.toLowerCase().includes(query.toLowerCase())
      );

  const filteredOpps = query.trim() === ''
    ? opportunitiesData.slice(0, 2)
    : opportunitiesData.filter(o =>
        o.title.toLowerCase().includes(query.toLowerCase()) ||
        o.description.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#002244] border border-[#1e4066] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-[#F8F8F2]">
        {/* Header Search Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#00162e]">
          <Search className="w-5 h-5 text-[#77C65E] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'es' ? 'Buscar obras, musicales, proyectos, pasantías...' : 'Search shows, projects, internships...'}
            className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-base font-sans"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6 divide-y divide-white/10">
          {/* Shows Section */}
          {filteredShows.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Ticket className="w-4 h-4 text-[#77C65E]" />
                <span>{language === 'es' ? 'Obras y Musicales' : 'Shows & Musicals'}</span>
              </div>
              <div className="space-y-2">
                {filteredShows.map(show => (
                  <div
                    key={show.id}
                    onClick={() => {
                      onSelectShow(show);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-[#77C65E]/20 border border-transparent hover:border-[#77C65E]/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-[#00162e] overflow-hidden shrink-0 border border-white/10">
                        <img src={show.poster} alt={show.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-white group-hover:text-[#77C65E] transition-colors">
                          {show.title} ({show.year})
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-1">{show.synopsis}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#4A90D6] group-hover:text-[#77C65E] transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {filteredProjects.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Globe className="w-4 h-4 text-[#4A90D6]" />
                <span>{language === 'es' ? 'Proyectos e Impacto' : 'Projects & Impact'}</span>
              </div>
              <div className="space-y-2">
                {filteredProjects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-bold text-white">
                        {language === 'es' ? proj.title : proj.titleEn}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#77C65E]/20 text-[#DCEB4F] font-bold">
                        {proj.country}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{language === 'es' ? proj.summary : proj.summaryEn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities Section */}
          {filteredOpps.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Briefcase className="w-4 h-4 text-[#77C65E]" />
                <span>{language === 'es' ? 'Pasantías y Voluntariado' : 'Opportunities'}</span>
              </div>
              <div className="space-y-2">
                {filteredOpps.map(opp => (
                  <div key={opp.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <h4 className="font-serif text-sm font-bold text-white">
                      {language === 'es' ? opp.title : opp.titleEn}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">{opp.location} • {opp.period}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredShows.length === 0 && filteredProjects.length === 0 && filteredOpps.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">{language === 'es' ? 'No se encontraron resultados para tu búsqueda.' : 'No results found.'}</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#00162e] border-t border-white/10 text-[11px] text-center text-slate-400 font-mono">
          {language === 'es' ? 'Presiona ESC o la X para cerrar la búsqueda' : 'Press ESC or X to close'}
        </div>
      </div>
    </div>
  );
};
