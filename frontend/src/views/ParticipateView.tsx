import React, { useEffect, useState } from 'react';
import { Language, PublicForm } from '../types';
import { apiAdminJson } from '../services/apiAdmin';
import { ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { getTranslations } from '../lib/i18n';

interface ParticipateViewProps {
  language: Language;
  onSelectForm: (form: PublicForm) => void;
}

export const ParticipateView: React.FC<ParticipateViewProps> = ({
  language,
  onSelectForm,
}) => {
  const t = getTranslations(language).views.participate;
  const [formularios, setFormularios] = useState<PublicForm[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    setCargando(true);
    async function cargar() {
      try {
        const datos = await apiAdminJson<PublicForm[]>(
          `/api/v1/forms/published?lang=${language}`,
          { signal: controller.signal },
          { tokenOpcional: true }
        );
        if (controller.signal.aborted) return;
        const lista = Array.isArray(datos) ? datos : [];
        const pending = lista.some(form => form.localization?.state === 'pending');
        const keepPolling = pending && ++attempts < 60;
        setFormularios(pending && !keepPolling ? lista.map(form => form.localization?.state === 'pending'
          ? { ...form, localization: { ...form.localization, state: 'unavailable' as const } } : form) : lista);
        if (keepPolling) {
          timer = setTimeout(cargar, 3000);
        }
      } catch {
        if (!controller.signal.aborted && attempts === 0) setFormularios([]);
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    }
    void cargar();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [language]);

  // El destacado se elige desde el admin de Formularios; si no hay ninguno
  // publicado, la tarjeta grande no se muestra.
  const destacado = formularios.find((f) => f.is_featured) ?? null;

  const titulo = (form: PublicForm) =>
    form.localization?.language === language ? form.localization.title : language === 'es' ? form.title : form.title_en || form.title;
  const descripcion = (form: PublicForm) =>
    form.localization?.language === language ? form.localization.description : language === 'es' ? form.description : form.description_en || form.description;
  const periodo = (form: PublicForm) =>
    form.localization?.language === language ? form.localization.period : language === 'es' ? form.period : form.period_en || form.period;
  const requisitos = (form: PublicForm) => form.localization?.language === language
    ? form.localization.requirements : form.requirements?.[language] ?? [];

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

      {formularios.some(form => form.localization?.language === language && form.localization.state === 'pending') && (
        <p role="status" className="text-center text-xs text-slate-500 dark:text-slate-400">
          {language === 'es' ? 'Preparando traducción. Los textos se actualizarán automáticamente.' : 'Preparing translation. Texts will update automatically.'}
        </p>
      )}

      {/* Tarjeta principal: el formulario marcado como destacado en el admin */}
      {destacado && (
        <div className="bg-white dark:bg-gradient-to-r dark:from-brand-navy dark:via-brand-navyCard dark:to-brand-navy border border-slate-200 dark:border-brand-green/40 rounded-3xl p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl dark:shadow-2xl">
          <div className={`${destacado.image_url ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-brand-forest dark:text-brand-lime">
              <Star className="w-4 h-4 text-brand-green fill-current" />
              <span>
                {destacado.category ? t.categories[destacado.category] : t.openCallsBadge}
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-navy dark:text-white">
              {titulo(destacado)}
            </h2>

            {descripcion(destacado) && (
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {descripcion(destacado)}
              </p>
            )}

            {requisitos(destacado).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300 pt-2">
                {requisitos(destacado).map((req, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={() => onSelectForm(destacado)}
                className="px-7 py-3 btn-green text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center space-x-2 uppercase tracking-wider"
              >
                <span>{t.applyRoleBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {destacado.image_url && (
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
                <img src={destacado.image_url} alt={titulo(destacado)} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      )}

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

        {cargando ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.loadingCalls}</p>
        ) : formularios.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.noOpenCalls}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {formularios.map((form) => {
              const requisitosForm = requisitos(form);
              return (
                <div
                  key={form.slug}
                  className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-2xl p-6 space-y-4 hover:border-brand-green/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {form.category && (
                        <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded border ${
                          form.category === 'internship'
                            ? 'bg-brand-green/20 text-brand-forest dark:text-brand-lime border-brand-green/40'
                            : form.category === 'camp'
                            ? 'bg-brand-blue/20 text-brand-blue border-brand-blue/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {t.categories[form.category]}
                        </span>
                      )}
                      {periodo(form) && (
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">{periodo(form)}</span>
                      )}
                    </div>

                    <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
                      {titulo(form)}
                    </h3>

                    {descripcion(form) && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {descripcion(form)}
                      </p>
                    )}

                    {requisitosForm.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-bold text-brand-forest dark:text-brand-lime block">
                          {t.requirementsLabel}
                        </span>
                        {requisitosForm.map((req, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <Star className="w-3 h-3 text-brand-green shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={() => onSelectForm(form)}
                      className="w-full py-2.5 btn-green text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider"
                    >
                      {t.applyRoleBtn}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
