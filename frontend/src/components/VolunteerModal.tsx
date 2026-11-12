import React, { useEffect, useState } from 'react';
import { Language, Opportunity } from '../types';
import { X, UserCheck, CheckCircle2, Upload } from 'lucide-react';
import type { UsuarioSesion } from '../services/sesion';
import { getTranslations } from '../lib/i18n';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  language: Language;
  usuario: UsuarioSesion | null;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  language,
  usuario,
}) => {
  const t = getTranslations(language).modals.volunteer;
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [experience, setExperience] = useState('');
  const [fileName, setFileName] = useState('');

  const usuarioId = usuario?.id;
  const nombreUsuario = usuario?.full_name ?? '';
  const correoUsuario = usuario?.email ?? '';
  const oportunidadId = opportunity?.id;

  useEffect(() => {
    if (!isOpen || !usuarioId || !oportunidadId) return;
    setFullName(nombreUsuario);
    setEmail(correoUsuario);
  }, [isOpen, oportunidadId, usuarioId, nombreUsuario, correoUsuario]);

  if (!isOpen || !opportunity || !usuario) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFileName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-brand-navy dark:text-brand-cream">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-brand-navyDark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white leading-tight">
                {t.title}
              </h3>
              <p className="text-xs text-brand-forest dark:text-brand-lime font-semibold">
                {language === 'es' ? opportunity.title : (opportunity.titleEn || opportunity.title)}
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-[#F8F8F2] dark:bg-brand-navyDark p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-brand-navy dark:text-white block">
                  {t.locationAndPeriod}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{opportunity.location} • {opportunity.period}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sofia@email.com"
                    className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {t.country}
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t.countryPlaceholder}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.experience}
                </label>
                <textarea
                  required
                  rows={3}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder={t.experiencePlaceholder}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                ></textarea>
              </div>

              {/* CV / Document Demo */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {t.attachCV}
                </label>
                <div className="border border-dashed border-slate-200 dark:border-brand-border bg-[#F8F8F2] dark:bg-brand-navyDark p-4 rounded-xl text-center cursor-pointer hover:border-brand-green transition-colors">
                  <Upload className="w-6 h-6 text-brand-green mx-auto mb-1" />
                  <span className="text-xs text-slate-600 dark:text-slate-300 block">
                    {fileName ? fileName : t.attachCVPlaceholder}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileName(e.target.files[0].name);
                      }
                    }}
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer text-xs text-brand-blue font-bold underline mt-1 inline-block">
                    {t.browseFile}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 btn-green text-brand-navy hover:text-brand-navy dark:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs"
              >
                {t.submitBtn}
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
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t.successMessage(fullName, (language === 'es' ? opportunity.title : opportunity.titleEn) || opportunity.title)}
              </p>
              <div className="p-4 bg-[#F8F8F2] dark:bg-brand-navyDark rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
                {t.successEmailNotice(email)}
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
