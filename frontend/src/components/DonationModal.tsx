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
      <div className="bg-[#002244] border border-[#1e4066] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-[#F8F8F2]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#00162e] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#77C65E]/20 border border-[#77C65E]/40 text-[#77C65E]">
              <Heart className="w-5 h-5 fill-[#77C65E]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">
                {language === 'es' ? 'Donar a Far Corners Teatro Comunitario' : 'Donate to Far Corners'}
              </h3>
              <p className="text-xs text-[#DCEB4F]">
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
                          ? 'bg-[#77C65E] border-[#DCEB4F] text-[#002244] shadow-glow-green'
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
                    className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-sm text-white focus:border-[#77C65E] focus:outline-none font-mono"
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
                        ? 'bg-[#77C65E] border-[#DCEB4F] text-[#002244] font-bold shadow-glow-green'
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
                        ? 'bg-[#77C65E] border-[#DCEB4F] text-[#002244] font-bold shadow-glow-green'
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
                        ? 'bg-[#77C65E] border-[#DCEB4F] text-[#002244] font-bold shadow-glow-green'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    Tarjeta / Stripe
                  </button>
                </div>
              </div>

              {paymentMethod === 'sinpe' && (
                <div className="bg-[#00162e] p-4 rounded-xl border border-white/10 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-300">Número SINPE Móvil:</span>
                    <span className="font-mono font-bold text-[#DCEB4F] text-sm bg-[#002244] px-2 py-0.5 rounded border border-[#1e4066]">8888-9999</span>
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
                      className="w-full px-3 py-1.5 bg-[#002244] border border-[#1e4066] rounded text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'zeffy' && (
                <div className="bg-[#00162e] p-4 rounded-xl border border-white/10 text-xs space-y-1">
                  <p className="text-slate-200 font-semibold">Integración Zeffy Payments (0% Comisión)</p>
                  <p className="text-slate-300">El 100% de tu contribución llega directo a nuestras becas y producciones.</p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-[#00162e] p-4 rounded-xl border border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-200">
                    <CreditCard className="w-4 h-4 text-[#4A90D6]" />
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
                    className="w-full px-3 py-2 bg-[#00162e] border border-[#1e4066] rounded text-xs text-white"
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
                    className="w-full px-3 py-2 bg-[#00162e] border border-[#1e4066] rounded text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Completar Donación de ${activeAmount} USD</span>
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">¡Muchas Gracias por tu Aporte!</h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Tu contribución de <strong className="text-[#DCEB4F]">${activeAmount} USD</strong> permite seguir financiando becas de teatro musical y producciones comunitarias.
              </p>
              <div className="p-4 bg-[#00162e] rounded-xl border border-white/10 text-xs text-slate-300">
                Se enviará el recibo oficial al correo <span className="text-white">{donorEmail}</span>.
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-[#77C65E] text-[#002244] font-extrabold rounded-xl"
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
