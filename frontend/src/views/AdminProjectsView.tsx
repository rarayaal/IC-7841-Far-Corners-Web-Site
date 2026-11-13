import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Globe, Calendar, Users, FolderKanban } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  country: string | null;
  image_url: string | null;
  display_order: number;
  project_year: number | null;
  participants_count: number | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProjectForm {
  id?: string;
  title: string;
  description: string;
  country: string;
  image_url: string;
  display_order: number;
  project_year: string;
  participants_count: string;
  is_published: boolean;
}

const formVacio = (): ProjectForm => ({
  title: '',
  description: '',
  country: 'CR',
  image_url: '',
  display_order: 0,
  project_year: new Date().getFullYear().toString(),
  participants_count: '',
  is_published: true,
});

export const AdminProjectsView = ({ language }: { language: Language }) => {
  const isEs = language === 'es';
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<ProjectForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<Project | null>(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<Project[]>('/api/v1/projects?admin=true');
        if (activo) setProyectos(datos);
      } catch (e) {
        if (activo) {
          setError(e instanceof Error ? e.message : 'Error al cargar los proyectos.');
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  function abrirNuevo() {
    setFormulario(formVacio());
    setError('');
    setAviso('');
  }

  function abrirEdicion(proyecto: Project) {
    setFormulario({
      id: proyecto.id,
      title: proyecto.title,
      description: proyecto.description ?? '',
      country: proyecto.country ?? 'CR',
      image_url: proyecto.image_url ?? '',
      display_order: proyecto.display_order ?? 0,
      project_year: proyecto.project_year ? proyecto.project_year.toString() : '',
      participants_count: proyecto.participants_count ? proyecto.participants_count.toString() : '',
      is_published: proyecto.is_published,
    });
    setError('');
    setAviso('');
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!formulario || guardando) return;

    const titulo = formulario.title.trim();
    if (!titulo) {
      setError(isEs ? 'El título es obligatorio.' : 'Title is required.');
      return;
    }

    setGuardando(true);
    setError('');
    setAviso('');

    const esEdicion = Boolean(formulario.id);

    try {
      const body = JSON.stringify({
        title: titulo,
        description: formulario.description.trim() || null,
        country: formulario.country.trim().toUpperCase() || null,
        image_url: formulario.image_url.trim() || null,
        display_order: Number(formulario.display_order) || 0,
        project_year: formulario.project_year ? Number(formulario.project_year) : null,
        participants_count: formulario.participants_count ? Number(formulario.participants_count) : null,
        is_published: formulario.is_published,
      });

      if (esEdicion) {
        const actualizado = await api<Project>(`/api/v1/projects/${formulario.id}`, {
          method: 'PUT',
          body,
        });
        setProyectos((actuales) =>
          actuales.map((p) => (p.id === actualizado.id ? actualizado : p))
        );
        setAviso(isEs ? 'Proyecto actualizado exitosamente.' : 'Project updated successfully.');
      } else {
        const creado = await api<Project>('/api/v1/projects', {
          method: 'POST',
          body,
        });
        setProyectos((actuales) => [...actuales, creado]);
        setAviso(isEs ? 'Proyecto creado exitosamente.' : 'Project created successfully.');
      }

      setFormulario(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el proyecto.');
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<void>(`/api/v1/projects/${porEliminar.id}`, {
        method: 'DELETE',
      });
      setProyectos((actuales) => actuales.filter((p) => p.id !== porEliminar.id));
      setAviso(isEs ? 'Proyecto eliminado del catálogo.' : 'Project removed.');
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar el proyecto.');
    } finally {
      setBorrando(false);
    }
  }

  const nombrePais = (codigo: string | null) => {
    switch (codigo) {
      case 'CR':
        return 'Costa Rica';
      case 'CN':
        return 'China';
      case 'MZ':
        return 'Mozambique';
      default:
        return codigo || '—';
    }
  };

  return (
    <div className="space-y-6">
      <ToastRegion>
        {error && (
          <Toast
            variant="error"
            message={error}
            onClose={() => setError('')}
            closeLabel={isEs ? 'Cerrar' : 'Close'}
          />
        )}
        {aviso && (
          <Toast
            variant="success"
            message={aviso}
            onClose={() => setAviso('')}
            closeLabel={isEs ? 'Cerrar' : 'Close'}
          />
        )}
      </ToastRegion>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#002244] border border-[#1e4066] p-6 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-white">
              {isEs ? 'Catálogo de Proyectos' : 'Projects Directory'}
            </h2>
            <p className="text-xs text-slate-300">
              {isEs
                ? 'Gestiona las obras, hitos comunitarios y proyectos por país.'
                : 'Manage community works, productions, and milestones.'}
            </p>
          </div>
        </div>

        <button
          onClick={abrirNuevo}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl transition-all shadow-glow-green text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>{isEs ? 'Nuevo Proyecto' : 'New Project'}</span>
        </button>
      </div>

      {/* Form Modal */}
      {formulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#002244] border border-[#77C65E]/40 rounded-2xl p-6 w-full max-w-2xl text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg font-bold text-white">
                {formulario.id
                  ? isEs ? 'Editar Proyecto' : 'Edit Project'
                  : isEs ? 'Registrar Nuevo Proyecto' : 'Create Project'}
              </h3>
              <button
                onClick={() => setFormulario(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEs ? 'Título de la Obra o Proyecto *' : 'Project Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={formulario.title}
                  onChange={(e) => setFormulario({ ...formulario, title: e.target.value })}
                  placeholder={isEs ? 'Ej. Campamento de Teatro Monteverde' : 'Project title...'}
                  className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-white focus:border-[#77C65E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isEs ? 'País de Enfoque' : 'Country'}
                  </label>
                  <select
                    value={formulario.country}
                    onChange={(e) => setFormulario({ ...formulario, country: e.target.value })}
                    className="fc-select w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-white focus:border-[#77C65E] focus:outline-none"
                  >
                    <option value="CR">Costa Rica (CR)</option>
                    <option value="CN">China (CN)</option>
                    <option value="MZ">Mozambique (MZ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isEs ? 'Año del Proyecto' : 'Year'}
                  </label>
                  <input
                    type="number"
                    value={formulario.project_year}
                    onChange={(e) => setFormulario({ ...formulario, project_year: e.target.value })}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-white focus:border-[#77C65E] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isEs ? 'Participantes / Beneficiarios' : 'Participants'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formulario.participants_count}
                    onChange={(e) => setFormulario({ ...formulario, participants_count: e.target.value })}
                    placeholder="Ej. 120"
                    className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-white focus:border-[#77C65E] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEs ? 'URL de Imagen o Póster' : 'Poster / Image URL'}
                </label>
                <input
                  type="text"
                  value={formulario.image_url}
                  onChange={(e) => setFormulario({ ...formulario, image_url: e.target.value })}
                  placeholder="/recursos/IMG_2905.PNG o https://..."
                  className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-white focus:border-[#77C65E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isEs ? 'Descripción Detallada' : 'Description'}
                </label>
                <textarea
                  rows={4}
                  value={formulario.description}
                  onChange={(e) => setFormulario({ ...formulario, description: e.target.value })}
                  placeholder={isEs ? 'Reseña de la obra, logros o actividades desarrolladas...' : 'Detailed project info...'}
                  className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-xl text-white focus:border-[#77C65E] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formulario.is_published}
                    onChange={(e) => setFormulario({ ...formulario, is_published: e.target.checked })}
                    className="rounded border-slate-700 text-[#77C65E] focus:ring-[#77C65E]"
                  />
                  <span className="text-slate-200 font-semibold">
                    {isEs ? 'Publicar en el sitio web inmediatamente' : 'Publish to website'}
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFormulario(null)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl transition-all shadow-glow-green"
                >
                  {guardando
                    ? isEs ? 'Guardando...' : 'Saving...'
                    : isEs ? 'Guardar Proyecto' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-[#002244] border border-[#1e4066] rounded-2xl overflow-hidden shadow-card-dark">
        {cargando ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isEs ? 'Cargando catálogo de proyectos...' : 'Loading projects...'}
          </div>
        ) : proyectos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isEs ? 'No hay proyectos registrados aún.' : 'No projects registered.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#00162e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">{isEs ? 'Proyecto' : 'Project'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'País' : 'Country'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Año' : 'Year'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Participantes' : 'Participants'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Estado' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">{isEs ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {proyectos.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        {proyecto.image_url ? (
                          <img
                            src={proyecto.image_url}
                            alt={proyecto.title}
                            className="w-10 h-10 object-cover rounded-lg border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#00162e] border border-white/10 flex items-center justify-center text-slate-500">
                            <FolderKanban className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-white block">{proyecto.title}</span>
                          <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {proyecto.description || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A90D6]/20 text-[#4A90D6] border border-[#4A90D6]/30">
                        <Globe className="w-3 h-3 mr-1" />
                        {nombrePais(proyecto.country)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      {proyecto.project_year || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      {proyecto.participants_count ? `${proyecto.participants_count} personas` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {proyecto.is_published ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40">
                          {isEs ? 'Publicado' : 'Published'}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {isEs ? 'Borrador / Oculto' : 'Draft'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => abrirEdicion(proyecto)}
                        className="p-1.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title={isEs ? 'Editar' : 'Edit'}
                      >
                        <Pencil className="w-4 h-4 text-[#4A90D6]" />
                      </button>
                      <button
                        onClick={() => setPorEliminar(proyecto)}
                        className="p-1.5 text-slate-300 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                        title={isEs ? 'Eliminar' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title={isEs ? 'Confirmar retiro de proyecto' : 'Confirm removal'}
        message={
          isEs
            ? `¿Deseas eliminar el proyecto "${porEliminar?.title}"? Esta acción retirará el registro del catálogo.`
            : `Are you sure you want to delete "${porEliminar?.title}"?`
        }
        confirmLabel={isEs ? 'Eliminar' : 'Delete'}
        busyLabel={isEs ? 'Eliminando...' : 'Deleting...'}
        cancelLabel={isEs ? 'Cancelar' : 'Cancel'}
        busy={borrando}
        onConfirm={confirmarBorrado}
        onCancel={() => setPorEliminar(null)}
      />
    </div>
  );
};
