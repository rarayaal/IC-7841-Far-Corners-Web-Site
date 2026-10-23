import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';

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

export const AdminStudentsView = () => {
  const [estudiantes, setEstudiantes] = useState<StudentProfile[]>([]);
  const [candidatos, setCandidatos] = useState<Candidate[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCandidatos, setCargandoCandidatos] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<StudentForm | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<StudentProfile[]>('/api/v1/students');
        if (activo) setEstudiantes(datos);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudieron cargar los estudiantes.');
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
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los candidatos.');
    } finally {
      setCargandoCandidatos(false);
    }
  }

  function abrirEdicion(estudiante: StudentProfile) {
    setFormulario({
      id: estudiante.id,
      user_id: estudiante.user_id,
      university: estudiante.university ?? '',
      start_date: estudiante.start_date ?? '',
      end_date: estudiante.end_date ?? '',
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

        await api(`/api/v1/students/${formulario.id}`, { method: 'PUT', body });
        setAviso('Estudiante actualizado correctamente.');
      } else {
        if (!formulario.user_id) {
          setError('Debes seleccionar un estudiante.');
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
        setAviso('Perfil de estudiante creado correctamente.');
      }

      setFormulario(null);

      const datos = await api<StudentProfile[]>('/api/v1/students');
      setEstudiantes(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el estudiante.');
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(estudiante: StudentProfile) {
    if (!window.confirm(`¿Eliminar el perfil de ${estudiante.student_name}?`)) return;

    setError('');
    setAviso('');

    try {
      await api<void>(`/api/v1/students/${estudiante.id}`, { method: 'DELETE' });
      setEstudiantes((actuales) => actuales.filter((e) => e.id !== estudiante.id));
      setAviso('Perfil de estudiante eliminado.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el estudiante.');
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#1e4066] bg-[#00162e] p-3 text-sm text-white focus:border-[#77C65E] focus:outline-none';

  const etiquetaEstado = (estado: string) => {
    const estilos: Record<string, string> = {
      active: 'bg-[#77C65E]/20 text-[#77C65E]',
      inactive: 'bg-white/10 text-slate-300',
      pending: 'bg-[#4A90D6]/20 text-[#4A90D6]',
    };
    const nombres: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
    };
    return (
      <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${estilos[estado] ?? 'bg-white/10 text-slate-300'}`}>
        {nombres[estado] ?? estado}
      </span>
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-white">Estudiantes internacionales</h2>
          <p className="text-sm text-slate-300">
            Administra los perfiles de estudiantes internacionales.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNueva}
          className="flex items-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] hover:bg-[#008047] hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo estudiante
        </button>
      </div>

      {cargando && <p role="status" className="text-slate-300">Cargando estudiantes...</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {aviso && <p role="status" className="text-sm text-[#77C65E]">{aviso}</p>}

      {!cargando && estudiantes.length === 0 && !error && (
        <p className="text-slate-300">No hay estudiantes registrados.</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">
              {formulario.id ? 'Editar estudiante' : 'Nuevo estudiante'}
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
                <label htmlFor="estudiante-usuario" className="mb-1 block text-sm text-slate-300">
                  Estudiante registrado *
                </label>
                <select
                  id="estudiante-usuario"
                  required
                  value={formulario.user_id}
                  onChange={(e) => setFormulario({ ...formulario, user_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">{cargandoCandidatos ? 'Cargando...' : 'Selecciona un usuario'}</option>
                  {candidatos.map((candidato) => (
                    <option key={candidato.id} value={candidato.id}>
                      {candidato.full_name} ({candidato.email})
                    </option>
                  ))}
                </select>
                {candidatos.length === 0 && !cargandoCandidatos && (
                  <p className="mt-1 text-xs text-slate-400">
                    No hay usuarios pendientes de perfil. Registra al estudiante como usuario primero.
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="estudiante-universidad" className="mb-1 block text-sm text-slate-300">
                Universidad
              </label>
              <input
                id="estudiante-universidad"
                type="text"
                maxLength={255}
                value={formulario.university}
                onChange={(e) => setFormulario({ ...formulario, university: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estudiante-inicio" className="mb-1 block text-sm text-slate-300">
                  Fecha de inicio
                </label>
                <input
                  id="estudiante-inicio"
                  type="date"
                  value={formulario.start_date}
                  onChange={(e) => setFormulario({ ...formulario, start_date: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="estudiante-fin" className="mb-1 block text-sm text-slate-300">
                  Fecha de fin
                </label>
                <input
                  id="estudiante-fin"
                  type="date"
                  value={formulario.end_date}
                  onChange={(e) => setFormulario({ ...formulario, end_date: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {formulario.id && (
              <div>
                <label htmlFor="estudiante-estado" className="mb-1 block text-sm text-slate-300">
                  Estado
                </label>
                <select
                  id="estudiante-estado"
                  value={formulario.status}
                  onChange={(e) => setFormulario({ ...formulario, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setFormulario(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {estudiantes.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#1e4066] bg-[#002244]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#00162e] text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
              <tr>
                <th className="p-4">Estudiante</th>
                <th className="p-4">Universidad</th>
                <th className="p-4">Periodo</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {estudiantes.map((estudiante) => (
                <tr key={estudiante.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-white block">{estudiante.student_name}</span>
                    <span className="text-[11px] text-slate-300">{estudiante.student_email}</span>
                  </td>
                  <td className="p-4 text-slate-300">{estudiante.university ?? '—'}</td>
                  <td className="p-4 text-slate-300">
                    {estudiante.start_date || estudiante.end_date
                      ? `${estudiante.start_date ?? '—'} → ${estudiante.end_date ?? '—'}`
                      : '—'}
                  </td>
                  <td className="p-4">{etiquetaEstado(estudiante.status)}</td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicion(estudiante)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/20"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(estudiante)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/30"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
