import React, { useState, useEffect } from 'react';
import { Language, Show } from '../types';
import { showsData } from '../data/mockData';
import { Ticket, Calendar, Users, Info, X, FileText, User, Image as ImageIcon, ZoomIn } from 'lucide-react';
import { GalleryButton, GalleryLightbox, toGalleryImages } from '../components/GalleryLightbox';
import { hasTickets, openProgram, mapearEventoAShow } from '../lib/shows';
import { getTranslations } from '../lib/i18n';
import { useGalleries } from '../hooks/useGalleries';

interface ShowsViewProps {
  language: Language;
  onOpenTickets: (show: Show) => void;
}

export const ShowsView: React.FC<ShowsViewProps> = ({ language, onOpenTickets }) => {
  const t = getTranslations(language).views.shows;
  const [filter, setFilter] = useState<'all' | 'current'>('current');
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [actorDetalle, setActorDetalle] = useState<{ name: string; role: string; photo?: string; biography?: string } | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<{ url: string; title: string; alt?: string } | null>(null);
  const [cardImageMode, setCardImageMode] = useState<Record<string, 'poster' | 'banner'>>({});
  const [obras, setObras] = useState<Show[]>(showsData);
  const [galleryShow, setGalleryShow] = useState<Show | null>(null);
  const es = language === 'es';
  const { galleryFor } = useGalleries();

  const getGalleryForShow = (show: Show): { url: string; alt_text?: string }[] => {
    const urls = galleryFor(show.id, show.gallery);
    if (urls && urls.length > 0) {
      return urls.map((item, i) => {
        const url = typeof item === 'string' ? item : item.url;
        const alt = typeof item === 'string' ? `${show.title} - Foto ${i + 1}` : (item.alt || `${show.title} - Foto ${i + 1}`);
        return { url, alt_text: alt };
      });
    }
    // Galería fotográfica de respaldo para producciones de temporada
    return [
      { url: show.banner || '/recursos/IMG_2903.PNG', alt_text: `${show.title} - Banner Principal` },
      { url: '/recursos/IMG_2906.PNG', alt_text: `${show.title} - Montaje Escénico` },
      { url: '/recursos/IMG_2907.PNG', alt_text: `${show.title} - Ensayo General` },
      { url: '/recursos/IMG_2908.PNG', alt_text: `${show.title} - Elenco Comunitario` },
    ];
  };

  useEffect(() => {
    async function cargarObras() {
      try {
        const res = await fetch('/api/v1/events');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setObras(data.map(mapearEventoAShow));
          }
        }
      } catch {}
    }
    void cargarObras();
  }, []);

  // Put 2026 / current shows first
  const currentShows = obras.filter(s => s.status === 'current');
  const pastShows = obras.filter(s => s.status === 'past');
  const allShows = [...currentShows, ...pastShows, ...obras.filter(s => s.status === 'upcoming')];

  const filteredShows = filter === 'current'
    ? (currentShows.length > 0 ? currentShows : obras)
    : allShows;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-lime text-xs font-bold uppercase tracking-wider border border-brand-green/40">
          {t.badge}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-navy dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {t.desc}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-xl bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border text-xs font-bold space-x-1">
          <button
            onClick={() => setFilter('current')}
            className={`px-5 py-2 rounded-lg transition-all ${
              filter === 'current'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white'
            }`}
          >
            {t.tab2026}
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white'
            }`}
          >
            {t.tabAll}
          </button>
        </div>
      </div>

      {/* Shows Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-2xl overflow-hidden hover:border-brand-green/60 transition-all duration-300 hover:-translate-y-1 shadow-card-dark flex flex-col justify-between group"
          >
            <div>
              {/* Poster & Banner image container */}
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-900 cursor-pointer" onClick={() => setSelectedShow(show)}>
                <img
                  src={(cardImageMode[show.id] === 'banner' && show.banner) ? show.banner : show.poster}
                  alt={show.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent"></div>

                {show.status === 'current' ? (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-green text-brand-navy text-xs font-extrabold uppercase tracking-wider shadow-lg">
                    {es ? 'CARTELERA' : 'NOW SHOWING'} {show.year}
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded bg-[#F8F8F2] dark:bg-brand-navyDark/80 text-slate-600 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-white/10">
                    {show.year}
                  </span>
                )}

                {/* Selector de Póster Vertical vs Horizontal */}
                <div className="absolute top-3 right-3 z-10 flex items-center bg-black/75 backdrop-blur-md rounded-xl p-0.5 border border-white/20 shadow-lg">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardImageMode((prev) => ({ ...prev, [show.id]: 'poster' }));
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                      (cardImageMode[show.id] || 'poster') === 'poster'
                        ? 'bg-brand-green text-brand-navy shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Póster
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardImageMode((prev) => ({ ...prev, [show.id]: 'banner' }));
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                      cardImageMode[show.id] === 'banner'
                        ? 'bg-brand-green text-brand-navy shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Horizontal
                  </button>
                </div>

                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#F8F8F2] dark:bg-brand-navyDark/90 text-brand-forest dark:text-brand-lime text-xs font-mono font-bold border border-slate-200 dark:border-brand-border">
                  ₡10,000 CRC
                </span>

                <GalleryButton
                  count={galleryFor(show.id, show.gallery).length}
                  language={language}
                  onClick={() => setGalleryShow(show)}
                  className="absolute bottom-3 left-3"
                />
              </div>

              {/* Card info */}
              <div className="p-6 space-y-3">
                <h3
                  onClick={() => setSelectedShow(show)}
                  className="font-serif text-2xl font-bold text-brand-navy dark:text-white group-hover:text-brand-green transition-colors cursor-pointer"
                >
                  {show.title} ({show.year})
                </h3>

                <div className="flex items-center space-x-2 text-xs text-brand-blue">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{show.dates}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {language === 'es' ? show.synopsis : show.synopsisEn}
                </p>

                {/* Actores que participan */}
                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 mt-0.5 shrink-0 text-brand-blue" aria-hidden="true" />
                  {show.cast && show.cast.length > 0 ? (
                    <p className="line-clamp-2">
                      {show.cast.map((c) => `${c.name} (${c.role})`).join(' · ')}
                    </p>
                  ) : (
                    <p className="italic">{es ? 'Elenco por anunciar' : 'Cast to be announced'}</p>
                  )}
                </div>

                {/* Galería de Fotos dentro de la Card */}
                {(() => {
                  const galleryList = getGalleryForShow(show);
                  if (galleryList.length === 0) return null;
                  return (
                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-brand-green" />
                          <span>Galería de Fotos</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{galleryList.length} fotos</span>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                        {galleryList.slice(0, 4).map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFotoAmpliada({ url: img.url, title: show.title, alt: img.alt_text });
                            }}
                            className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 hover:border-brand-green hover:scale-105 transition-all shadow-sm group/thumb"
                            title="Ver foto ampliada"
                          >
                            <img src={img.url} alt={img.alt_text || show.title} className="w-full h-full object-cover" />
                            {idx === 3 && galleryList.length > 4 && (
                              <div className="absolute inset-0 bg-black/65 flex items-center justify-center text-white text-[10px] font-extrabold group-hover/thumb:bg-black/50">
                                +{galleryList.length - 3}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 space-y-3">
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setSelectedShow(show)}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white font-medium flex items-center space-x-1"
                >
                  <Info className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Ver Ficha</span>
                </button>

                {hasTickets(show) ? (
                  <button
                    onClick={() => onOpenTickets(show)}
                    className="px-4 py-2.5 btn-green text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold rounded-lg shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider"
                  >
                    <Ticket className="w-3.5 h-3.5 text-brand-navy fill-current" />
                    <span>{t.buyTickets}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openProgram(show, () => setSelectedShow(show))}
                    className="px-4 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark hover:bg-slate-50 dark:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-brand-navy dark:text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 uppercase tracking-wider transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.viewProgram}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {galleryShow && (
        <GalleryLightbox
          title={`${galleryShow.title} (${galleryShow.year})`}
          images={toGalleryImages(galleryFor(galleryShow.id, galleryShow.gallery), galleryShow.title)}
          language={language}
          onClose={() => setGalleryShow(null)}
        />
      )}

      {/* Show Detail Modal */}
      {selectedShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-brand-navy dark:text-brand-cream max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-brand-navyDark flex items-center justify-between shrink-0">
              <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                {selectedShow.title} ({selectedShow.year})
              </h3>
              <button onClick={() => setSelectedShow(null)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Banner Horizontal Panorámico */}
              {selectedShow.banner && (
                <div className="w-full aspect-[21/9] sm:aspect-[16/7] rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm relative group/banner">
                  <img
                    src={selectedShow.banner}
                    alt={`${selectedShow.title} Banner Horizontal`}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] text-white font-bold border border-white/20">
                    Póster Horizontal / Banner
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-48 aspect-[3/4] rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                  <img src={selectedShow.poster} alt={selectedShow.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-3 flex-1">
                  <span className="text-xs font-mono text-brand-forest dark:text-brand-lime block font-bold">{selectedShow.dates}</span>
                  <h4 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">{selectedShow.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {language === 'es' ? selectedShow.synopsis : selectedShow.synopsisEn}
                  </p>
                  <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p><strong className="text-brand-navy dark:text-white">Teatro / Lugar:</strong> {selectedShow.location}</p>
                    <p><strong className="text-brand-navy dark:text-white">Dirección:</strong> {selectedShow.director}</p>
                  </div>
                </div>
              </div>

              {/* Cast List */}
              {/* Cast List */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h5 className="font-serif text-base font-bold text-brand-navy dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-green" />
                    <span>{es ? 'Elenco y Solistas Principales' : 'Cast & Main Soloists'}</span>
                  </h5>
                  {selectedShow.cast && selectedShow.cast.length > 0 && (
                    <span className="text-[11px] text-slate-500">{es ? 'Toca un actor para ver detalles' : 'Tap an actor for details'}</span>
                  )}
                </div>
                {!selectedShow.cast || selectedShow.cast.length === 0 ? (
                  <p className="text-xs italic text-slate-600 dark:text-slate-300">
                    {es ? 'Elenco por anunciar.' : 'Cast to be announced.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedShow.cast.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => setActorDetalle(c)}
                        className="p-2.5 rounded-xl bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border text-xs flex items-center space-x-2.5 cursor-pointer hover:border-brand-green/60 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-black/30 overflow-hidden shrink-0 border border-slate-300 dark:border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          {c.photo ? (
                            <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-brand-navy dark:text-white block truncate group-hover:text-brand-green transition-colors">
                            {c.name}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] block truncate">
                            {c.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Galería Completa de la Obra */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h5 className="font-serif text-base font-bold text-brand-navy dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-brand-green" />
                    <span>Galería Fotográfica de la Producción</span>
                  </h5>
                  <span className="text-[11px] text-slate-500">Toca para ampliar</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {getGalleryForShow(selectedShow).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFotoAmpliada({ url: img.url, title: selectedShow.title, alt: img.alt_text })}
                      className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 cursor-pointer hover:border-brand-green hover:scale-[1.02] transition-all shadow-sm relative group/gimg"
                    >
                      <img src={img.url} alt={img.alt_text || selectedShow.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/gimg:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ZoomIn className="w-5 h-5 text-brand-green" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Single Price Card */}
              <div className="p-4 rounded-xl bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-brand-navy dark:text-white block">Entrada General</span>
                  <span className="text-slate-600 dark:text-slate-300 text-[11px]">Acceso completo a la función</span>
                </div>
                <span className="font-mono text-base font-bold text-brand-forest dark:text-brand-lime">₡10,000 CRC</span>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 bg-[#F8F8F2] dark:bg-brand-navyDark border-t border-slate-200 dark:border-white/10 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedShow(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-brand-navy dark:text-white text-xs font-semibold"
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
                  className="px-6 py-2.5 rounded-xl btn-green text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold shadow-glow-green flex items-center space-x-2 uppercase tracking-wider"
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
                    className="px-6 py-2.5 rounded-xl bg-slate-50 dark:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-brand-navy dark:text-white text-xs font-bold flex items-center space-x-2 uppercase tracking-wider"
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

      {/* Modal de Detalle de Actor / Personaje */}
      {actorDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setActorDetalle(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-brand-green shadow-glow-green mb-4 bg-slate-100 dark:bg-brand-navyDark flex items-center justify-center">
              {actorDetalle.photo ? (
                <img src={actorDetalle.photo} alt={actorDetalle.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <h4 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
              {actorDetalle.name}
            </h4>
            <span className="inline-block px-3 py-1 mt-1 rounded-full text-xs font-bold bg-brand-green/20 text-brand-forest dark:text-brand-lime border border-brand-green/30">
              {actorDetalle.role}
            </span>

            <div className="mt-4 p-4 rounded-2xl bg-[#F8F8F2] dark:bg-brand-navyDark text-xs text-slate-600 dark:text-slate-300 text-left leading-relaxed max-h-44 overflow-y-auto border border-slate-200 dark:border-white/5">
              <p className="font-bold mb-1 text-slate-500 uppercase text-[10px]">Semblanza / Biografía:</p>
              <p>
                {actorDetalle.biography || (language === 'es' ? 'Integrante destacado del elenco artístico de Far Corners Community Theatre.' : 'Featured cast member of Far Corners Community Theatre.')}
              </p>
            </div>

            <button
              onClick={() => setActorDetalle(null)}
              className="mt-5 w-full py-2.5 bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-bold text-xs rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Lightbox de Foto Ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setFotoAmpliada(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-brand-navy border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-black/50 border-b border-white/10 flex items-center justify-between text-white text-xs">
              <span className="font-bold truncate">{fotoAmpliada.title} - {fotoAmpliada.alt || 'Fotografía de Producción'}</span>
              <button
                onClick={() => setFotoAmpliada(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-black/70 max-h-[75vh] overflow-hidden">
              <img
                src={fotoAmpliada.url}
                alt={fotoAmpliada.alt || fotoAmpliada.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
