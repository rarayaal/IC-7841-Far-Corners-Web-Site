import React, { useState, useEffect, useCallback } from 'react';
import { Language, Show, AuditLogItem } from '../types';
import { apiAdminJson } from '../services/apiAdmin';
import { showsData, auditLogsMock } from '../data/mockData';
import {
  Shield, Ticket, Users, Heart, Plus, Edit2, Trash2,
  LayoutDashboard, FolderKanban, GraduationCap, HandHeart, Building2,
  ClipboardList, FileText, PenLine, Image, Archive, Phone, MessageSquare,
  Mail, ScrollText, Tent, Sparkles, RefreshCw, Loader2, Coins
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
import { AdminShowsManagementView } from './AdminShowsManagementView';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { tienePermiso } from '../services/permisos';
import { AdminNewsletterView } from './AdminNewsletterView';
import { AdminFormsView } from './AdminFormsView';
import { AdminApplicantsView } from './AdminApplicantsView';

type AdminTab =
  | 'kpi' | 'shows' | 'donations' | 'projects' | 'ticketing' | 'content' | 'media'
  | 'retirement' | 'applicants' | 'audit' | 'messages' | 'contacts'
  | 'communities' | 'students' | 'volunteers' | 'camps' | 'users' | 'newsletter' | 'forms';

interface DashboardMetrics {
  donations: {
    totalCRC: number;
    totalUSD: number;
    completedCount: number;
    pendingCount: number;
    totalCount: number;
  };
  tickets: {
    soldCount: number;
    pendingCount: number;
    activeCount: number;
    usedCount: number;
    totalCapacity: number;
    occupancyPercentage: number;
    totalRevenueCRC: number;
    totalRevenueUSD: number;
    paidPurchases: number;
    pendingPurchases: number;
  };
  applicants: {
    total: number;
  };
  users: {
    total: number;
  };
  auditLogs: {
    total: number;
  };
  salesByShow: {
    id: string;
    title: string;
    sold: number;
    pendingSold: number;
    capacity: number;
    percentage: number;
  }[];
}

interface AdminViewProps {
  language: Language;
}

export const AdminView: React.FC<AdminViewProps> = ({ language }) => {
  const txt = adminTexts[language];
  const isEs = language === 'es';
  const [activeTab, setActiveTab] = useState<AdminTab>('kpi');
  
  // Métricas reales del Dashboard desde la base de datos
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    setMetricsError('');
    try {
      const data = await apiAdminJson<DashboardMetrics>('/api/v1/dashboard/metrics');
      setMetrics(data);
    } catch (err: any) {
      console.warn('Error al cargar métricas reales del dashboard:', err);
      setMetricsError(err.message || 'Error al conectar con la base de datos.');
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'kpi') {
      void loadMetrics();
    }
  }, [activeTab, loadMetrics]);
  
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
        { key: 'shows', label: language === 'es' ? 'Proyectos' : 'Projects', icon: Sparkles },
        { key: 'ticketing', label: txt.tabs.ticketing, icon: Ticket },
        { key: 'donations', label: txt.tabs.donations, icon: Heart },
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
      <div className="bg-white dark:bg-brand-navy border border-brand-green/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-glow-green">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-brand-green text-brand-navy border border-brand-lime">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-mono text-brand-forest dark:text-brand-lime font-bold uppercase tracking-wider block">
              Panel Administrativo Central • Far Corners
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">
              Gestión y Control de Sistema
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#F8F8F2] dark:bg-[#00162e] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1e4066] text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#77C65E] animate-pulse"></span>
          <span className="text-slate-700 dark:text-slate-200 font-mono">
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
                  <p className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 dark:text-slate-500 font-mono font-bold mb-2 px-1">
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
                              : 'bg-white dark:bg-brand-navy text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white hover:bg-slate-50 dark:bg-brand-navyCard'
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
      {activeTab === 'shows' && <AdminShowsManagementView language={language} />}
      {activeTab === 'ticketing' && <AdminTicketingView />}
      {activeTab === 'donations' && <AdminDonationsView language={language} />}
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
          {/* Header del Panel General con botón de refresco */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-brand-navy p-4 rounded-2xl border border-slate-200 dark:border-brand-border">
            <div>
              <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-brand-green" />
                <span>{isEs ? 'Métricas Clave del Sistema (En Tiempo Real)' : 'Key System Metrics (Real-Time)'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEs ? 'Información consolidada directamente desde la base de datos de Far Corners.' : 'Consolidated information queried directly from Far Corners database.'}
              </p>
            </div>
            <button
              onClick={loadMetrics}
              disabled={loadingMetrics}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-brand-navy dark:text-white text-xs font-semibold transition-all border border-slate-200 dark:border-white/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin' : ''}`} />
              <span>{isEs ? 'Actualizar Datos' : 'Refresh Data'}</span>
            </button>
          </div>

          {metricsError && (
            <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-600 dark:text-red-300">
              {metricsError}
            </div>
          )}

          {/* Top KPI Cards con datos reales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Donaciones */}
            <div className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{txt.kpi.donationsTitle}</span>
                <Heart className="w-4 h-4 text-brand-green fill-current" />
              </div>
              {loadingMetrics && !metrics ? (
                <div className="py-2 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : metrics ? (
                <div>
                  {metrics.donations.totalUSD > 0 && metrics.donations.totalCRC > 0 ? (
                    <div className="space-y-0.5">
                      <span className="font-mono text-xl font-extrabold text-brand-forest dark:text-[#DCEB4F] block">
                        ₡{metrics.donations.totalCRC.toLocaleString()} CRC
                      </span>
                      <span className="font-mono text-sm font-bold text-brand-forest dark:text-[#77C65E] block">
                        ${metrics.donations.totalUSD.toLocaleString()} USD
                      </span>
                    </div>
                  ) : metrics.donations.totalUSD > 0 ? (
                    <span className="font-mono text-2xl font-extrabold text-brand-forest dark:text-brand-lime block">
                      ${metrics.donations.totalUSD.toLocaleString()} USD
                    </span>
                  ) : (
                    <span className="font-mono text-2xl font-extrabold text-brand-forest dark:text-brand-lime block">
                      ₡{metrics.donations.totalCRC.toLocaleString()} CRC
                    </span>
                  )}
                  <span className="text-[11px] text-brand-green block mt-1 font-medium">
                    {metrics.donations.completedCount} {isEs ? 'validadas' : 'validated'}
                    {metrics.donations.pendingCount > 0 ? ` (${metrics.donations.pendingCount} ${isEs ? 'pendientes' : 'pending'})` : ''}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-2xl font-bold text-slate-400">—</span>
              )}
            </div>

            {/* Boletos */}
            <div className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{txt.kpi.ticketsTitle}</span>
                <Ticket className="w-4 h-4 text-brand-blue" />
              </div>
              {loadingMetrics && !metrics ? (
                <div className="py-2 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : metrics ? (
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="font-mono text-3xl font-extrabold text-brand-navy dark:text-white block">
                      {metrics.tickets.soldCount}
                    </span>
                    <span className="text-xs font-mono font-bold text-brand-forest dark:text-brand-lime">
                      ({metrics.tickets.occupancyPercentage}% {isEs ? 'ocupación' : 'occupancy'})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-1">
                    {isEs
                      ? `De ${metrics.tickets.totalCapacity} boletos totales • ${metrics.tickets.usedCount} en puerta`
                      : `Out of ${metrics.tickets.totalCapacity} capacity • ${metrics.tickets.usedCount} checked in`}
                  </span>
                  {metrics.tickets.pendingCount > 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                      +{metrics.tickets.pendingCount} {isEs ? 'en revisión por validar' : 'pending validation'}
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-mono text-2xl font-bold text-slate-400">—</span>
              )}
            </div>

            {/* Postulaciones */}
            <div className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{txt.kpi.applicantsTitle}</span>
                <Users className="w-4 h-4 text-brand-blue" />
              </div>
              {loadingMetrics && !metrics ? (
                <div className="py-2 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : metrics ? (
                <div>
                  <span className="font-mono text-3xl font-extrabold text-brand-navy dark:text-white block">
                    {metrics.applicants.total}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-1">
                    {isEs ? 'Postulaciones registradas' : 'Registered submissions'}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-2xl font-bold text-slate-400">—</span>
              )}
            </div>

            {/* Operaciones / Seguridad */}
            <div className="bg-white dark:bg-brand-navy p-5 rounded-2xl border border-slate-200 dark:border-brand-border space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{isEs ? 'Auditoría & Usuarios' : 'Audit & Users'}</span>
                <Shield className="w-4 h-4 text-brand-green" />
              </div>
              {loadingMetrics && !metrics ? (
                <div className="py-2 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : metrics ? (
                <div>
                  <span className="font-mono text-3xl font-extrabold text-brand-green block">
                    {metrics.auditLogs.total}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-1">
                    {metrics.users.total} {isEs ? 'usuarios registrados' : 'registered users'}
                  </span>
                </div>
              ) : (
                <span className="font-mono text-2xl font-bold text-slate-400">—</span>
              )}
            </div>
          </div>

          {/* Gráfico de Barras con Datos Reales por Obra */}
          <div className="bg-white dark:bg-brand-navy p-6 rounded-3xl border border-slate-200 dark:border-brand-border space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-navy dark:text-white">{txt.kpi.salesChartTitle}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{txt.kpi.salesChartSub}</p>
              </div>
              <span className="text-xs text-brand-forest dark:text-brand-lime font-mono font-semibold">{txt.kpi.updatedRealtime}</span>
            </div>

            {/* Barras dinámicas de obras */}
            <div className="pt-2 space-y-4">
              {loadingMetrics && !metrics ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
                  <span>{isEs ? 'Consultando producciones e inventarios...' : 'Loading productions and ticket inventory...'}</span>
                </div>
              ) : !metrics?.salesByShow || metrics.salesByShow.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  {isEs ? 'No hay producciones teatrales con funciones o boletos registrados actualmente.' : 'No theatre productions with inventory currently registered.'}
                </div>
              ) : (
                metrics.salesByShow.map((bar, i) => {
                  const colors = [
                    'from-brand-green to-brand-forest',
                    'from-brand-blue to-brand-navy',
                    'from-brand-lime to-brand-green',
                    'from-amber-400 to-amber-600',
                    'from-purple-500 to-indigo-600',
                  ];
                  const barColor = colors[i % colors.length];

                  return (
                    <div key={bar.id} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-start text-slate-700 dark:text-slate-200 font-semibold">
                        <span className="font-bold text-brand-navy dark:text-white">{bar.title}</span>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-brand-forest dark:text-brand-lime">
                            {bar.sold} / {bar.capacity} {isEs ? 'boletos' : 'tickets'} ({bar.percentage}%)
                          </span>
                          {bar.pendingSold > 0 && (
                            <span className="text-[10px] text-amber-500 font-normal block">
                              +{bar.pendingSold} {isEs ? 'pendientes' : 'pending'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-[#F8F8F2] dark:bg-brand-navyDark h-4 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 p-0.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000`}
                          style={{ width: `${Math.min(100, Math.max(bar.sold > 0 ? 3 : 0, bar.percentage))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
          <div className="bg-[#F8F8F2] dark:bg-[#00162e] border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center text-rose-400">
            {txt.audit.noPermissions}
          </div>
        )
      )}

      {/* TAB: GESTIÓN DE USUARIOS */}
      {activeTab === 'users' && (
        puedeGestionarUsuarios ? (
          <AdminUsersManagementView language={language} />
        ) : (
          <div className="bg-[#F8F8F2] dark:bg-[#00162e] border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center text-rose-400">
            {txt.usersManagement.noPermissions}
          </div>
        )
      )}

        </div>
      </div>
    </div>
  );
};
