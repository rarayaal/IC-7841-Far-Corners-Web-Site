import React, { useEffect, useState } from 'react';
import { PageView, Language } from '../types';
import type { UsuarioSesion } from '../services/sesion';
import { puedeAccederAlPanel } from '../services/sesion';
import { Globe, Search, Shield, Menu, X, Heart, Ticket, Calendar, Info, Users, UserPlus, Mail } from 'lucide-react';
import { getTranslations } from '../lib/i18n';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenSearch: () => void;
  onOpenDonate: () => void;
  onOpenTickets: () => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  usuario: UsuarioSesion | null;
  verificandoSesion: boolean;
  onAccederAdmin: () => void;
  onCerrarSesion: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  language,
  setLanguage,
  onOpenSearch,
  onOpenDonate,
  onOpenTickets,
  isAdminMode,
  setIsAdminMode,
  usuario,
  verificandoSesion,
  onAccederAdmin,
  onCerrarSesion,
}) => {
  const t = getTranslations(language).nav;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Al bajar, el menú pasa a vidrio esmerilado: fondo translúcido y desenfoque.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const accesoAdmin = puedeAccederAlPanel(usuario);

  const navItems = [
    { id: 'home' as PageView, label: t.menu.home, icon: Calendar },
    { id: 'about' as PageView, label: t.menu.about, icon: Info },
    { id: 'shows' as PageView, label: t.menu.shows, icon: Ticket },
    { id: 'participate' as PageView, label: t.menu.participate, icon: Users },
    { id: 'register' as PageView, label: t.menu.joinUs, icon: UserPlus },
  ].filter((item) => !(usuario && item.id === 'register'));

  // "Donar" lleva a la sección de donaciones; desde ahí se continúa a Zeffy.
  const goToDonate = () => {
    setIsAdminMode(false);
    setCurrentPage('donate');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? 'bg-brand-navyDark/60 border-white/10 shadow-glow-navy'
          : 'bg-brand-navyDark/95 border-brand-border'
      }`}
    >
      {/* Top Brand Tagline Bar */}
      <div className="bg-brand-navy border-b border-white/10 py-1.5 px-4 text-xs font-sans text-slate-200">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-brand-lime font-bold tracking-wider text-[11px] uppercase">
              {t.tagline}
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="text-slate-300 text-xs">
              {t.locations}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              className="flex min-h-10 items-center space-x-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-brand-cream transition-colors"
              title={t.selectLanguage}
              aria-label={t.switchLanguage}
            >
              <Globe className="w-3.5 h-3.5 text-brand-green" />
              <span className="font-semibold text-xs">{language.toUpperCase()}</span>
            </button>

            {verificandoSesion ? (
              <span role="status" className="text-xs text-slate-300">
                {t.checkingSession}
              </span>
            ) : usuario ? (
              <>
                <span className="hidden md:inline text-xs text-slate-300 max-w-40 truncate" title={usuario.full_name}>
                  {usuario.full_name}
                </span>
                {accesoAdmin && (
                  <button type="button" onClick={() => {
                    setMobileMenuOpen(false);
                    onAccederAdmin();
                  }} className={`flex min-h-10 items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                    isAdminMode ? 'bg-brand-green text-brand-navy font-extrabold' : 'bg-white/10 hover:bg-white/20 text-brand-cream'
                  }`}>
                    <Shield className="w-3.5 h-3.5" />
                    <span>{t.adminAccess}</span>
                  </button>
                )}
                <button type="button" onClick={() => {
                  setMobileMenuOpen(false);
                  onCerrarSesion();
                }} className="min-h-10 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-brand-cream">
                  {t.signOut}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => {
                setMobileMenuOpen(false);
                setIsAdminMode(false);
                setCurrentPage('login');
              }} className="min-h-10 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-brand-cream">
                {t.signIn}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand Header */}
          <button
            type="button"
            aria-label={t.goToHome}
            onClick={() => {
              setIsAdminMode(false);
              setCurrentPage('home');
            }}
            className="flex shrink-0 items-center space-x-3 cursor-pointer group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-brand-navyDark p-1 border border-brand-green/50 shadow-glow-green group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src="/recursos/IMG_2903.PNG"
                alt="Far Corners Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="whitespace-nowrap">
              <span className="block font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-brand-green transition-colors">
                Far Corners
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-brand-blue font-bold">
                {t.brandSubtitle}
              </span>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id && !isAdminMode;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setIsAdminMode(false);
                    setCurrentPage(item.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-green text-brand-navy shadow-glow-green font-bold'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: Search, Tickets & Donate */}
          <div className="hidden sm:flex items-center space-x-2.5">
            <button
              onClick={onOpenSearch}
              className="p-2.5 text-slate-200 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title={t.searchContent}
            >
              <Search className="w-4 h-4 text-brand-blue" />
            </button>

            <button
              onClick={onOpenTickets}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-white text-sm font-semibold transition-all shadow-glow-navy"
            >
              <Ticket className="w-4 h-4 text-brand-lime" />
              <span>{t.tickets}</span>
            </button>

            <button
              onClick={goToDonate}
              aria-current={currentPage === 'donate' && !isAdminMode ? 'page' : undefined}
              className="btn-green flex items-center space-x-2 px-4 py-2 rounded-xl text-brand-navy hover:text-white font-extrabold text-sm shadow-glow-green transform hover:-translate-y-0.5"
            >
              <Heart className="w-4 h-4 fill-brand-navy" />
              <span>{t.donate}</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex xl:hidden items-center space-x-2">
            <button
              onClick={onOpenSearch}
              aria-label={t.search}
              className="flex h-11 w-11 items-center justify-center text-slate-200 hover:text-white rounded-lg bg-white/10"
            >
              <Search className="w-5 h-5 text-brand-blue" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? t.closeMenu
                  : t.openMenu
              }
              aria-expanded={mobileMenuOpen}
              className="flex h-11 w-11 items-center justify-center text-slate-200 hover:text-white rounded-lg bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
       <div className="xl:hidden bg-brand-navy border-b border-white/10 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const isActive = currentPage === item.id && !isAdminMode;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setIsAdminMode(false);
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-green text-brand-navy font-bold'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <IconComp className="w-5 h-5 text-brand-blue" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenTickets();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-brand-navyDark border border-brand-blue/50 text-brand-blue text-sm font-semibold"
            >
              <Ticket className="w-4 h-4 text-brand-lime" />
              <span>{t.tickets}</span>
            </button>

            <button
              onClick={goToDonate}
              className="btn-green flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-brand-navy text-sm font-extrabold"
            >
              <Heart className="w-4 h-4 fill-brand-navy" />
              <span>{t.donate}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
