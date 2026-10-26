import React, { useState, useEffect } from 'react';
import { Language, Show } from '../types';
import { X, Ticket, Calendar, CheckCircle2, ShieldCheck, QrCode, CreditCard, Clock, Upload, AlertTriangle } from 'lucide-react';

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quantity, setQuantity] = useState(2);
  const [selectedDate, setSelectedDate] = useState('2026-07-18');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'card'>('sinpe');
  
  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // SINPE Confirmation info (Step 3)
  const [sinpeRef, setSinpeRef] = useState('');
  const [sinpeFileName, setSinpeFileName] = useState('');
  const [sinpeCompleted, setSinpeCompleted] = useState(false);

  // 5 Minute Timer for SINPE Payment
  const [timeLeft, setTimeLeft] = useState<number>(300); // 300 seconds = 5 minutes
  const [isTimerExpired, setIsTimerExpired] = useState(false);

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

  const pricePerTicket = show.priceGeneral || 10000;
  const totalPrice = pricePerTicket * quantity;

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
      setTimeLeft(300); // Reset 5-minute countdown on reaching Step 3
      setIsTimerExpired(false);
    }
  };

  const handleFinishSinpe = (e: React.FormEvent) => {
    e.preventDefault();
    setSinpeCompleted(true);
  };

  const resetAndClose = () => {
    setStep(1);
    setSinpeRef('');
    setSinpeFileName('');
    setSinpeCompleted(false);
    setTimeLeft(300);
    setIsTimerExpired(false);
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
                {language === 'es' ? 'Boletería Far Corners Teatro Comunitario' : 'Official Far Corners Ticket Office'}
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
            1. {language === 'es' ? 'Entradas & Fecha' : 'Tickets & Date'}
          </span>
          <span className={step >= 2 ? 'text-brand-green font-bold' : ''}>
            2. {language === 'es' ? 'Datos del Comprador' : 'Patron Details'}
          </span>
          <span className={step === 3 ? 'text-brand-lime font-bold' : ''}>
            3. {paymentMethod === 'sinpe' ? 'Comprobante SINPE' : 'Confirmación'}
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  {language === 'es' ? 'Selecciona la Función:' : 'Select Show Date:'}
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
                  <span className="font-bold text-sm text-white block">Entrada General</span>
                  <span className="text-xs text-slate-300">Asiento para función de teatro</span>
                </div>
                <span className="font-mono text-base font-bold text-brand-lime">
                  ₡{pricePerTicket.toLocaleString()} CRC
                </span>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold uppercase text-slate-300">
                  {language === 'es' ? 'Cantidad de Boletos:' : 'Ticket Quantity:'}
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
                  {language === 'es' ? 'Total a Pagar:' : 'Total Amount:'}
                </span>
                <span className="font-mono text-xl font-bold text-brand-lime">
                  ₡{totalPrice.toLocaleString()} CRC
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all text-sm uppercase tracking-wider"
              >
                {language === 'es' ? 'Continuar a Datos del Comprador' : 'Proceed to Patron Info'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. María Rodríguez"
                    className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono *</label>
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
                  {language === 'es' ? 'Selecciona Modo de Pago:' : 'Payment Option:'}
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
                    Tarjeta / Stripe
                  </button>
                </div>
              </div>

              {paymentMethod === 'sinpe' && (
                <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs text-slate-300">
                  <p className="font-semibold text-white">Reserva Temporal SINPE Móvil</p>
                  <p className="mt-1 text-slate-300">
                    Al hacer clic en <strong>Confirmar Reserva</strong>, se reservarán tus boletos por <strong>5 minutos</strong> para que realices la transferencia e ingreses el comprobante.
                  </p>
                </div>
              )}

              {paymentMethod === 'zeffy' && (
                <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                  <p className="text-slate-200 font-semibold">Zeffy Payments (0% Comisión)</p>
                  <p className="text-slate-300">Plataforma 100% gratuita para ONG. Tu dinero llega íntegro a las producciones de Far Corners.</p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <CreditCard className="w-4 h-4 text-brand-blue" />
                    <span>Pasarela Segura SSL Stripe & PayPal</span>
                  </div>
                  <p className="text-slate-300">Procesamiento inmediato con encriptación bancaria.</p>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all"
                >
                  Confirmar Reserva de Boletos
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
                      <span className="text-slate-300 font-semibold">Número SINPE Móvil Oficial:</span>
                      <span className="font-mono font-bold text-brand-lime text-sm bg-brand-navy px-2 py-0.5 rounded border border-brand-border">8888-9999</span>
                    </div>
                    <p className="text-slate-300">
                      Transfiere <strong>₡{totalPrice.toLocaleString()} CRC</strong> a nombre de <strong>Far Corners Teatro Comunitario</strong>.
                    </p>
                  </div>

                  {/* Reference & Receipt upload */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Referencia SINPE *</label>
                    <input
                      type="text"
                      required
                      value={sinpeRef}
                      onChange={(e) => setSinpeRef(e.target.value)}
                      placeholder="Ej. #8920192"
                      className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white font-mono focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Adjuntar Comprobante de Pago (Imagen o PDF) *</label>
                    <div className="border border-dashed border-brand-border bg-brand-navyDark p-4 rounded-xl text-center cursor-pointer hover:border-brand-green transition-colors">
                      <Upload className="w-6 h-6 text-brand-green mx-auto mb-1" />
                      <span className="text-xs text-slate-300 block">
                        {sinpeFileName ? sinpeFileName : 'Haz clic para seleccionar el archivo de comprobante'}
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
                        Examinar Comprobante
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs"
                  >
                    Completar Registro de Pago SINPE
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-2">
                  <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="font-serif text-xl font-bold text-white">¡Comprobante SINPE Recibido!</h4>
                  <p className="text-xs text-slate-300">
                    Hemos registrado tu pago de <strong className="text-white">₡{totalPrice.toLocaleString()}</strong> (Ref: <span className="font-mono text-brand-lime">{sinpeRef}</span>). Se enviaron los boletos a <span className="text-white">{email}</span>.
                  </p>
                  <button
                    onClick={resetAndClose}
                    className="w-full py-3 bg-brand-green text-brand-navy font-extrabold rounded-xl"
                  >
                    Cerrar y Volver
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
                <h4 className="font-serif text-xl font-bold text-white">¡Reserva y Boleto Confirmado!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Se ha enviado la confirmación y los boletos digitales a <span className="text-brand-lime">{email || 'tu correo'}</span>.
                </p>
              </div>

              {/* Digital Ticket Voucher Card */}
              <div className="bg-gradient-to-b from-brand-navyCard to-brand-navyDark p-5 rounded-2xl border border-brand-green/50 text-left relative overflow-hidden shadow-2xl">
                <div className="absolute right-3 top-3 text-brand-lime flex items-center space-x-1 text-[10px] bg-brand-green/20 px-2 py-0.5 rounded border border-brand-green/40 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>BOLETO OFICIAL</span>
                </div>

                <div className="border-b border-white/10 pb-3 mb-3">
                  <span className="text-[10px] text-slate-300 font-mono">ID: TKT-2026-FC-{Math.floor(1000 + Math.random() * 9000)}</span>
                  <h5 className="font-serif text-lg font-bold text-white">{show.title}</h5>
                  <p className="text-xs text-brand-blue font-medium">{show.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div>
                    <span className="text-slate-300 block text-[10px]">Titular:</span>
                    <span className="font-semibold text-white">{name || 'Cliente FC'}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block text-[10px]">Entradas:</span>
                    <span className="font-semibold text-white">{quantity} x (Entrada General)</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block text-[10px]">Fecha:</span>
                    <span className="font-semibold text-white">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block text-[10px]">Total:</span>
                    <span className="font-mono font-bold text-brand-lime">₡{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* QR Simulation */}
                <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/10">
                  <div className="flex items-center space-x-3">
                    <QrCode className="w-12 h-12 text-brand-green" />
                    <div className="text-[10px] text-slate-300">
                      <span className="block text-white font-mono font-bold">Código de Acceso QR</span>
                      <span>Muestra este código al ingresar al teatro</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={resetAndClose}
                className="w-full py-3 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl"
              >
                Cerrar y Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
