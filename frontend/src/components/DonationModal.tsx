import React, { useState } from 'react';
import { Language } from '../types';
import { X, Heart, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'card'>('sinpe');
  const [sinpeRef, setSinpeRef] = useState('');

  if (!isOpen) return null;

  const activeAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setSinpeRef('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-navy border border-brand-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-brand-cream">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-brand-navyDark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <Heart className="w-5 h-5 fill-brand-green" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                {language === 'es' ? 'Donar a Far Corners Teatro Comunitario' : 'Donate to Far Corners'}
              </h3>
              <p className="text-xs text-brand-lime">
                {language === 'es' ? '100% destinado a programas juveniles e impacto comunitario' : '100% goes to youth programs & community impact'}
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Preset Amounts in USD ($) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                  {language === 'es' ? 'Selecciona un Monto en Dólares ($ USD):' : 'Select Amount (USD):'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => {
                        setAmount(val);
                        setCustomAmount('');
                      }}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        activeAmount === val && !customAmount
                          ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      ${val} USD
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={language === 'es' ? 'Otro monto en dólares ($ USD)...' : 'Custom amount ($ USD)...'}
                    className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-xl text-sm text-white focus:border-brand-green focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Same Payment Selector as TicketModal */}
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
                <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-300">Número SINPE Móvil:</span>
                    <span className="font-mono font-bold text-brand-lime text-sm bg-brand-navy px-2 py-0.5 rounded border border-brand-border">8888-9999</span>
                  </div>
                  <p className="text-slate-300">
                    Transfiere el equivalente a <strong>${activeAmount} USD</strong> a nombre de <strong>Far Corners Teatro Comunitario</strong>.
                  </p>
                  <div>
                    <label className="block text-slate-400 mb-1">Número de Referencia SINPE (Opcional):</label>
                    <input
                      type="text"
                      value={sinpeRef}
                      onChange={(e) => setSinpeRef(e.target.value)}
                      placeholder="Ej. #8920192"
                      className="w-full px-3 py-1.5 bg-brand-navy border border-brand-border rounded text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'zeffy' && (
                <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 text-xs space-y-1">
                  <p className="text-slate-200 font-semibold">Integración Zeffy Payments (0% Comisión)</p>
                  <p className="text-slate-300">El 100% de tu contribución llega directo a nuestras becas y producciones.</p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <CreditCard className="w-4 h-4 text-brand-blue" />
                    <span>Pasarela Segura SSL Stripe & PayPal</span>
                  </div>
                  <p className="text-slate-300">Procesamiento directo con tarjeta internacional.</p>
                </div>
              )}

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Tu nombre..."
                    className="w-full px-3 py-2 bg-brand-navyDark border border-brand-border rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 bg-brand-navyDark border border-brand-border rounded text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Completar Donación de ${activeAmount} USD</span>
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">¡Muchas Gracias por tu Aporte!</h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Tu contribución de <strong className="text-brand-lime">${activeAmount} USD</strong> permite seguir financiando becas de teatro musical y producciones comunitarias.
              </p>
              <div className="p-4 bg-brand-navyDark rounded-xl border border-white/10 text-xs text-slate-300">
                Se enviará el recibo oficial al correo <span className="text-white">{donorEmail}</span>.
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-brand-green text-brand-navy font-extrabold rounded-xl"
              >
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
