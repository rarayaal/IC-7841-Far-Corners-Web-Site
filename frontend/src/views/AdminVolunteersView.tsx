import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface VolunteerProfile {
  id: string;
  user_id: string;
  volunteer_name: string;
  volunteer_email: string;
  interests: string | null;
  availability: string | null;
  status: string;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  participant_type: string | null;
}

interface VolunteerForm {
  id?: string;
  user_id: string;
  interests: string;
  availability: string;
  status: string;
}

const nuevoFormulario = (): VolunteerForm => ({
  user_id: '',
  interests: '',
  availability: '',
  status: 'active',
});

export const AdminVolunteersView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const [voluntarios, setVoluntarios] = useState<VolunteerProfile[]>([]);
  const [candidatos, setCandidatos] = useState<Candidate[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<VolunteerForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<VolunteerProfile | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<VolunteerProfile[]>('/api/v1/volunteers');
        if (activo) setVoluntarios(datos);
      } catch (e) {
        if (activo)
          setError(e instanceof Error ? e.message : txt.volunteers.loadError);
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
      const datos = await api<Candidate[]>('/api/v1/volunteers/candidates');
      setCandidatos(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.volunteers.candidatesError);
    } finally {
      setCargandoCandidatos(false);
    }
  }

  function abrirEdicion(voluntario: VolunteerProfile) {
    setFormulario({
      id: voluntario.id,
      user_id: voluntario.user_id,
      interests: voluntario.interests ?? '',
      availability: voluntario.availability ?? '',
      status: voluntario.status,
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
          interests: formulario.interests.trim() || null,
          availability: formulario.availability.trim() || null,
          status: formulario.status,
        });

        await api(`/api/v1/volunteers/${formulario.id}`, {
          method: 'PUT',
          body,
        });
        setAviso(txt.volunteers.updated);
      } else {
        if (!formulario.user_id) {
          setError(txt.volunteers.selectRequired);
          setGuardando(false);
          return;
        }

        const body = JSON.stringify({
          user_id: formulario.user_id,
          interests: formulario.interests.trim() || null,
          availability: formulario.availability.trim() || null,
        });

        await api('/api/v1/volunteers', { method: 'POST', body });
        setAviso(txt.volunteers.created);
      }

      setFormulario(null);

      const datos = await api<VolunteerProfile[]>('/api/v1/volunteers');
      setVoluntarios(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.volunteers.saveError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<void>(`/api/v1/volunteers/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setVoluntarios((actuales) =>
        actuales.filter((v) => v.id !== porEliminar.id)
      );
      setAviso(txt.volunteers.deleted);
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.volunteers.deleteError);
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
            {txt.volunteers.title}
          </h2>
          <p className="text-sm text-slate-300">{txt.volunteers.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirNueva}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] transition-colors hover:bg-[#008047] hover:text-white sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {txt.volunteers.newItem}
        </button>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          {txt.volunteers.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {!cargando && voluntarios.length === 0 && !error && (
        <p className="text-slate-300">{txt.volunteers.empty}</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">
              {formulario.id
                ? txt.volunteers.editTitle
                : txt.volunteers.createTitle}
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
            {!formulario.id && (
              <div>
                <label
                  htmlFor="voluntario-usuario"
                  className="mb-1 block text-sm text-slate-300"
                >
                  {txt.volunteers.candidateLabel}
                </label>
                <select
                  id="voluntario-usuario"
                  required
                  value={formulario.user_id}
                  onChange={(e) =>
                    setFormulario({ ...formulario, user_id: e.target.value })
                  }
                  className={inputClass}
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
                  <p className="mt-1 text-xs text-slate-400">
                    {txt.volunteers.noCandidates}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="voluntario-intereses"
                className="mb-1 block text-sm text-slate-300"
              >
                {txt.volunteers.interests}
              </label>
              <textarea
                id="voluntario-intereses"
                rows={3}
                value={formulario.interests}
                onChange={(e) =>
                  setFormulario({ ...formulario, interests: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="voluntario-disponibilidad"
                className="mb-1 block text-sm text-slate-300"
              >
                {txt.volunteers.availability}
              </label>
              <textarea
                id="voluntario-disponibilidad"
                rows={3}
                value={formulario.availability}
                onChange={(e) =>
                  setFormulario({ ...formulario, availability: e.target.value })
                }
                className={inputClass}
              />
            </div>

            {formulario.id && (
              <div>
                <label
                  htmlFor="voluntario-estado"
                  className="mb-1 block text-sm text-slate-300"
                >
                  {txt.common.status}
                </label>
                <select
                  id="voluntario-estado"
                  value={formulario.status}
                  onChange={(e) =>
                    setFormulario({ ...formulario, status: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="active">{statusLabel('active', language)}</option>
                  <option value="inactive">
                    {statusLabel('inactive', language)}
                  </option>
                  <option value="pending">
                    {statusLabel('pending', language)}
                  </option>
                </select>
              </div>
            )}

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

      {voluntarios.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#1e4066] bg-[#002244]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#00162e] text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
              <tr>
                <th className="p-3 sm:p-4">{txt.volunteers.columnVolunteer}</th>
                <th className="hidden p-4 md:table-cell">
                  {txt.volunteers.columnInterests}
                </th>
                <th className="hidden p-4 md:table-cell">
                  {txt.volunteers.columnAvailability}
                </th>
                <th className="p-3 sm:p-4">{txt.common.status}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {voluntarios.map((voluntario) => (
                <tr
                  key={voluntario.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-white block">
                      {voluntario.volunteer_name}
                    </span>
                    <span className="text-[11px] text-slate-300 break-all">
                      {voluntario.volunteer_email}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-[11px] text-slate-400 md:hidden">
                      {voluntario.interests ?? '—'}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] text-slate-400 md:hidden">
                      {voluntario.availability ?? '—'}
                    </span>
                  </td>
                  <td className="hidden p-4 text-slate-300 max-w-xs truncate md:table-cell">
                    {voluntario.interests ?? '—'}
                  </td>
                  <td className="hidden p-4 text-slate-300 max-w-xs truncate md:table-cell">
                    {voluntario.availability ?? '—'}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        voluntario.status === 'active'
                          ? 'bg-[#77C65E]/20 text-[#77C65E]'
                          : voluntario.status === 'pending'
                            ? 'bg-[#4A90D6]/20 text-[#4A90D6]'
                            : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {statusLabel(voluntario.status, language)}
                    </span>
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(voluntario)}
                        aria-label={txt.common.edit}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/20"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">{txt.common.edit}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(voluntario)}
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
            ? txt.volunteers.deleteMessage.replace(
                '{name}',
                porEliminar.volunteer_name
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
