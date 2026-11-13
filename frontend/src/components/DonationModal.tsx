import React, { useState } from 'react';
import { Language } from '../types';
import { X, Heart, CheckCircle2, CreditCard } from 'lucide-react';
import { getTranslations } from '../lib/i18n';

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
  const t = getTranslations(language).modals.donation;
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
      <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-brand-navy dark:text-brand-cream">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-brand-navyDark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <Heart className="w-5 h-5 fill-brand-green" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                {t.title}
              </h3>
              <p className="text-xs text-brand-forest dark:text-brand-lime">
                {t.subtitle}
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Preset Amounts in USD ($) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-2">
                  {t.selectAmount}
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
                          : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
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
                    placeholder={t.customAmountPlaceholder}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-xl text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Same Payment Selector as TicketModal */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 mb-2">
                  {t.paymentOption}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('sinpe')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                      paymentMethod === 'sinpe'
                        ? 'bg-brand-green/20 border-brand-green text-brand-navy dark:text-white shadow-glow-green'
                        : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="font-mono text-brand-forest dark:text-brand-lime font-bold">SINPE</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">Móvil (CR)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('zeffy')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                      paymentMethod === 'zeffy'
                        ? 'bg-brand-green/20 border-brand-green text-brand-navy dark:text-white shadow-glow-green'
                        : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-brand-green font-bold">Zeffy</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">0% Comisión</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                      paymentMethod === 'card'
                        ? 'bg-brand-green/20 border-brand-green text-brand-navy dark:text-white shadow-glow-green'
                        : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-brand-blue" />
                    <span className="text-[10px] text-slate-600 dark:text-slate-300">Stripe / Tarjeta</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Details */}
              {paymentMethod === 'sinpe' && (
                <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/10">
                    <span className="text-slate-600 dark:text-slate-300">
                      {t.sinpeNumber}
                    </span>
                    <span className="font-mono font-bold text-brand-forest dark:text-brand-lime text-sm bg-white dark:bg-brand-navy px-2 py-0.5 rounded border border-slate-200 dark:border-brand-border">8888-9999</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {t.sinpeInstructions(activeAmount)}
                  </p>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">
                      {t.sinpeRefLabel}
                    </label>
                    <input
                      type="text"
                      value={sinpeRef}
                      onChange={(e) => setSinpeRef(e.target.value)}
                      placeholder={t.sinpeRefPlaceholder}
                      className="w-full px-3 py-1.5 bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded text-brand-navy dark:text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'zeffy' && (
                <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-1">
                  <p className="text-slate-700 dark:text-slate-200 font-semibold">
                    {t.zeffyTitle}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {t.zeffySubtitle}
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                    <CreditCard className="w-4 h-4 text-brand-blue" />
                    <span>{t.cardTitle}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {t.cardSubtitle}
                  </p>
                </div>
              )}

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                    {t.donorName}
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={t.donorNamePlaceholder}
                    className="w-full px-3 py-2 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded text-xs text-brand-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-300 mb-1">
                    {t.donorEmail}
                  </label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded text-xs text-brand-navy dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-green text-brand-navy hover:text-brand-navy dark:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs flex items-center justify-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>
                  {t.completeDonationBtn(activeAmount)}
                </span>
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-brand-navy dark:text-white">
                {t.successTitle}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {t.successMsg(activeAmount)}
              </p>
              <div className="p-4 bg-[#F8F8F2] dark:bg-brand-navyDark rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
                {t.receiptNotice(donorEmail)}
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-brand-green text-brand-navy font-extrabold rounded-xl"
              >
                {t.closeBtn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
