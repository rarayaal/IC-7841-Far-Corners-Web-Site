import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface CampProfile {
  id: string;
  user_id: string;
  camper_name: string;
  camper_email: string;
  school: string | null;
  grade: string | null;
  session: string | null;
  status: string;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  participant_type: string | null;
}

interface CampForm {
  id?: string;
  user_id: string;
  school: string;
  grade: string;
  session: string;
  status: string;
}

const nuevoFormulario = (): CampForm => ({
  user_id: '',
  school: '',
  grade: '',
  session: '',
  status: 'active',
});

export const AdminCampsView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const [campistas, setCampistas] = useState<CampProfile[]>([]);
  const [candidatos, setCandidatos] = useState<Candidate[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<CampForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<CampProfile | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<CampProfile[]>('/api/v1/camps');
        if (activo) setCampistas(datos);
      } catch (e) {
        if (activo)
          setError(e instanceof Error ? e.message : txt.camps.loadError);
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  async function abrirNueva() {
    setFormulario(nuevoFormulario());
    setError('');
    setAviso('');
    setCargandoCandidatos(true);

    try {
      const datos = await api<Candidate[]>('/api/v1/camps/candidates');
      setCandidatos(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.camps.candidatesError);
    } finally {
      setCargandoCandidatos(false);
    }
  }

  function abrirEdicion(campista: CampProfile) {
    setFormulario({
      id: campista.id,
      user_id: campista.user_id,
      school: campista.school ?? '',
      grade: campista.grade ?? '',
      session: campista.session ?? '',
      status: campista.status,
    });
    setError('');
    setAviso('');
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!formulario || guardando) return;

    setGuardando(true);
    setError('');
    setAviso('');

    const esEdicion = Boolean(formulario.id);

    try {
      if (esEdicion) {
        const body = JSON.stringify({
          school: formulario.school.trim() || null,
          grade: formulario.grade.trim() || null,
          session: formulario.session.trim() || null,
          status: formulario.status,
        });

        await api(`/api/v1/camps/${formulario.id}`, {
          method: 'PUT',
          body,
        });
        setAviso(txt.camps.updated);
      } else {
        if (!formulario.user_id) {
          setError(txt.camps.selectRequired);
          setGuardando(false);
          return;
        }

        const body = JSON.stringify({
          user_id: formulario.user_id,
          school: formulario.school.trim() || null,
          grade: formulario.grade.trim() || null,
          session: formulario.session.trim() || null,
        });

        await api('/api/v1/camps', { method: 'POST', body });
        setAviso(txt.camps.created);
      }

      setFormulario(null);

      const datos = await api<CampProfile[]>('/api/v1/camps');
      setCampistas(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.camps.saveError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<void>(`/api/v1/camps/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setCampistas((actuales) =>
        actuales.filter((c) => c.id !== porEliminar.id)
      );
      setAviso(txt.camps.deleted);
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.camps.deleteError);
    } finally {
      setBorrando(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-brand-border bg-[#F8F8F2] dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
            {txt.camps.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{txt.camps.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirNueva}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-forest hover:text-brand-navy dark:text-white sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {txt.camps.newItem}
        </button>
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 dark:text-slate-300">
          {txt.camps.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {!cargando && campistas.length === 0 && !error && (
        <p className="text-slate-600 dark:text-slate-300">{txt.camps.empty}</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-navy dark:text-white">
              {formulario.id ? txt.camps.editTitle : txt.camps.createTitle}
            </h3>
            <button
              type="button"
              onClick={() => setFormulario(null)}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:text-white hover:bg-slate-100 dark:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <fieldset disabled={guardando} className="space-y-4">
            {!formulario.id && (
              <div>
                <label
                  htmlFor="campista-usuario"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.camps.candidateLabel}
                </label>
                <select
                  id="campista-usuario"
                  required
                  value={formulario.user_id}
                  onChange={(e) =>
                    setFormulario({ ...formulario, user_id: e.target.value })
                  }
                  className={`${inputClass} fc-select`}
                >
                  <option value="">
                    {cargandoCandidatos
                      ? txt.common.loading
                      : txt.common.selectUser}
                  </option>
                  {candidatos.map((candidato) => (
                    <option key={candidato.id} value={candidato.id}>
                      {candidato.full_name} ({candidato.email})
                    </option>
                  ))}
                </select>
                {candidatos.length === 0 && !cargandoCandidatos && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {txt.camps.noCandidates}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="campista-escuela"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.camps.school}
                </label>
                <input
                  id="campista-escuela"
                  type="text"
                  maxLength={255}
                  value={formulario.school}
                  onChange={(e) =>
                    setFormulario({ ...formulario, school: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="campista-grado"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.camps.grade}
                </label>
                <input
                  id="campista-grado"
                  type="text"
                  maxLength={100}
                  value={formulario.grade}
                  onChange={(e) =>
                    setFormulario({ ...formulario, grade: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="campista-sesion"
                className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
              >
                {txt.camps.session}
              </label>
              <input
                id="campista-sesion"
                type="text"
                maxLength={255}
                value={formulario.session}
                onChange={(e) =>
                  setFormulario({ ...formulario, session: e.target.value })
                }
                className={inputClass}
              />
            </div>

            {formulario.id && (
              <div>
                <label
                  htmlFor="campista-estado"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.common.status}
                </label>
                <select
                  id="campista-estado"
                  value={formulario.status}
                  onChange={(e) =>
                    setFormulario({ ...formulario, status: e.target.value })
                  }
                  className={`${inputClass} fc-select`}
                >
                  <option value="active">{statusLabel('active', language)}</option>
                  <option value="inactive">
                    {statusLabel('inactive', language)}
                  </option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-navy disabled:opacity-50"
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

      {campistas.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-[#F8F8F2] dark:bg-brand-navyDark text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="p-3 sm:p-4">{txt.camps.columnCamper}</th>
                <th className="hidden p-4 sm:table-cell">
                  {txt.camps.columnSchool}
                </th>
                <th className="hidden p-4 md:table-cell">
                  {txt.camps.columnGrade}
                </th>
                <th className="hidden p-4 md:table-cell">
                  {txt.camps.columnSession}
                </th>
                <th className="p-3 sm:p-4">{txt.common.status}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campistas.map((campista) => (
                <tr
                  key={campista.id}
                  className="hover:bg-slate-100 dark:bg-white/5 transition-colors"
                >
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-brand-navy dark:text-white block">
                      {campista.camper_name}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 break-all">
                      {campista.camper_email}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
                      {campista.school ?? '—'} · {campista.grade ?? '—'}
                    </span>
                  </td>
                  <td className="hidden p-4 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {campista.school ?? '—'}
                  </td>
                  <td className="hidden p-4 text-slate-600 dark:text-slate-300 md:table-cell">
                    {campista.grade ?? '—'}
                  </td>
                  <td className="hidden p-4 text-slate-600 dark:text-slate-300 md:table-cell">
                    {campista.session ?? '—'}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        campista.status === 'active'
                          ? 'bg-brand-green/20 text-brand-green'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {statusLabel(campista.status, language)}
                    </span>
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(campista)}
                        aria-label={txt.common.edit}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-brand-navy dark:text-white hover:bg-white/20"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">{txt.common.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(campista)}
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
            ? txt.camps.deleteMessage.replace('{name}', porEliminar.camper_name)
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
