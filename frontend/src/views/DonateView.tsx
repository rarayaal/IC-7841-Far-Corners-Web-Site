import React, { useState } from 'react';
import { Language } from '../types';
import { Heart, ShieldCheck, CheckCircle2, CreditCard, Send, Upload } from 'lucide-react';

interface DonateViewProps {
  language: Language;
  onOpenDonateModal: () => void;
}

export const DonateView: React.FC<DonateViewProps> = ({ language, onOpenDonateModal }) => {
  const [submitted, setSubmitted] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'card'>('sinpe');
  const [refNumber, setRefNumber] = useState('');

  const handleSubmitDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-lime text-xs font-bold uppercase tracking-wider border border-brand-green/40">
          {language === 'es' ? 'Recaudación de Fondos & Apoyo' : 'Donations & Support'}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
          {language === 'es' ? 'Donaciones al Teatro Far Corners' : 'Donate to Far Corners'}
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          {language === 'es'
            ? 'Tu donación financia directamente becas de campamento, vestuario, utilería e infraestructura teatral para jóvenes comunitarios en Costa Rica.'
            : 'Your donation directly funds youth scholarships, costumes, props, and stage infrastructure.'}
        </p>
      </div>

      {/* Direct Donation Registration Form */}
      <div className="bg-brand-navy border border-brand-green/40 rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-glow-green">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-brand-green fill-brand-green" />
            <span>Registrar una Donación</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Selecciona el modo de pago e ingresa el monto en dólares ($ USD) para realizar tu aporte.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmitDonation} className="space-y-5">
            {/* Payment Method Selector (Identical to TicketModal) */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                Selecciona Modo de Pago:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('sinpe')}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'sinpe'
                      ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green'
                      : 'bg-white/5 border-white/10 text-slate-300'
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
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  Zeffy (0% com)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-brand-green border-brand-lime text-brand-navy shadow-glow-green'
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
                  <span className="text-slate-300 font-semibold">Número SINPE Móvil Oficial:</span>
                  <span className="font-mono font-bold text-brand-lime text-sm bg-brand-navy px-2 py-0.5 rounded border border-brand-border">8888-9999</span>
                </div>
                <p className="text-slate-300">
                  Transfiere el equivalente de tu donación en dólares a nombre de <strong>Far Corners Teatro Comunitario</strong>.
                </p>
                <div>
                  <label className="block text-slate-400 mb-1">Número de Referencia SINPE (Opcional):</label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="Ej. #8920192"
                    className="w-full px-3 py-1.5 bg-brand-navy border border-brand-border rounded text-white font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'zeffy' && (
              <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 text-xs space-y-1">
                <p className="text-slate-200 font-semibold">Zeffy Payments (0% Comisión)</p>
                <p className="text-slate-300">Plataforma 100% gratuita para ONG. El 100% de tu dinero llega directo al programa.</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 text-xs space-y-1">
                <div className="flex items-center space-x-2 text-slate-200">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                  <span>Pasarela Segura SSL Stripe & PayPal</span>
                </div>
                <p className="text-slate-300">Procesamiento seguro directo con tarjeta de crédito o débito internacional.</p>
              </div>
            )}

            {/* Donor Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo del Donante *</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Tu nombre..."
                  className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-xl text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-xl text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Donado ($ USD Solo Dólares) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-mono text-xs text-brand-lime font-bold">$</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50"
                  className="w-full pl-8 pr-12 py-2.5 bg-brand-navyDark border border-brand-border rounded-xl text-xs text-white focus:border-brand-green focus:outline-none font-mono font-bold"
                />
                <span className="absolute right-3.5 top-2.5 font-mono text-[10px] text-slate-400">USD</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>Completar Registro de Donación (${amount} USD)</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-serif text-xl font-bold text-white">¡Donación Registrada Exitosamente!</h4>
            <p className="text-xs text-slate-300">
              Gracias <strong className="text-white">{donorName}</strong>. Hemos registrado tu aporte de <span className="text-brand-lime font-mono font-bold">${amount} USD</span> en nuestro sistema.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-white/10 text-white text-xs font-semibold rounded-xl"
            >
              Registrar Otra Donación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
