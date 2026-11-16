import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import {
  SLUG_LIBRE_SECTIONS,
  SCOPES_BY_SECTION,
  type InstitutionalContent,
  type InstitutionalSection,
} from '../services/institutional';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface ContentForm {
  id?: string;
  page_slug: string;
  language: Language;
  title: string;
  subtitle: string;
  content: string;
  cta_label: string;
  cta_target: string;
  display_order: number;
  is_published: boolean;
}

const SECCIONES: InstitutionalSection[] = [
  'history',
  'impact',
  'future',
  'footer',
  'board',
  'production',
  'gallery',
];

const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const formVacio = (section: InstitutionalSection): ContentForm => ({
  page_slug: SCOPES_BY_SECTION[section][0] ?? '',
  language: 'es',
  title: '',
  subtitle: '',
  content: '',
  cta_label: '',
  cta_target: '',
  display_order: 0,
  is_published: false,
});

export const AdminInstitutionalView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const t = txt.institutional;

  const [seccion, setSeccion] = useState<InstitutionalSection>('history');
  const [items, setItems] = useState<InstitutionalContent[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<ContentForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<InstitutionalContent | null>(
    null
  );
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError('');
    setFormulario(null);

    async function cargar() {
      try {
        const datos = await api<InstitutionalContent[]>(
          `/api/v1/institutional/${seccion}/admin`
        );
        if (activo) setItems(datos);
      } catch (e) {
        if (activo) {
          setItems([]);
          setError(e instanceof Error ? e.message : t.loadError);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, [seccion]);

  function abrirNuevo() {
    setFormulario(formVacio(seccion));
    setError('');
    setAviso('');
  }

  function abrirEdicion(item: InstitutionalContent) {
    setFormulario({
      id: item.id,
      page_slug: item.page_slug,
      language: item.language,
      title: item.title,
      subtitle: item.subtitle ?? '',
      content: item.content,
      cta_label: item.cta_label ?? '',
      cta_target: item.cta_target ?? '',
      display_order: item.display_order,
      is_published: item.is_published,
    });
    setError('');
    setAviso('');
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!formulario || guardando) return;

    if (!formulario.title.trim()) {
      setError(t.titleRequired);
      return;
    }

    if (!formulario.content.trim()) {
      setError(t.contentRequired);
      return;
    }

    if (!FORMATO_SLUG.test(formulario.page_slug)) {
      setError(t.slugInvalid);
      return;
    }

    setGuardando(true);
    setError('');
    setAviso('');

    const esEdicion = Boolean(formulario.id);

    try {
      const body = JSON.stringify({
        page_slug: formulario.page_slug,
        language: formulario.language,
        title: formulario.title.trim(),
        subtitle: formulario.subtitle.trim() || null,
        content: formulario.content.trim(),
        cta_label: formulario.cta_label.trim() || null,
        cta_target: formulario.cta_target.trim() || null,
        display_order: formulario.display_order,
        is_published: formulario.is_published,
      });

      const { contenido } = await api<{ contenido: InstitutionalContent }>(
        esEdicion
          ? `/api/v1/institutional/${seccion}/${formulario.id}`
          : `/api/v1/institutional/${seccion}`,
        { method: esEdicion ? 'PUT' : 'POST', body }
      );

      setItems((actuales) =>
        (esEdicion
          ? actuales.map((i) => (i.id === contenido.id ? contenido : i))
          : [...actuales, contenido]
        ).sort(
          (a, b) =>
            a.display_order - b.display_order ||
            a.page_slug.localeCompare(b.page_slug) ||
            a.language.localeCompare(b.language)
        )
      );
      setAviso(esEdicion ? t.updated : t.created);
      setFormulario(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.saveError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<{ message: string }>(
        `/api/v1/institutional/${seccion}/${porEliminar.id}`,
        { method: 'DELETE' }
      );
      setItems((actuales) => actuales.filter((i) => i.id !== porEliminar.id));
      setAviso(t.deleted);
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteError);
      setPorEliminar(null);
    } finally {
      setBorrando(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-[#1e4066] bg-[#F8F8F2] dark:bg-[#00162e] p-3 text-sm text-brand-navy dark:text-white focus:border-[#77C65E] focus:outline-none';
  const labelClass = 'mb-1 block text-sm text-slate-600 dark:text-slate-300';
  const esPersona = SLUG_LIBRE_SECTIONS.includes(seccion);
  const etiquetas =
    seccion === 'footer' || seccion === 'board' || seccion === 'production' || seccion === 'gallery'
      ? t.fieldLabels[seccion]
      : null;
  const scopeLabel = (slug: string) =>
    (t.scopes as Record<string, string>)[slug] ?? slug;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white">{t.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] transition-colors hover:bg-[#008047] hover:text-brand-navy dark:text-white sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t.newItem}
        </button>
      </div>

      <div
        role="tablist"
        className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10 pb-2"
      >
        {SECCIONES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={seccion === s}
            onClick={() => setSeccion(s)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              seccion === s
                ? 'bg-[#77C65E] text-[#002244]'
                : 'bg-white dark:bg-[#002244] text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white'
            }`}
          >
            {t.sections[s]}
          </button>
        ))}
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 dark:text-slate-300">
          {t.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {!cargando && items.length === 0 && !error && (
        <p className="text-slate-600 dark:text-slate-300">{t.empty}</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-slate-200 dark:border-[#1e4066] bg-white dark:bg-[#002244] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-navy dark:text-white">
              {formulario.id ? t.editTitle : t.createTitle} ·{' '}
              {t.sections[seccion]}
            </h3>
            <button
              type="button"
              onClick={() => setFormulario(null)}
              aria-label={txt.common.cancel}
              className="rounded-lg p-1 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:bg-white/10 hover:text-brand-navy dark:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <fieldset disabled={guardando} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="inst-alcance" className={labelClass}>
                  {esPersona ? t.personSlug : t.scope}
                </label>
                {esPersona ? (
                  <>
                    <input
                      id="inst-alcance"
                      type="text"
                      required
                      maxLength={191}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      value={formulario.page_slug}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          page_slug: e.target.value.toLowerCase(),
                        })
                      }
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      {t.personSlugHint}
                    </p>
                  </>
                ) : (
                  <select
                    id="inst-alcance"
                    value={formulario.page_slug}
                    onChange={(e) =>
                      setFormulario({ ...formulario, page_slug: e.target.value })
                    }
                    className={`${inputClass} fc-select`}
                  >
                    {SCOPES_BY_SECTION[seccion].map((slug) => (
                      <option key={slug} value={slug}>
                        {scopeLabel(slug)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="inst-idioma" className={labelClass}>
                  {t.language}
                </label>
                <select
                  id="inst-idioma"
                  value={formulario.language}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      language: e.target.value as Language,
                    })
                  }
                  className={`${inputClass} fc-select`}
                >
                  <option value="es">{t.languageEs}</option>
                  <option value="en">{t.languageEn}</option>
                </select>
              </div>

              <div>
                <label htmlFor="inst-orden" className={labelClass}>
                  {t.order}
                </label>
                <input
                  id="inst-orden"
                  type="number"
                  min={0}
                  step={1}
                  value={formulario.display_order}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      display_order: Math.max(
                        0,
                        Math.trunc(Number(e.target.value)) || 0
                      ),
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="inst-titulo" className={labelClass}>
                {etiquetas?.title ?? t.titleField}
              </label>
              <input
                id="inst-titulo"
                type="text"
                required
                maxLength={255}
                value={formulario.title}
                onChange={(e) =>
                  setFormulario({ ...formulario, title: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="inst-subtitulo" className={labelClass}>
                {etiquetas?.subtitle ?? t.subtitleField}
              </label>
              <input
                id="inst-subtitulo"
                type="text"
                maxLength={1000}
                value={formulario.subtitle}
                onChange={(e) =>
                  setFormulario({ ...formulario, subtitle: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="inst-contenido" className={labelClass}>
                {etiquetas?.content ?? t.contentField}
              </label>
              <textarea
                id="inst-contenido"
                rows={8}
                required
                maxLength={20000}
                value={formulario.content}
                onChange={(e) =>
                  setFormulario({ ...formulario, content: e.target.value })
                }
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {etiquetas?.hint ?? t.contentHint}
              </p>
            </div>

            {!esPersona && seccion !== 'footer' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="inst-cta-texto" className={labelClass}>
                  {t.ctaLabel}
                </label>
                <input
                  id="inst-cta-texto"
                  type="text"
                  maxLength={150}
                  value={formulario.cta_label}
                  onChange={(e) =>
                    setFormulario({ ...formulario, cta_label: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="inst-cta-destino" className={labelClass}>
                  {t.ctaTarget}
                </label>
                <input
                  id="inst-cta-destino"
                  type="text"
                  maxLength={2048}
                  value={formulario.cta_target}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      cta_target: e.target.value,
                    })
                  }
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.ctaTargetHint}
                </p>
              </div>
            </div>
            )}

            <label className="flex items-center gap-2 text-sm text-brand-navy dark:text-white">
              <input
                type="checkbox"
                checked={formulario.is_published}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    is_published: e.target.checked,
                  })
                }
              />
              {t.published}
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] disabled:opacity-50"
              >
                {guardando ? txt.common.saving : txt.common.save}
              </button>
              <button
                type="button"
                onClick={() => setFormulario(null)}
                className="rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-sm font-bold text-brand-navy dark:text-white hover:bg-white/20"
              >
                {txt.common.cancel}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e4066] bg-white dark:bg-[#002244]">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-[#00162e] font-mono text-[11px] uppercase text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-3 sm:p-4">{t.columnTitle}</th>
                <th className="hidden p-4 md:table-cell">{t.columnScope}</th>
                <th className="hidden p-4 sm:table-cell">{t.columnLanguage}</th>
                <th className="p-3 sm:p-4">{txt.common.status}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-100 dark:bg-white/5">
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-brand-navy dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 md:hidden">
                      {scopeLabel(item.page_slug)} ·{' '}
                      {item.language.toUpperCase()}
                    </span>
                  </td>
                  <td className="hidden p-4 md:table-cell">
                    {scopeLabel(item.page_slug)}
                  </td>
                  <td className="hidden p-4 font-mono sm:table-cell">
                    {item.language.toUpperCase()}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase ${
                        item.is_published
                          ? 'bg-[#77C65E]/20 text-[#77C65E]'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {statusLabel(
                        item.is_published ? 'published' : 'hidden',
                        language
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(item)}
                        aria-label={txt.common.edit}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-brand-navy dark:text-white hover:bg-white/20"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">
                          {txt.common.edit}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(item)}
                        aria-label={txt.common.delete}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">
                          {txt.common.delete}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title={txt.common.confirmDeleteTitle}
        message={
          porEliminar ? t.deleteMessage.replace('{name}', porEliminar.title) : ''
        }
        confirmLabel={txt.common.delete}
        busyLabel={txt.common.deleting}
        cancelLabel={txt.common.cancel}
        busy={borrando}
        onConfirm={confirmarBorrado}
        onCancel={() => {
          if (!borrando) setPorEliminar(null);
        }}
      />

      {aviso && (
        <ToastRegion>
          <Toast
            message={aviso}
            onClose={() => setAviso('')}
            closeLabel={txt.common.closeNotification}
          />
        </ToastRegion>
      )}
    </section>
  );
};
