import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';

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

export const AdminCommunitiesView = () => {
  const [comunidades, setComunidades] = useState<Community[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<CommunityForm | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<Community[]>('/api/v1/communities');
        if (activo) setComunidades(datos);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudieron cargar las comunidades.');
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
      setError('El nombre es obligatorio.');
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
        setAviso('Comunidad actualizada correctamente.');
      } else {
        const creada = await api<Community>('/api/v1/communities', {
          method: 'POST',
          body,
        });
        setComunidades((actuales) => [...actuales, creada]);
        setAviso('Comunidad creada correctamente.');
      }

      setFormulario(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la comunidad.');
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(comunidad: Community) {
    if (!window.confirm(`¿Eliminar la comunidad "${comunidad.name}"?`)) return;

    setError('');
    setAviso('');

    try {
      await api<void>(`/api/v1/communities/${comunidad.id}`, { method: 'DELETE' });
      setComunidades((actuales) => actuales.filter((c) => c.id !== comunidad.id));
      setAviso('Comunidad eliminada.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la comunidad.');
    }
  }

  const inputClass =
    'w-full rounded-lg border border-[#1e4066] bg-[#00162e] p-3 text-sm text-white focus:border-[#77C65E] focus:outline-none';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-white">Comunidades</h2>
          <p className="text-sm text-slate-300">
            Administra las comunidades que aparecen en el sitio.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirNueva}
          className="flex items-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] hover:bg-[#008047] hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva comunidad
        </button>
      </div>

      {cargando && <p role="status" className="text-slate-300">Cargando comunidades...</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {aviso && <p role="status" className="text-sm text-[#77C65E]">{aviso}</p>}

      {!cargando && comunidades.length === 0 && !error && (
        <p className="text-slate-300">No hay comunidades registradas.</p>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-[#1e4066] bg-[#002244] p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">
              {formulario.id ? 'Editar comunidad' : 'Nueva comunidad'}
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
              <label htmlFor="comunidad-nombre" className="mb-1 block text-sm text-slate-300">
                Nombre *
              </label>
              <input
                id="comunidad-nombre"
                type="text"
                required
                maxLength={255}
                value={formulario.name}
                onChange={(e) => setFormulario({ ...formulario, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="comunidad-descripcion" className="mb-1 block text-sm text-slate-300">
                Descripción
              </label>
              <textarea
                id="comunidad-descripcion"
                rows={3}
                value={formulario.description}
                onChange={(e) => setFormulario({ ...formulario, description: e.target.value })}
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={formulario.is_published}
                onChange={(e) => setFormulario({ ...formulario, is_published: e.target.checked })}
              />
              Publicada en el sitio
            </label>

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

      {comunidades.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#1e4066] bg-[#002244]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#00162e] text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
              <tr>
                <th className="p-4">Nombre</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comunidades.map((comunidad) => (
                <tr key={comunidad.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{comunidad.name}</td>
                  <td className="p-4 text-slate-300 max-w-xs truncate">
                    {comunidad.description ?? '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        comunidad.is_published
                          ? 'bg-[#77C65E]/20 text-[#77C65E]'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {comunidad.is_published ? 'Publicada' : 'Oculta'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicion(comunidad)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/20"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(comunidad)}
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
