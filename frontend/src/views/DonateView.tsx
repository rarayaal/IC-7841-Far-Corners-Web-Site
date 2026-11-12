import React, { useState } from 'react';
import { Language } from '../types';
import { Heart, ShieldCheck, CheckCircle2, CreditCard, Send, Upload, AlertCircle } from 'lucide-react';
import { getTranslations } from '../lib/i18n';

interface DonateViewProps {
  language: Language;
  onOpenDonateModal: () => void;
}

export const DonateView: React.FC<DonateViewProps> = ({ language, onOpenDonateModal }) => {
  const t = getTranslations(language).views.donate;
  const [submitted, setSubmitted] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [amount, setAmount] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState<'sinpe' | 'zeffy' | 'card'>('sinpe');
  const [refNumber, setRefNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      const res = await fetch('/api/v1/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName.trim() || null,
          donor_email: donorEmail.trim() || null,
          amount: parsedAmount,
          currency: 'USD',
          payment_provider: paymentMethod === 'sinpe' ? 'sinpe' : paymentMethod === 'zeffy' ? 'zeffy' : 'stripe',
          payment_method: paymentMethod,
          payment_reference: refNumber.trim() || null,
          status: paymentMethod === 'sinpe' ? 'pending' : 'completed',
          message: 'Donación recibida desde el portal institucional',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || data?.message || 'Error al procesar la donación');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo registrar la donación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-lime text-xs font-bold uppercase tracking-wider border border-brand-green/40">
          {t.badge}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Direct Donation Registration Form */}
      <div className="bg-brand-navy border border-brand-green/40 rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-glow-green">
        <div className="border-b border-white/10 pb-4">
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-brand-green fill-brand-green" />
            <span>{t.registerTitle}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {t.registerSubtitle}
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
                  <span className="text-slate-300 font-semibold">
                    {t.sinpeNumberTitle}
                  </span>
                  <span className="font-mono font-bold text-brand-lime text-sm bg-brand-navy px-2 py-0.5 rounded border border-brand-border">8888-9999</span>
                </div>
                <p className="text-slate-300">
                  {t.sinpeInstructions}
                </p>
                <div>
                  <label className="block text-slate-400 mb-1">
                    {t.sinpeRefLabel}
                  </label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder={t.sinpeRefPlaceholder}
                    className="w-full px-3 py-1.5 bg-brand-navy border border-brand-border rounded text-white font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'zeffy' && (
              <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 text-xs space-y-1">
                <p className="text-slate-200 font-semibold">
                  {t.zeffyTitle}
                </p>
                <p className="text-slate-300">
                  {t.zeffySubtitle}
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="bg-brand-navyDark p-4 rounded-xl border border-white/10 text-xs space-y-1">
                <div className="flex items-center space-x-2 text-slate-200">
                  <CreditCard className="w-4 h-4 text-brand-blue" />
                  <span>{t.cardTitle}</span>
                </div>
                <p className="text-slate-300">
                  {t.cardSubtitle}
                </p>
              </div>
            )}

            {/* Donor Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.donorNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={t.donorNamePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-xl text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.donorEmailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder={t.donorEmailPlaceholder}
                  className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-xl text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.amountLabel}
              </label>
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

            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 btn-green text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>
                {loading
                  ? t.processingBtn
                  : t.submitBtn(amount)}
              </span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-serif text-xl font-bold text-white">
              {t.successTitle}
            </h4>
            <p className="text-xs text-slate-300">
              {t.successMsg(donorName, amount)}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 bg-white/10 text-white text-xs font-semibold rounded-xl"
            >
              {t.registerAnotherBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
