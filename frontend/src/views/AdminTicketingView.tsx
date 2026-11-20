import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Ticket, Calendar, CheckCircle2, AlertTriangle, Loader2,
  DollarSign, Package, TrendingUp, QrCode, Search, Filter,
  Check, Download, Camera, RefreshCw, UserCheck, ShieldAlert, Mail
} from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface EventOption {
  id: string;
  title: string;
  season_year?: number;
  status?: string;
  is_featured?: boolean;
}

interface PerformanceMetric {
  performance_id: string;
  event_id: string;
  starts_at: string;
  ends_at?: string;
  venue: string;
  max_capacity: number;
  status: string;
  total_sold: number;
  total_available: number;
  price_crc: number;
  price_usd: number;
}

interface TicketItem {
  ticket_id: string;
  qr_code: string;
  ticket_status: 'active' | 'used' | 'refunded';
  ticket_created_at: string;
  ticket_type: string;
  price: number;
  currency: string;
  purchase_id: string;
  buyer_name: string | null;
  buyer_email: string | null;
  purchase_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id: string;
  total_amount: number;
  purchase_created_at: string;
}

interface QrValidationResult {
  valid: boolean;
  message: string;
  error?: string;
  ticket?: any;
}

export const AdminTicketingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'tickets' | 'scanner'>('metrics');

  // Eventos / Producciones
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Funciones y Métricas
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState('');

  // Boletos por función
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string>('');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketsFilter, setTicketsFilter] = useState<'all' | 'pending' | 'paid' | 'used'>('all');
  const [ticketsSearch, setTicketsSearch] = useState('');
  const [validatingSinpeId, setValidatingSinpeId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Escáner QR en puerta
  const [scannerQrInput, setScannerQrInput] = useState('');
  const [validatingQr, setValidatingQr] = useState(false);
  const [qrResult, setQrResult] = useState<QrValidationResult | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // 1. Cargar lista de eventos reales desde la BD
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch('/api/v1/events?admin=true');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar producciones para boletería:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // 2. Cargar métricas de funciones de la obra seleccionada
  const fetchMetrics = useCallback(async () => {
    if (!selectedEventId) return;
    setLoadingMetrics(true);
    setMetricsError('');
    try {
      const res = await fetch(`/api/v1/tickets/events/${selectedEventId}/performances-metrics`);
      if (!res.ok) throw new Error(`Error al consultar métricas (${res.status})`);
      const data = await res.json();
      setMetrics(data);
      if (data.length > 0 && !selectedPerformanceId) {
        setSelectedPerformanceId(data[0].performance_id);
      }
    } catch (err: any) {
      setMetricsError(err.message || 'Error al cargar métricas de funciones.');
    } finally {
      setLoadingMetrics(false);
    }
  }, [selectedEventId, selectedPerformanceId]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  // 3. Cargar lista de boletos para la función seleccionada
  const fetchTickets = useCallback(async () => {
    if (!selectedPerformanceId) return;
    setLoadingTickets(true);
    try {
      const res = await apiAdminJson<TicketItem[]>(
        `/api/v1/tickets/performances/${selectedPerformanceId}/tickets`
      );
      setTickets(res);
    } catch (err) {
      console.error('Error al cargar boletos de la función:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, [selectedPerformanceId]);

  useEffect(() => {
    if (activeTab === 'tickets' || activeTab === 'scanner') {
      void fetchTickets();
    }
  }, [activeTab, fetchTickets]);

  // Validar Pago SINPE
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  const handleResendEmail = async (purchaseId: string, email?: string) => {
    setResendingEmailId(purchaseId);
    setActionSuccessMsg('');
    try {
      const res: any = await apiAdminJson(`/api/v1/tickets/purchases/${purchaseId}/resend-email`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setActionSuccessMsg(res.message || 'Boletos reenviados por correo exitosamente.');
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al reenviar boletos por correo.');
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleValidateSinpe = async (purchaseId: string) => {
    setValidatingSinpeId(purchaseId);
    setActionSuccessMsg('');
    try {
      await apiAdminJson(`/api/v1/tickets/purchases/${purchaseId}/validate-sinpe`, {
        method: 'PATCH',
      });
      setActionSuccessMsg('¡Pago SINPE validado exitosamente! Boletos activados y enviados por correo.');
      await fetchTickets();
      await fetchMetrics();
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al validar pago SINPE');
    } finally {
      setValidatingSinpeId(null);
    }
  };

  // Validar Código QR en Puerta
  const handleValidateQr = async (codeToValidate?: string) => {
    const code = codeToValidate || scannerQrInput;
    if (!code.trim()) return;

    setValidatingQr(true);
    setQrResult(null);

    try {
      const res = await apiAdminJson<QrValidationResult>('/api/v1/tickets/validate-qr', {
        method: 'POST',
        body: JSON.stringify({
          qr_code: code.trim(),
          performance_id: selectedPerformanceId || undefined,
        }),
      });

      setQrResult(res);
      setScannerQrInput('');
      await fetchTickets();
      await fetchMetrics();
    } catch (err: any) {
      setQrResult({
        valid: false,
        message: err.message || 'Error al validar código QR.',
        error: 'SERVER_ERROR',
      });
    } finally {
      setValidatingQr(false);
    }
  };

  // Manejo de Cámara para el Escáner
  const startCamera = async () => {
    setCameraError('');
    try {
      stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      videoStreamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play warning:', e);
        }
      }

      // Si el navegador soporta la API nativa BarcodeDetector
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !videoStreamRef.current) {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
            return;
          }
          try {
            if (videoRef.current.readyState >= 2) {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detectedVal = barcodes[0].rawValue;
                if (detectedVal) {
                  stopCamera();
                  void handleValidateQr(detectedVal);
                }
              }
            }
          } catch {}
        }, 300);
      } else {
        setCameraError(
          'Aviso: Tu navegador no soporta detección automática BarcodeDetector. Puedes usar un lector/pistola QR USB o pegar el código directamente en el campo inferior para validación instantánea.'
        );
      }
    } catch (err: any) {
      console.error('Error al iniciar cámara:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Otorga permiso a la cámara en tu navegador.'
          : err.name === 'NotFoundError'
          ? 'No se detectó cámara en este dispositivo.'
          : 'No se pudo activar la cámara. Puedes ingresar el código manualmente abajo.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && videoStreamRef.current) {
      if (videoRef.current.srcObject !== videoStreamRef.current) {
        videoRef.current.srcObject = videoStreamRef.current;
        void videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Métricas agregadas
  const totalCapacidad = metrics.reduce((s, m) => s + m.max_capacity, 0);
  const totalVendidos = metrics.reduce((s, m) => s + m.total_sold, 0);
  const totalDisponibles = metrics.reduce((s, m) => s + m.total_available, 0);
  const totalRecaudadoCrc = metrics.reduce((s, m) => s + (m.price_crc * m.total_sold), 0);
  const selectedMetric = metrics.find((m) => m.performance_id === selectedPerformanceId) || metrics[0];

  // Filtrado de boletos
  const boletosFiltrados = tickets.filter((t) => {
    if (ticketsFilter === 'pending' && t.purchase_status !== 'pending') return false;
    if (ticketsFilter === 'paid' && t.purchase_status !== 'paid') return false;
    if (ticketsFilter === 'used' && t.ticket_status !== 'used') return false;

    if (ticketsSearch.trim()) {
      const q = ticketsSearch.toLowerCase();
      const matchName = t.buyer_name?.toLowerCase().includes(q);
      const matchEmail = t.buyer_email?.toLowerCase().includes(q);
      const matchQr = t.qr_code.toLowerCase().includes(q);
      const matchIntent = t.payment_intent_id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchQr && !matchIntent) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header y Selector de Obra */}
      <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-brand-navy dark:text-white flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-brand-green" />
            <span>Gestión de Boletería y Taquilla</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supervisión de aforos, métricas por función, validación de pagos SINPE y escaneo en puerta.
          </p>
        </div>

        {/* Dropdown de Proyectos */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 flex-shrink-0">
            Proyecto:
          </label>
          {loadingEvents ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
          ) : (
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setSelectedPerformanceId('');
              }}
              className="px-3.5 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-brand-border rounded-xl text-xs font-bold text-brand-navy dark:text-white focus:outline-none focus:border-brand-green"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.season_year || 2026}) {evt.is_featured ? '★' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabs Principales */}
      <div className="flex border-b border-slate-200 dark:border-white/10 space-x-4">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'metrics'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Funciones y Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'tickets'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Boletos y Validación SINPE</span>
          {tickets.some((t) => t.purchase_status === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 border-b-2 ${
            activeTab === 'scanner'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Escáner en Puerta (Check-in)</span>
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 1: FUNCIONES Y MÉTRICAS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas Globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-brand-border">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                Capacidad Total
              </span>
              <span className="text-2xl font-bold font-mono text-brand-navy dark:text-white mt-1 block">
                {totalCapacidad}
              </span>
              <span className="text-[10px] text-slate-400">asientos en todas las funciones</span>
            </div>

            <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-brand-border">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block uppercase">
                Boletos Vendidos
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                {totalVendidos}
              </span>
              <span className="text-[10px] text-slate-400">
                {totalCapacidad > 0 ? `${Math.round((totalVendidos / totalCapacidad) * 100)}% ocupación global` : '0%'}
              </span>
            </div>

            <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-brand-border">
              <span className="text-[11px] font-semibold text-brand-forest dark:text-brand-lime block uppercase">
                Boletos Disponibles
              </span>
              <span className="text-2xl font-bold font-mono text-brand-forest dark:text-brand-lime mt-1 block">
                {totalDisponibles}
              </span>
              <span className="text-[10px] text-slate-400">aforo libre restante</span>
            </div>

            <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-brand-border">
              <span className="text-[11px] font-semibold text-brand-green block uppercase">
                Recaudación Est. (CRC)
              </span>
              <span className="text-xl font-bold font-mono text-brand-green mt-1 block">
                ₡{totalRecaudadoCrc.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">ingresos brutos estimados</span>
            </div>
          </div>

          {/* Lista de Funciones con Desglose Detallado */}
          <div className="bg-[#F8F8F2] dark:bg-brand-navyDark rounded-2xl border border-slate-200 dark:border-brand-border p-5">
            <h3 className="font-serif text-base font-bold text-brand-navy dark:text-white mb-4">
              Desglose de Funciones Programadas
            </h3>

            {loadingMetrics ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
                <span>Cargando funciones y aforos...</span>
              </div>
            ) : metrics.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Este proyecto no tiene funciones individuales registradas aún. Puedes agregarlas desde la pestaña "Proyectos".
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.map((perf, index) => {
                  const pct = perf.max_capacity > 0 ? Math.min(100, Math.round((perf.total_sold / perf.max_capacity) * 100)) : 0;

                  let fechaStr = perf.starts_at;
                  try {
                    const d = new Date(perf.starts_at);
                    if (!isNaN(d.getTime())) {
                      fechaStr = d.toLocaleString('es-CR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                  } catch {}

                  return (
                    <div
                      key={perf.performance_id}
                      className="bg-white dark:bg-brand-navy p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:border-brand-green/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">
                              Función #{index + 1}
                            </span>
                            <span className="font-bold text-sm text-brand-navy dark:text-white capitalize">
                              {fechaStr}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                            Lugar: <strong>{perf.venue}</strong>
                          </span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Tarifas</span>
                            <span className="font-mono text-xs font-bold text-brand-navy dark:text-white">
                              ₡{perf.price_crc.toLocaleString()} CRC / ${perf.price_usd} USD
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedPerformanceId(perf.performance_id);
                              setActiveTab('tickets');
                            }}
                            className="px-3 py-1.5 bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-bold rounded-lg text-xs hover:opacity-90 transition-opacity"
                          >
                            Ver Boletos
                          </button>
                        </div>
                      </div>

                      {/* Barra de progreso de aforo */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            Vendidos: <strong className="text-emerald-600 dark:text-emerald-400">{perf.total_sold}</strong> de <strong>{perf.max_capacity}</strong>
                          </span>
                          <span className="font-mono font-bold text-brand-forest dark:text-brand-lime">
                            {perf.total_available} disponibles ({pct}% aforo)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-brand-navyDark rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-brand-green'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 2: LISTA DE BOLETOS Y VALIDACIÓN SINPE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Panel de Control de Función y Filtros */}
          <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-4 shadow-sm">
            {/* Fila 1: Selección de Función con Métricas Rápidas */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-brand-green/20 text-brand-green border border-brand-green/40">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                    Función Seleccionada:
                  </label>
                  <select
                    value={selectedPerformanceId}
                    onChange={(e) => setSelectedPerformanceId(e.target.value)}
                    className="mt-1 px-3.5 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-brand-border rounded-xl text-xs font-bold text-brand-navy dark:text-white shadow-sm focus:outline-none focus:border-brand-green"
                  >
                    {metrics.map((m, i) => (
                      <option key={m.performance_id} value={m.performance_id}>
                        Función #{i + 1} • {new Date(m.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({m.venue})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Indicadores de Aforo de la Función */}
              {selectedMetric && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 font-medium">
                    Aforo Total: <strong className="text-brand-navy dark:text-white">{selectedMetric.max_capacity}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium">
                    Vendidos: <strong>{selectedMetric.total_sold}</strong>
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-forest dark:text-brand-lime font-medium">
                    Disponibles: <strong>{selectedMetric.total_available}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Fila 2: Búsqueda y Filtros de Estado */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Barra de Búsqueda */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o código QR..."
                  value={ticketsSearch}
                  onChange={(e) => setTicketsSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-brand-border rounded-xl text-xs text-brand-navy dark:text-white shadow-sm focus:outline-none focus:border-brand-green"
                />
                {ticketsSearch && (
                  <button
                    onClick={() => setTicketsSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Botones de Filtro Segmentados */}
              <div className="md:col-span-7 flex flex-wrap gap-1.5 justify-start md:justify-end">
                <button
                  onClick={() => setTicketsFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketsFilter === 'all'
                      ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                      : 'bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>Todos</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{tickets.length}</span>
                </button>

                <button
                  onClick={() => setTicketsFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketsFilter === 'pending'
                      ? 'bg-amber-400 text-brand-navy font-extrabold shadow-sm'
                      : 'bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pendiente SINPE</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{tickets.filter((t) => t.purchase_status === 'pending').length}</span>
                </button>

                <button
                  onClick={() => setTicketsFilter('paid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketsFilter === 'paid'
                      ? 'bg-emerald-500 text-white font-extrabold shadow-sm'
                      : 'bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>Pagados</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{tickets.filter((t) => t.purchase_status === 'paid').length}</span>
                </button>

                <button
                  onClick={() => setTicketsFilter('used')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketsFilter === 'used'
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                      : 'bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>Usados en Puerta</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/10">{tickets.filter((t) => t.ticket_status === 'used').length}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Boletos */}
          <div className="bg-[#F8F8F2] dark:bg-brand-navyDark rounded-2xl border border-slate-200 dark:border-brand-border overflow-hidden shadow-sm">
            {loadingTickets ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
                <span>Cargando boletos registrados...</span>
              </div>
            ) : boletosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No hay boletos que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-brand-navyDeep text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th className="py-3 px-4">Asistente</th>
                      <th className="py-3 px-4">Código QR</th>
                      <th className="py-3 px-4">Referencia Pago</th>
                      <th className="py-3 px-4">Monto</th>
                      <th className="py-3 px-4">Estado Pago</th>
                      <th className="py-3 px-4">Estado Boleto</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {boletosFiltrados.map((tItem) => (
                      <tr key={tItem.ticket_id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-brand-navy dark:text-white block">
                            {tItem.buyer_name || 'Sin registrar'}
                          </span>
                          <span className="text-[11px] text-slate-400">{tItem.buyer_email || 'No email'}</span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-brand-forest dark:text-brand-lime">
                          {tItem.qr_code}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {tItem.payment_intent_id}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-brand-navy dark:text-white">
                          {tItem.currency === 'USD' ? `$${tItem.price}` : `₡${tItem.price.toLocaleString()}`}
                        </td>

                        <td className="py-3 px-4">
                          {tItem.purchase_status === 'paid' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              PAGADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              PENDIENTE SINPE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {tItem.ticket_status === 'used' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              USADO EN PUERTA
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-green/20 text-brand-green border border-brand-green/30">
                              ACTIVO
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {tItem.purchase_status === 'pending' && (
                              <button
                                onClick={() => handleValidateSinpe(tItem.purchase_id)}
                                disabled={validatingSinpeId === tItem.purchase_id}
                                className="px-2.5 py-1 bg-brand-green hover:bg-brand-lime text-brand-navy font-extrabold rounded text-[10px] flex items-center space-x-1 shadow-sm transition-all"
                              >
                                {validatingSinpeId === tItem.purchase_id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Validar SINPE</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleResendEmail(tItem.purchase_id, tItem.buyer_email || undefined)}
                              disabled={resendingEmailId === tItem.purchase_id || !tItem.buyer_email}
                              className="p-1.5 text-slate-400 hover:text-brand-green rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-30"
                              title={tItem.buyer_email ? `Reenviar boletos a ${tItem.buyer_email}` : 'Sin correo registrado'}
                            >
                              {resendingEmailId === tItem.purchase_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-green" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <a
                              href={`/api/v1/tickets/purchases/${tItem.purchase_id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-brand-navy dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-white/10"
                              title="Descargar Boleto PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          TAB 3: ESCÁNER QR EN PUERTA (IN-APP CHECK-IN)
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lector / Cámara / Entrada de Código */}
          <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-brand-navy dark:text-white flex items-center space-x-2">
                <Camera className="w-4 h-4 text-brand-green" />
                <span>Escáner de Boletos en Puerta</span>
              </h3>
              <select
                value={selectedPerformanceId}
                onChange={(e) => setSelectedPerformanceId(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-brand-navy border border-slate-300 dark:border-brand-border rounded-lg text-xs font-bold text-brand-navy dark:text-white"
              >
                {metrics.map((m, i) => (
                  <option key={m.performance_id} value={m.performance_id}>
                    Función #{i + 1} - {new Date(m.starts_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Visor de Cámara */}
            <div className="bg-black rounded-xl overflow-hidden relative aspect-video flex items-center justify-center border border-white/10">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                autoPlay
                playsInline
                muted
              />

              {!cameraActive && (
                <div className="text-center p-6 space-y-3">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 max-w-xs">
                    Activa la cámara para escanear los boletos de los asistentes automáticamente con el sensor óptico.
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-brand-green text-brand-navy font-extrabold text-xs rounded-xl shadow-glow-green"
                  >
                    Activar Cámara
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 pointer-events-auto px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
                  >
                    Detener Cámara
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                {cameraError}
              </div>
            )}

            {/* Entrada Manual de Código QR */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                O ingresa el código QR manualmente:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ej: FC-TKT-35243817-..."
                  value={scannerQrInput}
                  onChange={(e) => setScannerQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleValidateQr()}
                  className="flex-1 px-3.5 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-brand-border rounded-xl text-xs font-mono text-brand-navy dark:text-white focus:outline-none focus:border-brand-green"
                />
                <button
                  onClick={() => void handleValidateQr()}
                  disabled={validatingQr || !scannerQrInput.trim()}
                  className="px-4 py-2 btn-green text-brand-navy font-extrabold rounded-xl text-xs shadow-glow-green disabled:opacity-50"
                >
                  {validatingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                </button>
              </div>
            </div>

            {/* Botones de simulación con boletos de la lista */}
            {tickets.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Probar con boleto emitido:
                </span>
                <div className="flex flex-wrap gap-1">
                  {tickets.slice(0, 4).map((t) => (
                    <button
                      key={t.ticket_id}
                      onClick={() => void handleValidateQr(t.qr_code)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-slate-300 dark:border-white/10 rounded text-[10px] font-mono text-brand-forest dark:text-brand-lime"
                    >
                      {t.qr_code.slice(0, 16)}... ({t.ticket_status})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resultado de la Validación en Puerta */}
          <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-slate-200 dark:border-brand-border flex flex-col justify-center">
            {validatingQr ? (
              <div className="text-center p-8 space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-brand-green mx-auto" />
                <span className="text-sm font-bold text-slate-400">Verificando autenticidad en la base de datos...</span>
              </div>
            ) : qrResult ? (
              qrResult.valid ? (
                <div className="bg-emerald-500/15 border-2 border-emerald-500/50 p-6 rounded-2xl text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500">
                    <UserCheck className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-bold text-emerald-400">
                      {qrResult.message}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Boleto marcado como UTILIZADO en puerta.</p>
                  </div>

                  {qrResult.ticket && (
                    <div className="bg-white dark:bg-brand-navy p-4 rounded-xl text-left text-xs space-y-1.5 border border-emerald-500/30">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Asistente:</span>
                        <span className="font-bold text-brand-navy dark:text-white text-sm">
                          {qrResult.ticket.buyer_name || 'Asistente Far Corners'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Obra & Función:</span>
                        <span className="font-semibold text-brand-navy dark:text-white">
                          {qrResult.ticket.show_title} • {new Date(qrResult.ticket.starts_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-400 font-mono">{qrResult.ticket.qr_code}</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {qrResult.ticket.currency === 'USD' ? `$${qrResult.ticket.price}` : `₡${Number(qrResult.ticket.price).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-500/15 border-2 border-red-500/50 p-6 rounded-2xl text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border-2 border-red-500">
                    <ShieldAlert className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-xl font-serif font-bold text-red-400">
                      Acceso Denegado
                    </h4>
                    <p className="text-xs text-red-300 mt-1 font-semibold">{qrResult.message}</p>
                  </div>

                  {qrResult.ticket && (
                    <div className="bg-white dark:bg-brand-navy p-4 rounded-xl text-left text-xs space-y-1 border border-red-500/30">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Titular:</span>
                        <span className="font-bold text-brand-navy dark:text-white">
                          {qrResult.ticket.buyer_name} ({qrResult.ticket.buyer_email})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Estado Boleto:</span>
                        <span className="font-mono text-red-400 uppercase font-bold">
                          {qrResult.ticket.ticket_status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="text-center p-8 space-y-3 text-slate-400">
                <UserCheck className="w-12 h-12 mx-auto text-slate-600" />
                <h4 className="font-serif text-base font-bold text-brand-navy dark:text-white">
                  Esperando Lectura de Boleto
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Escanea el código QR desde el dispositivo móvil del espectador o ingresa la clave de boleto para validar el ingreso a sala.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
