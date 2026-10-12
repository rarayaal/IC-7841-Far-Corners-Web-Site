import React from 'react';
import { Language, Opportunity } from '../types';
import { opportunitiesData } from '../data/mockData';
import { GraduationCap, Users, ArrowRight, CheckCircle2, Star } from 'lucide-react';

interface ParticipateViewProps {
  language: Language;
  onSelectOpportunity: (opp: Opportunity) => void;
}

export const ParticipateView: React.FC<ParticipateViewProps> = ({
  language,
  onSelectOpportunity,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#77C65E]/20 text-[#DCEB4F] text-xs font-bold uppercase tracking-wider border border-[#77C65E]/40">
          {language === 'es' ? 'Participación e Intercambio' : 'Programs & Opportunities'}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
          {language === 'es' ? 'Únete al Programa Far Corners' : 'Join the Far Corners Family'}
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          {language === 'es'
            ? 'Descubre oportunidades para estudiantes locales, pasantías universitarias internacionales y voluntariado cyber o presencial.'
            : 'Explore opportunities for local students, international university internships, and cyber/onsite volunteering.'}
        </p>
      </div>

      {/* Main Costa Rica Theatre Camp Feature Card */}
      <div className="bg-gradient-to-r from-[#002244] via-[#002d57] to-[#002244] border border-[#77C65E]/40 rounded-3xl p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#DCEB4F]">
            <GraduationCap className="w-4 h-4 text-[#77C65E]" />
            <span>CAMPAMENTO DE VERANO BILINGÜE</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Costa Rica Theatre Camp (CRTC)
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            {language === 'es'
              ? 'Un programa de inmersión total en Monteverde, Puntarenas. Los participantes reciben formación en canto, danza y actuación mientras ensayan el musical de la temporada para presentarlo ante el público costarricense.'
              : 'A full immersion musical theatre camp in Monteverde, Costa Rica. Campers receive vocal, dance, and acting training culminating in a full musical.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#77C65E] shrink-0" />
              <span>Edades: 8 a 18 años</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#77C65E] shrink-0" />
              <span>100% Becas locales disponibles</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#77C65E] shrink-0" />
              <span>Instructorado bilingüe de nivel internacional</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#77C65E] shrink-0" />
              <span>Funciones estelares abiertas al público</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onSelectOpportunity(opportunitiesData[0])}
              className="px-7 py-3 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center space-x-2 uppercase tracking-wider"
            >
              <span>{language === 'es' ? 'Postular al Campamento 2026' : 'Apply for Theatre Camp 2026'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img src="/recursos/IMG_2916.PNG" alt="Costa Rica Theatre Camp" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* International Internships & Volunteer Opportunities */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-bold text-[#77C65E] uppercase tracking-wider block mb-1">
              {language === 'es' ? 'Convocatorias Abiertas Verano 2026' : 'Open Calls Summer 2026'}
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              {language === 'es' ? 'Pasantías Internacionales y Voluntariado' : 'Internships & Volunteering'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {opportunitiesData.map((opp) => (
            <div
              key={opp.id}
              className="bg-[#002244] border border-[#1e4066] rounded-2xl p-6 space-y-4 hover:border-[#77C65E]/60 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded border ${
                    opp.type === 'internship'
                      ? 'bg-[#77C65E]/20 text-[#DCEB4F] border-[#77C65E]/40'
                      : opp.type === 'camp'
                      ? 'bg-[#4A90D6]/20 text-[#4A90D6] border-[#4A90D6]/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {opp.type === 'internship' ? 'Pasantía Internacional' : opp.type === 'camp' ? 'Campamento' : 'Voluntariado Cyber'}
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">{opp.period}</span>
                </div>

                <h3 className="font-serif text-xl font-bold text-white">
                  {language === 'es' ? opp.title : opp.titleEn}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'es' ? opp.description : opp.descriptionEn}
                </p>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-[#DCEB4F] block">Requisitos:</span>
                  {(language === 'es' ? opp.requirements : opp.requirementsEn).map((req, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                      <Star className="w-3 h-3 text-[#77C65E] shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => onSelectOpportunity(opp)}
                  className="w-full py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider"
                >
                  {language === 'es' ? 'Postular a este Puesto' : 'Apply for this Role'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
