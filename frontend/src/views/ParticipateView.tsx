import React from 'react';
import { Language, Opportunity } from '../types';
import { opportunitiesData } from '../data/mockData';
import { GraduationCap, Users, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { getTranslations } from '../lib/i18n';

interface ParticipateViewProps {
  language: Language;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const ParticipateView: React.FC<ParticipateViewProps> = ({
  language,
  onSelectOpportunity,
}) => {
  const t = getTranslations(language).views.participate;
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
          {t.desc}
        </p>
      </div>

      {/* Main Costa Rica Theatre Camp Feature Card */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-brand-navy dark:via-brand-navyCard dark:to-brand-navy border border-slate-200 dark:border-brand-green/40 rounded-3xl p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl dark:shadow-2xl">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-brand-forest dark:text-brand-lime">
            <GraduationCap className="w-4 h-4 text-brand-green" />
            <span>{t.campBadge}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy dark:text-white">
            {t.campTitle}
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {t.campDesc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>{t.campBullets.ages}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>{t.campBullets.scholarships}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>{t.campBullets.faculty}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
              <span>{t.campBullets.shows}</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onSelectOpportunity(opportunitiesData[0])}
              className="px-7 py-3 btn-green text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center space-x-2 uppercase tracking-wider"
            >
              <span>{t.applyCampBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
            <img src="/recursos/IMG_2916.PNG" alt="Costa Rica Theatre Camp" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* International Internships & Volunteer Opportunities */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold text-brand-green uppercase tracking-wider block mb-1">
              {t.openCallsBadge}
            </span>
            <h2 className="font-serif text-3xl font-bold text-brand-navy dark:text-white">
              {t.openCallsTitle}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opportunitiesData.map((opp) => (
            <div
              key={opp.id}
              className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-2xl p-6 space-y-4 hover:border-brand-green/60 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded border ${
                    opp.type === 'internship'
                      ? 'bg-brand-green/20 text-brand-forest dark:text-brand-lime border-brand-green/40'
                      : opp.type === 'camp'
                      ? 'bg-brand-blue/20 text-brand-blue border-brand-blue/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {opp.type === 'internship' ? 'Pasantía Internacional' : opp.type === 'camp' ? 'Campamento' : 'Voluntariado Cyber'}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">{opp.period}</span>
                </div>

                <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                  {language === 'es' ? opp.title : opp.titleEn}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'es' ? opp.description : opp.descriptionEn}
                </p>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-brand-forest dark:text-brand-lime block">Requisitos:</span>
                  {(language === 'es' ? opp.requirements : opp.requirementsEn).map((req, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <Star className="w-3 h-3 text-brand-green shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="w-full py-2.5 btn-green text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider"
                >
                  {t.applyRoleBtn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
