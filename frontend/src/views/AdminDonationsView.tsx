import { useEffect, useState, useMemo } from 'react';
import {
  Heart,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Search,
  Filter,
  Calendar,
  XCircle,
  X,
  CreditCard,
  Coins,
} from 'lucide-react';
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
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [filtroMetodo, setFiltroMetodo] = useState<'all' | 'sinpe' | 'zeffy' | 'paypal'>('all');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

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
          ? `Donación actualizada a ${nuevoEstado === 'completed' ? 'VALIDADA' : nuevoEstado === 'failed' ? 'NO VALIDADA' : 'EN REVISIÓN'}.`
          : `Donation status updated to ${nuevoEstado.toUpperCase()}.`
      );
    } catch (e: any) {
      setError(e.message || 'Error al actualizar el estado de la donación.');
    } finally {
      setActualizandoId(null);
    }
  }

  // Filtrado reactivo en frontend
  const donacionesFiltradas = useMemo(() => {
    return donaciones.filter((d) => {
      // Filtro de Estado
      if (filtroEstado !== 'all' && d.status !== filtroEstado) {
        return false;
      }

      // Filtro de Método
      if (filtroMetodo !== 'all') {
        const metodo = (d.payment_method || d.payment_provider || '').toLowerCase();
        if (!metodo.includes(filtroMetodo)) return false;
      }

      // Búsqueda por texto (comprobante, nombre, correo)
      if (busqueda.trim() !== '') {
        const q = busqueda.toLowerCase().trim();
        const nombre = (d.donor_name || '').toLowerCase();
        const correo = (d.donor_email || '').toLowerCase();
        const ref = (d.payment_reference || d.transaction_id || '').toLowerCase();
        if (!nombre.includes(q) && !correo.includes(q) && !ref.includes(q)) {
          return false;
        }
      }

      // Filtro por Fecha Desde
      if (fechaDesde) {
        const fechaD = new Date(d.created_at);
        const desde = new Date(fechaDesde);
        if (fechaD < desde) return false;
      }

      // Filtro por Fecha Hasta
      if (fechaHasta) {
        const fechaD = new Date(d.created_at);
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fechaD > hasta) return false;
      }

      // Filtro por Monto Mínimo
      if (montoMin !== '' && !isNaN(Number(montoMin))) {
        if (d.amount < Number(montoMin)) return false;
      }

      // Filtro por Monto Máximo
      if (montoMax !== '' && !isNaN(Number(montoMax))) {
        if (d.amount > Number(montoMax)) return false;
      }

      return true;
    });
  }, [donaciones, filtroEstado, filtroMetodo, busqueda, fechaDesde, fechaHasta, montoMin, montoMax]);

  const limpiarFiltros = () => {
    setFiltroEstado('all');
    setFiltroMetodo('all');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
    setMontoMin('');
    setMontoMax('');
  };

  // KPIs
  const donacionesCompletadas = donaciones.filter((d) => d.status === 'completed');
  const totalCRC = donacionesCompletadas
    .filter((d) => d.currency === 'CRC')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalUSD = donacionesCompletadas
    .filter((d) => d.currency !== 'CRC')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const donacionesPendientes = donaciones.filter((d) => d.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fadeIn">
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
        <div className="bg-[#002244] border border-[#1e4066] p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">
              {isEs ? 'Recaudado (Validadas)' : 'Total Raised (Validated)'}
            </span>
            <div className="space-y-0.5">
              <span className="text-lg font-bold font-mono text-[#DCEB4F] block">
                ₡{totalCRC.toLocaleString()} CRC
              </span>
              <span className="text-sm font-bold font-mono text-[#77C65E] block">
                ${totalUSD.toLocaleString()} USD
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#002244] border border-[#1e4066] p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">
              {isEs ? 'En Revisión (Por Validar)' : 'Pending Review'}
            </span>
            <span className="text-xl font-bold font-mono text-white">
              {donacionesPendientes} {isEs ? 'aportes' : 'records'}
            </span>
          </div>
        </div>

        <div className="bg-[#002244] border border-[#1e4066] p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-[#4A90D6]/20 text-[#4A90D6] border border-[#4A90D6]/40 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block">
              {isEs ? 'Total de Donaciones' : 'Total Donations'}
            </span>
            <span className="text-xl font-bold font-mono text-white">
              {donaciones.length}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[#002244] border border-[#1e4066] p-4 rounded-2xl space-y-4 shadow-card-dark">
        {/* Fila Principal: Búsqueda, Filtro Estado y Actualizar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          {/* Búsqueda por comprobante, nombre o correo */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={isEs ? 'Buscar por comprobante, nombre o correo...' : 'Search by receipt, name, or email...'}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#77C65E]"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botones de Estado */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => setFiltroEstado('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroEstado === 'all'
                  ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              {isEs ? 'Todas' : 'All'} ({donaciones.length})
            </button>
            <button
              onClick={() => setFiltroEstado('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroEstado === 'pending'
                  ? 'bg-amber-400 text-[#002244] font-extrabold'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              {isEs ? 'En Revisión' : 'Pending'} ({donacionesPendientes})
            </button>
            <button
              onClick={() => setFiltroEstado('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroEstado === 'completed'
                  ? 'bg-[#77C65E] text-[#002244] font-extrabold'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              {isEs ? 'Validadas' : 'Validated'}
            </button>
            <button
              onClick={() => setFiltroEstado('failed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroEstado === 'failed'
                  ? 'bg-red-400 text-white font-extrabold'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              {isEs ? 'No Validadas' : 'Not Validated'}
            </button>
          </div>

          {/* Toggle Filtros Avanzados y Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                mostrarFiltrosAvanzados || filtroMetodo !== 'all' || fechaDesde || fechaHasta || montoMin || montoMax
                  ? 'bg-brand-blue/20 border-brand-blue text-brand-blue'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isEs ? 'Filtros' : 'Filters'}</span>
            </button>

            <button
              onClick={cargarDonaciones}
              disabled={cargando}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold transition-all border border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              <span>{isEs ? 'Actualizar' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Fila Secundaria: Filtros Avanzados (Método, Fechas, Monto) */}
        {mostrarFiltrosAvanzados && (
          <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-fadeIn">
            {/* Método */}
            <div>
              <label className="block text-slate-400 mb-1">{isEs ? 'Método de Pago' : 'Payment Method'}</label>
              <select
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-[#00162e] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#77C65E]"
              >
                <option value="all">{isEs ? 'Todos los métodos' : 'All methods'}</option>
                <option value="sinpe">SINPE Móvil</option>
                <option value="zeffy">Zeffy</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-slate-400 mb-1">{isEs ? 'Fecha Desde' : 'Date From'}</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#00162e] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#77C65E]"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-slate-400 mb-1">{isEs ? 'Fecha Hasta' : 'Date To'}</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#00162e] border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#77C65E]"
              />
            </div>

            {/* Rango de Monto */}
            <div>
              <label className="block text-slate-400 mb-1">{isEs ? 'Rango de Monto (Mín - Máx)' : 'Amount Range'}</label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  placeholder="Mín"
                  value={montoMin}
                  onChange={(e) => setMontoMin(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-[#00162e] border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={montoMax}
                  onChange={(e) => setMontoMax(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-[#00162e] border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Botón para limpiar filtros */}
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-1">
              <button
                onClick={limpiarFiltros}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                {isEs ? 'Limpiar todos los filtros' : 'Clear all filters'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Donaciones */}
      <div className="bg-[#002244] border border-[#1e4066] rounded-2xl overflow-hidden shadow-card-dark">
        {cargando ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isEs ? 'Cargando registros de donaciones...' : 'Loading donations...'}
          </div>
        ) : donacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isEs ? 'No se encontraron donaciones con los filtros seleccionados.' : 'No donations found with selected filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#00162e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">{isEs ? 'Donante' : 'Donor'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Monto' : 'Amount'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Método' : 'Method'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Comprobante / Ref' : 'Receipt / Ref'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Fecha' : 'Date'}</th>
                  <th className="px-5 py-3.5">{isEs ? 'Estado' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">{isEs ? 'Validación / Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donacionesFiltradas.map((donacion) => (
                  <tr key={donacion.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">
                          {donacion.donor_name || (isEs ? 'Donante Anónimo' : 'Anonymous')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {donacion.donor_email || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#DCEB4F]">
                      {donacion.currency === 'CRC' ? '₡' : '$'}
                      {Number(donacion.amount).toLocaleString()} {donacion.currency || 'CRC'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4A90D6]/20 text-[#4A90D6] border border-[#4A90D6]/30 uppercase">
                        {donacion.payment_method || donacion.payment_provider}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-white font-semibold">
                      {donacion.payment_reference || donacion.transaction_id || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {isEs ? 'Validada' : 'Validated'}
                        </span>
                      )}
                      {donacion.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {isEs ? 'En Revisión' : 'Pending'}
                        </span>
                      )}
                      {donacion.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          <XCircle className="w-3 h-3 mr-1" />
                          {isEs ? 'No Validada' : 'Not Validated'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {donacion.status === 'pending' ? (
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => cambiarEstado(donacion.id, 'completed')}
                            disabled={actualizandoId === donacion.id}
                            className="px-2.5 py-1 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white rounded-lg text-xs font-bold transition-all shadow-glow-green"
                          >
                            {actualizandoId === donacion.id ? '...' : isEs ? 'Validar' : 'Validate'}
                          </button>
                          <button
                            onClick={() => cambiarEstado(donacion.id, 'failed')}
                            disabled={actualizandoId === donacion.id}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-all"
                          >
                            {isEs ? 'Rechazar' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => cambiarEstado(donacion.id, 'pending')}
                          disabled={actualizandoId === donacion.id}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-[11px] transition-all"
                        >
                          {isEs ? 'Reabrir Revisión' : 'Reopen'}
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
