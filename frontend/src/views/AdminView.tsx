import React, { useState } from 'react';
import { Language, Show, AuditLogItem, VolunteerApplication } from '../types';
import { showsData, auditLogsMock, volunteerAppsMock } from '../data/mockData';
import { Shield, Ticket, Users, Heart, Plus, Edit2, Trash2 } from 'lucide-react';
import { AdminMessagesView } from './AdminMessagesView';
import { AdminContactChannelsView } from './AdminContactChannelsView';
import { AdminCommunitiesView } from './AdminCommunitiesView';
import { AdminStudentsView } from './AdminStudentsView';
import { AdminVolunteersView } from './AdminVolunteersView';
import { AdminProfileView } from './AdminProfileView';
import { AdminInstitutionalView } from './AdminInstitutionalView';
import { AdminMediaView } from './AdminMediaView';
import { AdminRetirementView, canRetireSomething } from './AdminRetirementView';
import { AdminUsersManagementView } from './AdminUsersManagementView';
import { AdminAuditView } from './AdminAuditView';
import { AdminProjectsView } from './AdminProjectsView';
import { AdminDonationsView } from './AdminDonationsView';
import { AdminTicketingView } from './AdminTicketingView';
import { adminTexts } from '../lib/adminI18n';
import { tienePermiso } from '../services/permisos';

interface AdminViewProps {
  language: Language;
}

export const AdminView: React.FC<AdminViewProps> = ({ language }) => {
  const txt = adminTexts[language];
  const [activeTab, setActiveTab] = useState<'kpi' | 'donations' | 'projects' | 'ticketing' | 'content' | 'media' | 'retirement' | 'applicants' | 'audit' | 'messages' | 'contacts' | 'communities' | 'students' | 'volunteers' | 'profile' | 'users'>('kpi');
  
  // Dynamic state for CRUD demo
  const [shows, setShows] = useState<Show[]>(showsData);
  const [apps, setApps] = useState<VolunteerApplication[]>(volunteerAppsMock);
  const [logs, setLogs] = useState<AuditLogItem[]>(auditLogsMock);

  // New Show state form
  const [showFormOpen, setShowFormOpen] = useState(false);
  const [newShowTitle, setNewShowTitle] = useState('');
  const [newShowYear, setNewShowYear] = useState('2026');
  const [newShowGeneral, setNewShowGeneral] = useState('10000');
  const [newShowCapacity, setNewShowCapacity] = useState('100');

  const handleCreateShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShowTitle) return;

    const newShow: Show = {
      id: `show-${Date.now()}`,
      title: newShowTitle,
      year: parseInt(newShowYear) || 2026,
      status: 'upcoming',
      poster: '/recursos/IMG_2905.PNG',
      banner: '/recursos/IMG_2903.PNG',
      dates: 'Agosto 2026',
      location: 'Teatro Comunitario Monteverde',
      priceGeneral: parseInt(newShowGeneral) || 10000,
      priceVIP: 10000,
      priceStudent: 10000,
      availableTickets: parseInt(newShowCapacity) || 100,
      director: 'Equipo Far Corners',
      synopsis: 'Nueva producción teatral anunciada para la temporada 2026.',
      synopsisEn: 'New production announced for 2026.',
      cast: []
    };

    setShows([newShow, ...shows]);
    
    // Add to audit log
    const newLog: AuditLogItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user: 'Administrador General',
      action: 'CREATE',
      module: 'Boletería',
      details: `Creado nuevo evento: ${newShowTitle} (${newShowYear})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([newLog, ...logs]);

    setNewShowTitle('');
    setShowFormOpen(false);
  };

  const handleUpdateAppStatus = (id: string, status: VolunteerApplication['status']) => {
    setApps(apps.map(a => a.id === id ? { ...a, status } : a));
    
    const newLog: AuditLogItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user: 'Administrador General',
      action: 'UPDATE',
      module: 'Personas y Comunidad',
      details: `Actualizado estado de postulación ${id} a "${status}"`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([newLog, ...logs]);
  };

  const puedeGestionarContenido = tienePermiso('content:manage');
  const puedeGestionarMedia = tienePermiso('media:manage');
  const puedeRetirarContenido = canRetireSomething();
  const puedeVerMensajes = tienePermiso('contact_messages:read');
  const puedeGestionarContactos = tienePermiso(
    'contact_channels:manage'
  );
  const puedeGestionarUsuarios = tienePermiso('users:manage');
  const puedeVerAuditoria = tienePermiso('audit:read');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Admin Panel Header */}
      <div className="bg-brand-navy border border-brand-green/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-green">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-brand-green text-brand-navy border border-brand-lime">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-mono text-brand-lime font-bold uppercase tracking-wider block">
              Panel Administrativo Central • Far Corners
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Gestión y Control de Sistema
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#00162e] px-3.5 py-2 rounded-xl border border-[#1e4066] text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#77C65E] animate-pulse"></span>
          <span className="text-slate-200 font-mono">
            {(() => {
              try {
                const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
                return u?.full_name ? `${u.full_name} (${u.role === 'admin' ? 'Admin General' : 'Admin de Área'})` : 'Administrador';
              } catch {
                return 'Administrador';
              }
            })()}
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto pb-2 border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'kpi'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          Resumen & Métricas KPI
        </button>

        <button
          onClick={() => setActiveTab('ticketing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ticketing'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          Gestión de Boletería
        </button>

        {puedeGestionarContenido && (
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'bg-brand-navy text-slate-300 hover:text-white'
            }`}
          >
            {txt.tabs.content}
          </button>
        )}

        {puedeGestionarMedia && (
          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'media'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'bg-brand-navy text-slate-300 hover:text-white'
            }`}
          >
            {txt.tabs.media}
          </button>
        )}

        {puedeRetirarContenido && (
          <button
            onClick={() => setActiveTab('retirement')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'retirement'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'bg-brand-navy text-slate-300 hover:text-white'
            }`}
          >
            {txt.tabs.retirement}
          </button>
        )}

        <button
          onClick={() => setActiveTab('applicants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'applicants'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          Postulaciones
        </button>

        {puedeGestionarUsuarios && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
                : 'bg-[#002244] text-slate-300 hover:text-white'
            }`}
          >
            Usuarios Administrativos
          </button>
        )}

        {puedeVerAuditoria && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
                : 'bg-[#002244] text-slate-300 hover:text-white'
            }`}
          >
            Bitácora de Cambios
          </button>
        )}

        {puedeVerMensajes && (
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'bg-brand-navy text-slate-300 hover:text-white'
            }`}
          >
            Mensajes
          </button>
        )}

        {puedeGestionarContactos && (
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'contacts'
                ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                : 'bg-brand-navy text-slate-300 hover:text-white'
            }`}
          >
            Medios de contacto
          </button>
        )}

        <button
          onClick={() => setActiveTab('donations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'donations'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          {language === 'es' ? 'Donaciones' : 'Donations'}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          {language === 'es' ? 'Proyectos' : 'Projects'}
        </button>


        <button
          onClick={() => setActiveTab('communities')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'communities'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.communities}
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.students}
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'volunteers'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.volunteers}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
              : 'bg-brand-navy text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.profile}
        </button>
      </div>

      {/* Renderizado de vistas */}
      {activeTab === 'donations' && <AdminDonationsView language={language} />}
      {activeTab === 'projects' && <AdminProjectsView language={language} />}
      {activeTab === 'contacts' && puedeGestionarContactos && (
        <AdminContactChannelsView />
      )}

      {activeTab === 'messages' && puedeVerMensajes && (
        <AdminMessagesView />
      )}
      {activeTab === 'communities' && <AdminCommunitiesView language={language} />}
      {activeTab === 'students' && <AdminStudentsView language={language} />}
      {activeTab === 'volunteers' && <AdminVolunteersView language={language} />}
      {activeTab === 'profile' && <AdminProfileView language={language} />}
      {activeTab === 'kpi' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Recaudación Donaciones</span>
                <Heart className="w-4 h-4 text-brand-green fill-current" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-brand-lime block">$4,250 USD</span>
              <span className="text-[11px] text-brand-green block">+15% este mes</span>
            </div>

            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Boletos Vendidos 2026</span>
                <Ticket className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-white block">182</span>
              <span className="text-[11px] text-slate-300 block">De 250 boletos totales</span>
            </div>

            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Postulantes Activos</span>
                <Users className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-white block">14</span>
              <span className="text-[11px] text-slate-300 block">Pasantías & Voluntarios</span>
            </div>

            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Concurrencia Sistema</span>
                <Shield className="w-4 h-4 text-brand-green" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-brand-green block">28</span>
              <span className="text-[11px] text-slate-300 block">Usuarios simultáneos (Max 100)</span>
            </div>
          </div>

          {/* Graphical Analytics Bar Chart */}
          <div className="bg-brand-navy p-6 rounded-3xl border border-brand-border space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Venta de Entradas por Obra Teatral</h3>
                <p className="text-xs text-slate-300">Distribución de boletos vendidos en la plataforma</p>
              </div>
              <span className="text-xs text-brand-lime font-mono">Actualizado en tiempo real</span>
            </div>

            {/* SVG Custom Bar Chart */}
            <div className="pt-4 space-y-4">
              {[
                { name: 'Merlina (2026)', count: 95, max: 250, color: 'from-brand-green to-brand-forest' },
                { name: 'MAMMA MIA! (2026)', count: 182, max: 250, color: 'from-brand-blue to-brand-navy' },
                { name: 'Jesus Christ Superstar (2019)', count: 240, max: 250, color: 'from-brand-lime to-brand-green' },
              ].map((bar, i) => {
                const percentage = Math.round((bar.count / bar.max) * 100);
                return (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span>{bar.name}</span>
                      <span className="font-mono font-bold text-brand-lime">{bar.count} boletos ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-brand-navyDark h-4 rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${bar.color} transition-all duration-1000`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TICKETING MANAGEMENT */}
      {activeTab === 'ticketing' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Inventario y Eventos de Boletería</h3>
              <p className="text-xs text-slate-300">Crear, editar disponibilidad y administrar valor de boletos</p>
            </div>
            <button
              onClick={() => setShowFormOpen(!showFormOpen)}
              className="px-4 py-2 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>{showFormOpen ? 'Cancelar' : 'Agregar Obra a Cartelera'}</span>
            </button>
          </div>

          {/* New Show Form */}
          {showFormOpen && (
            <form onSubmit={handleCreateShow} className="bg-brand-navyDark p-5 rounded-2xl border border-brand-green/40 space-y-4 text-xs">
              <h4 className="font-serif text-sm font-bold text-brand-lime">Registrar Nueva Producción Teatral</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Título de la Obra *</label>
                  <input
                    type="text"
                    required
                    value={newShowTitle}
                    onChange={(e) => setNewShowTitle(e.target.value)}
                    placeholder="Ej. El Fantasma de la Ópera"
                    className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Año de Temporada *</label>
                  <input
                    type="number"
                    required
                    value={newShowYear}
                    onChange={(e) => setNewShowYear(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Capacidad Total de Boletos *</label>
                  <input
                    type="number"
                    required
                    value={newShowCapacity}
                    onChange={(e) => setNewShowCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
                  />
                </div>
              </div>
              <button type="submit" className="px-5 py-2 bg-brand-green text-brand-navy font-extrabold rounded-lg">
                Guardar Obra en Sistema
              </button>
            </form>
          )}

          {/* Shows Inventory Table */}
          <div className="bg-brand-navy border border-brand-border rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-brand-navyDark text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Obra / Producción</th>
                  <th className="p-4">Año</th>
                  <th className="p-4">Tarifa General</th>
                  <th className="p-4">Boletos Libres</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {shows.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{s.title}</td>
                    <td className="p-4 font-mono text-brand-lime">{s.year}</td>
                    <td className="p-4 font-mono">₡{s.priceGeneral.toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-brand-green">{s.availableTickets} entradas</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        s.status === 'current' ? 'bg-brand-green/20 text-brand-lime' : 'bg-brand-navyDark text-slate-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-200">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INSTITUTIONAL CONTENT MANAGEMENT (CU-01, CU-02, CU-03) */}
      {activeTab === 'content' && puedeGestionarContenido && (
        <AdminInstitutionalView language={language} />
      )}

      {/* MULTIMEDIA GALLERY (CU-22) */}
      {activeTab === 'media' && puedeGestionarMedia && (
        <AdminMediaView language={language} />
      )}

      {/* WITHDRAW CONTENT (CU-24) */}
      {activeTab === 'retirement' && puedeRetirarContenido && (
        <AdminRetirementView language={language} />
      )}

      {/* TAB 4: APPLICANTS MANAGER */}
      {activeTab === 'applicants' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Gestión de Postulantes a Pasantías</h3>
              <p className="text-xs text-slate-300">Revisar solicitudes de estudiantes internacionales y voluntarios</p>
            </div>
            <span className="text-xs font-mono text-brand-lime font-bold">{apps.length} solicitudes activas</span>
          </div>

          <div className="bg-brand-navy border border-brand-border rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-brand-navyDark text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Postulante</th>
                  <th className="p-4">País</th>
                  <th className="p-4">Puesto Solicitado</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Actualizar Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-brand-lime">{app.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{app.name}</span>
                      <span className="text-[11px] text-slate-300">{app.email}</span>
                    </td>
                    <td className="p-4">{app.country}</td>
                    <td className="p-4 font-semibold text-slate-200">{app.role}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        app.status === 'Aprobado' ? 'bg-brand-green/20 text-brand-green' :
                        app.status === 'Entrevista' ? 'bg-brand-blue/20 text-brand-blue' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'Entrevista')}
                        className="px-2.5 py-1 rounded bg-brand-blue/20 text-brand-blue text-[10px] font-bold hover:bg-brand-blue/30"
                      >
                        Entrevista
                      </button>
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'Aprobado')}
                        className="px-2.5 py-1 rounded bg-brand-green/20 text-brand-green text-[10px] font-bold hover:bg-brand-green/30"
                      >
                        Aprobar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

           {/* TAB: AUDIT LOG */}
      {activeTab === 'audit' && (
        puedeVerAuditoria ? (
          <AdminAuditView />
        ) : (
          <div className="bg-[#00162e] border border-white/10 rounded-2xl p-8 text-center text-rose-400">
            No tienes permisos para ver la bitácora de auditoría. Inicia sesión como administrador general.
          </div>
        )
      )}

      {/* TAB: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        puedeGestionarUsuarios ? (
          <AdminUsersManagementView />
        ) : (
          <div className="bg-[#00162e] border border-white/10 rounded-2xl p-8 text-center text-rose-400">
            No tienes permisos para gestionar usuarios administrativos. Inicia sesión como administrador general.
          </div>
        )
      )}

    </div>
  );
};
