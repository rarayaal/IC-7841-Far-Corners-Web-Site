import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Filter, AlertCircle, FileText } from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';
import { adminTexts } from '../lib/adminI18n';
import type { Language } from '../types';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name?: string;
  user_email?: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent?: string | null;
  created_at: string;
}

interface AdminAuditViewProps {
  language?: Language;
}

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({ language = 'es' }) => {
  const txt = adminTexts[language].audit;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('tableName', entityFilter);
      params.append('limit', '50');

      const res = await apiAdminJson<{ data: AuditLog[] }>(`/api/v1/audit/logs?${params.toString()}`);
      setLogs(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.message || txt.fetchError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#00162e] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#77C65E]" />
            {txt.title}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {txt.subtitle}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {txt.refresh}
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-[#00162e] border border-white/10 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="w-4 h-4 text-[#77C65E]" />
          <span>{txt.filters}</span>
        </div>

        {/* Filtro Acciones */}
        <div className="relative inline-block">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="fc-select bg-[#000d1a] border border-white/10 hover:border-white/20 focus:border-[#77C65E] rounded-xl text-white text-xs pl-3.5 py-2 outline-none cursor-pointer transition-all shadow-inner"
          >
            <option value="">{txt.allActions}</option>
            <option value="create">{txt.actions.create}</option>
            <option value="update">{txt.actions.update}</option>
            <option value="delete">{txt.actions.delete}</option>
          </select>
        </div>

        {/* Filtro Entidades */}
        <div className="relative inline-block">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="fc-select bg-[#000d1a] border border-white/10 hover:border-white/20 focus:border-[#77C65E] rounded-xl text-white text-xs pl-3.5 py-2 outline-none cursor-pointer transition-all shadow-inner"
          >
            <option value="">{txt.allEntities}</option>
            <option value="users">{txt.entities.users}</option>
            <option value="user_permissions">{txt.entities.permissions}</option>
            <option value="shows">{txt.entities.shows}</option>
            <option value="events">{txt.entities.events}</option>
            <option value="tickets">{txt.entities.tickets}</option>
            <option value="donations">{txt.entities.donations}</option>
            <option value="institutional_content">{txt.entities.institutionalContent}</option>
          </select>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de Auditoría */}
      <div className="bg-[#00162e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {language === 'es' ? 'Cargando registros de auditoría...' : 'Loading audit records...'}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {txt.detailModal.emptyState}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#002244] text-[11px] uppercase font-mono text-slate-300 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">{txt.table.date}</th>
                  <th className="py-3.5 px-4">{txt.table.action}</th>
                  <th className="py-3.5 px-4">{txt.table.entity}</th>
                  <th className="py-3.5 px-4">{txt.table.user}</th>
                  <th className="py-3.5 px-4">{txt.table.ip}</th>
                  <th className="py-3.5 px-4 text-right">{txt.table.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(language === 'es' ? 'es-CR' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.action.toLowerCase() === 'create' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        log.action.toLowerCase() === 'update' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        log.action.toLowerCase() === 'delete' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-white font-semibold">
                      {log.table_name} {log.record_id ? `(${log.record_id.substring(0, 8)}...)` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-300">
                      {log.user_email || log.user_name || log.user_id || (language === 'es' ? 'Sistema / Anónimo' : 'System / Anonymous')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[10px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-sans font-semibold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detalle JSON (Diff Estado Anterior / Nuevo) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#00162e] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#77C65E]" />
                  {txt.detailModal.title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">{txt.detailModal.oldValues}</h4>
                <pre className="p-3 bg-[#000d1a] border border-white/10 rounded-xl text-[11px] font-mono text-amber-300/90 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.old_values, null, 2) || 'null'}
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">{txt.detailModal.newValues}</h4>
                <pre className="p-3 bg-[#000d1a] border border-white/10 rounded-xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.new_values, null, 2) || 'null'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                {txt.detailModal.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
