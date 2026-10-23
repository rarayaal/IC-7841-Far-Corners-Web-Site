import { useEffect, useState } from 'react';
import { Language } from '../types';
import { apiAdminJson } from '../services/apiAdmin';
import { Search, X, Ticket, Globe, Users, Briefcase } from 'lucide-react';

interface SearchEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
}

interface SearchProject {
  id: string;
  title: string;
  description: string | null;
  country: string | null;
}

interface SearchCommunity {
  id: string;
  name: string;
  description: string | null;
}

interface SearchOpportunity {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  location: string | null;
}

interface SearchResult {
  events: SearchEvent[];
  projects: SearchProject[];
  communities: SearchCommunity[];
  opportunities: SearchOpportunity[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const vacio: SearchResult = {
  events: [],
  projects: [],
  communities: [],
  opportunities: [],
};

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, language }) => {
  const [query, setQuery] = useState('');
  const [resultado, setResultado] = useState<SearchResult>(vacio);
  const [consultado, setConsultado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const texto = query.trim();

    if (texto.length < 2) {
      setResultado(vacio);
      setConsultado(false);
      setError('');
      return;
    }

    setConsultado(true);
    setCargando(true);
    setError('');

    const controlador = new AbortController();
    const temporizador = setTimeout(async () => {
      try {
        const datos = await apiAdminJson<SearchResult>(
          `/api/v1/search?q=${encodeURIComponent(texto)}`,
          { signal: controlador.signal },
          { tokenOpcional: true }
        );
        setResultado(datos);
      } catch (e) {
        if (controlador.signal.aborted) return;
        setError(
          e instanceof Error
            ? e.message
            : language === 'es'
              ? 'No se pudo realizar la búsqueda.'
              : 'The search could not be completed.'
        );
        setResultado(vacio);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }, 300);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [query, isOpen, language]);

  if (!isOpen) return null;

  const hayResultados =
    resultado.events.length > 0 ||
    resultado.projects.length > 0 ||
    resultado.communities.length > 0 ||
    resultado.opportunities.length > 0;

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
            placeholder={language === 'es' ? 'Buscar obras, proyectos, comunidades, pasantías...' : 'Search shows, projects, communities, internships...'}
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
          {query.trim().length < 2 && (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm">
                {language === 'es' ? 'Escribe al menos 2 caracteres para buscar.' : 'Type at least 2 characters to search.'}
              </p>
            </div>
          )}

          {cargando && (
            <p role="status" className="py-4 text-center text-sm text-slate-300">
              {language === 'es' ? 'Buscando...' : 'Searching...'}
            </p>
          )}

          {error && (
            <p role="alert" className="py-4 text-center text-sm text-red-300">
              {error}
            </p>
          )}

          {consultado && !cargando && !error && !hayResultados && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">{language === 'es' ? 'No se encontraron resultados para tu búsqueda.' : 'No results found.'}</p>
            </div>
          )}

          {resultado.events.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Ticket className="w-4 h-4 text-[#77C65E]" />
                <span>{language === 'es' ? 'Eventos y Obras' : 'Events & Shows'}</span>
              </div>
              <div className="space-y-2">
                {resultado.events.map((evento) => (
                  <div key={evento.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <h4 className="font-serif text-sm font-bold text-white">{evento.title}</h4>
                    {evento.venue && (
                      <p className="text-[11px] text-[#4A90D6] mt-0.5">{evento.venue}</p>
                    )}
                    {evento.description && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{evento.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.projects.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Globe className="w-4 h-4 text-[#4A90D6]" />
                <span>{language === 'es' ? 'Proyectos e Impacto' : 'Projects & Impact'}</span>
              </div>
              <div className="space-y-2">
                {resultado.projects.map((proyecto) => (
                  <div key={proyecto.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif text-sm font-bold text-white">{proyecto.title}</h4>
                      {proyecto.country && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#77C65E]/20 text-[#DCEB4F] font-bold">
                          {proyecto.country}
                        </span>
                      )}
                    </div>
                    {proyecto.description && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{proyecto.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.communities.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Users className="w-4 h-4 text-[#77C65E]" />
                <span>{language === 'es' ? 'Comunidades' : 'Communities'}</span>
              </div>
              <div className="space-y-2">
                {resultado.communities.map((comunidad) => (
                  <div key={comunidad.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <h4 className="font-serif text-sm font-bold text-white">{comunidad.name}</h4>
                    {comunidad.description && (
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{comunidad.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.opportunities.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#DCEB4F] uppercase tracking-wider mb-3">
                <Briefcase className="w-4 h-4 text-[#77C65E]" />
                <span>{language === 'es' ? 'Pasantías y Voluntariado' : 'Opportunities'}</span>
              </div>
              <div className="space-y-2">
                {resultado.opportunities.map((oportunidad) => (
                  <div key={oportunidad.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <h4 className="font-serif text-sm font-bold text-white">{oportunidad.title}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {[oportunidad.type, oportunidad.location].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                ))}
              </div>
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
