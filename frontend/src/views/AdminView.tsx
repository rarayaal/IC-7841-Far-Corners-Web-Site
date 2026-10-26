import React, { useState } from 'react';
import { Language, Show, AuditLogItem, VolunteerApplication } from '../types';
import { showsData, auditLogsMock, volunteerAppsMock } from '../data/mockData';
import { Shield, Ticket, Users, Heart, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { AdminMessagesView } from './AdminMessagesView';
import { AdminContactChannelsView } from './AdminContactChannelsView';
import { AdminCommunitiesView } from './AdminCommunitiesView';
import { AdminStudentsView } from './AdminStudentsView';
import { AdminVolunteersView } from './AdminVolunteersView';
import { AdminProfileView } from './AdminProfileView';
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
  const [activeTab, setActiveTab] = useState<'kpi' | 'donations' | 'projects' | 'ticketing' | 'content' | 'applicants' | 'audit' | 'messages' | 'contacts' | 'communities' | 'students' | 'volunteers' | 'profile'>('kpi');
  
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

  // Edit history content state
  const [historyText, setHistoryText] = useState('Far Corners es un teatro comunitario que cree en el poder del arte para transformar, inspirar y unir personas. Creamos experiencias escénicas que fortalecen la comunidad, celebran la diversidad y abren espacios de expresión para todos.');
  const [historySaved, setHistorySaved] = useState(false);

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

  const handleSaveHistory = (e: React.FormEvent) => {
    e.preventDefault();
    setHistorySaved(true);
    setTimeout(() => setHistorySaved(false), 3000);

    const newLog: AuditLogItem = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user: 'Administrador General',
      action: 'UPDATE',
      module: 'Contenido Institucional',
      details: 'Actualizada reseña histórica de la organización',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setLogs([newLog, ...logs]);
  };
  const puedeVerMensajes = tienePermiso('contact_messages:read');
  const puedeGestionarContactos = tienePermiso(
    'contact_channels:manage'
  );
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Admin Panel Header */}
      <div className="bg-[#002244] border border-[#77C65E]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-green">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-[#77C65E] text-[#002244] border border-[#DCEB4F]">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-mono text-[#DCEB4F] font-bold uppercase tracking-wider block">
              Panel Administrativo Central • Far Corners
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Gestión y Control de Sistema
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#00162e] px-3.5 py-2 rounded-xl border border-[#1e4066] text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#77C65E] animate-pulse"></span>
          <span className="text-slate-200 font-mono">Alicia Salazar (Admin General)</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto pb-2 border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'kpi'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          Resumen & Métricas KPI
        </button>

        <button
          onClick={() => setActiveTab('ticketing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ticketing'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          Gestión de Boletería
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'content'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          Contenido Institucional
        </button>

        <button
          onClick={() => setActiveTab('applicants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'applicants'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          Postulaciones
        </button>

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

        {puedeVerMensajes && (
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
                : 'bg-[#002244] text-slate-300 hover:text-white'
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
                ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
                : 'bg-[#002244] text-slate-300 hover:text-white'
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
          {language === 'es' ? 'Donaciones (CU-14)' : 'Donations'}
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          {language === 'es' ? 'Proyectos (CU-04)' : 'Projects'}
        </button>


        <button
          onClick={() => setActiveTab('communities')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'communities'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.communities}
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.students}
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'volunteers'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
          }`}
        >
          {txt.tabs.volunteers}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-extrabold'
              : 'bg-[#002244] text-slate-300 hover:text-white'
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
            <div className="bg-[#002244] p-5 rounded-2xl border border-[#1e4066] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Recaudación Donaciones</span>
                <Heart className="w-4 h-4 text-[#77C65E] fill-current" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#DCEB4F] block">$4,250 USD</span>
              <span className="text-[11px] text-[#77C65E] block">+15% este mes</span>
            </div>

            <div className="bg-[#002244] p-5 rounded-2xl border border-[#1e4066] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Boletos Vendidos 2026</span>
                <Ticket className="w-4 h-4 text-[#4A90D6]" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-white block">182</span>
              <span className="text-[11px] text-slate-300 block">De 250 boletos totales</span>
            </div>

            <div className="bg-[#002244] p-5 rounded-2xl border border-[#1e4066] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Postulantes Activos</span>
                <Users className="w-4 h-4 text-[#4A90D6]" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-white block">14</span>
              <span className="text-[11px] text-slate-300 block">Pasantías & Voluntarios</span>
            </div>

            <div className="bg-[#002244] p-5 rounded-2xl border border-[#1e4066] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Concurrencia Sistema</span>
                <Shield className="w-4 h-4 text-[#77C65E]" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-[#77C65E] block">28</span>
              <span className="text-[11px] text-slate-300 block">Usuarios simultáneos (Max 100)</span>
            </div>
          </div>

          {/* Graphical Analytics Bar Chart */}
          <div className="bg-[#002244] p-6 rounded-3xl border border-[#1e4066] space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">Venta de Entradas por Obra Teatral</h3>
                <p className="text-xs text-slate-300">Distribución de boletos vendidos en la plataforma</p>
              </div>
              <span className="text-xs text-[#DCEB4F] font-mono">Actualizado en tiempo real</span>
            </div>

            {/* SVG Custom Bar Chart */}
            <div className="pt-4 space-y-4">
              {[
                { name: 'Merlina (2026)', count: 95, max: 250, color: 'from-[#77C65E] to-[#008047]' },
                { name: 'MAMMA MIA! (2026)', count: 182, max: 250, color: 'from-[#4A90D6] to-[#002244]' },
                { name: 'Jesus Christ Superstar (2019)', count: 240, max: 250, color: 'from-[#DCEB4F] to-[#77C65E]' },
              ].map((bar, i) => {
                const percentage = Math.round((bar.count / bar.max) * 100);
                return (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span>{bar.name}</span>
                      <span className="font-mono font-bold text-[#DCEB4F]">{bar.count} boletos ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-[#00162e] h-4 rounded-full overflow-hidden border border-white/10 p-0.5">
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
        <AdminTicketingView />
      )}

      {/* TAB 3: INSTITUTIONAL CONTENT MANAGEMENT */}
      {activeTab === 'content' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#002244] p-6 rounded-3xl border border-[#1e4066] space-y-4">
            <h3 className="font-serif text-xl font-bold text-white">Editar Historia de la Organización</h3>
            <p className="text-xs text-slate-300">Permite modificar el texto de la reseña institucional del Teatro Far Corners.</p>

            <form onSubmit={handleSaveHistory} className="space-y-4">
              <textarea
                rows={6}
                value={historyText}
                onChange={(e) => setHistoryText(e.target.value)}
                className="w-full p-4 bg-[#00162e] border border-[#1e4066] rounded-xl text-xs text-white focus:border-[#77C65E] focus:outline-none"
              ></textarea>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green uppercase tracking-wider"
                >
                  Publicar Cambios Institucionales
                </button>
                {historySaved && (
                  <span className="text-xs text-[#77C65E] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Cambios guardados y publicados!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: APPLICANTS MANAGER */}
      {activeTab === 'applicants' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Gestión de Postulantes a Pasantías</h3>
              <p className="text-xs text-slate-300">Revisar solicitudes de estudiantes internacionales y voluntarios</p>
            </div>
            <span className="text-xs font-mono text-[#DCEB4F] font-bold">{apps.length} solicitudes activas</span>
          </div>

          <div className="bg-[#002244] border border-[#1e4066] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#00162e] text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
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
                    <td className="p-4 font-mono text-[#DCEB4F]">{app.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-white block">{app.name}</span>
                      <span className="text-[11px] text-slate-300">{app.email}</span>
                    </td>
                    <td className="p-4">{app.country}</td>
                    <td className="p-4 font-semibold text-slate-200">{app.role}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold ${
                        app.status === 'Aprobado' ? 'bg-[#77C65E]/20 text-[#77C65E]' :
                        app.status === 'Entrevista' ? 'bg-[#4A90D6]/20 text-[#4A90D6]' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'Entrevista')}
                        className="px-2.5 py-1 rounded bg-[#4A90D6]/20 text-[#4A90D6] text-[10px] font-bold hover:bg-[#4A90D6]/30"
                      >
                        Entrevista
                      </button>
                      <button
                        onClick={() => handleUpdateAppStatus(app.id, 'Aprobado')}
                        className="px-2.5 py-1 rounded bg-[#77C65E]/20 text-[#77C65E] text-[10px] font-bold hover:bg-[#77C65E]/30"
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

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Bitácora de Auditoría</h3>
              <p className="text-xs text-slate-300">Registro detallado de acciones administrativas y mutaciones de datos</p>
            </div>
            <span className="text-xs text-[#77C65E] font-mono flex items-center gap-1 font-bold">
              <Shield className="w-3.5 h-3.5" />
              Auditoría Registrada
            </span>
          </div>

          <div className="bg-[#002244] border border-[#1e4066] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#00162e] text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Log ID</th>
                  <th className="p-4">Usuario</th>
                  <th className="p-4">Acción</th>
                  <th className="p-4">Módulo</th>
                  <th className="p-4">Detalle de Operación</th>
                  <th className="p-4">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-[#DCEB4F] font-bold">{log.id}</td>
                    <td className="p-4 text-white font-sans font-semibold">{log.user}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        log.action === 'CREATE' || log.action === 'INSERT' ? 'bg-[#77C65E]/20 text-[#77C65E]' :
                        log.action === 'UPDATE' ? 'bg-[#4A90D6]/20 text-[#4A90D6]' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-200 font-sans">{log.module}</td>
                    <td className="p-4 text-slate-300 font-sans">{log.details}</td>
                    <td className="p-4 text-slate-400">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
