import React, { useState, useEffect } from 'react';
import { Language, Show } from '../types';
import {
  X, Ticket, Calendar, CheckCircle2, ShieldCheck, QrCode,
  Upload, AlertTriangle, Loader2, Download, MapPin, Coins, ExternalLink, Lock, ShieldAlert, Clock
} from 'lucide-react';
import { getTranslations } from '../lib/i18n';
import { useSesion } from '../hooks/useSesion';

interface TicketInventoryItem {
  id: string;
  event_id: string;
  performance_id?: string | null;
  ticket_type: string;
  ticket_type_en?: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  currency: string;
  starts_at?: string;
  venue?: string;
}

interface PurchaseResult {
  purchase: {
    id: string;
    event_id: string;
    total_amount: number;
    status: string;
    payment_intent_id: string;
    currency: string;
    buyer_name: string | null;
    buyer_email: string | null;
    created_at: string;
  };
  tickets: {
    id: string;
    qr_code: string;
    status: string;
  }[];
  pdfBase64?: string;
}

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: Show | null;
  language: Language;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  show,
  language,
}) => {
  const isEs = language === 'es';
  const t = getTranslations(language).modals.ticket;
  const { usuario } = useSesion();

  // Estados del formulario unificado (estilo donaciones)
  const [currency, setCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string>('');
  const [quantity, setQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'paypal'>('sinpe');
  const [sinpeRef, setSinpeRef] = useState('');
  const [sinpeFileName, setSinpeFileName] = useState('');

  // Rate limit / Enfriamiento de 30 segundos
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Datos del comprador
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Inventario
  const [inventory, setInventory] = useState<TicketInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Compra y resultado
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  // Control de cooldown de 30s para evitar compras duplicadas
  useEffect(() => {
    const updateCooldown = () => {
      const lastPurchaseStr = localStorage.getItem('fc_last_ticket_purchase');
      if (!lastPurchaseStr) {
        setCooldownRemaining(0);
        return;
      }
      const lastTime = parseInt(lastPurchaseStr, 10);
      const elapsed = Date.now() - lastTime;
      if (elapsed < 30000) {
        setCooldownRemaining(Math.ceil((30000 - elapsed) / 1000));
      } else {
        setCooldownRemaining(0);
      }
    };

    updateCooldown();
    const timer = setInterval(updateCooldown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pre-llenar datos del usuario si tiene sesión iniciada
  useEffect(() => {
    if (usuario) {
      if (!name) setName(usuario.full_name || '');
      if (!email) setEmail(usuario.email || '');
    }
  }, [usuario, name, email]);

  // Cargar inventario y funciones del show al abrir el modal
  useEffect(() => {
    if (!isOpen || !show) return;

    async function fetchInventory() {
      setLoadingInventory(true);
      try {
        const res = await fetch(`/api/v1/tickets/events/${show!.id}`);
        if (res.ok) {
          const data: TicketInventoryItem[] = await res.json();
          setInventory(data);
          const firstPerf = data.find((i) => i.performance_id);
          if (firstPerf?.performance_id) {
            setSelectedPerformanceId(firstPerf.performance_id);
          } else if (show?.performances && show.performances.length > 0) {
            setSelectedPerformanceId(show.performances[0].id);
          }
        }
      } catch (err) {
        console.error('Error al cargar inventario:', err);
      } finally {
        setLoadingInventory(false);
      }
    }

    void fetchInventory();
  }, [isOpen, show]);

  if (!isOpen || !show) return null;

  // Lista de funciones disponibles
  const performancesList = (show.performances && show.performances.length > 0)
    ? show.performances
    : inventory
        .filter((item, index, self) =>
          item.performance_id &&
          self.findIndex((t) => t.performance_id === item.performance_id) === index
        )
        .map((i) => ({
          id: i.performance_id!,
          starts_at: i.starts_at || new Date().toISOString(),
          venue: i.venue || show.location || 'Teatro Comunitario',
          max_capacity: i.quantity_available + i.quantity_sold,
          status: 'scheduled',
        }));

  // Inventario coincidente con función y moneda
  const selectedInventory =
    inventory.find(
      (i) =>
        (i.performance_id === selectedPerformanceId || !i.performance_id) &&
        i.currency === currency
    ) ||
    inventory.find((i) => i.currency === currency) ||
    inventory[0];

  const pricePerTicket = selectedInventory
    ? selectedInventory.price
    : currency === 'USD'
    ? 20
    : 10000;

  const totalPrice = pricePerTicket * quantity;
  const availableQty = selectedInventory ? selectedInventory.quantity_available : show.availableTickets;

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!show || !selectedInventory) return;

    if (cooldownRemaining > 0) {
      setPurchaseError(
        isEs
          ? `Por seguridad de la taquilla, debes esperar ${cooldownRemaining}s antes de realizar otra compra.`
          : `For security reasons, please wait ${cooldownRemaining}s before another purchase.`
      );
      return;
    }

    const effectiveRef = sinpeRef.trim() || (
      paymentMethod === 'zeffy'
        ? `ZEFFY-${Date.now().toString().slice(-6)}`
        : paymentMethod === 'paypal'
        ? `PAYPAL-${Date.now().toString().slice(-6)}`
        : ''
    );

    if (paymentMethod === 'sinpe' && !sinpeRef.trim()) {
      setPurchaseError(isEs ? 'El número de comprobante SINPE es obligatorio.' : 'SINPE reference is required.');
      return;
    }

    setPurchasing(true);
    setPurchaseError('');

    try {
      const res = await fetch('/api/v1/tickets/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: show.id,
          performance_id: selectedPerformanceId || undefined,
          ticket_inventory_id: selectedInventory.id,
          quantity,
          buyer_name: name.trim() || null,
          buyer_email: email.trim() || null,
          payment_method: paymentMethod,
          sinpe_reference: effectiveRef || undefined,
          currency,
          user_id: usuario?.id || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data?.error || (isEs ? 'Debes esperar unos segundos antes de realizar otra compra.' : 'Please wait before another purchase.'));
        }
        if (res.status === 409) {
          throw new Error(isEs ? 'No hay suficientes boletos disponibles.' : 'Not enough tickets available.');
        }
        throw new Error(data?.error || data?.message || 'Error al procesar la compra.');
      }

      // Guardar timestamp de compra exitosa para aplicar cooldown de 30s
      localStorage.setItem('fc_last_ticket_purchase', Date.now().toString());
      setCooldownRemaining(30);

      setPurchaseResult(data as PurchaseResult);
    } catch (err: any) {
      setPurchaseError(err.message || 'No se pudo completar la compra. Intenta de nuevo.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!purchaseResult?.purchase?.id) return;
    window.open(`/api/v1/tickets/purchases/${purchaseResult.purchase.id}/pdf`, '_blank');
  };

  const resetAndClose = () => {
    setPurchaseResult(null);
    setPurchaseError('');
    setSinpeRef('');
    setSinpeFileName('');
    setQuantity(2);
    setPurchasing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden text-brand-navy dark:text-brand-cream">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-brand-navyDark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white leading-tight">
                {show.title}
              </h3>
              <p className="text-xs text-brand-forest dark:text-brand-lime">
                {show.location} • Temporada {show.year}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-navy dark:hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {purchaseResult ? (
            /* Pantalla de Confirmación de Compra */
            <div className="text-center space-y-5 py-2 animate-fadeIn">
              <div className={`inline-flex p-3 rounded-full border ${
                purchaseResult.purchase.status === 'paid'
                  ? 'bg-brand-green/20 text-brand-green border-brand-green/40'
                  : 'bg-amber-400/20 text-amber-500 border-amber-400/40'
              }`}>
                {purchaseResult.purchase.status === 'paid' ? (
                  <CheckCircle2 className="w-12 h-12" />
                ) : (
                  <Clock className="w-12 h-12" />
                )}
              </div>

              <div>
                <h4 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
                  {purchaseResult.purchase.status === 'paid'
                    ? (isEs ? '¡Boletos Oficiales Confirmados!' : 'Tickets Confirmed!')
                    : (isEs ? '¡Solicitud de Boletos Registrada!' : 'Ticket Request Submitted!')}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {purchaseResult.purchase.status === 'paid'
                    ? (isEs
                        ? `Tu compra ha sido procesada con éxito. Hemos enviado un correo a ${email || 'tu email'} con tus boletos y códigos QR adjuntos.`
                        : `Your tickets have been issued and sent to ${email}.`)
                    : (isEs
                        ? `Tu solicitud por ${quantity} ${quantity === 1 ? 'asiento' : 'asientos'} ha sido registrada. Por seguridad de la taquilla, los códigos QR y la descarga oficial en PDF se activarán una vez que el equipo de administración valide tu comprobante de pago.`
                        : `Your reservation for ${quantity} tickets is registered. QR codes will be unlocked after admin verification.`)}
                </p>
              </div>

              {/* Digital Ticket Voucher Card */}
              <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-5 rounded-2xl border border-brand-green/50 text-left relative overflow-hidden shadow-xl">
                <div className="absolute right-3 top-3 text-brand-forest dark:text-brand-lime flex items-center space-x-1 text-[10px] bg-brand-green/20 px-2 py-0.5 rounded border border-brand-green/40 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Boletería Oficial FC</span>
                </div>

                <div className="border-b border-slate-200 dark:border-white/10 pb-3 mb-3">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {purchaseResult.purchase.id.slice(0, 14)}
                  </span>
                  <h5 className="font-serif text-lg font-bold text-brand-navy dark:text-white">{show.title}</h5>
                  <p className="text-xs text-brand-forest dark:text-brand-lime font-medium">{show.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Titular:</span>
                    <span className="font-semibold text-brand-navy dark:text-white">{name || 'Asistente'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Asientos Asignados:</span>
                    <span className="font-bold text-brand-navy dark:text-white">{quantity} {quantity === 1 ? 'asiento general' : 'asientos generales'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total:</span>
                    <span className="font-mono font-bold text-brand-forest dark:text-brand-lime">
                      {currency === 'CRC' ? `₡${totalPrice.toLocaleString()} CRC` : `$${totalPrice.toLocaleString()} USD`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Estado del Pago:</span>
                    <span className={`font-bold uppercase text-[11px] ${
                      purchaseResult.purchase.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {purchaseResult.purchase.status === 'paid' ? 'PAGADO / ACTIVO' : 'PENDIENTE DE VALIDACIÓN'}
                    </span>
                  </div>
                </div>

                {/* Códigos QR (Solo visibles tras validación) */}
                {purchaseResult.purchase.status === 'paid' ? (
                  <div className="space-y-2">
                    <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-300 font-bold">
                      Códigos QR por Asiento:
                    </span>
                    {purchaseResult.tickets.map((tItem, i) => (
                      <div
                        key={tItem.id}
                        className="flex items-center justify-between bg-white dark:bg-brand-navy p-3 rounded-xl border border-slate-200 dark:border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <QrCode className="w-8 h-8 text-brand-green" />
                          <div className="text-[10px]">
                            <span className="block text-brand-navy dark:text-white font-mono font-bold">
                              Boleto #{i + 1} de {quantity}
                            </span>
                            <span className="font-mono text-brand-forest dark:text-brand-lime">{tItem.qr_code}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3 text-xs">
                    <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-amber-600 dark:text-amber-300 block text-xs">
                        Códigos QR protegidos hasta validación
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Se asignaron <strong>{quantity} {quantity === 1 ? 'asiento' : 'asientos'}</strong> a tu nombre. Tan pronto la administración apruebe el comprobante, tus códigos QR y boletos quedarán activos y te llegará la copia en PDF a <strong>{email}</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Descarga del PDF */}
              {purchaseResult.purchase.status === 'paid' ? (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="w-full py-3 bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-bold rounded-xl text-xs flex items-center justify-center space-x-2 border border-slate-300 hover:opacity-90 transition-opacity shadow-md"
                >
                  <Download className="w-4 h-4 text-brand-green" />
                  <span>{isEs ? 'Descargar Boletos en PDF' : 'Download Tickets (PDF)'}</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-100 dark:bg-brand-navyDark rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2 border border-dashed border-slate-300 dark:border-white/10">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isEs ? 'Descarga de boletos habilitada tras validación en taquilla' : 'Download available once payment is validated'}</span>
                </div>
              )}

              <button
                onClick={resetAndClose}
                className="w-full py-3 btn-green text-brand-navy font-extrabold rounded-xl"
              >
                {isEs ? 'Listo / Cerrar' : 'Close'}
              </button>
            </div>
          ) : (
            /* Formulario Unificado de Compra (Estilo Donaciones) */
            <form onSubmit={handleSubmitPurchase} className="space-y-5">
              {/* 1. Selección de Función / Fecha */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-2">
                  {isEs ? '1. Selecciona la Función:' : '1. Select Performance:'}
                </label>
                {loadingInventory ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-brand-green" />
                    <span>Cargando funciones...</span>
                  </div>
                ) : performancesList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {performancesList.map((perf) => {
                      let fechaLabel = perf.starts_at;
                      try {
                        const d = new Date(perf.starts_at);
                        if (!isNaN(d.getTime())) {
                          fechaLabel = d.toLocaleString(isEs ? 'es-CR' : 'en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        }
                      } catch {}

                      const isSelected = selectedPerformanceId === perf.id;

                      return (
                        <button
                          type="button"
                          key={perf.id}
                          onClick={() => setSelectedPerformanceId(perf.id)}
                          className={`p-3 rounded-xl text-left border text-xs transition-all ${
                            isSelected
                              ? 'bg-brand-green/20 border-brand-green text-brand-navy dark:text-white font-bold ring-1 ring-brand-green'
                              : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-brand-green flex-shrink-0" />
                            <span className="font-semibold">{fechaLabel}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{perf.venue}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 dark:bg-brand-navyDark rounded-xl text-xs text-slate-600 dark:text-slate-300">
                    {show.location} • {show.dates}
                  </div>
                )}
              </div>

              {/* 2. Cantidad y Selector de Moneda (Igual que en Donaciones) */}
              <div className="p-4 rounded-2xl bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                    {isEs ? '2. Cantidad y Moneda' : '2. Quantity & Currency'}
                  </span>
                  {/* Selector de Moneda */}
                  <div className="inline-flex rounded-lg border border-slate-300 dark:border-white/10 p-0.5 bg-white dark:bg-brand-navy text-xs">
                    <button
                      type="button"
                      onClick={() => setCurrency('CRC')}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        currency === 'CRC'
                          ? 'bg-brand-green text-brand-navy shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
                      }`}
                    >
                      CRC (₡)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-3 py-1 rounded-md font-bold transition-all ${
                        currency === 'USD'
                          ? 'bg-brand-green text-brand-navy shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-500 block">Tarifa por boleto:</span>
                    <span className="font-mono text-base font-bold text-brand-forest dark:text-brand-lime">
                      {currency === 'CRC' ? `₡${pricePerTicket.toLocaleString()} CRC` : `$${pricePerTicket} USD`}
                    </span>
                  </div>

                  {/* Contador de Cantidad */}
                  <div className="flex items-center space-x-3 bg-white dark:bg-brand-navy border border-slate-200 dark:border-white/10 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-brand-navy dark:text-white font-bold hover:bg-slate-200 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-base px-2 text-brand-green">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(Math.min(10, availableQty || 10), quantity + 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-brand-navy dark:text-white font-bold hover:bg-slate-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Total a Pagar:</span>
                  <span className="font-mono text-xl font-extrabold text-brand-forest dark:text-brand-lime">
                    {currency === 'CRC' ? `₡${totalPrice.toLocaleString()} CRC` : `$${totalPrice.toLocaleString()} USD`}
                  </span>
                </div>
              </div>

              {/* 3. Datos del Asistente */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {isEs ? '3. Datos del Titular' : '3. Patron Information'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isEs ? 'Nombre completo *' : 'Full name *'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isEs ? 'Correo electrónico *' : 'Email *'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isEs ? 'Teléfono / WhatsApp' : 'Phone'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-xl text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Método de Pago */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {isEs ? '4. Método de Pago' : '4. Payment Method'}
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sinpe')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      paymentMethod === 'sinpe'
                        ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green font-extrabold'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    SINPE Móvil
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('zeffy')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      paymentMethod === 'zeffy'
                        ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green font-extrabold'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Zeffy (0% com)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      paymentMethod === 'paypal'
                        ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green font-extrabold'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    PayPal
                  </button>
                </div>

                {/* Instrucciones SINPE con número y comprobante */}
                {paymentMethod === 'sinpe' && (
                  <div className="p-4 bg-brand-green/10 border border-brand-green/30 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-green/20">
                      <span className="font-semibold text-brand-navy dark:text-white">Número SINPE Móvil:</span>
                      <span className="font-mono font-bold text-sm bg-white dark:bg-brand-navy px-2.5 py-1 rounded-lg border border-brand-green/40 text-brand-forest dark:text-brand-lime">
                        8888-0000
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      Transfiere el monto de <strong>{currency === 'CRC' ? `₡${totalPrice.toLocaleString()} CRC` : `$${totalPrice.toLocaleString()} USD`}</strong> a nombre de <strong>Asociación Far Corners</strong> y digita el número de comprobante abajo.
                    </p>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-navy dark:text-white mb-1">
                        Número de Comprobante / Referencia SINPE *
                      </label>
                      <input
                        type="text"
                        required
                        value={sinpeRef}
                        onChange={(e) => setSinpeRef(e.target.value)}
                        placeholder="Ej. REF-839201"
                        className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-brand-green/50 rounded-xl text-xs font-mono font-bold text-brand-navy dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Redirección Zeffy */}
                {paymentMethod === 'zeffy' && (
                  <div className="p-4 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-2xl space-y-3 text-xs">
                    <p className="text-slate-600 dark:text-slate-300">
                      {isEs
                        ? 'Plataforma oficial 100% gratuita para el Teatro Comunitario Far Corners. Haz clic abajo para ir a pagar a Zeffy:'
                        : 'Free non-profit platform. Click below to pay on Zeffy:'}
                    </p>
                    <a
                      href="https://www.zeffy.com/ticketing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-[#75267A] hover:bg-[#8D2E94] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isEs ? 'Ir a Plataforma Zeffy' : 'Open Zeffy Platform'}</span>
                    </a>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Número de Confirmación / Referencia Zeffy:
                      </label>
                      <input
                        type="text"
                        value={sinpeRef}
                        onChange={(e) => setSinpeRef(e.target.value)}
                        placeholder="Ej. ZEFFY-928172"
                        className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-brand-navy dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Redirección PayPal */}
                {paymentMethod === 'paypal' && (
                  <div className="p-4 bg-slate-50 dark:bg-brand-navyDark border border-slate-200 dark:border-white/10 rounded-2xl space-y-3 text-xs">
                    <p className="text-slate-600 dark:text-slate-300">
                      {isEs
                        ? 'Paga de forma segura mediante tu saldo de PayPal o tarjeta vinculada. Haz clic abajo para ir a PayPal:'
                        : 'Pay securely with PayPal. Click below to proceed:'}
                    </p>
                    <a
                      href="https://www.paypal.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isEs ? 'Ir a PayPal' : 'Open PayPal'}</span>
                    </a>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        ID de Transacción / Correo PayPal:
                      </label>
                      <input
                        type="text"
                        value={sinpeRef}
                        onChange={(e) => setSinpeRef(e.target.value)}
                        placeholder="Ej. 9X928172PP o tu correo PayPal"
                        className="w-full px-3 py-2 bg-white dark:bg-brand-navy border border-slate-300 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-brand-navy dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {purchaseError && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-600 dark:text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{purchaseError}</span>
                </div>
              )}

              {cooldownRemaining > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-600 dark:text-amber-300 text-xs font-medium">
                  <Clock className="w-4 h-4 flex-shrink-0 text-amber-500 animate-spin" />
                  <span>
                    {isEs
                      ? `Por seguridad de la taquilla, debes esperar ${cooldownRemaining}s para realizar otra compra.`
                      : `Please wait ${cooldownRemaining}s before another purchase.`}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={purchasing || cooldownRemaining > 0}
                className="w-full py-3.5 btn-green text-brand-navy font-extrabold rounded-xl shadow-glow-green text-xs uppercase tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEs ? 'Procesando Boletos...' : 'Processing...'}</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <span>
                    {isEs ? `Espera ${cooldownRemaining}s...` : `Wait ${cooldownRemaining}s...`}
                  </span>
                ) : (
                  <span>
                    {isEs ? `Adquirir ${quantity} ${quantity === 1 ? 'Boleto' : 'Boletos'} (${currency === 'CRC' ? '₡' : '$'}${totalPrice.toLocaleString()})` : `Buy ${quantity} Tickets`}
                  </span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
