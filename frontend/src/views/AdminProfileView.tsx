import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  participant_type: string | null;
  status: string;
}

export const AdminProfileView = () => {
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<{ data: Profile }>('/api/v1/users/me');
        if (!activo) return;
        setPerfil(datos.data);
        setNombre(datos.data.full_name);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;

    const nuevoNombre = nombre.trim();
    if (!nuevoNombre) {
      setError('El nombre es obligatorio.');
      return;
    }

    setGuardando(true);
    setError('');
    setAviso('');

    try {
      const datos = await api<{ data: Profile }>('/api/v1/users/me', {
        method: 'PUT',
        body: JSON.stringify({ full_name: nuevoNombre }),
      });

      setPerfil(datos.data);
      setNombre(datos.data.full_name);
      setAviso('Perfil actualizado correctamente.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  }

  const etiquetas: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gestor',
    user: 'Usuario',
    visitor: 'Visitante',
  };

  const tiposParticipante: Record<string, string> = {
    international_student: 'Estudiante internacional',
    volunteer: 'Voluntario',
    intern: 'Pasante',
  };

  return (
    <section className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-white">Mi perfil</h2>
        <p className="text-sm text-slate-300">
          Consulta y actualiza los datos de tu cuenta.
        </p>
      </div>

      {cargando && <p role="status" className="text-slate-300">Cargando perfil...</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {aviso && <p role="status" className="text-sm text-[#77C65E]">{aviso}</p>}

      {perfil && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-6"
        >
          <div>
            <label htmlFor="perfil-nombre" className="mb-1 block text-sm text-slate-300">
              Nombre completo *
            </label>
            <input
              id="perfil-nombre"
              type="text"
              required
              maxLength={200}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-[#1e4066] bg-[#00162e] p-3 text-sm text-white focus:border-[#77C65E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl bg-[#00162e] border border-[#1e4066] p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">Correo</p>
              <p className="text-white break-words">{perfil.email}</p>
            </div>
            <div className="rounded-xl bg-[#00162e] border border-[#1e4066] p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">Rol</p>
              <p className="text-white">{etiquetas[perfil.role] ?? perfil.role}</p>
            </div>
            <div className="rounded-xl bg-[#00162e] border border-[#1e4066] p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">Tipo de participante</p>
              <p className="text-white">
                {perfil.participant_type
                  ? (tiposParticipante[perfil.participant_type] ?? perfil.participant_type)
                  : '—'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </section>
  );
};
