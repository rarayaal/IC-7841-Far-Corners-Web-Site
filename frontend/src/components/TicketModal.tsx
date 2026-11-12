import React, { useState, useEffect } from 'react';
import { Language, Show } from '../types';
import { X, Ticket, Calendar, CheckCircle2, ShieldCheck, QrCode, CreditCard, Clock, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { getTranslations } from '../lib/i18n';

// Tipos devueltos por la API
interface TicketInventoryItem {
  id: string;
  event_id: string;
  ticket_type: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  currency: string;
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
  const t = getTranslations(language).modals.ticket;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quantity, setQuantity] = useState(2);
  const [selectedDate, setSelectedDate] = useState('2026-07-18');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'card'>('sinpe');

  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Inventory from API
  const [inventory, setInventory] = useState<TicketInventoryItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Purchase result from API
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  // SINPE Confirmation
  const [sinpeRef, setSinpeRef] = useState('');
  const [sinpeFileName, setSinpeFileName] = useState('');
  const [sinpeCompleted, setSinpeCompleted] = useState(false);

  // 5 Minute Timer for SINPE Payment
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  // Load ticket inventory when modal opens
  useEffect(() => {
    if (!isOpen || !show) return;

    async function fetchInventory() {
      setLoadingInventory(true);
      try {
        const res = await fetch(`/api/v1/tickets/events/${show!.id}`);
        if (res.ok) {
          const data: TicketInventoryItem[] = await res.json();
          setInventory(data);
          if (data.length > 0) setSelectedInventoryId(data[0].id);
        }
      } catch {
        // Si falla, seguimos con precios del show
      } finally {
        setLoadingInventory(false);
      }
    }

    void fetchInventory();
  }, [isOpen, show]);

  // SINPE countdown timer
  useEffect(() => {
    let interval: any = null;
    if (step === 3 && paymentMethod === 'sinpe' && !sinpeCompleted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, paymentMethod, sinpeCompleted, timeLeft]);

  if (!isOpen || !show) return null;

  // Use real inventory price or fall back to show price
  const selectedInventory = inventory.find(i => i.id === selectedInventoryId);
  const pricePerTicket = selectedInventory ? selectedInventory.price : (show.priceGeneral || 10000);
  const totalPrice = pricePerTicket * quantity;
  const availableQty = selectedInventory ? selectedInventory.quantity_available : show.availableTickets;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      setTimeLeft(300);
      setIsTimerExpired(false);
      // Si no es SINPE, procesar la compra al llegar al paso 3
      if (paymentMethod !== 'sinpe') {
        void procesarCompra();
      }
    }
  };

  async function procesarCompra(sinpeReference?: string) {
    if (!show || !selectedInventoryId) return;

    setPurchasing(true);
    setPurchaseError('');

    try {
      const res = await fetch('/api/v1/tickets/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: show.id,
          ticket_inventory_id: selectedInventoryId,
          quantity,
          buyer_name: name.trim() || null,
          buyer_email: email.trim() || null,
          payment_intent_id: sinpeReference
            ? `SINPE-${sinpeReference}`
            : `TXN-${paymentMethod.toUpperCase()}-${Date.now()}`,
          currency: selectedInventory?.currency || 'CRC',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error('No hay suficientes boletos disponibles para esta función.');
        }
        if (res.status === 404) {
          throw new Error('El evento o tipo de boleto seleccionado ya no está disponible.');
        }
        throw new Error(data?.error || 'Error al procesar la compra.');
      }

      setPurchaseResult(data as PurchaseResult);
    } catch (err: any) {
      setPurchaseError(err.message || 'No se pudo completar la compra. Intenta de nuevo.');
      // Si falla la compra, volvemos al paso 2
      if (step === 3) setStep(2);
    } finally {
      setPurchasing(false);
    }
  }

  const handleFinishSinpe = async (e: React.FormEvent) => {
    e.preventDefault();
    await procesarCompra(sinpeRef);
    setSinpeCompleted(true);
  };

  const resetAndClose = () => {
    setStep(1);
    setSinpeRef('');
    setSinpeFileName('');
    setSinpeCompleted(false);
    setTimeLeft(300);
    setIsTimerExpired(false);
    setPurchaseResult(null);
    setPurchaseError('');
    setPurchasing(false);
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-navy border border-brand-border w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-brand-cream">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 bg-brand-navyDark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white leading-tight">
                {show.title} ({show.year})
              </h3>
              <p className="text-xs text-brand-lime">
                {t.headerTitle}
              </p>
            </div>
          </div>
          <button onClick={resetAndClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-brand-navyDeep px-6 py-2 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className={step >= 1 ? 'text-brand-green font-bold' : ''}>
            1. {t.step1}
          </span>
          <span className={step >= 2 ? 'text-brand-green font-bold' : ''}>
            2. {t.step2}
          </span>
          <span className={step === 3 ? 'text-brand-lime font-bold' : ''}>
            3. {paymentMethod === 'sinpe' ? (language === 'es' ? 'Comprobante SINPE' : 'SINPE Receipt') : (language === 'es' ? 'Confirmación' : 'Confirmation')}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  {t.selectDate}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '2026-07-18', label: 'Sáb 18 Julio, 7:00 PM' },
                    { id: '2026-07-19', label: 'Dom 19 Julio, 5:00 PM' },
                    { id: '2026-07-25', label: 'Sáb 25 Julio, 7:00 PM' },
                    { id: '2026-07-26', label: 'Dom 26 Julio, 5:00 PM' }
                  ].map(d => (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => setSelectedDate(d.id)}
                      className={`p-3 rounded-xl text-left border text-xs font-semibold transition-all ${
                        selectedDate === d.id
                          ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 inline mr-2 text-brand-blue" />
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Ticket Option */}
              <div className="p-4 rounded-xl bg-brand-navyDark border border-brand-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white block">
                    {language === 'es' ? 'Entrada General' : 'General Admission'}
                  </span>
                  <span className="text-xs text-slate-300">
                    {language === 'es' ? 'Asiento para función de teatro' : 'Seat for theater performance'}
                  </span>
                </div>
                <span className="font-mono text-base font-bold text-brand-lime">
                  ₡{pricePerTicket.toLocaleString()} CRC
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold uppercase text-slate-300">
                  {t.quantity}
                </span>
                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-base px-2 text-brand-green">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  {t.total}
                </span>
                <span className="font-mono text-xl font-bold text-brand-lime">
                  ₡{totalPrice.toLocaleString()} CRC
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all text-sm uppercase tracking-wider"
              >
                {t.proceedToPatronInfo}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.email} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="maria@ejemplo.com"
                      className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.phone} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="8888-0000"
                      className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  {t.paymentOption}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sinpe')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      paymentMethod === 'sinpe'
                        ? 'bg-brand-green border-brand-lime text-brand-navy font-bold shadow-glow-green'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    SINPE Móvil
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('zeffy')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      paymentMethod === 'zeffy'
                        ? 'bg-brand-green border-brand-lime text-brand-navy font-bold shadow-glow-green'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    Zeffy (0% com)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-brand-green border-brand-lime text-brand-navy font-bold shadow-glow-green'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {language === 'es' ? 'Tarjeta / Stripe' : 'Card / Stripe'}
                  </button>
                </div>
              </div>

              {paymentMethod === 'sinpe' && (
                <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs text-slate-300">
                  <p className="font-semibold text-white">
                    {language === 'es' ? 'Reserva Temporal SINPE Móvil' : 'Temporary SINPE Mobile Reservation'}
                  </p>
                  <p className="mt-1 text-slate-300">
                    {language === 'es' ? (
                      <>Al hacer clic en <strong>Confirmar Reserva</strong>, se reservarán tus boletos por <strong>5 minutos</strong> para que realices la transferencia e ingreses el comprobante.</>
                    ) : (
                      <>Clicking <strong>Confirm Reservation</strong> will hold your tickets for <strong>5 minutes</strong> while you complete the transfer and enter your receipt.</>
                    )}
                  </p>
                </div>
              )}

              {paymentMethod === 'zeffy' && (
                <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                  <p className="text-slate-200 font-semibold">
                    {language === 'es' ? 'Zeffy Payments (0% Comisión)' : 'Zeffy Payments (0% Fee)'}
                  </p>
                  <p className="text-slate-300">
                    {language === 'es'
                      ? 'Plataforma 100% gratuita para ONG. Tu dinero llega íntegro a las producciones de Far Corners.'
                      : '100% free platform for non-profits. 100% of your funds go directly to Far Corners productions.'}
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <CreditCard className="w-4 h-4 text-brand-blue" />
                    <span>{language === 'es' ? 'Pasarela Segura SSL Stripe & PayPal' : 'Secure SSL Stripe & PayPal Gateway'}</span>
                  </div>
                  <p className="text-slate-300">
                    {language === 'es'
                      ? 'Procesamiento inmediato con encriptación bancaria.'
                      : 'Instant processing with bank-grade encryption.'}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl"
                >
                  {language === 'es' ? 'Atrás' : 'Back'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all"
                >
                  {language === 'es' ? 'Confirmar Reserva de Boletos' : 'Confirm Ticket Reservation'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && paymentMethod === 'sinpe' && (
            <div className="space-y-5">
              {isTimerExpired ? (
                <div className="bg-red-500/20 border border-red-500/40 p-6 rounded-2xl text-center space-y-4">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                  <h4 className="font-serif text-xl font-bold text-white">¡Tiempo Expirado!</h4>
                  <p className="text-xs text-slate-200">
                    Ha transcurrido el tiempo límite de 5 minutos para realizar el pago por SINPE Móvil. Los boletos han sido liberados para otros espectadores.
                  </p>
                  <button
                    onClick={() => {
                      setStep(1);
                      setIsTimerExpired(false);
                      setTimeLeft(300);
                    }}
                    className="px-6 py-2.5 bg-brand-green text-brand-navy font-extrabold text-xs rounded-xl"
                  >
                    Volver a Intentar Reserva
                  </button>
                </div>
              ) : !sinpeCompleted ? (
                <form onSubmit={handleFinishSinpe} className="space-y-4">
                  {/* Countdown Banner */}
                  <div className="bg-gradient-to-r from-brand-navyDark to-brand-navyCard border border-brand-lime/50 p-4 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-6 h-6 text-brand-lime animate-pulse" />
                      <div>
                        <span className="font-bold text-white text-xs block">Tiempo para Realizar Pago:</span>
                        <span className="text-[11px] text-slate-300">Tus boletos se liberarán al finalizar el tiempo</span>
                      </div>
                    </div>
                    <span className="font-mono text-2xl font-extrabold text-brand-lime bg-brand-navyDark px-3 py-1 rounded-lg border border-brand-border">
                      {formatTime(timeLeft)}
                    </span>
                  </div>

                  {/* SINPE Instructions */}
                  <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                      <span className="text-slate-300 font-semibold">{t.sinpeTitle}:</span>
                      <span className="font-mono font-bold text-brand-lime text-sm bg-brand-navy px-2 py-0.5 rounded border border-brand-border">{t.sinpeNumber}</span>
                    </div>
                    <p className="text-slate-300">
                      {t.sinpeInstructions(`₡${totalPrice.toLocaleString()} CRC`)}
                    </p>
                  </div>

                  {/* Reference & Receipt upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.sinpeRefLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      value={sinpeRef}
                      onChange={(e) => setSinpeRef(e.target.value)}
                      placeholder={t.sinpeRefPlaceholder}
                      className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white font-mono focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.sinpeProofLabel} *
                    </label>
                    <div className="border border-dashed border-brand-border bg-brand-navyDark p-4 rounded-xl text-center cursor-pointer hover:border-brand-green transition-colors">
                      <Upload className="w-6 h-6 text-brand-green mx-auto mb-1" />
                      <span className="text-xs text-slate-300 block">
                        {sinpeFileName
                          ? sinpeFileName
                          : t.sinpeProofPlaceholder}
                      </span>
                      <input
                        type="file"
                        required
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSinpeFileName(e.target.files[0].name);
                          }
                        }}
                        id="sinpe-upload"
                      />
                      <label htmlFor="sinpe-upload" className="cursor-pointer text-xs text-brand-blue font-bold underline mt-1 inline-block">
                        {t.browseProof}
                      </label>
                    </div>
                  </div>

                  {purchaseError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{purchaseError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs"
                  >
                    {purchasing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t.processingPurchase}</span>
                      </span>
                    ) : t.completeSinpeBtn}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-2">
                  <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-white">
                    {t.sinpeSuccessTitle}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {t.sinpeSuccessMsg(`₡${totalPrice.toLocaleString()}`, sinpeRef, email)}
                  </p>
                  <button
                    onClick={resetAndClose}
                    className="w-full py-3 bg-brand-green text-brand-navy font-extrabold rounded-xl"
                  >
                    {t.closeAndReturn}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 3 && paymentMethod !== 'sinpe' && (
            <div className="text-center space-y-5 py-2">
              <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-serif text-xl font-bold text-white">
                  {t.confirmedTitle}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {t.confirmedSubtitle(email || 'tu correo')}
                </p>
              </div>

              {/* Digital Ticket Voucher Card */}
              <div className="bg-gradient-to-b from-brand-navyCard to-brand-navyDark p-5 rounded-2xl border border-brand-green/50 text-left relative overflow-hidden shadow-2xl">
                <div className="absolute right-3 top-3 text-brand-lime flex items-center space-x-1 text-[10px] bg-brand-green/20 px-2 py-0.5 rounded border border-brand-green/40 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.officialTicketBadge}</span>
                </div>

                <div className="border-b border-white/10 pb-3 mb-3">
                  <span className="text-[10px] text-slate-300 font-mono">ID: TKT-2026-FC-{Math.floor(1000 + Math.random() * 9000)}</span>
                  <h5 className="font-serif text-lg font-bold text-white">{show.title}</h5>
                  <p className="text-xs text-brand-blue font-medium">{show.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div>
                    <span className="text-slate-300 block text-[10px]">{t.ticketPatron}:</span>
                    <span className="font-semibold text-white">{name || (language === 'es' ? 'Cliente FC' : 'FC Guest')}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block text-[10px]">{t.quantity}:</span>
                    <span className="font-semibold text-white">{t.ticketCount(quantity)}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block text-[10px]">{t.ticketDate}:</span>
                    <span className="font-semibold text-white">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block text-[10px]">{t.ticketTotal}:</span>
                    <span className="font-mono font-bold text-brand-lime">₡{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {purchaseResult?.tickets && purchaseResult.tickets.length > 0 ? (
                  <div className="space-y-2">
                    <span className="block text-[11px] font-mono text-slate-300 font-bold mb-1">
                      {t.yourTickets}
                    </span>
                    {purchaseResult.tickets.map((tItem, i) => (
                      <div key={tItem.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <QrCode className="w-8 h-8 text-[#77C65E]" />
                          <div className="text-[10px] text-slate-300">
                            <span className="block text-white font-mono font-bold">
                              {t.ticketItem(i + 1)}
                            </span>
                            <span className="font-mono text-[#DCEB4F]">{tItem.qr_code}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <QrCode className="w-12 h-12 text-brand-green" />
                      <div className="text-[10px] text-slate-300">
                        <span className="block text-white font-mono font-bold">
                          {t.qrCodeTitle}
                        </span>
                        <span>
                          {t.qrCodeSubtitle}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={resetAndClose}
                className="w-full py-3 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl"
              >
                {t.closeAndReturn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
