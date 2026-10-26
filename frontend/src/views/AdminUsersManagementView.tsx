import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Check, X, Edit2, Power, AlertCircle, Key, ChevronDown } from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive';
  permissions: string[];
  created_at: string;
}

const AVAILABLE_PERMISSIONS = [
  { code: 'users:manage', label: 'Gestionar Usuarios', desc: 'Crear, editar y desactivar administradores' },
  { code: 'roles:manage', label: 'Gestionar Roles', desc: 'Asignar y revocar permisos del sistema' },
  { code: 'audit:read', label: 'Consultar Auditoría', desc: 'Ver la bitácora de cambios' },
  { code: 'content:manage', label: 'Contenido Institucional', desc: 'Editar historia, visión e impacto' },
  { code: 'projects:manage', label: 'Proyectos Teatrales', desc: 'Administrar catálogo de obras' },
  { code: 'events:manage', label: 'Eventos', desc: 'Gestionar cartelera y fechas' },
  { code: 'tickets:manage', label: 'Boletería', desc: 'Gestionar inventario y precios de entradas' },
  { code: 'donations:manage', label: 'Donaciones', desc: 'Ver y verificar aportes económicos' },
  { code: 'community:manage', label: 'Comunidad', desc: 'Gestionar estudiantes y voluntarios' },
  { code: 'media:manage', label: 'Multimedia', desc: 'Gestionar fotos y galería Cloudflare R2' },
];

interface RolePreset {
  name: string;
  permissions: string[];
}

const ROLE_PRESETS: RolePreset[] = [
  {
    name: 'Boletería y Taquilla',
    permissions: ['tickets:manage', 'events:manage'],
  },
  {
    name: 'Tesorero / Donaciones',
    permissions: ['donations:manage'],
  },
  {
    name: 'Director Artístico',
    permissions: ['projects:manage', 'events:manage', 'media:manage'],
  },
  {
    name: 'Coordinador Comunitario',
    permissions: ['community:manage'],
  },
  {
    name: 'Editor de Contenido',
    permissions: ['content:manage', 'media:manage'],
  },
  {
    name: 'Acceso Completo',
    permissions: AVAILABLE_PERMISSIONS.map((p) => p.code),
  },
];

export const AdminUsersManagementView: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Crear Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'manager'>('manager');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Modal Editar Permisos
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<AdminUser | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // Cargar usuarios al montar
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAdminJson<{ data: AdminUser[] }>('/api/v1/admin/users');
      setUsers(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios administrativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) return;

    setSubmitting(true);
    setError(null);
    try {
      await apiAdminJson('/api/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          full_name: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          temporary_password: newPassword,
          role: newRole,
          permissions: newPermissions,
        }),
      });

      setSuccessMsg('Usuario administrativo creado correctamente.');
      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('manager');
      setNewPermissions([]);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await apiAdminJson(`/api/v1/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccessMsg(`Estado de ${user.full_name} actualizado a ${nextStatus}.`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar estado');
      setTimeout(() => setError(null), 4000);
    }
  };


  const handleOpenPermsModal = (user: AdminUser) => {
    setSelectedUserForPerms(user);
    setEditPermissions(user.permissions || []);
  };

  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return;
    try {
      await apiAdminJson(`/api/v1/admin/users/${selectedUserForPerms.id}/roles`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions: editPermissions }),
      });
      setSuccessMsg(`Permisos de ${selectedUserForPerms.full_name} actualizados.`);
      setSelectedUserForPerms(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar permisos');
      setTimeout(() => setError(null), 4000);
    }
  };


  const togglePerm = (code: string) => {
    setEditPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const toggleNewPerm = (code: string) => {
    setNewPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  return (
    <div className="space-y-8 min-h-[70vh] pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#00162e] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#77C65E]" />
            Gestión de Usuarios Administrativos
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Administra directores, líderes de área y asigna.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl transition-all shadow-glow-green flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Administrador
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-[#00162e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Cargando personal administrativo...</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">No hay usuarios administrativos registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#002244] text-xs uppercase text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-4 px-6">Usuario</th>
                  <th className="py-4 px-6">Rol</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Permisos Asignados</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{u.full_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        }`}
                      >
                        {u.role === 'admin' ? 'Administrador General' : 'Administrador de Área'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-amber-400 font-medium italic">Acceso Total (Bypass)</span>
                      ) : u.permissions && u.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.permissions.map((p) => (
                            <span key={p} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-slate-300 font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sin permisos asignados</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleOpenPermsModal(u)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                          title="Gestionar Permisos"
                        >
                          <Key className="w-3.5 h-3.5" />
                          Permisos
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-lg border text-xs transition-all inline-flex items-center ${
                          u.status === 'active'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                        title={u.status === 'active' ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#00162e] border border-white/15 rounded-2xl w-full max-w-lg my-auto max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header del Modal fijo */}
            <div className="flex justify-between items-center border-b border-white/10 p-6 pb-4 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#77C65E]" />
                Registrar Nuevo Administrador
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable del formulario */}
            <form onSubmit={handleCreateUser} className="p-6 pt-4 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none shadow-inner"
                  placeholder="Ej. María Hernández"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none shadow-inner"
                  placeholder="ejemplo@farcornerscr.org"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña Temporal</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none shadow-inner"
                  placeholder="Min. 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Administrador</label>
                <div className="relative">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'manager')}
                    className="w-full appearance-none px-3.5 pr-10 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none cursor-pointer transition-all shadow-inner"
                  >
                    <option value="manager">Administrador de Área (Manager)</option>
                    <option value="admin">Administrador General (Admin)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Si es Manager, mostrar selector de permisos con presets */}
              {newRole === 'manager' && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Plantillas Rápidas de Puesto (Presets):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLE_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setNewPermissions(preset.permissions)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-[#77C65E]/20 hover:border-[#77C65E]/40 border border-white/10 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all font-medium"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Personalizar Permisos Granulares
                    </label>
                    <span className="text-[10px] text-[#77C65E] font-mono">
                      {newPermissions.length} de {AVAILABLE_PERMISSIONS.length} seleccionados
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 border border-white/10 rounded-xl p-2 bg-[#000d1a]">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = newPermissions.includes(perm.code);
                      return (
                        <label
                          key={perm.code}
                          onClick={() => toggleNewPerm(perm.code)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#77C65E]/10 border-[#77C65E]/30 text-white'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded bg-[#000d1a] border-white/20 text-[#77C65E] focus:ring-0 shrink-0"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white leading-tight">{perm.label}</div>
                            <div className="text-[10px] text-slate-400 leading-tight">{perm.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl shadow-glow-green transition-all"
                >
                  {submitting ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Permisos Granulares */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#00162e] border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 p-6 pb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#77C65E]" />
                  Asignar Permisos del Sistema
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Usuario: <span className="text-white font-semibold">{selectedUserForPerms.full_name}</span>
                </p>
              </div>
              <button onClick={() => setSelectedUserForPerms(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 pt-4 space-y-3 overflow-y-auto flex-grow">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Plantillas Rápidas de Puesto (Presets):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setEditPermissions(preset.permissions)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-[#77C65E]/20 hover:border-[#77C65E]/40 border border-white/10 rounded-lg text-[11px] text-slate-300 hover:text-white transition-all font-medium"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Permisos Seleccionados
                </label>
                <span className="text-[10px] text-[#77C65E] font-mono">
                  {editPermissions.length} de {AVAILABLE_PERMISSIONS.length} seleccionados
                </span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1 border border-white/10 rounded-xl p-2 bg-[#000d1a]">
                {AVAILABLE_PERMISSIONS.map((perm) => {
                  const isChecked = editPermissions.includes(perm.code);
                  return (
                    <label
                      key={perm.code}
                      onClick={() => togglePerm(perm.code)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#77C65E]/10 border-[#77C65E]/30 text-white'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded bg-[#000d1a] border-white/20 text-[#77C65E] focus:ring-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{perm.label}</div>
                        <div className="text-[11px] text-slate-400">{perm.desc}</div>
                        <span className="font-mono text-[9px] text-[#77C65E]">{perm.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPerms(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/20 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl shadow-glow-green transition-all"
                >
                  Guardar Permisos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
