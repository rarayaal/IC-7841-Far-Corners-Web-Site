import React, { useState } from 'react';
import { Language, Show, AuditLogItem } from '../types';
import { showsData, auditLogsMock } from '../data/mockData';
import {
  Shield, Ticket, Users, Heart, Plus, Edit2, Trash2,
  LayoutDashboard, FolderKanban, GraduationCap, HandHeart, Building2,
  ClipboardList, FileText, PenLine, Image, Archive, Phone, MessageSquare,
  Mail, ScrollText, Tent,
} from 'lucide-react';
import { AdminMessagesView } from './AdminMessagesView';
import { AdminContactChannelsView } from './AdminContactChannelsView';
import { AdminCommunitiesView } from './AdminCommunitiesView';
import { AdminStudentsView } from './AdminStudentsView';
import { AdminCampsView } from './AdminCampsView';
import { AdminVolunteersView } from './AdminVolunteersView';
import { AdminInstitutionalView } from './AdminInstitutionalView';
import { AdminMediaView } from './AdminMediaView';
import { AdminRetirementView, canRetireSomething } from './AdminRetirementView';
import { AdminUsersManagementView } from './AdminUsersManagementView';
import { AdminAuditView } from './AdminAuditView';
import { AdminProjectsView } from './AdminProjectsView';
import { AdminDonationsView } from './AdminDonationsView';
import { AdminTicketingView } from './AdminTicketingView';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { tienePermiso } from '../services/permisos';
import { AdminNewsletterView } from './AdminNewsletterView';
import { AdminFormsView } from './AdminFormsView';
import { AdminApplicantsView } from './AdminApplicantsView';

type AdminTab =
  | 'kpi' | 'donations' | 'projects' | 'ticketing' | 'content' | 'media'
  | 'retirement' | 'applicants' | 'audit' | 'messages' | 'contacts'
  | 'communities' | 'students' | 'volunteers' | 'camps' | 'users' | 'newsletter' | 'forms';

interface AdminViewProps {
  language: Language;
}

export const AdminView: React.FC<AdminViewProps> = ({ language }) => {
  const txt = adminTexts[language];
  const [activeTab, setActiveTab] = useState<AdminTab>('kpi');
  
  // Dynamic state for CRUD demo
  const [shows, setShows] = useState<Show[]>(showsData);
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

  const puedeGestionarContenido = tienePermiso('content:manage');
  const puedeGestionarMedia = tienePermiso('media:manage');
  const puedeRetirarContenido = canRetireSomething();
  const puedeVerMensajes = tienePermiso('contact_messages:read');
  const puedeVerBoletin = tienePermiso('newsletter:read');
  const puedeGestionarContactos = tienePermiso(
    'contact_channels:manage'
  );
  const puedeGestionarUsuarios = tienePermiso('users:manage');
  const puedeVerAuditoria = tienePermiso('audit:read');

  const sidebarGroups: {
    label: string;
    items: { key: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; visible?: boolean }[];
  }[] = [
    {
      label: txt.sidebar.general,
      items: [
        { key: 'kpi', label: txt.tabs.kpi, icon: LayoutDashboard },
        { key: 'ticketing', label: txt.tabs.ticketing, icon: Ticket },
        { key: 'donations', label: txt.tabs.donations, icon: Heart },
        { key: 'projects', label: txt.tabs.projects, icon: FolderKanban },
      ],
    },
    {
      label: txt.sidebar.people,
      items: [
        { key: 'users', label: txt.tabs.users, icon: Users, visible: puedeGestionarUsuarios },
        { key: 'students', label: txt.tabs.students, icon: GraduationCap },
        { key: 'volunteers', label: txt.tabs.volunteers, icon: HandHeart },
        { key: 'camps', label: txt.tabs.camps, icon: Tent },
        { key: 'communities', label: txt.tabs.communities, icon: Building2 },
        { key: 'applicants', label: txt.tabs.applicants, icon: ClipboardList },
        { key: 'forms', label: txt.tabs.forms, icon: FileText },
      ],
    },
    {
      label: txt.sidebar.content,
      items: [
        { key: 'content', label: txt.tabs.content, icon: PenLine, visible: puedeGestionarContenido },
        { key: 'media', label: txt.tabs.media, icon: Image, visible: puedeGestionarMedia },
        { key: 'retirement', label: txt.tabs.retirement, icon: Archive, visible: puedeRetirarContenido },
        { key: 'contacts', label: txt.tabs.contacts, icon: Phone, visible: puedeGestionarContactos },
      ],
    },
    {
      label: txt.sidebar.records,
      items: [
        { key: 'messages', label: txt.tabs.messages, icon: MessageSquare, visible: puedeVerMensajes },
        { key: 'newsletter', label: txt.tabs.newsletter, icon: Mail, visible: puedeVerBoletin },
        { key: 'audit', label: txt.tabs.audit, icon: ScrollText, visible: puedeVerAuditoria },
      ],
    },
  ];

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

      {/* Sidebar + contenido */}
      <div className="flex flex-col lg:flex-row gap-6 mt-8 items-start">
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="lg:sticky lg:top-24 space-y-6">
            {sidebarGroups.map((group) => {
              const items = group.items.filter((i) => i.visible !== false);
              if (items.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono font-bold mb-2 px-1">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveTab(item.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-brand-green text-brand-navy shadow-glow-green font-extrabold'
                              : 'bg-brand-navy text-slate-300 hover:text-white hover:bg-brand-navyCard'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 w-full space-y-8">
      {/* Renderizado de vistas */}
      {activeTab === 'donations' && <AdminDonationsView language={language} />}
      {activeTab === 'projects' && <AdminProjectsView language={language} />}
      {activeTab === 'newsletter' && puedeVerBoletin && (
        <AdminNewsletterView language={language} />
      )}
      {activeTab === 'contacts' && puedeGestionarContactos && (
        <AdminContactChannelsView language={language} />
      )}

      {activeTab === 'messages' && puedeVerMensajes && (
        <AdminMessagesView language={language} />
      )}
      {activeTab === 'communities' && <AdminCommunitiesView language={language} />}
      {activeTab === 'students' && <AdminStudentsView language={language} />}
      {activeTab === 'volunteers' && <AdminVolunteersView language={language} />}
      {activeTab === 'camps' && <AdminCampsView language={language} />}
      {activeTab === 'forms' && <AdminFormsView language={language} />}
      {activeTab === 'kpi' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>{txt.kpi.donationsTitle}</span>
                <Heart className="w-4 h-4 text-brand-green fill-current" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-brand-lime block">$4,250 USD</span>
              <span className="text-[11px] text-brand-green block">{txt.kpi.donationsGrowth}</span>
            </div>

            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>{txt.kpi.ticketsTitle}</span>
                <Ticket className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-white block">182</span>
              <span className="text-[11px] text-slate-300 block">{txt.kpi.ticketsTotal}</span>
            </div>

            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>{txt.kpi.applicantsTitle}</span>
                <Users className="w-4 h-4 text-brand-blue" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-white block">14</span>
              <span className="text-[11px] text-slate-300 block">{txt.kpi.applicantsSub}</span>
            </div>

            <div className="bg-brand-navy p-5 rounded-2xl border border-brand-border space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>{txt.kpi.concurrencyTitle}</span>
                <Shield className="w-4 h-4 text-brand-green" />
              </div>
              <span className="font-mono text-3xl font-extrabold text-brand-green block">28</span>
              <span className="text-[11px] text-slate-300 block">{txt.kpi.concurrencySub}</span>
            </div>
          </div>

          {/* Graphical Analytics Bar Chart */}
          <div className="bg-brand-navy p-6 rounded-3xl border border-brand-border space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-white">{txt.kpi.salesChartTitle}</h3>
                <p className="text-xs text-slate-300">{txt.kpi.salesChartSub}</p>
              </div>
              <span className="text-xs text-brand-lime font-mono">{txt.kpi.updatedRealtime}</span>
            </div>

            {/* SVG Custom Bar Chart */}
            <div className="pt-4 space-y-4">
              {[
                { name: 'The Addams Family (2026)', count: 95, max: 250, color: 'from-brand-green to-brand-forest' },
                { name: 'MAMMA MIA! (2024)', count: 182, max: 250, color: 'from-brand-blue to-brand-navy' },
                { name: 'Jesus Christ Superstar (2019)', count: 240, max: 250, color: 'from-brand-lime to-brand-green' },
              ].map((bar, i) => {
                const percentage = Math.round((bar.count / bar.max) * 100);
                return (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-200 font-semibold">
                      <span>{bar.name}</span>
                      <span className="font-mono font-bold text-brand-lime">
                        {txt.kpi.ticketsSold
                          .replace('{count}', String(bar.count))
                          .replace('{percentage}', String(percentage))}
                      </span>
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
              <h3 className="font-serif text-xl font-bold text-white">{txt.ticketing.title}</h3>
              <p className="text-xs text-slate-300">{txt.ticketing.subtitle}</p>
            </div>
            <button
              onClick={() => setShowFormOpen(!showFormOpen)}
              className="px-4 py-2 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>{showFormOpen ? txt.ticketing.cancel : txt.ticketing.addShow}</span>
            </button>
          </div>

          {/* New Show Form */}
          {showFormOpen && (
            <form onSubmit={handleCreateShow} className="bg-brand-navyDark p-5 rounded-2xl border border-brand-green/40 space-y-4 text-xs">
              <h4 className="font-serif text-sm font-bold text-brand-lime">{txt.ticketing.newShowTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">{txt.ticketing.form.titleLabel}</label>
                  <input
                    type="text"
                    required
                    value={newShowTitle}
                    onChange={(e) => setNewShowTitle(e.target.value)}
                    placeholder={txt.ticketing.form.titlePlaceholder}
                    className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">{txt.ticketing.form.yearLabel}</label>
                  <input
                    type="number"
                    required
                    value={newShowYear}
                    onChange={(e) => setNewShowYear(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">{txt.ticketing.form.capacityLabel}</label>
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
                {txt.ticketing.form.saveShow}
              </button>
            </form>
          )}

          {/* Shows Inventory Table */}
          <div className="bg-brand-navy border border-brand-border rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-brand-navyDark text-slate-300 font-mono text-[11px] uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">{txt.ticketing.table.show}</th>
                  <th className="p-4">{txt.ticketing.table.year}</th>
                  <th className="p-4">{txt.ticketing.table.price}</th>
                  <th className="p-4">{txt.ticketing.table.available}</th>
                  <th className="p-4">{txt.ticketing.table.status}</th>
                  <th className="p-4 text-right">{txt.ticketing.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {shows.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white">{s.title}</td>
                    <td className="p-4 font-mono text-brand-lime">{s.year}</td>
                    <td className="p-4 font-mono">₡{s.priceGeneral.toLocaleString()}</td>
                    <td className="p-4 font-mono font-bold text-brand-green">
                      {txt.ticketing.ticketsCount.replace('{count}', String(s.availableTickets))}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        s.status === 'current' ? 'bg-brand-green/20 text-brand-lime' : 'bg-brand-navyDark text-slate-400'
                      }`}>
                        {statusLabel(s.status, language)}
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

      {/* TAB: BANDEJA UNIFICADA DE POSTULACIONES */}
      {activeTab === 'applicants' && (
        <AdminApplicantsView language={language} />
      )}

           {/* TAB: AUDIT LOG */}
      {activeTab === 'audit' && (
        puedeVerAuditoria ? (
          <AdminAuditView language={language} />
        ) : (
          <div className="bg-[#00162e] border border-white/10 rounded-2xl p-8 text-center text-rose-400">
            {txt.audit.noPermissions}
          </div>
        )
      )}

      {/* TAB: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        puedeGestionarUsuarios ? (
          <AdminUsersManagementView language={language} />
        ) : (
          <div className="bg-[#00162e] border border-white/10 rounded-2xl p-8 text-center text-rose-400">
            {txt.usersManagement.noPermissions}
          </div>
        )
      )}

        </div>
      </div>
    </div>
  );
};
