import React, { useState, useEffect, useCallback } from 'react';
import { Language } from '../types';
import {
  Heart,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Send,
  AlertCircle,
  Clock,
  XCircle,
  Pencil,
  Trash2,
  RefreshCw,
  Coins,
  ExternalLink,
} from 'lucide-react';
import { getTranslations } from '../lib/i18n';
import { useSesion } from '../hooks/useSesion';
import { apiAdminJson } from '../services/apiAdmin';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface DonateViewProps {
  language: Language;
  onOpenDonateModal?: () => void;
  onNavigate?: (page: any) => void;
}

interface MiDonacion {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  currency: string;
  payment_provider: string;
  payment_method: string | null;
  payment_reference: string | null;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  message: string | null;
  created_at: string;
  verified_at: string | null;
}

export const DonateView: React.FC<DonateViewProps> = ({ language, onNavigate }) => {
  const t = getTranslations(language).views.donate;
  const isEs = language === 'es';
  const { usuario } = useSesion();

  // Estados del formulario de donación
  const [submitted, setSubmitted] = useState(false);
  const [donorName, setDonorName] = useState(usuario?.full_name || '');
  const [donorEmail, setDonorEmail] = useState(usuario?.email || '');
  const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [amount, setAmount] = useState('10000');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'paypal'>('sinpe');
  const [refNumber, setRefNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Actualizar nombre y email si el usuario inicia sesión
  useEffect(() => {
    if (usuario) {
      if (!donorName) setDonorName(usuario.full_name || '');
      if (!donorEmail) setDonorEmail(usuario.email || '');
    }
  }, [usuario]);

  // Estados de "Mis Donaciones" (Usuario registrado)
  const [misDonaciones, setMisDonaciones] = useState<MiDonacion[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

  // Estados de edición de donación
  const [editandoDonacion, setEditandoDonacion] = useState<MiDonacion | null>(null);
  const [editRefNumber, setEditRefNumber] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Estados de eliminación
  const [porEliminar, setPorEliminar] = useState<MiDonacion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Muro público de donaciones por monto
  interface PublicDonation {
    id: string;
    donor_name: string;
    amount: number;
    currency: string;
    created_at?: string;
  }
  const [donacionesPublicas, setDonacionesPublicas] = useState<PublicDonation[]>([]);
  const [cargandoMuro, setCargandoMuro] = useState(false);

  const cargarMuroPublico = useCallback(async () => {
    setCargandoMuro(true);
    try {
      const res = await fetch('/api/v1/donations/public');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDonacionesPublicas(data);
        }
      }
    } catch (err) {
      console.error('Error al cargar donaciones públicas:', err);
    } finally {
      setCargandoMuro(false);
    }
  }, []);

  useEffect(() => {
    void cargarMuroPublico();
  }, [cargarMuroPublico]);

  const cargarMisDonaciones = useCallback(async () => {
    if (!usuario) return;
    setCargandoHistorial(true);
    setErrorHistorial('');
    try {
      const data = await apiAdminJson<MiDonacion[]>('/api/v1/donations/my-donations');
      setMisDonaciones(data);
    } catch (err: any) {
      setErrorHistorial(err.message || 'Error al cargar historial de donaciones.');
    } finally {
      setCargandoHistorial(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      void cargarMisDonaciones();
    }
  }, [usuario, cargarMisDonaciones]);

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error(isEs ? 'El monto debe ser mayor a 0.' : 'Amount must be greater than 0.');
      }

      if (paymentMethod === 'sinpe' && !refNumber.trim()) {
        throw new Error(
          isEs
            ? 'Por favor ingresa el número de comprobante o referencia de tu transferencia SINPE.'
            : 'Please enter the receipt or reference number of your SINPE transfer.'
        );
      }

      const res = await fetch('/api/v1/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName.trim() || null,
          donor_email: donorEmail.trim() || null,
          amount: parsedAmount,
          currency,
          payment_provider: paymentMethod,
          payment_method: paymentMethod,
          payment_reference: refNumber.trim() || null,
          status: 'pending',
          message: 'Donación recibida desde el portal institucional',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || data?.message || 'Error al procesar la donación');
      }

      setSubmitted(true);
      void cargarMuroPublico();
      if (usuario) {
        void cargarMisDonaciones();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo registrar la donación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoDonacion) return;
    setGuardandoEdicion(true);
    try {
      const parsed = parseFloat(editAmount);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error(isEs ? 'El monto debe ser mayor a 0.' : 'Amount must be greater than 0.');
      }

      await apiAdminJson(`/api/v1/donations/my-donations/${editandoDonacion.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          amount: parsed,
          payment_reference: editRefNumber.trim() || editandoDonacion.payment_reference,
        }),
      });

      setEditandoDonacion(null);
      await cargarMisDonaciones();
    } catch (err: any) {
      alert(err.message || 'No se pudo actualizar la donación.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await apiAdminJson(`/api/v1/donations/my-donations/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setPorEliminar(null);
      await cargarMisDonaciones();
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar la donación.');
    } finally {
      setEliminando(false);
    }
  };

  const abrirEdicion = (donacion: MiDonacion) => {
    setEditandoDonacion(donacion);
    setEditAmount(donacion.amount.toString());
    setEditRefNumber(donacion.payment_reference || '');
  };

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
          {t.subtitle}
        </p>
      </div>

      {/* Formulario de Donación */}
      <div className="bg-white dark:bg-brand-navy border border-brand-green/40 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 shadow-glow-green">
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <h2 className="font-serif text-2xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-brand-green fill-brand-green" />
            <span>{t.registerTitle}</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            {t.registerSubtitle}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmitDonation} className="space-y-5">
            {/* Selector de Modo de Pago */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-2">
                {t.paymentMethodLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('sinpe')}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'sinpe'
                      ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green'
                      : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                  }`}
                >
                  SINPE Móvil
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('zeffy')}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'zeffy'
                      ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green'
                      : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Zeffy (0% com)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'paypal'
                      ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green'
                      : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                  }`}
                >
                  PayPal
                </button>
              </div>
            </div>

            {/* Instrucciones de Pago según método */}
            {paymentMethod === 'sinpe' && (
              <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/10">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    {t.sinpeNumberTitle}
                  </span>
                  <span className="font-mono font-bold text-brand-forest dark:text-brand-lime text-sm bg-white dark:bg-brand-navy px-2 py-0.5 rounded border border-slate-200 dark:border-brand-border">
                    8888-9999
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {t.sinpeInstructions}
                </p>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
                    {t.sinpeRefLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder={t.sinpeRefPlaceholder}
                    className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-brand-border rounded text-brand-navy dark:text-white font-mono text-xs focus:border-brand-green focus:outline-none"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'zeffy' && (
              <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-2">
                <p className="text-slate-700 dark:text-slate-200 font-semibold">
                  {t.zeffyTitle}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  {t.zeffySubtitle}
                </p>
                <div className="pt-1">
                  <a
                    href="https://www.zeffy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-brand-blue hover:text-brand-forest dark:hover:text-brand-lime font-bold"
                  >
                    <span>{isEs ? 'Ir al portal seguro de Zeffy' : 'Go to secure Zeffy portal'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                  <span>{t.paypalTitle}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {t.paypalSubtitle}
                </p>
                <div className="pt-1">
                  <a
                    href="https://www.paypal.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-brand-blue hover:text-brand-forest dark:hover:text-brand-lime font-bold"
                  >
                    <span>{isEs ? 'Ir al portal seguro de PayPal' : 'Go to secure PayPal portal'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Datos del Donante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.donorNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={t.donorNamePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-xl text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.donorEmailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder={t.donorEmailPlaceholder}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-xl text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                />
              </div>
            </div>

            {/* Monto y Selector de Moneda a la par */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t.amountLabel}
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isEs ? 'Moneda:' : 'Currency:'}
                </span>
              </div>
              <div className="flex gap-2">
                {/* Input de monto */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 font-mono text-xs text-brand-forest dark:text-brand-lime font-bold">
                    {currency === 'CRC' ? '₡' : '$'}
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={currency === 'CRC' ? '10000' : '50'}
                    className="w-full pl-8 pr-4 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-xl text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none font-mono font-bold"
                  />
                </div>

                {/* Botón toggle selector de moneda a la par */}
                <div className="inline-flex rounded-xl p-1 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency('CRC');
                      if (amount === '50' || amount === '25') setAmount('10000');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currency === 'CRC'
                        ? 'bg-brand-green text-brand-navy font-extrabold shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
                    }`}
                  >
                    ₡ CRC
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency('USD');
                      if (amount === '10000') setAmount('50');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currency === 'USD'
                        ? 'bg-brand-green text-brand-navy font-extrabold shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-600 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 btn-green text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>
                {loading ? t.processingBtn : t.submitBtn(amount, currency)}
              </span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
              {t.successTitle}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {t.successMsg(donorName, amount, currency)}
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setRefNumber('');
              }}
              className="px-6 py-2.5 bg-black/5 dark:bg-white/10 text-brand-navy dark:text-white text-xs font-semibold rounded-xl hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
            >
              {t.registerAnotherBtn}
            </button>
          </div>
        )}
      </div>

      {/* Sección de "Mis Donaciones Realizadas" para usuarios autenticados */}
      {usuario ? (
        <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h3 className="font-serif text-2xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-brand-blue" />
                <span>{t.myDonationsTitle}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {t.myDonationsSubtitle}
              </p>
            </div>
            <button
              onClick={cargarMisDonaciones}
              disabled={cargandoHistorial}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-brand-navy dark:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoHistorial ? 'animate-spin' : ''}`} />
              <span>{isEs ? 'Actualizar' : 'Refresh'}</span>
            </button>
          </div>

          {errorHistorial && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-600 dark:text-red-300">
              {errorHistorial}
            </div>
          )}

          {cargandoHistorial ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {isEs ? 'Cargando tus donaciones...' : 'Loading your donations...'}
            </div>
          ) : misDonaciones.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {t.emptyDonations}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-[#F8F8F2] dark:bg-brand-navyDark uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{isEs ? 'Fecha' : 'Date'}</th>
                    <th className="px-4 py-3">{isEs ? 'Monto' : 'Amount'}</th>
                    <th className="px-4 py-3">{isEs ? 'Método' : 'Method'}</th>
                    <th className="px-4 py-3">{isEs ? 'Comprobante' : 'Receipt / Ref'}</th>
                    <th className="px-4 py-3">{isEs ? 'Estado' : 'Status'}</th>
                    <th className="px-4 py-3 text-right">{isEs ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {misDonaciones.map((d) => {
                    const esPendiente = d.status === 'pending';
                    return (
                      <tr key={d.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {new Date(d.created_at).toLocaleDateString(language === 'es' ? 'es-CR' : 'en-US')}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-brand-navy dark:text-brand-lime">
                          {d.currency === 'CRC' ? '₡' : '$'}
                          {Number(d.amount).toLocaleString()} {d.currency}
                        </td>
                        <td className="px-4 py-3 uppercase text-[11px] font-semibold">
                          {d.payment_method || d.payment_provider}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {d.payment_reference || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {d.status === 'pending' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              {t.statusPending}
                            </span>
                          )}
                          {d.status === 'completed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30">
                              {t.statusCompleted}
                            </span>
                          )}
                          {d.status === 'failed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
                              {t.statusFailed}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {esPendiente ? (
                            <div className="inline-flex items-center space-x-1">
                              <button
                                onClick={() => abrirEdicion(d)}
                                title={t.editBtn}
                                className="p-1.5 rounded-lg text-brand-blue hover:bg-brand-blue/10 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPorEliminar(d)}
                                title={t.deleteBtn}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className="text-[10px] text-slate-400 dark:text-slate-500 italic"
                              title={t.verifiedNotice}
                            >
                              {isEs ? 'Verificada' : 'Verified'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto text-center space-y-4 shadow-md">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-green/20 text-brand-green flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
              {isEs ? '¿Deseas consultar y gestionar tus donaciones?' : 'Want to view and manage your donations?'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto mt-1">
              {isEs
                ? 'Inicia sesión con tu cuenta de Far Corners para acceder a tu historial de donaciones, consultar el estado de tus aportes SINPE y editar o cancelar donaciones pendientes.'
                : 'Sign in to access your donation history, check the status of your SINPE receipts, and edit or cancel pending contributions.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate?.('login')}
              className="px-6 py-2.5 btn-green text-brand-navy font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-glow-green"
            >
              {isEs ? 'Iniciar Sesión' : 'Sign In'}
            </button>
            <button
              onClick={() => onNavigate?.('register')}
              className="px-6 py-2.5 bg-slate-200 dark:bg-white/10 text-brand-navy dark:text-white font-bold rounded-xl text-xs hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
            >
              {isEs ? 'Crear Cuenta' : 'Register'}
            </button>
          </div>
        </div>
      )}

      {/* Muro de Donaciones Realizadas (Ordenadas por Monto) */}
      <div className="max-w-4xl mx-auto space-y-6 pt-6 animate-fadeIn border-t border-slate-200 dark:border-white/10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-lime text-[11px] font-bold border border-brand-green/40 uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-current text-brand-green" />
            <span>{isEs ? 'Muro de Donantes y Gratitud' : 'Donor Wall of Gratitude'}</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">
            {isEs ? 'Donaciones Realizadas' : 'Donations Wall'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            {isEs
              ? 'Agradecemos a quienes apoyan nuestras producciones y talleres teatrales. Mostramos aquí las donaciones ordenadas por monto:'
              : 'Grateful recognition of all donations supporting our theatrical programs, ordered by amount:'}
          </p>
        </div>

        <div className="bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-md">
          {cargandoMuro ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-green" />
              <span>{isEs ? 'Cargando donaciones realizadas...' : 'Loading donations...'}</span>
            </div>
          ) : donacionesPublicas.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              {isEs ? 'Aún no hay donaciones registradas para mostrar.' : 'No donations recorded yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {donacionesPublicas.map((don, idx) => (
                <div
                  key={don.id || idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 shadow-sm hover:border-brand-green/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-brand-navy shadow-md ring-2 ring-amber-300'
                        : idx === 1
                        ? 'bg-slate-300 text-brand-navy shadow-sm'
                        : idx === 2
                        ? 'bg-amber-700/40 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-xs sm:text-sm text-brand-navy dark:text-white block truncate">
                        {don.donor_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isEs ? 'Donación al proyecto teatral' : 'Donation to theatre project'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <span className="font-mono text-sm sm:text-base font-extrabold text-brand-forest dark:text-brand-lime">
                      {don.currency === 'USD'
                        ? `$${Number(don.amount).toLocaleString()} USD`
                        : `₡${Number(don.amount).toLocaleString()} CRC`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición de Donación Pendiente */}
      {editandoDonacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
              {t.editBtn}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEs
                ? 'Puedes corregir el monto o el número de comprobante mientras la donación esté en revisión.'
                : 'You can correct the amount or receipt number while your donation is pending review.'}
            </p>
            <form onSubmit={handleGuardarEdicion} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t.amountLabel} ({editandoDonacion.currency})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-brand-navy dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  {t.sinpeRefLabel}
                </label>
                <input
                  type="text"
                  required
                  value={editRefNumber}
                  onChange={(e) => setEditRefNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-brand-navy dark:text-white font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditandoDonacion(null)}
                  disabled={guardandoEdicion}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-brand-navy dark:text-white font-semibold"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-4 py-2 rounded-xl btn-green text-brand-navy font-bold shadow-glow-green"
                >
                  {guardandoEdicion ? (isEs ? 'Guardando...' : 'Saving...') : isEs ? 'Guardar Cambios' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Cancelar / Eliminar */}
      {porEliminar && (
        <ConfirmDialog
          open={!!porEliminar}
          title={t.deleteBtn}
          message={
            isEs
              ? `¿Estás seguro de que deseas cancelar y eliminar este registro de donación por ${porEliminar.currency === 'CRC' ? '₡' : '$'}${Number(porEliminar.amount).toLocaleString()} ${porEliminar.currency}? Esta acción no se puede deshacer.`
              : `Are you sure you want to cancel and delete this donation record for ${porEliminar.currency === 'CRC' ? '₡' : '$'}${Number(porEliminar.amount).toLocaleString()} ${porEliminar.currency}? This action cannot be undone.`
          }
          confirmLabel={isEs ? 'Sí, eliminar' : 'Yes, delete'}
          busyLabel={isEs ? 'Eliminando...' : 'Deleting...'}
          cancelLabel={isEs ? 'Volver' : 'Back'}
          busy={eliminando}
          onConfirm={handleConfirmarEliminar}
          onCancel={() => setPorEliminar(null)}
        />
      )}
    </div>
  );
};
