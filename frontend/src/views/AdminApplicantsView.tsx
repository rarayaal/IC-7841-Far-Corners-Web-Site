import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, ClipboardList, Eye, RefreshCw, X } from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';
import { adminTexts } from '../lib/adminI18n';
import type { FormSnapshot, Language } from '../types';

type SubmissionStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

interface Envio {
  id: string;
  form_type: string;
  form_title: string;
  user_name: string;
  user_email: string;
  data: Record<string, unknown>;
  form_snapshot: FormSnapshot | null;
  status: SubmissionStatus;
  created_at: string;
}

const ESTADOS: SubmissionStatus[] = ['pending', 'reviewed', 'approved', 'rejected'];

interface AdminApplicantsViewProps {
  language: Language;
}

export const AdminApplicantsView = ({ language }: AdminApplicantsViewProps) => {
  const txt = adminTexts[language].applicants;
  const estadoTxt = adminTexts[language].forms.status;

  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Envio | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAdminJson<Envio[]>('/api/v1/forms/submissions');
      setEnvios(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || txt.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const cambiarEstado = async (envio: Envio, status: SubmissionStatus) => {
    if (status === envio.status || actualizando) return;
    setActualizando(envio.id);
    setError(null);
    try {
      await apiAdminJson(`/api/v1/forms/${envio.form_type}/submissions/${envio.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setEnvios((prev) => prev.map((e) => (e.id === envio.id ? { ...e, status } : e)));
      setAviso(txt.statusUpdated);
      setTimeout(() => setAviso(null), 3000);
    } catch (err: any) {
      setError(err?.message || txt.statusError);
      setTimeout(() => setError(null), 4000);
    } finally {
      setActualizando(null);
    }
  };

  const estadoBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-brand-green/20 text-brand-green';
      case 'rejected':
        return 'bg-rose-500/20 text-rose-300';
      case 'reviewed':
        return 'bg-brand-blue/20 text-brand-blue';
      default:
        return 'bg-amber-500/20 text-amber-300';
    }
  };

  // Ordena y etiqueta los datos con la instantánea del envío, para que la
  // postulación se vea tal como fue completada aunque el formulario haya cambiado.
  const entradasDe = (envio: Envio) => {
    const datos = envio.data ?? {};
    const campos = envio.form_snapshot?.fields ?? [];
    const incluidas = new Set<string>();
    const filas: { clave: string; etiqueta: string; valor: unknown }[] = [];

    for (const campo of campos) {
      if (!Object.prototype.hasOwnProperty.call(datos, campo.field_key)) continue;
      incluidas.add(campo.field_key);
      filas.push({ clave: campo.field_key, etiqueta: campo.label, valor: datos[campo.field_key] });
    }
    for (const [clave, valor] of Object.entries(datos)) {
      if (!incluidas.has(clave)) filas.push({ clave, etiqueta: clave, valor });
    }
    return filas;
  };

  const valorTexto = (valor: unknown) => {
    if (Array.isArray(valor)) return valor.join(', ');
    if (typeof valor === 'boolean') {
      return valor ? (language === 'es' ? 'Sí' : 'Yes') : 'No';
    }
    return String(valor ?? '');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#77C65E]" />
            {txt.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">{txt.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-brand-forest dark:text-brand-lime font-bold">
            {txt.activeCount.replace('{count}', String(envios.length))}
          </span>
          <button
            type="button"
            onClick={() => void cargar()}
            className="p-1.5 bg-slate-100 dark:bg-white/10 hover:bg-white/20 text-brand-navy dark:text-white rounded-lg transition-all inline-flex items-center"
            title={language === 'es' ? 'Recargar' : 'Reload'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {aviso && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-5 h-5 shrink-0" />
          <span>{aviso}</span>
        </div>
      )}

      <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">{txt.loading}</div>
        ) : envios.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">{txt.empty}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-[#F8F8F2] dark:bg-brand-navyDark text-slate-600 dark:text-slate-300 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="p-4">{txt.table.applicant}</th>
                  <th className="p-4">{txt.table.form}</th>
                  <th className="p-4">{txt.table.date}</th>
                  <th className="p-4">{txt.table.status}</th>
                  <th className="p-4">{txt.table.updateStatus}</th>
                  <th className="p-4 text-right">{txt.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {envios.map((envio) => (
                  <tr key={envio.id} className="hover:bg-slate-100 dark:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-brand-navy dark:text-white block">{envio.user_name}</span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">{envio.user_email}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{envio.form_title}</td>
                    <td className="p-4">
                      {new Date(envio.created_at).toLocaleDateString(
                        language === 'es' ? 'es-CR' : 'en-US'
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${estadoBadge(envio.status)}`}
                      >
                        {estadoTxt[envio.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={envio.status}
                        disabled={actualizando === envio.id}
                        onChange={(e) => void cambiarEstado(envio, e.target.value as SubmissionStatus)}
                        className="fc-select px-2.5 py-1.5 bg-white dark:bg-[#000d1a] border border-slate-200 dark:border-white/10 rounded-lg text-xs text-brand-navy dark:text-white focus:border-[#77C65E] outline-none disabled:opacity-50"
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estadoTxt[estado]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDetalle(envio)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-brand-navy dark:text-white hover:bg-white/20"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{txt.view}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col">
              <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-200 dark:border-white/10">
                <div>
                  <h4 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
                    {txt.detailTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {detalle.user_name} · {detalle.form_title} ·{' '}
                    {new Date(detalle.created_at).toLocaleString(
                      language === 'es' ? 'es-CR' : 'en-US'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetalle(null)}
                  aria-label={txt.close}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-5 space-y-4">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{txt.detailSubtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  {entradasDe(detalle).map(({ clave, etiqueta, valor }) => (
                    <div key={clave} className="text-xs">
                      <span className="text-slate-500 dark:text-slate-400 block">{etiqueta}</span>
                      <span className="text-brand-navy dark:text-white whitespace-pre-wrap">
                        {valorTexto(valor) || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetalle(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-white/20 text-brand-navy dark:text-white text-xs font-bold rounded-lg"
                >
                  {txt.close}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
