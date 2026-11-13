import React, { useState, useEffect, type FormEvent } from 'react';
import {
  UserPlus, Shield, Check, X, Power, AlertCircle, Key, ChevronDown,
  ChevronRight, Search, RefreshCw,
} from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';
import { adminTexts, roleLabel, participantTypeLabel } from '../lib/adminI18n';
import type { Language } from '../types';

type UserRole = 'admin' | 'manager' | 'user';
type ParticipantType = 'internship' | 'volunteer' | 'camp';

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  participant_type: ParticipantType | null;
  permissions: string[];
  created_at: string;
}

interface ListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

const ROLE_ORDER: UserRole[] = ['admin', 'manager', 'user'];
const PARTICIPANT_TYPES: ParticipantType[] = [
  'internship',
  'volunteer',
  'camp',
];

interface AdminUsersManagementViewProps {
  language?: Language;
}

export const AdminUsersManagementView: React.FC<AdminUsersManagementViewProps> = ({
  language = 'es',
}) => {
  const txt = adminTexts[language].usersManagement;

  const AVAILABLE_PERMISSIONS: { code: string; label: string; desc: string }[] = [
    { code: 'users:manage', label: txt.permissions['users:manage'].label, desc: txt.permissions['users:manage'].desc },
    { code: 'roles:manage', label: txt.permissions['roles:manage'].label, desc: txt.permissions['roles:manage'].desc },
    { code: 'audit:read', label: txt.permissions['audit:read'].label, desc: txt.permissions['audit:read'].desc },
    { code: 'content:manage', label: txt.permissions['content:manage'].label, desc: txt.permissions['content:manage'].desc },
    { code: 'projects:manage', label: txt.permissions['projects:manage'].label, desc: txt.permissions['projects:manage'].desc },
    { code: 'events:manage', label: txt.permissions['events:manage'].label, desc: txt.permissions['events:manage'].desc },
    { code: 'tickets:manage', label: txt.permissions['tickets:manage'].label, desc: txt.permissions['tickets:manage'].desc },
    { code: 'donations:manage', label: txt.permissions['donations:manage'].label, desc: txt.permissions['donations:manage'].desc },
    { code: 'community:manage', label: txt.permissions['community:manage'].label, desc: txt.permissions['community:manage'].desc },
    { code: 'media:manage', label: txt.permissions['media:manage'].label, desc: txt.permissions['media:manage'].desc },
  ];

  const ROLE_PRESETS = [
    { name: txt.presets.boxOffice, permissions: ['tickets:manage', 'events:manage'] },
    { name: txt.presets.treasurer, permissions: ['donations:manage'] },
    { name: txt.presets.artistic, permissions: ['projects:manage', 'events:manage', 'media:manage'] },
    { name: txt.presets.community, permissions: ['community:manage'] },
    { name: language === 'es' ? 'Editor de Contenido' : 'Content Editor', permissions: ['content:manage', 'media:manage'] },
    { name: language === 'es' ? 'Acceso Completo' : 'Full Access', permissions: AVAILABLE_PERMISSIONS.map((p) => p.code) },
  ];

  const esAdmin = (() => {
    try {
      return (JSON.parse(localStorage.getItem('auth_user') || '{}') as { role?: string }).role === 'admin';
    } catch {
      return false;
    }
  })();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<UserRole, boolean>>({
    admin: false,
    manager: false,
    user: true,
  });

  // Modal Crear Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('manager');
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Modal Editar Permisos
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<AdminUser | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (roleFilter) params.set('role', roleFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await apiAdminJson<ListResponse>(
        `/api/v1/admin/users?${params.toString()}`
      );
      setUsers(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total || 0);
    } catch (err: any) {
      setError(err?.message || txt.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [page, roleFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleRoleFilter = (value: string) => {
    setPage(1);
    setRoleFilter(value as '' | UserRole);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await apiAdminJson(`/api/v1/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccessMsg(
        txt.statusUpdated
          .replace('{name}', user.full_name)
          .replace('{status}', nextStatus === 'active' ? (language === 'es' ? 'activo' : 'active') : (language === 'es' ? 'inactivo' : 'inactive'))
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || txt.statusError);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleParticipantType = async (user: AdminUser, value: string) => {
    const participantType = value === '' ? null : (value as ParticipantType);
    try {
      await apiAdminJson(`/api/v1/admin/users/${user.id}/participant-type`, {
        method: 'PATCH',
        body: JSON.stringify({ participant_type: participantType }),
      });
      setSuccessMsg(txt.participantTypeUpdated);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, participant_type: participantType } : u))
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || txt.participantTypeError);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
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
          permissions: newRole === 'manager' ? newPermissions : [],
        }),
      });

      setSuccessMsg(txt.createSuccess);
      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('manager');
      setNewPermissions([]);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || txt.createError);
    } finally {
      setSubmitting(false);
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
      setSuccessMsg(
        language === 'es'
          ? `Permisos de ${selectedUserForPerms.full_name} actualizados.`
          : `Permissions for ${selectedUserForPerms.full_name} updated.`
      );
      setSelectedUserForPerms(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err?.message || (language === 'es' ? 'Error al actualizar permisos' : 'Error updating permissions'));
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

  const renderRow = (u: AdminUser) => (
    <tr key={u.id} className="hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 sm:px-6">
        <div className="font-semibold text-white">{u.full_name}</div>
        <div className="text-xs text-slate-400 font-mono break-all">{u.email}</div>
      </td>
      <td className="py-4 px-4 sm:px-6">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
            u.role === 'admin'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              : u.role === 'manager'
                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
          }`}
        >
          {roleLabel(u.role, language)}
        </span>
      </td>
      <td className="py-4 px-4 sm:px-6">
        <select
          value={u.participant_type ?? ''}
          onChange={(e) => void handleParticipantType(u, e.target.value)}
          className="fc-select w-full max-w-[12rem] px-2.5 py-1.5 bg-[#000d1a] border border-white/10 rounded-lg text-xs text-white focus:border-[#77C65E] outline-none"
        >
          <option value="">{txt.participantTypeEmpty}</option>
          {PARTICIPANT_TYPES.map((pt) => (
            <option key={pt} value={pt}>
              {participantTypeLabel(pt, language)}
            </option>
          ))}
        </select>
      </td>
      <td className="py-4 px-4 sm:px-6">
        {u.role === 'admin' ? (
          <span className="text-xs text-amber-400 font-medium italic">
            {language === 'es' ? 'Acceso Total (Bypass)' : 'Full Access (Bypass)'}
          </span>
        ) : u.role === 'manager' && u.permissions && u.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {u.permissions.map((p) => (
              <span key={p} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-slate-300 font-mono">
                {p}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">—</span>
        )}
      </td>
      <td className="py-4 px-4 sm:px-6">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            u.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          {u.status === 'active'
            ? (language === 'es' ? 'Activo' : 'Active')
            : (language === 'es' ? 'Inactivo' : 'Inactive')}
        </span>
      </td>
      <td className="py-4 px-4 sm:px-6 text-right space-x-2">
        {u.role !== 'admin' && esAdmin && (
          <button
            onClick={() => handleOpenPermsModal(u)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            title={language === 'es' ? 'Gestionar Permisos' : 'Manage Permissions'}
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => handleToggleStatus(u)}
          className={`p-1.5 rounded-lg border text-xs transition-all inline-flex items-center ${
            u.status === 'active'
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title={
            u.status === 'active'
              ? (language === 'es' ? 'Desactivar usuario' : 'Deactivate user')
              : (language === 'es' ? 'Activar usuario' : 'Activate user')
          }
        >
          <Power className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 min-h-[70vh] pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#00162e] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#77C65E]" />
            {txt.title}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{txt.subtitle}</p>
        </div>
        {esAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl transition-all shadow-glow-green flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {txt.createUserBtn}
          </button>
        )}
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

      {/* Barra de filtros */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3 bg-[#00162e] border border-white/10 rounded-2xl p-4"
      >
        <div className="flex-1 flex items-center gap-2 bg-[#000d1a] border border-white/10 rounded-xl px-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={txt.searchPlaceholder}
            className="w-full bg-transparent py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="fc-select px-3 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-sm text-white focus:border-[#77C65E] outline-none"
        >
          <option value="">{txt.allRoles}</option>
          <option value="admin">{roleLabel('admin', language)}</option>
          <option value="manager">{roleLabel('manager', language)}</option>
          <option value="user">{roleLabel('user', language)}</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl transition-all"
        >
          {language === 'es' ? 'Buscar' : 'Search'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchInput('');
            setSearchTerm('');
            setRoleFilter('');
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {language === 'es' ? 'Limpiar' : 'Clear'}
        </button>
      </form>

      {/* Listado agrupado por rol */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">{txt.loading}</div>
      ) : users.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm">{txt.empty}</div>
      ) : (
        <div className="space-y-4">
          {ROLE_ORDER.map((role) => {
            const rows = users.filter((u) => u.role === role);
            if (rows.length === 0) return null;
            const isCollapsed = collapsed[role];
            return (
              <div
                key={role}
                className="bg-[#00162e] border border-white/10 rounded-2xl overflow-hidden shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [role]: !prev[role] }))}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-[#002244] hover:bg-[#002a50] transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-white">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-[#77C65E]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#77C65E]" />
                    )}
                    {roleLabel(role, language)}
                    <span className="text-xs font-mono text-slate-400">({rows.length})</span>
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-[#00162e] text-xs uppercase text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4 sm:px-6">{txt.table.user}</th>
                          <th className="py-3 px-4 sm:px-6">{txt.table.role}</th>
                          <th className="py-3 px-4 sm:px-6">{txt.table.participantType}</th>
                          <th className="py-3 px-4 sm:px-6">{txt.table.permissions}</th>
                          <th className="py-3 px-4 sm:px-6">{txt.table.status}</th>
                          <th className="py-3 px-4 sm:px-6 text-right">{txt.table.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {rows.map(renderRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {!loading && users.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {txt.pagination.page.replace('{current}', String(page)).replace('{total}', String(totalPages))}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {txt.pagination.prev}
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {txt.pagination.next}
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[#00162e] border border-white/15 rounded-2xl w-full max-w-lg my-auto max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 p-6 pb-4 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#77C65E]" />
                {txt.modal.title}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 pt-4 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{txt.modal.nameLabel}</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none shadow-inner"
                  placeholder={language === 'es' ? 'Ej. María Hernández' : 'e.g. Maria Hernandez'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{txt.modal.emailLabel}</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none shadow-inner"
                  placeholder={language === 'es' ? 'ejemplo@farcornerscr.org' : 'example@farcornersmusicals.org'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{txt.modal.passLabel}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none shadow-inner"
                  placeholder={language === 'es' ? 'Min. 8 caracteres' : 'Min. 8 characters'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{txt.modal.roleLabel}</label>
                <div className="relative">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="fc-select w-full px-3.5 py-2.5 bg-[#000d1a] border border-white/10 rounded-xl text-white text-sm focus:border-[#77C65E] outline-none cursor-pointer transition-all shadow-inner"
                  >
                    <option value="admin">{roleLabel('admin', language)}</option>
                    <option value="manager">{roleLabel('manager', language)}</option>
                    <option value="user">{roleLabel('user', language)}</option>
                  </select>
                </div>
              </div>

              {newRole === 'manager' && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {txt.modal.presetLabel}
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
                      {txt.modal.permissionsSection}
                    </label>
                    <span className="text-[10px] text-[#77C65E] font-mono">
                      {newPermissions.length} / {AVAILABLE_PERMISSIONS.length}
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

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  {txt.modal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl shadow-glow-green transition-all"
                >
                  {submitting ? txt.modal.creating : txt.modal.create}
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
                  {txt.editModal.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'es' ? 'Usuario' : 'User'}: <span className="text-white font-semibold">{selectedUserForPerms.full_name}</span>
                </p>
              </div>
              <button onClick={() => setSelectedUserForPerms(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 pt-4 space-y-3 overflow-y-auto flex-grow">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {txt.modal.presetLabel}
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
                  {txt.modal.permissionsSection}
                </label>
                <span className="text-[10px] text-[#77C65E] font-mono">
                  {editPermissions.length} / {AVAILABLE_PERMISSIONS.length}
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
                  {txt.modal.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-bold text-xs rounded-xl shadow-glow-green transition-all"
                >
                  {txt.editModal.saveChanges}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
