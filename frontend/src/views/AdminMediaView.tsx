import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FileText, Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import {
  ACCEPTED_TYPES,
  formatBytes,
  isImage,
  uploadMedia,
  validateFile,
  type MediaAssociation,
  type MediaItem,
} from '../services/media';
import type { InstitutionalContent } from '../services/institutional';
import { adminTexts } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

type TargetKind = 'content' | 'project';

interface Target {
  kind: TargetKind;
  id: string;
  label: string;
}

interface UploadForm {
  file: File | null;
  kind: TargetKind;
  targetId: string;
  altText: string;
  authorized: boolean;
}

interface EditForm {
  id: string;
  filename: string;
  altText: string;
  isImage: boolean;
  association: MediaAssociation;
}

const SLOW_UPLOAD_MS = 3000;

const formVacio = (): UploadForm => ({
  file: null,
  kind: 'content',
  targetId: '',
  altText: '',
  authorized: false,
});

function associationOf(item: MediaItem): MediaAssociation {
  if (item.content_id) return { content_id: item.content_id };
  if (item.project_id) return { project_id: item.project_id };

  return { event_id: item.event_id! };
}

export const AdminMediaView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const t = txt.media;

  const [items, setItems] = useState<MediaItem[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [subida, setSubida] = useState<UploadForm | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [lenta, setLenta] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>();

  const [edicion, setEdicion] = useState<EditForm | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [porEliminar, setPorEliminar] = useState<MediaItem | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const [galeria, ...contenido] = await Promise.all([
          api<MediaItem[]>('/api/v1/media'),
          ...(
            ['history', 'impact', 'future', 'footer', 'board', 'production', 'gallery'] as const
          ).map((seccion) =>
            api<InstitutionalContent[]>(`/api/v1/institutional/${seccion}/admin`)
          ),
        ]);
        // Los proyectos publicados son públicos: no requieren sesión.
        const proyectos = await api<{ id: string; title: string }[]>(
          '/api/v1/projects',
          {},
          { tokenOpcional: true }
        ).catch(() => []);

        if (!activo) return;

        setItems(galeria);
        setTargets([
          ...contenido.flat().map<Target>((c) => ({
            kind: 'content',
            id: c.id,
            label: `${txt.institutional.sections[c.section]} · ${c.title} (${c.language.toUpperCase()})`,
          })),
          ...proyectos.map<Target>((p) => ({
            kind: 'project',
            id: p.id,
            label: p.title,
          })),
        ]);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : t.loadError);
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function abrirSubida() {
    setSubida(formVacio());
    setEdicion(null);
    setProgreso(0);
    setError('');
    setAviso('');
  }

  function abrirEdicion(item: MediaItem) {
    setEdicion({
      id: item.id,
      filename: item.filename,
      altText: item.alt_text ?? '',
      isImage: isImage(item.mime_type),
      association: associationOf(item),
    });
    setSubida(null);
    setError('');
    setAviso('');
  }

  async function subir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!subida || subiendo) return;

    const { file } = subida;

    if (!file) return setError(t.fileRequired);

    const invalido = validateFile(file);
    if (invalido) return setError(invalido === 'type' ? t.invalidType : t.tooLarge);

    if (!subida.targetId) return setError(t.targetRequired);
    if (isImage(file.type) && !subida.altText.trim()) return setError(t.altRequired);
    if (!subida.authorized) return setError(t.authorizationRequired);

    setSubiendo(true);
    setLenta(false);
    setProgreso(0);
    setError('');
    setAviso('');

    // Indicador visual si la carga tarda más de 3 s.
    temporizador.current = setTimeout(() => setLenta(true), SLOW_UPLOAD_MS);

    try {
      const creada = await uploadMedia({
        file,
        altText: subida.altText,
        association:
          subida.kind === 'content'
            ? { content_id: subida.targetId }
            : { project_id: subida.targetId },
        onProgress: setProgreso,
      });

      setItems((actuales) => [creada, ...actuales]);
      setAviso(t.uploaded);
      setSubida(null);
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : '';

      setError(
        mensaje.startsWith('UPLOAD_') ? t.uploadFailed : mensaje || t.uploadError
      );
    } finally {
      clearTimeout(temporizador.current);
      setSubiendo(false);
      setLenta(false);
    }
  }

  async function guardarEdicion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!edicion || guardando) return;

    if (edicion.isImage && !edicion.altText.trim()) return setError(t.altRequired);

    setGuardando(true);
    setError('');

    try {
      const { media } = await api<{ media: MediaItem }>(
        `/api/v1/media/${edicion.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            filename: edicion.filename.trim(),
            alt_text: edicion.altText.trim() || null,
            ...edicion.association,
          }),
        }
      );

      setItems((actuales) => actuales.map((i) => (i.id === media.id ? media : i)));
      setAviso(t.updated);
      setEdicion(null);
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
      await api<{ message: string }>(`/api/v1/media/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setItems((actuales) => actuales.filter((i) => i.id !== porEliminar.id));
      setAviso(t.deleted);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteError);
    } finally {
      setPorEliminar(null);
      setBorrando(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#1e4066] bg-[#00162e] p-3 text-sm text-white focus:border-[#77C65E] focus:outline-none';
  const labelClass = 'mb-1 block text-sm text-slate-300';
  const opciones = subida ? targets.filter((x) => x.kind === subida.kind) : [];
  const subeImagen = Boolean(subida?.file && isImage(subida.file.type));

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-white">{t.title}</h2>
          <p className="text-sm text-slate-300">{t.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirSubida}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] transition-colors hover:bg-[#008047] hover:text-white sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t.upload}
        </button>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          {t.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {subida && (
        <form
          onSubmit={subir}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{t.upload}</h3>
            <button
              type="button"
              disabled={subiendo}
              onClick={() => setSubida(null)}
              aria-label={txt.common.cancel}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <fieldset disabled={subiendo} className="space-y-4">
            <div>
              <label htmlFor="media-archivo" className={labelClass}>
                {t.file}
              </label>
              <input
                id="media-archivo"
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={(e) =>
                  setSubida({ ...subida, file: e.target.files?.[0] ?? null })
                }
                className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[#77C65E] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#002244]`}
              />
              <p className="mt-1 text-xs text-slate-400">{t.fileHint}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="media-tipo" className={labelClass}>
                  {t.associateWith}
                </label>
                <select
                  id="media-tipo"
                  value={subida.kind}
                  onChange={(e) =>
                    setSubida({
                      ...subida,
                      kind: e.target.value as TargetKind,
                      targetId: '',
                    })
                  }
                  className={`${inputClass} fc-select`}
                >
                  <option value="content">{t.targetContent}</option>
                  <option value="project">{t.targetProject}</option>
                </select>
              </div>

              <div>
                <label htmlFor="media-destino" className={`${labelClass} sm:invisible`}>
                  {t.associateWith}
                </label>
                <select
                  id="media-destino"
                  value={subida.targetId}
                  onChange={(e) =>
                    setSubida({ ...subida, targetId: e.target.value })
                  }
                  className={`${inputClass} fc-select`}
                >
                  <option value="">{t.selectTarget}</option>
                  {opciones.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {opciones.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">{t.noTargets}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="media-alt" className={labelClass}>
                {subeImagen ? t.altTextRequired : t.altText}
              </label>
              <input
                id="media-alt"
                type="text"
                maxLength={500}
                value={subida.altText}
                onChange={(e) =>
                  setSubida({ ...subida, altText: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-white">
              <input
                type="checkbox"
                className="mt-1"
                checked={subida.authorized}
                onChange={(e) =>
                  setSubida({ ...subida, authorized: e.target.checked })
                }
              />
              {t.authorized}
            </label>

            {subiendo && (
              <div className="space-y-2" aria-live="polite">
                <div
                  role="progressbar"
                  aria-label={t.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progreso}
                  className="h-2 overflow-hidden rounded-full bg-[#00162e]"
                >
                  <div
                    className="h-full bg-[#77C65E] transition-all"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
                <p className="text-xs text-slate-300">
                  {progreso < 100 ? `${t.uploading} ${progreso}%` : t.registering}
                </p>
                {lenta && <p className="text-xs text-[#DCEB4F]">{t.slowUpload}</p>}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] disabled:opacity-50"
              >
                {subiendo ? t.uploading : t.upload}
              </button>
              <button
                type="button"
                onClick={() => setSubida(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                {txt.common.cancel}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {edicion && (
        <form
          onSubmit={guardarEdicion}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{t.editTitle}</h3>
            <button
              type="button"
              onClick={() => setEdicion(null)}
              aria-label={txt.common.cancel}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <fieldset disabled={guardando} className="space-y-4">
            <div>
              <label htmlFor="media-nombre" className={labelClass}>
                {t.fileName}
              </label>
              <input
                id="media-nombre"
                type="text"
                required
                maxLength={255}
                value={edicion.filename}
                onChange={(e) =>
                  setEdicion({ ...edicion, filename: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="media-edit-alt" className={labelClass}>
                {edicion.isImage ? t.altTextRequired : t.altText}
              </label>
              <input
                id="media-edit-alt"
                type="text"
                maxLength={500}
                value={edicion.altText}
                onChange={(e) =>
                  setEdicion({ ...edicion, altText: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] disabled:opacity-50"
              >
                {guardando ? txt.common.saving : txt.common.save}
              </button>
              <button
                type="button"
                onClick={() => setEdicion(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                {txt.common.cancel}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {!cargando && items.length === 0 && !error && (
        <p className="text-slate-300">{t.empty}</p>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-2xl border border-[#1e4066] bg-[#002244]"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-[#00162e]">
                {isImage(item.mime_type) ? (
                  <img
                    src={item.url}
                    alt={item.alt_text ?? ''}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t.openFile}: ${item.filename}`}
                    className="flex flex-col items-center gap-2 text-slate-300 hover:text-white"
                  >
                    <FileText className="h-10 w-10" />
                    <span className="text-xs">{t.document}</span>
                  </a>
                )}
              </div>

              <div className="space-y-2 p-4">
                <p className="truncate text-sm font-bold text-white" title={item.filename}>
                  {item.filename}
                  {!item.is_published && (
                    <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                      {txt.retirement.withdrawn}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {t.columnAssociation}:{' '}
                  <span className="text-slate-200">
                    {item.association_label ?? t.emptyAssociation}
                  </span>{' '}
                  · {formatBytes(item.size_bytes)}
                </p>

                <div className="flex justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(item)}
                    aria-label={`${txt.common.edit}: ${item.filename}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/20"
                  >
                    <Pencil className="w-3 h-3" />
                    {txt.common.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPorEliminar(item)}
                    aria-label={`${txt.common.delete}: ${item.filename}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/30"
                  >
                    <Trash2 className="w-3 h-3" />
                    {txt.common.delete}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title={txt.common.confirmDeleteTitle}
        message={
          porEliminar ? t.deleteMessage.replace('{name}', porEliminar.filename) : ''
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
