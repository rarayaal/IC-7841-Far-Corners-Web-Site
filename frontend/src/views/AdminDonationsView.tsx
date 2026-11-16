import { useEffect, useState } from 'react';
import { Heart, CheckCircle2, AlertCircle, RefreshCw, DollarSign, Calendar, Mail, User, ShieldCheck } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

export interface DonationItem {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  currency: string;
  payment_provider: string;
  payment_method: string | null;
  payment_reference: string | null;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  message: string | null;
  created_at: string;
  verified_by: string | null;
  verified_at: string | null;
}

export const AdminDonationsView = ({ language }: { language: Language }) => {
  const isEs = language === 'es';
  const [donaciones, setDonaciones] = useState<DonationItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  async function cargarDonaciones() {
    setCargando(true);
    try {
      const data = await api<DonationItem[]>('/api/v1/donations');
      setDonaciones(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar las donaciones.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarDonaciones();
  }, []);

  async function cambiarEstado(id: string, nuevoEstado: 'pending' | 'completed' | 'failed') {
    setActualizandoId(id);
    setError('');
    setAviso('');

    try {
      let adminId: string | undefined = undefined;
      try {
        const u = localStorage.getItem('auth_user');
        if (u) adminId = JSON.parse(u).id;
      } catch {}

      const actualizada = await api<DonationItem>(`/api/v1/donations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nuevoEstado,
          verified_by: nuevoEstado === 'completed' ? adminId : null,
        }),
      });

      setDonaciones((prev) => prev.map((d) => (d.id === id ? actualizada : d)));
      setAviso(
        isEs
          ? `Donación actualizada a ${nuevoEstado.toUpperCase()}.`
          : `Donation status updated to ${nuevoEstado}.`
      );
    } catch (e: any) {
      setError(e.message || 'Error al actualizar el estado de la donación.');
    } finally {
      setActualizandoId(null);
    }
  }

  const donacionesFiltradas = donaciones.filter((d) => {
    if (filtro === 'all') return true;
    return d.status === filtro;
  });

  const totalRecaudado = donaciones
    .filter((d) => d.status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const donacionesPendientes = donaciones.filter((d) => d.status === 'pending').length;

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

      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#002244] border border-slate-200 dark:border-[#1e4066] p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs block">
              {isEs ? 'Recaudado (Completadas)' : 'Total Raised (USD)'}
            </span>
            <span className="text-xl font-bold font-mono text-brand-forest dark:text-[#DCEB4F]">
              ${totalRecaudado.toLocaleString()} USD
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#002244] border border-slate-200 dark:border-[#1e4066] p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs block">
              {isEs ? 'Por Conciliar (SINPE)' : 'Pending Verification'}
            </span>
            <span className="text-xl font-bold font-mono text-brand-navy dark:text-white">
              {donacionesPendientes} {isEs ? 'aportes' : 'records'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#002244] border border-slate-200 dark:border-[#1e4066] p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-[#4A90D6]/20 text-[#4A90D6] border border-[#4A90D6]/40 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs block">
              {isEs ? 'Total de Registros' : 'Total Donations'}
            </span>
            <span className="text-xl font-bold font-mono text-brand-navy dark:text-white">
              {donaciones.length}
            </span>
          </div>
        </div>
      </div>

      {/* Action and Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#002244] border border-slate-200 dark:border-[#1e4066] p-4 rounded-2xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFiltro('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtro === 'all'
                ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white bg-slate-100 dark:bg-white/5'
            }`}
          >
            {isEs ? 'Todas' : 'All'} ({donaciones.length})
          </button>
          <button
            onClick={() => setFiltro('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtro === 'pending'
                ? 'bg-amber-400 text-[#002244] font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white bg-slate-100 dark:bg-white/5'
            }`}
          >
            {isEs ? 'Pendientes / SINPE' : 'Pending'} ({donacionesPendientes})
          </button>
          <button
            onClick={() => setFiltro('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtro === 'completed'
                ? 'bg-[#77C65E] text-[#002244] font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white bg-slate-100 dark:bg-white/5'
            }`}
          >
            {isEs ? 'Completadas' : 'Completed'}
          </button>
          <button
            onClick={() => setFiltro('failed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtro === 'failed'
                ? 'bg-red-400 text-brand-navy dark:text-white font-extrabold'
                : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white bg-slate-100 dark:bg-white/5'
            }`}
          >
            {isEs ? 'Fallidas' : 'Failed'}
          </button>
        </div>

        <button
          onClick={cargarDonaciones}
          disabled={cargando}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-brand-navy dark:text-white rounded-xl text-xs font-semibold transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          <span>{isEs ? 'Actualizar' : 'Refresh'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#002244] border border-slate-200 dark:border-[#1e4066] rounded-2xl overflow-hidden shadow-card-dark">
        {cargando ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            {isEs ? 'Cargando registros de donaciones...' : 'Loading donations...'}
          </div>
        ) : donacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            {isEs ? 'No hay donaciones en esta categoría.' : 'No donations found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-[#F8F8F2] dark:bg-[#00162e] text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-white/10">
                <tr>
                  <th className="px-5 py-3.5">{isEs ? 'Donante' : 'Donor'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Monto' : 'Amount'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Método / Proveedor' : 'Method / Provider'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Referencia' : 'Reference'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Fecha' : 'Date'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Estado' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">{isEs ? 'Acción' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donacionesFiltradas.map((donacion) => (
                  <tr key={donacion.id} className="hover:bg-slate-100 dark:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-brand-navy dark:text-white block">
                          {donacion.donor_name || (isEs ? 'Donante Anónimo' : 'Anonymous')}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {donacion.donor_email || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-brand-forest dark:text-[#DCEB4F]">
                      ${donacion.amount} {donacion.currency || 'USD'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A90D6]/20 text-[#4A90D6] border border-[#4A90D6]/30 uppercase">
                        {donacion.payment_method || donacion.payment_provider}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {donacion.payment_reference || donacion.transaction_id || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(donacion.created_at).toLocaleDateString(language === 'es' ? 'es-CR' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      {donacion.status === 'completed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isEs ? 'Completada' : 'Completed'}
                        </span>
                      )}
                      {donacion.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {isEs ? 'Pendiente' : 'Pending'}
                        </span>
                      )}
                      {donacion.status === 'failed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          {isEs ? 'Fallida' : 'Failed'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {donacion.status === 'pending' ? (
                        <button
                          onClick={() => cambiarEstado(donacion.id, 'completed')}
                          disabled={actualizandoId === donacion.id}
                          className="px-3 py-1.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-brand-navy dark:text-white rounded-lg text-xs font-bold transition-all shadow-glow-green"
                        >
                          {actualizandoId === donacion.id
                            ? isEs ? 'Verificando...' : 'Verifying...'
                            : isEs ? 'Validar SINPE' : 'Verify'}
                        </button>
                      ) : (
                        <button
                          onClick={() => cambiarEstado(donacion.id, donacion.status === 'completed' ? 'pending' : 'completed')}
                          disabled={actualizandoId === donacion.id}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white rounded-lg text-[11px] transition-all"
                        >
                          {isEs ? 'Cambiar Estado' : 'Toggle'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
