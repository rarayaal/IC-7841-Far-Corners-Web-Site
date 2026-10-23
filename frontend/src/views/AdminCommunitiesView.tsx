import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface Community {
  id: string;
  name: string;
  description: string | null;
  is_published: boolean;
}

interface CommunityForm {
  id?: string;
  name: string;
  description: string;
  is_published: boolean;
}

const formVacio = (): CommunityForm => ({
  name: '',
  description: '',
  is_published: false,
});

export const AdminCommunitiesView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const [comunidades, setComunidades] = useState<Community[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<CommunityForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<Community | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<Community[]>('/api/v1/communities');
        if (activo) setComunidades(datos);
      } catch (e) {
        if (activo)
          setError(e instanceof Error ? e.message : txt.communities.loadError);
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  function abrirNueva() {
    setFormulario(formVacio());
    setError('');
    setAviso('');
  }

  function abrirEdicion(comunidad: Community) {
    setFormulario({
      id: comunidad.id,
      name: comunidad.name,
      description: comunidad.description ?? '',
      is_published: comunidad.is_published,
    });
    setError('');
    setAviso('');
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!formulario || guardando) return;

    const nombre = formulario.name.trim();
    if (!nombre) {
      setError(txt.communities.nameRequired);
      return;
    }

    setGuardando(true);
    setError('');
    setAviso('');

    const esEdicion = Boolean(formulario.id);

    try {
      const body = JSON.stringify({
        name: nombre,
        description: formulario.description.trim() || null,
        is_published: formulario.is_published,
      });

      if (esEdicion) {
        const actualizada = await api<Community>(
          `/api/v1/communities/${formulario.id}`,
          { method: 'PUT', body }
        );
        setComunidades((actuales) =>
          actuales.map((c) => (c.id === actualizada.id ? actualizada : c))
        );
        setAviso(txt.communities.updated);
      } else {
        const creada = await api<Community>('/api/v1/communities', {
          method: 'POST',
          body,
        });
        setComunidades((actuales) => [...actuales, creada]);
        setAviso(txt.communities.created);
      }

      setFormulario(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.communities.saveError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<void>(`/api/v1/communities/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setComunidades((actuales) => actuales.filter((c) => c.id !== porEliminar.id));
      setAviso(txt.communities.deleted);
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.communities.deleteError);
    } finally {
      setBorrando(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#1e4066] bg-[#00162e] p-3 text-sm text-white focus:border-[#77C65E] focus:outline-none';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-white">
            {txt.communities.title}
          </h2>
          <p className="text-sm text-slate-300">{txt.communities.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirNueva}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] transition-colors hover:bg-[#008047] hover:text-white sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {txt.communities.newItem}
        </button>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          {txt.communities.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {!cargando && comunidades.length === 0 && !error && (
        <p className="text-slate-300">{txt.communities.empty}</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">
              {formulario.id
                ? txt.communities.editTitle
                : txt.communities.createTitle}
            </h3>
            <button
              type="button"
              onClick={() => setFormulario(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <fieldset disabled={guardando} className="space-y-4">
            <div>
              <label
                htmlFor="comunidad-nombre"
                className="mb-1 block text-sm text-slate-300"
              >
                {txt.communities.name}
              </label>
              <input
                id="comunidad-nombre"
                type="text"
                required
                maxLength={255}
                value={formulario.name}
                onChange={(e) =>
                  setFormulario({ ...formulario, name: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="comunidad-descripcion"
                className="mb-1 block text-sm text-slate-300"
              >
                {txt.communities.description}
              </label>
              <textarea
                id="comunidad-descripcion"
                rows={3}
                value={formulario.description}
                onChange={(e) =>
                  setFormulario({ ...formulario, description: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-white">
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
              {txt.communities.published}
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
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                {txt.common.cancel}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {comunidades.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#1e4066] bg-[#002244]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#00162e] text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
              <tr>
                <th className="p-3 sm:p-4">{txt.communities.columnName}</th>
                <th className="hidden p-4 md:table-cell">
                  {txt.communities.columnDescription}
                </th>
                <th className="p-3 sm:p-4">{txt.common.status}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comunidades.map((comunidad) => (
                <tr
                  key={comunidad.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-white">{comunidad.name}</span>
                    <span className="mt-1 block line-clamp-2 text-[11px] text-slate-400 md:hidden">
                      {comunidad.description ?? '—'}
                    </span>
                  </td>
                  <td className="hidden p-4 text-slate-300 max-w-xs truncate md:table-cell">
                    {comunidad.description ?? '—'}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        comunidad.is_published
                          ? 'bg-[#77C65E]/20 text-[#77C65E]'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {statusLabel(
                        comunidad.is_published ? 'published' : 'hidden',
                        language
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(comunidad)}
                        aria-label={txt.common.edit}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/20"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">{txt.common.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(comunidad)}
                        aria-label={txt.common.delete}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">{txt.common.delete}</span>
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
          porEliminar
            ? txt.communities.deleteMessage.replace('{name}', porEliminar.name)
            : ''
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
