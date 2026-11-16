import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import {
  adminTexts,
  dateInputValue,
  formatDate,
  statusLabel,
} from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface StudentProfile {
  id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  university: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  participant_type: string | null;
}

interface StudentForm {
  id?: string;
  user_id: string;
  university: string;
  start_date: string;
  end_date: string;
  status: string;
}

const nuevoFormulario = (): StudentForm => ({
  user_id: '',
  university: '',
  start_date: '',
  end_date: '',
  status: 'active',
});

export const AdminStudentsView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const [estudiantes, setEstudiantes] = useState<StudentProfile[]>([]);
  const [candidatos, setCandidatos] = useState<Candidate[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<StudentForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<StudentProfile | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<StudentProfile[]>('/api/v1/students');
        if (activo) setEstudiantes(datos);
      } catch (e) {
        if (activo)
          setError(e instanceof Error ? e.message : txt.students.loadError);
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
      const datos = await api<Candidate[]>('/api/v1/students/candidates');
      setCandidatos(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.students.candidatesError);
    } finally {
      setCargandoCandidatos(false);
    }
  }

  function abrirEdicion(estudiante: StudentProfile) {
    setFormulario({
      id: estudiante.id,
      user_id: estudiante.user_id,
      university: estudiante.university ?? '',
      start_date: dateInputValue(estudiante.start_date),
      end_date: dateInputValue(estudiante.end_date),
      status: estudiante.status,
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
          university: formulario.university.trim() || null,
          start_date: formulario.start_date || null,
          end_date: formulario.end_date || null,
          status: formulario.status,
        });

        await api(`/api/v1/students/${formulario.id}`, {
          method: 'PUT',
          body,
        });
        setAviso(txt.students.updated);
      } else {
        if (!formulario.user_id) {
          setError(txt.students.selectRequired);
          setGuardando(false);
          return;
        }

        const body = JSON.stringify({
          user_id: formulario.user_id,
          university: formulario.university.trim() || null,
          start_date: formulario.start_date || null,
          end_date: formulario.end_date || null,
        });

        await api('/api/v1/students', { method: 'POST', body });
        setAviso(txt.students.created);
      }

      setFormulario(null);

      const datos = await api<StudentProfile[]>('/api/v1/students');
      setEstudiantes(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.students.saveError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<void>(`/api/v1/students/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setEstudiantes((actuales) =>
        actuales.filter((e) => e.id !== porEliminar.id)
      );
      setAviso(txt.students.deleted);
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.students.deleteError);
    } finally {
      setBorrando(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-brand-border bg-[#F8F8F2] dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none';

  const periodo = (estudiante: StudentProfile) =>
    estudiante.start_date || estudiante.end_date
      ? `${formatDate(estudiante.start_date, language)} → ${formatDate(
          estudiante.end_date,
          language
        )}`
      : '—';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
            {txt.students.title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{txt.students.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirNueva}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-navy transition-colors hover:bg-brand-forest hover:text-brand-navy dark:text-white sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {txt.students.newItem}
        </button>
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 dark:text-slate-300">
          {txt.students.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {!cargando && estudiantes.length === 0 && !error && (
        <p className="text-slate-600 dark:text-slate-300">{txt.students.empty}</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-navy dark:text-white">
              {formulario.id ? txt.students.editTitle : txt.students.createTitle}
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
                  htmlFor="estudiante-usuario"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.students.candidateLabel}
                </label>
                <select
                  id="estudiante-usuario"
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
                    {txt.students.noCandidates}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="estudiante-universidad"
                className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
              >
                {txt.students.university}
              </label>
              <input
                id="estudiante-universidad"
                type="text"
                maxLength={255}
                value={formulario.university}
                onChange={(e) =>
                  setFormulario({ ...formulario, university: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="estudiante-inicio"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.students.startDate}
                </label>
                <input
                  id="estudiante-inicio"
                  type="date"
                  value={formulario.start_date}
                  onChange={(e) =>
                    setFormulario({ ...formulario, start_date: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="estudiante-fin"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.students.endDate}
                </label>
                <input
                  id="estudiante-fin"
                  type="date"
                  value={formulario.end_date}
                  onChange={(e) =>
                    setFormulario({ ...formulario, end_date: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {formulario.id && (
              <div>
                <label
                  htmlFor="estudiante-estado"
                  className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
                >
                  {txt.common.status}
                </label>
                <select
                  id="estudiante-estado"
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

      {estudiantes.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-[#F8F8F2] dark:bg-brand-navyDark text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="p-3 sm:p-4">{txt.students.columnStudent}</th>
                <th className="hidden p-4 sm:table-cell">
                  {txt.students.columnUniversity}
                </th>
                <th className="hidden p-4 sm:table-cell">
                  {txt.students.columnPeriod}
                </th>
                <th className="p-3 sm:p-4">{txt.common.status}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {estudiantes.map((estudiante) => (
                <tr
                  key={estudiante.id}
                  className="hover:bg-slate-100 dark:bg-white/5 transition-colors"
                >
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-brand-navy dark:text-white block">
                      {estudiante.student_name}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 break-all">
                      {estudiante.student_email}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
                      {estudiante.university ?? '—'}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400 sm:hidden">
                      {periodo(estudiante)}
                    </span>
                  </td>
                  <td className="hidden p-4 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {estudiante.university ?? '—'}
                  </td>
                  <td className="hidden p-4 text-slate-600 dark:text-slate-300 sm:table-cell">
                    {periodo(estudiante)}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        estudiante.status === 'active'
                          ? 'bg-brand-green/20 text-brand-green'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {statusLabel(estudiante.status, language)}
                    </span>
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(estudiante)}
                        aria-label={txt.common.edit}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-brand-navy dark:text-white hover:bg-white/20"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">{txt.common.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(estudiante)}
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
            ? txt.students.deleteMessage.replace(
                '{name}',
                porEliminar.student_name
              )
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
