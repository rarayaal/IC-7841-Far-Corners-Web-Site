import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket, Plus, Edit2, Save, X, RefreshCw, AlertTriangle, Loader2,
  DollarSign, Package, TrendingUp, Hash
} from 'lucide-react';
import { apiAdminJson } from '../services/apiAdmin';
import { showsData } from '../data/mockData';

// ── Types ──────────────────────────────────────────────────────────────────
interface InventoryItem {
  id: string;
  event_id: string;
  ticket_type: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  currency: string;
  created_at: string;
}

interface NewInventoryForm {
  ticket_type: string;
  price: string;
  quantity_available: string;
  currency: string;
}

interface EditForm {
  price: string;
  quantity_available: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export const AdminTicketingView: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>(showsData[0]?.id ?? '');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<NewInventoryForm>({
    ticket_type: '',
    price: '',
    quantity_available: '',
    currency: 'CRC',
  });
  const [createError, setCreateError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ price: '', quantity_available: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchInventory = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/tickets/events/${selectedEventId}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: InventoryItem[] = await res.json();
      setInventory(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar inventario.');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => { void fetchInventory(); }, [fetchInventory]);

  const totalDisponible = inventory.reduce((s, i) => s + i.quantity_available, 0);
  const totalVendidos = inventory.reduce((s, i) => s + i.quantity_sold, 0);
  const ingresoEstimado = inventory.reduce((s, i) => s + i.price * i.quantity_sold, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await apiAdminJson(`/api/v1/tickets/events/${selectedEventId}`, {
        method: 'POST',
        body: JSON.stringify({
          ticket_type: createForm.ticket_type,
          price: parseFloat(createForm.price),
          quantity_available: parseInt(createForm.quantity_available, 10),
          currency: createForm.currency,
        }),
      });
      setCreateForm({ ticket_type: '', price: '', quantity_available: '', currency: 'CRC' });
      setCreateOpen(false);
      await fetchInventory();
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear tipo de boleto.');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({ price: String(item.price), quantity_available: String(item.quantity_available) });
    setSaveError('');
  };

  const cancelEdit = () => { setEditingId(null); setSaveError(''); };

  const handleSave = async (id: string) => {
    setSaving(true);
    setSaveError('');
    try {
      await apiAdminJson(`/api/v1/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          price: parseFloat(editForm.price),
          quantity_available: parseInt(editForm.quantity_available, 10),
        }),
      });
      setEditingId(null);
      await fetchInventory();
    } catch (err: any) {
      setSaveError(err.message || 'Error al guardar cambios.');
    } finally {
      setSaving(false);
    }
  };

  const selectedShow = showsData.find(s => s.id === selectedEventId);

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center space-x-2">
            <Ticket className="w-5 h-5 text-[#77C65E]" />
            <span>Gestión de Inventario de Boletería</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Control de disponibilidad y precios por evento</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="px-4 py-2 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{createOpen ? 'Cancelar' : 'Agregar Tipo de Boleto'}</span>
          </button>
        </div>
      </div>

      {/* Event Selector */}
      <div className="bg-[#00162e] border border-[#1e4066] rounded-2xl p-4">
        <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
          Seleccionar Evento / Producción
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="fc-select w-full px-4 py-2.5 bg-[#002244] border border-[#1e4066] rounded-xl text-white text-sm focus:border-[#77C65E] focus:outline-none"
        >
          {showsData.map(s => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.year}) — {s.status}
            </option>
          ))}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: 'Disponibles', value: totalDisponible, color: '#77C65E' },
          { icon: Hash, label: 'Vendidos', value: totalVendidos, color: '#4A90D6' },
          { icon: DollarSign, label: 'Ingreso Est.', value: `\u20a1${ingresoEstimado.toLocaleString()}`, color: '#DCEB4F' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#00162e] border border-[#1e4066] rounded-2xl p-4 text-center">
            <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="font-mono font-bold text-white text-base">{value}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {createOpen && (
        <form onSubmit={handleCreate} className="bg-[#00162e] border border-[#77C65E]/40 rounded-2xl p-5 space-y-4">
          <h4 className="font-serif text-sm font-bold text-[#DCEB4F]">
            Nuevo Tipo de Boleto — {selectedShow?.title}
          </h4>
          {createError && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1">Tipo de Boleto *</label>
              <input
                required
                placeholder="Ej. Entrada General, VIP, Estudiante"
                value={createForm.ticket_type}
                onChange={e => setCreateForm(f => ({ ...f, ticket_type: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#002244] border border-[#1e4066] rounded-lg text-white focus:border-[#77C65E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Precio (\u20a1) *</label>
              <input
                required
                type="number"
                min="0"
                placeholder="10000"
                value={createForm.price}
                onChange={e => setCreateForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#002244] border border-[#1e4066] rounded-lg text-white font-mono focus:border-[#77C65E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Cantidad *</label>
              <input
                required
                type="number"
                min="1"
                placeholder="100"
                value={createForm.quantity_available}
                onChange={e => setCreateForm(f => ({ ...f, quantity_available: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#002244] border border-[#1e4066] rounded-lg text-white font-mono focus:border-[#77C65E] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <button type="button" onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10">
              Cancelar
            </button>
            <button type="submit" disabled={creating}
              className="px-5 py-2 bg-[#77C65E] hover:bg-[#008047] disabled:opacity-50 text-[#002244] font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Guardar Tipo de Boleto</span>
            </button>
          </div>
        </form>
      )}

      {/* Errors */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center space-x-3 text-red-300 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center space-x-2 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-[#002244] border border-[#1e4066] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#77C65E]" />
            <span className="text-sm">Cargando inventario...</span>
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay tipos de boleto registrados para este evento.</p>
            <p className="text-xs mt-1">Usa el botón "Agregar Tipo de Boleto" para crear el inventario.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#00162e] text-slate-400 font-mono text-[11px] uppercase border-b border-white/10">
              <tr>
                <th className="p-4">Tipo de Boleto</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Disponibles</th>
                <th className="p-4">Vendidos</th>
                <th className="p-4">Moneda</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  {editingId === item.id ? (
                    <>
                      <td className="p-4 font-bold text-white">{item.ticket_type}</td>
                      <td className="p-3">
                        <input type="number" value={editForm.price}
                          onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                          className="w-28 px-2 py-1.5 bg-[#002244] border border-[#77C65E]/60 rounded-lg text-white font-mono text-xs focus:outline-none" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={editForm.quantity_available}
                          onChange={e => setEditForm(f => ({ ...f, quantity_available: e.target.value }))}
                          className="w-24 px-2 py-1.5 bg-[#002244] border border-[#77C65E]/60 rounded-lg text-white font-mono text-xs focus:outline-none" />
                      </td>
                      <td className="p-4 font-mono text-[#4A90D6]">{item.quantity_sold}</td>
                      <td className="p-4">{item.currency}</td>
                      <td className="p-4 text-right flex items-center justify-end space-x-2">
                        <button onClick={() => handleSave(item.id)} disabled={saving}
                          className="p-1.5 rounded bg-[#77C65E]/20 hover:bg-[#77C65E]/40 text-[#77C65E] disabled:opacity-50" title="Guardar">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={cancelEdit}
                          className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-300" title="Cancelar">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-bold text-white">{item.ticket_type}</td>
                      <td className="p-4 font-mono text-[#DCEB4F]">\u20a1{item.price.toLocaleString()}</td>
                      <td className="p-4 font-mono font-bold text-[#77C65E]">{item.quantity_available}</td>
                      <td className="p-4 font-mono text-[#4A90D6]">{item.quantity_sold}</td>
                      <td className="p-4 text-slate-400">{item.currency}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => startEdit(item)}
                          className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-200" title="Editar precio o disponibilidad">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Concurrency note */}
      <div className="bg-[#001a35] border border-[#1e4066] rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-400">
        <TrendingUp className="w-5 h-5 text-[#77C65E] flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-300 mb-0.5">Control de Concurrencia Activo</p>
          <p>
            Las compras públicas usan transacciones PostgreSQL con{' '}
            <code className="font-mono text-[#DCEB4F] text-[11px]">SELECT … FOR UPDATE</code>,
            garantizando que 20–100 usuarios simultáneos no generen sobreventa de boletos.
          </p>
        </div>
      </div>
    </div>
  );
};
