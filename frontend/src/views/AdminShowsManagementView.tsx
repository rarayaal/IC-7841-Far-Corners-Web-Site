import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Coins,
  DollarSign,
  Star,
  CheckCircle2,
  X,
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  RefreshCw,
  Camera,
  User,
} from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

export interface PerformanceItem {
  id?: string;
  starts_at: string;
  venue: string;
  max_capacity: number;
  price_crc: number;
  price_usd: number;
}

export interface CastItem {
  full_name: string;
  role: string;
  biography?: string;
  photo_url?: string;
}

export interface ShowEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  venue: string | null;
  max_capacity: number;
  poster_url: string | null;
  banner_url: string | null;
  director: string | null;
  season_year: number | null;
  status: string;
  dates_label: string | null;
  is_published: boolean;
  is_featured: boolean;
  zeffy_url?: string | null;
  paypal_url?: string | null;
  sinpe_phone?: string | null;
  payment_methods?: string | null;
  performances?: any[];
  cast?: any[];
  media?: any[];
  inventory?: any[];
}

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt_text?: string;
}

export const AdminShowsManagementView: React.FC<{ language: Language }> = ({ language }) => {
  const isEs = language === 'es';
  const [shows, setShows] = useState<ShowEvent[]>([]);
  const [galeriaMedia, setGaleriaMedia] = useState<MediaItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  // Estado del Modal de Creación / Edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [director, setDirector] = useState('Equipo Far Corners');
  const [seasonYear, setSeasonYear] = useState('2026');
  const [posterUrl, setPosterUrl] = useState('/recursos/IMG_2905.PNG');
  const [bannerUrl, setBannerUrl] = useState('/recursos/IMG_2903.PNG');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Fechas y funciones
  const [performances, setPerformances] = useState<PerformanceItem[]>([]);

  // Elenco
  const [cast, setCast] = useState<CastItem[]>([]);

  // Galería asociada
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [customGalleryPhotos, setCustomGalleryPhotos] = useState<string[]>([]);

  // Pasarelas y métodos de pago por obra
  const [zeffyUrl, setZeffyUrl] = useState('');
  const [paypalUrl, setPaypalUrl] = useState('https://www.paypal.com/US/fundraiser/charity/1902778');
  const [sinpePhone, setSinpePhone] = useState('7131-7013');
  const [paymentMethods, setPaymentMethods] = useState<{ sinpe: boolean; zeffy: boolean; paypal: boolean }>({
    sinpe: true,
    zeffy: true,
    paypal: true,
  });

  // Diálogo para eliminar
  const [porEliminar, setPorEliminar] = useState<ShowEvent | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const dataShows = await apiAdminJson<ShowEvent[]>('/api/v1/events?admin=true');
      setShows(dataShows);

      try {
        const dataMedia = await apiAdminJson<MediaItem[]>('/api/v1/media');
        setGaleriaMedia(dataMedia);
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Error al cargar las producciones teatrales.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Carga automática de imagen optimizada a Data URL
  const handleImageFile = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1400;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          callback(dataUrl);
        }
      };
      img.onerror = () => callback(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const abrirNuevo = () => {
    setEditandoId(null);
    setTitle('');
    setDescription('');
    setDirector('Equipo Far Corners');
    setSeasonYear('2026');
    setPosterUrl('/recursos/IMG_2905.PNG');
    setBannerUrl('/recursos/IMG_2903.PNG');
    setIsFeatured(false);
    setIsPublished(true);
    setPerformances([
      {
        starts_at: '2026-10-15T19:00',
        venue: 'Teatro Comunitario Monteverde',
        max_capacity: 100,
        price_crc: 10000,
        price_usd: 20,
      },
    ]);
    setCast([{ full_name: '', role: '', biography: '', photo_url: '' }]);
    setSelectedMediaIds([]);
    setCustomGalleryPhotos([]);
    setZeffyUrl('');
    setPaypalUrl('https://www.paypal.com/US/fundraiser/charity/1902778');
    setSinpePhone('7131-7013');
    setPaymentMethods({ sinpe: true, zeffy: true, paypal: true });
    setModalAbierto(true);
  };

  const abrirEdicion = (show: ShowEvent) => {
    setEditandoId(show.id);
    setTitle(show.title);
    setDescription(show.description || '');
    setDirector(show.director || 'Equipo Far Corners');
    setSeasonYear(show.season_year ? String(show.season_year) : '2026');
    setPosterUrl(show.poster_url || '/recursos/IMG_2905.PNG');
    setBannerUrl(show.banner_url || '/recursos/IMG_2903.PNG');
    setIsFeatured(!!show.is_featured);
    setIsPublished(!!show.is_published);

    if (show.performances && show.performances.length > 0) {
      setPerformances(
        show.performances.map((p) => {
          const invCrc = p.inventory?.find((i: any) => i.currency === 'CRC');
          const invUsd = p.inventory?.find((i: any) => i.currency === 'USD');
          return {
            id: p.id,
            starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : '',
            venue: p.venue,
            max_capacity: p.max_capacity,
            price_crc: invCrc ? invCrc.price : 10000,
            price_usd: invUsd ? invUsd.price : 20,
          };
        })
      );
    } else {
      setPerformances([
        {
          starts_at: '2026-10-15T19:00',
          venue: show.venue || 'Teatro Comunitario Monteverde',
          max_capacity: show.max_capacity || 100,
          price_crc: 10000,
          price_usd: 20,
        },
      ]);
    }

    if (show.cast && show.cast.length > 0) {
      setCast(
        show.cast.map((c) => ({
          full_name: c.full_name,
          role: c.role,
          biography: c.biography || '',
          photo_url: c.photo_url || '',
        }))
      );
    } else {
      setCast([{ full_name: '', role: '', biography: '', photo_url: '' }]);
    }

    if (show.media && show.media.length > 0) {
      setSelectedMediaIds(show.media.map((m: any) => m.id));
    } else {
      setSelectedMediaIds([]);
    }
    setCustomGalleryPhotos([]);
    setZeffyUrl(show.zeffy_url || '');
    setPaypalUrl(show.paypal_url || 'https://www.paypal.com/US/fundraiser/charity/1902778');
    setSinpePhone(show.sinpe_phone || '7131-7013');
    const mStr = show.payment_methods || 'sinpe,zeffy,paypal';
    setPaymentMethods({
      sinpe: mStr.includes('sinpe'),
      zeffy: mStr.includes('zeffy'),
      paypal: mStr.includes('paypal'),
    });

    setModalAbierto(true);
  };

  const handleMarcarPrincipal = async (id: string) => {
    try {
      await apiAdminJson(`/api/v1/events/${id}/featured`, { method: 'PATCH' });
      setAviso(isEs ? 'Producción marcada como principal en la portada.' : 'Production set as featured on home.');
      await cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar producción principal.');
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isEs ? 'El título de la producción es obligatorio.' : 'Title is required.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        director: director.trim() || null,
        season_year: parseInt(seasonYear, 10) || 2026,
        poster_url: posterUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        is_featured: isFeatured,
        is_published: isPublished,
        zeffy_url: zeffyUrl.trim() || null,
        paypal_url: paypalUrl.trim() || null,
        sinpe_phone: sinpePhone.trim() || '7131-7013',
        payment_methods: Object.entries(paymentMethods)
          .filter(([_, active]) => active)
          .map(([method]) => method)
          .join(',') || 'sinpe,zeffy,paypal',
        performances: performances
          .filter((p) => p.starts_at && p.venue)
          .map((p) => ({
            id: p.id,
            starts_at: p.starts_at,
            venue: p.venue.trim(),
            max_capacity: Number(p.max_capacity) || 100,
            price_crc: Number(p.price_crc) || 10000,
            price_usd: Number(p.price_usd) || 20,
          })),
        cast: cast
          .filter((c) => c.full_name.trim() && c.role.trim())
          .map((c) => ({
            full_name: c.full_name.trim(),
            role: c.role.trim(),
            biography: c.biography ? c.biography.trim() : null,
            photo_url: c.photo_url ? c.photo_url.trim() : null,
          })),
        media_ids: selectedMediaIds,
      };

      if (editandoId) {
        await apiAdminJson(`/api/v1/events/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setAviso(isEs ? 'Producción y funciones actualizadas exitosamente.' : 'Production and performances updated successfully.');
      } else {
        await apiAdminJson('/api/v1/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setAviso(isEs ? 'Nueva producción registrada exitosamente.' : 'New production created successfully.');
      }

      setModalAbierto(false);
      await cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la producción.');
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await apiAdminJson(`/api/v1/events/${porEliminar.id}`, { method: 'DELETE' });
      setPorEliminar(null);
      setAviso(isEs ? 'Producción eliminada exitosamente.' : 'Production deleted successfully.');
      await cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la producción.');
    } finally {
      setEliminando(false);
    }
  };

  const agregarFuncion = () => {
    setPerformances([
      ...performances,
      {
        starts_at: '2026-10-16T19:00',
        venue: 'Teatro Comunitario Monteverde',
        max_capacity: 100,
        price_crc: 10000,
        price_usd: 20,
      },
    ]);
  };

  const quitarFuncion = (index: number) => {
    setPerformances(performances.filter((_, i) => i !== index));
  };

  const agregarActor = () => {
    setCast([...cast, { full_name: '', role: '', biography: '', photo_url: '' }]);
  };

  const quitarActor = (index: number) => {
    setCast(cast.filter((_, i) => i !== index));
  };

  const toggleMediaId = (id: string) => {
    if (selectedMediaIds.includes(id)) {
      setSelectedMediaIds(selectedMediaIds.filter((mId) => mId !== id));
    } else {
      setSelectedMediaIds([...selectedMediaIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <ToastRegion>
        {aviso && <Toast message={aviso} variant="success" closeLabel={isEs ? 'Cerrar' : 'Close'} onClose={() => setAviso('')} />}
        {error && <Toast message={error} variant="error" closeLabel={isEs ? 'Cerrar' : 'Close'} onClose={() => setError('')} />}
      </ToastRegion>

      {/* Header */}
      <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-brand-navy dark:text-white flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-brand-green" />
            <span>{isEs ? 'Gestión de Proyectos' : 'Projects Management'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEs
              ? 'Administra los proyectos teatrales, funciones con fechas y aforos, elenco y designación de obra principal.'
              : 'Manage theatre projects, schedules, capacity, pricing, cast, and featured hero.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={abrirNuevo}
            className="px-4 py-2.5 btn-green text-brand-navy font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-glow-green flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isEs ? 'Nueva Producción' : 'New Production'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Producciones */}
      {cargando ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-green" />
          <span>{isEs ? 'Cargando producciones...' : 'Loading productions...'}</span>
        </div>
      ) : shows.length === 0 ? (
        <div className="p-12 bg-[#F8F8F2] dark:bg-brand-navyDark rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-serif text-base font-bold text-brand-navy dark:text-white">
            {isEs ? 'No hay producciones registradas aún' : 'No productions registered yet'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isEs
              ? 'Comienza creando la primera obra teatral para programar sus funciones y activar la boletería.'
              : 'Create your first production to schedule performances and open ticketing.'}
          </p>
          <button
            onClick={abrirNuevo}
            className="px-4 py-2 btn-green text-brand-navy font-bold rounded-xl text-xs"
          >
            {isEs ? 'Crear Primera Obra' : 'Create First Show'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => {
            const esPrincipal = !!show.is_featured;
            const perfs = show.performances || [];

            return (
              <div
                key={show.id}
                className={`bg-[#F8F8F2] dark:bg-brand-navyDark rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-sm ${
                  esPrincipal
                    ? 'border-brand-green ring-1 ring-brand-green shadow-glow-green'
                    : 'border-slate-200 dark:border-brand-border hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Poster Thumbnail */}
                  <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-black/50 overflow-hidden relative">
                    <img
                      src={show.banner_url || show.poster_url || '/recursos/IMG_2905.PNG'}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex space-x-1.5">
                      {esPrincipal && (
                        <span className="bg-brand-green text-brand-navy px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{isEs ? 'Destacada' : 'Featured'}</span>
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        show.is_published ? 'bg-emerald-500/80 text-white' : 'bg-slate-500/80 text-white'
                      }`}>
                        {show.is_published ? (isEs ? 'Pública' : 'Published') : (isEs ? 'Borrador' : 'Draft')}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono">
                      {show.season_year || 2026}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white leading-tight">
                        {show.title}
                      </h3>
                      <p className="text-xs text-brand-forest dark:text-brand-lime font-medium mt-0.5">
                        {show.director || 'Equipo Far Corners'}
                      </p>
                    </div>

                    {show.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {show.description}
                      </p>
                    )}

                    {/* Resumen de Funciones */}
                    <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-green" />
                          <span>{perfs.length} {isEs ? 'funciones programadas' : 'performances'}</span>
                        </span>
                        <span className="font-mono text-brand-forest dark:text-brand-lime font-bold">
                          {perfs[0]?.price_crc ? `₡${perfs[0].price_crc.toLocaleString()}` : '₡10,000'} CRC
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[200px]">{show.venue || 'Teatro Comunitario'}</span>
                        <span>{show.cast?.length || 0} {isEs ? 'actores' : 'cast'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-slate-100 dark:bg-brand-navyDeep border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleMarcarPrincipal(show.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      esPrincipal
                        ? 'bg-brand-green/20 text-brand-green border border-brand-green/40'
                        : 'bg-white/5 hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${esPrincipal ? 'fill-brand-green' : ''}`} />
                    <span>{esPrincipal ? (isEs ? 'Destacada' : 'Featured') : isEs ? 'Hacer Principal' : 'Set Featured'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => abrirEdicion(show)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-200 hover:text-brand-navy dark:hover:text-white"
                      title={isEs ? 'Editar' : 'Edit'}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPorEliminar(show)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-300"
                      title={isEs ? 'Eliminar' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear / Editar Producción Completa */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-3xl my-8 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-[#F8F8F2] dark:bg-brand-navyDark shrink-0">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                  {editandoId
                    ? isEs ? 'Editar Producción Teatral' : 'Edit Production'
                    : isEs ? 'Nueva Producción Teatral' : 'New Production'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEs
                    ? 'Configura afiche, funciones con precios en CRC/USD, elenco con fotos y galería.'
                    : 'Set poster, performances, pricing, cast with photos, and gallery.'}
                </p>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleGuardar} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-200">
              {/* Información General */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider">
                  {isEs ? '1. Información de la Producción' : '1. Production Info'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      {isEs ? 'Título de la Obra *' : 'Show Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Merlina (Wednesday Addams)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      {isEs ? 'Director / Dirección' : 'Director'}
                    </label>
                    <input
                      type="text"
                      value={director}
                      onChange={(e) => setDirector(e.target.value)}
                      placeholder="Equipo Far Corners"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      {isEs ? 'Año de Temporada' : 'Season Year'}
                    </label>
                    <input
                      type="number"
                      value={seasonYear}
                      onChange={(e) => setSeasonYear(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-brand-navy dark:text-white font-mono focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                      {isEs ? 'Sinopsis de la Obra' : 'Synopsis'}
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={isEs ? 'Sinopsis de la obra teatral...' : 'Synopsis...'}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  {/* Afiche / Poster con carga automática de imagen */}
                  <div className="p-3 bg-slate-50 dark:bg-brand-navyDark rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs">
                      {isEs ? 'Afiche Vertical (Poster)' : 'Vertical Poster'}
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-20 bg-slate-200 dark:bg-black/40 rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 shrink-0">
                        {posterUrl ? (
                          <img src={posterUrl} alt="Poster" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="cursor-pointer px-3 py-1.5 bg-brand-green text-brand-navy font-extrabold rounded-lg text-xs inline-flex items-center space-x-1.5 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isEs ? 'Subir Imagen' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageFile(f, setPosterUrl);
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={posterUrl}
                          onChange={(e) => setPosterUrl(e.target.value)}
                          placeholder="o ingresa URL de imagen"
                          className="w-full px-2 py-1 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Banner Horizontal con carga automática de imagen */}
                  <div className="p-3 bg-slate-50 dark:bg-brand-navyDark rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                    <label className="block text-slate-600 dark:text-slate-300 font-semibold text-xs">
                      {isEs ? 'Banner Horizontal de Portada' : 'Horizontal Banner'}
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-16 bg-slate-200 dark:bg-black/40 rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 shrink-0">
                        {bannerUrl ? (
                          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="cursor-pointer px-3 py-1.5 bg-brand-green text-brand-navy font-extrabold rounded-lg text-xs inline-flex items-center space-x-1.5 shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isEs ? 'Subir Imagen' : 'Upload Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageFile(f, setBannerUrl);
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          placeholder="o ingresa URL de imagen"
                          className="w-full px-2 py-1 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción de Producción Principal */}
                <div className="pt-2 flex items-center space-x-3 bg-brand-green/10 p-3.5 rounded-xl border border-brand-green/30">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-green focus:ring-0"
                  />
                  <label htmlFor="isFeatured" className="cursor-pointer">
                    <span className="font-bold text-brand-navy dark:text-white block">
                      {isEs ? 'Marcar como Producción Principal de Portada' : 'Set as Featured Production on Home'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {isEs
                        ? 'Esta obra aparecerá de inmediato en el banner estelar de la portada principal.'
                        : 'This show will appear in the main hero and season banner.'}
                    </span>
                  </label>
                </div>
              </div>

              {/* 2. Funciones de la Obra y Precios */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider">
                      {isEs ? '2. Fechas de Función y Precios' : '2. Performance Dates & Pricing'}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {isEs ? 'Ajusta fechas, aforo y tarifas en Colones y Dólares' : 'Adjust dates, capacity and prices'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={agregarFuncion}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-green text-brand-navy text-xs font-extrabold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Agregar Función' : 'Add Date'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {performances.map((perf, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                          {isEs ? 'Fecha y Hora *' : 'Date & Time *'}
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={perf.starts_at}
                          onChange={(e) => {
                            const copy = [...performances];
                            copy[index].starts_at = e.target.value;
                            setPerformances(copy);
                          }}
                          className="w-full px-2.5 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white font-mono text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                          {isEs ? 'Lugar / Teatro *' : 'Venue *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={perf.venue}
                          onChange={(e) => {
                            const copy = [...performances];
                            copy[index].venue = e.target.value;
                            setPerformances(copy);
                          }}
                          className="w-full px-2.5 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                          {isEs ? 'Aforo' : 'Capacity'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={perf.max_capacity}
                          onChange={(e) => {
                            const copy = [...performances];
                            copy[index].max_capacity = parseInt(e.target.value, 10) || 100;
                            setPerformances(copy);
                          }}
                          className="w-full px-2.5 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white font-mono text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                          ₡ CRC
                        </label>
                        <input
                          type="number"
                          value={perf.price_crc}
                          onChange={(e) => {
                            const copy = [...performances];
                            copy[index].price_crc = parseFloat(e.target.value) || 0;
                            setPerformances(copy);
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white font-mono font-bold text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                          $ USD
                        </label>
                        <input
                          type="number"
                          value={perf.price_usd}
                          onChange={(e) => {
                            const copy = [...performances];
                            copy[index].price_usd = parseFloat(e.target.value) || 0;
                            setPerformances(copy);
                          }}
                          className="w-full px-2.5 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white font-mono font-bold text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {performances.length > 1 && (
                          <button
                            type="button"
                            onClick={() => quitarFuncion(index)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                            title="Eliminar función"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Elenco y Actores con Fotos */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider">
                      {isEs ? '3. Elenco y Actores' : '3. Cast & Characters'}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {isEs ? 'Agrega fotos y biografías para que se muestren al tocarlos en la cartelera' : 'Add photos and bio'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={agregarActor}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-green text-brand-navy text-xs font-extrabold shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Agregar Actor' : 'Add Cast Member'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {cast.map((actor, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      {/* Foto del Actor */}
                      <div className="sm:col-span-2 flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-brand-navy overflow-hidden border border-slate-300 dark:border-white/10 shrink-0 flex items-center justify-center">
                          {actor.photo_url ? (
                            <img src={actor.photo_url} alt={actor.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <label className="cursor-pointer p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-300 text-[10px] font-bold" title="Subir foto del actor">
                          <Camera className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleImageFile(f, (url) => {
                                  const copy = [...cast];
                                  copy[idx].photo_url = url;
                                  setCast(copy);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder={isEs ? 'Nombre del Actor' : 'Actor name'}
                          value={actor.full_name}
                          onChange={(e) => {
                            const copy = [...cast];
                            copy[idx].full_name = e.target.value;
                            setCast(copy);
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder={isEs ? 'Papel / Rol' : 'Role'}
                          value={actor.role}
                          onChange={(e) => {
                            const copy = [...cast];
                            copy[idx].role = e.target.value;
                            setCast(copy);
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder={isEs ? 'Biografía / descripción' : 'Bio description'}
                          value={actor.biography || ''}
                          onChange={(e) => {
                            const copy = [...cast];
                            copy[idx].biography = e.target.value;
                            setCast(copy);
                          }}
                          className="w-full px-3 py-1.5 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white text-xs"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        {cast.length > 1 && (
                          <button
                            type="button"
                            onClick={() => quitarActor(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Galería Multimedia */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center">
                  <h4 className="font-serif text-sm font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider">
                    {isEs ? '4. Galería de Fotos de la Obra' : '4. Photo Gallery'}
                  </h4>
                </div>

                {galeriaMedia.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-brand-navyDark rounded-xl border border-slate-200 dark:border-white/10">
                    {galeriaMedia.map((m) => {
                      const selected = selectedMediaIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleMediaId(m.id)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer relative group ${
                            selected ? 'border-brand-green' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={m.url} alt={m.filename} className="w-full h-full object-cover" />
                          {selected && (
                            <div className="absolute top-1 right-1 bg-brand-green text-brand-navy rounded-full p-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    {isEs
                      ? 'No hay imágenes globales en la galería. Las fotos del afiche y banner se asociarán automáticamente.'
                      : 'No media uploaded in gallery.'}
                  </p>
                )}
              </div>

              {/* 5. Métodos de Pago y Pasarelas de Boletería */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                <div>
                  <h4 className="font-serif text-sm font-bold text-brand-forest dark:text-brand-lime uppercase tracking-wider">
                    {isEs ? '5. Métodos de Pago y Pasarelas de Boletería' : '5. Payment Gateways & Methods'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isEs
                      ? 'Activa los métodos de pago disponibles para esta obra y define sus enlaces o números específicos.'
                      : 'Enable payment methods and custom links/numbers for this show.'}
                  </p>
                </div>

                {/* Selección de Métodos Activos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                    paymentMethods.sinpe
                      ? 'bg-brand-green/15 border-brand-green text-brand-navy dark:text-white font-bold'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={paymentMethods.sinpe}
                      onChange={(e) => setPaymentMethods((p) => ({ ...p, sinpe: e.target.checked }))}
                      className="rounded text-brand-green focus:ring-brand-green"
                    />
                    <span className="text-xs">SINPE Móvil</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                    paymentMethods.zeffy
                      ? 'bg-brand-green/15 border-brand-green text-brand-navy dark:text-white font-bold'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={paymentMethods.zeffy}
                      onChange={(e) => setPaymentMethods((p) => ({ ...p, zeffy: e.target.checked }))}
                      className="rounded text-brand-green focus:ring-brand-green"
                    />
                    <span className="text-xs">Zeffy (0% com)</span>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                    paymentMethods.paypal
                      ? 'bg-brand-green/15 border-brand-green text-brand-navy dark:text-white font-bold'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                  }`}>
                    <input
                      type="checkbox"
                      checked={paymentMethods.paypal}
                      onChange={(e) => setPaymentMethods((p) => ({ ...p, paypal: e.target.checked }))}
                      className="rounded text-brand-green focus:ring-brand-green"
                    />
                    <span className="text-xs">PayPal</span>
                  </label>
                </div>

                {/* Enlaces y Datos de cada método activo */}
                <div className="space-y-3 bg-slate-50 dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10">
                  {paymentMethods.sinpe && (
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        {isEs ? 'Número Telefónico SINPE Móvil' : 'SINPE Mobile Number'}
                      </label>
                      <input
                        type="text"
                        value={sinpePhone}
                        onChange={(e) => setSinpePhone(e.target.value)}
                        placeholder="7131-7013"
                        className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white font-mono text-xs focus:border-brand-green focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isEs ? 'Número al que los clientes transferirán el valor del boleto.' : 'Phone patrons will send money to.'}
                      </span>
                    </div>
                  )}

                  {paymentMethods.zeffy && (
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        {isEs ? 'Enlace de Compra en Zeffy (Ticketing URL)' : 'Zeffy Ticketing Link'}
                      </label>
                      <input
                        type="url"
                        value={zeffyUrl}
                        onChange={(e) => setZeffyUrl(e.target.value)}
                        placeholder="https://www.zeffy.com/ticketing/nombre-obra"
                        className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white text-xs focus:border-brand-green focus:outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isEs ? 'Dejar en blanco para usar la plataforma general de Zeffy.' : 'Leave blank for default.'}
                      </span>
                    </div>
                  )}

                  {paymentMethods.paypal && (
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                        {isEs ? 'Enlace de Pago en PayPal (Charity / Fundraiser URL)' : 'PayPal Charity/Payment Link'}
                      </label>
                      <input
                        type="url"
                        value={paypalUrl}
                        onChange={(e) => setPaypalUrl(e.target.value)}
                        placeholder="https://www.paypal.com/US/fundraiser/charity/1902778"
                        className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-lg text-brand-navy dark:text-white text-xs focus:border-brand-green focus:outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isEs ? 'Enlace oficial al que se redirige al comprador al pagar con PayPal.' : 'Official link for PayPal payment.'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción del Modal */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-brand-navy dark:text-white font-bold text-xs"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 btn-green text-brand-navy font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-glow-green flex items-center space-x-2"
                >
                  {guardando && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{guardando ? (isEs ? 'Guardando...' : 'Saving...') : isEs ? 'Guardar Cambios' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Eliminar */}
      {porEliminar && (
        <ConfirmDialog
          open={!!porEliminar}
          title={isEs ? '¿Eliminar producción teatral?' : 'Delete production?'}
          message={
            isEs
              ? `¿Estás seguro de que deseas eliminar permanentemente la obra "${porEliminar?.title}"? Se eliminarán también sus funciones programadas e inventarios asociados.`
              : `Are you sure you want to delete "${porEliminar?.title}" and all associated performances?`
          }
          confirmLabel={isEs ? 'Sí, eliminar' : 'Yes, delete'}
          busyLabel={isEs ? 'Eliminando...' : 'Deleting...'}
          cancelLabel={isEs ? 'Cancelar' : 'Cancel'}
          busy={eliminando}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setPorEliminar(null)}
        />
      )}
    </div>
  );
};
