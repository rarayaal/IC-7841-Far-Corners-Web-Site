import React, { useEffect, useState } from 'react';
import { PageView, Language } from '../types';
import type { UsuarioSesion } from '../services/sesion';
import { puedeAccederAlPanel } from '../services/sesion';
import { Globe, Search, Shield, Menu, X, Heart, Ticket, Calendar, Info, Users, UserPlus, Mail, Sun, Moon } from 'lucide-react';
import { getTranslations } from '../lib/i18n';
import { useTheme } from '../hooks/useTheme';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
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
  theme,
  toggleTheme,
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
    const onScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };

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


  return (
    <header
      className={`sticky top-0 z-40 border-b ${
        scrolled
          ? 'bg-[#F8F8F2]/70 backdrop-blur-lg backdrop-saturate-150 text-brand-navy border-slate-300/60 shadow-md dark:bg-brand-navyDark/70 dark:text-brand-cream dark:border-white/10 dark:shadow-glow-navy'
          : 'bg-[#F8F8F2] text-brand-navy border-slate-200 dark:bg-brand-navyDark dark:text-brand-cream dark:border-brand-border'
      }`}
    >
      {/* Top Brand Tagline Bar */}
      <div className="bg-slate-100 border-b border-slate-200 text-brand-navy dark:bg-brand-navy dark:border-brand-navyDark dark:text-brand-cream py-1.5 px-4 text-xs font-sans transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-brand-forest dark:text-brand-lime font-bold tracking-wider text-[11px] uppercase">
              {t.tagline}
            </span>
            {t.locations && (
              <>
                <span className="hidden md:inline text-slate-400 dark:text-brand-blue/60">•</span>
                <span className="text-slate-600 dark:text-brand-cream/80 text-xs">
                  {t.locations}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Selector */}
            <div
              role="group"
              aria-label={t.selectLanguage}
              className="flex min-h-10 items-center gap-1 rounded bg-white border border-slate-200 px-2 shadow-sm dark:border-transparent dark:shadow-none dark:bg-white/10"
            >
              <Globe className="w-3.5 h-3.5 text-brand-forest dark:text-brand-green" aria-hidden="true" />
              {(['es', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  lang={lang}
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  aria-label={lang === 'es' ? 'ES, Español' : 'EN, English'}
                  className={`min-h-8 min-w-9 rounded px-2 text-xs font-bold transition-colors ${
                    language === lang
                      ? 'bg-brand-green text-brand-navy'
                      : 'text-brand-navy/70 hover:bg-black/5 dark:text-brand-cream/80 dark:hover:bg-white/10'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex min-h-10 items-center space-x-1.5 px-3 py-1 rounded bg-white hover:bg-slate-200/70 text-brand-navy border border-slate-200 shadow-sm dark:border-transparent dark:shadow-none dark:bg-white/10 dark:hover:bg-white/20 dark:text-brand-cream transition-colors"
              title={theme === 'dark' ? (language === 'es' ? 'Cambiar a modo claro' : 'Switch to light mode') : (language === 'es' ? 'Cambiar a modo oscuro' : 'Switch to dark mode')}
              aria-label={theme === 'dark' ? (language === 'es' ? 'Cambiar a modo claro' : 'Switch to light mode') : (language === 'es' ? 'Cambiar a modo oscuro' : 'Switch to dark mode')}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-brand-lime" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-brand-blue" />
              )}
              <span className="font-semibold text-xs uppercase hidden sm:inline">
                {theme === 'dark' ? (language === 'es' ? 'Claro' : 'Light') : (language === 'es' ? 'Oscuro' : 'Dark')}
              </span>
            </button>
            {verificandoSesion ? (
              <span role="status" className="text-xs text-slate-600 dark:text-slate-300">
                {t.checkingSession}
              </span>
            ) : usuario ? (
              <>
                <span className="hidden md:inline text-xs text-slate-600 dark:text-slate-300 max-w-40 truncate" title={usuario.full_name}>
                  {usuario.full_name}
                </span>
                <button type="button" onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAdminMode(false);
                  setCurrentPage('profile');
                }} className="min-h-10 px-3 py-1 rounded bg-white hover:bg-slate-200/70 text-brand-navy border border-slate-200 shadow-sm dark:border-transparent dark:shadow-none dark:bg-white/10 dark:hover:bg-white/20 text-xs dark:text-brand-cream transition-colors">
                  {t.profile}
                </button>
                {accesoAdmin && (
                  <button type="button" onClick={() => {
                    setMobileMenuOpen(false);
                    onAccederAdmin();
                  }} className={`flex min-h-10 items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                    isAdminMode ? 'bg-brand-green text-brand-navy font-extrabold' : 'bg-white hover:bg-slate-200/70 text-brand-navy border border-slate-200 shadow-sm dark:border-transparent dark:shadow-none dark:bg-white/10 dark:hover:bg-white/20 dark:text-brand-cream'
                  }`}>
                    <Shield className="w-3.5 h-3.5" />
                    <span>{t.adminAccess}</span>
                  </button>
                )}
                <button type="button" onClick={() => {
                  setMobileMenuOpen(false);
                  onCerrarSesion();
                }} className="min-h-10 px-3 py-1 rounded bg-white hover:bg-slate-200/70 text-brand-navy border border-slate-200 shadow-sm dark:border-transparent dark:shadow-none dark:bg-white/10 dark:hover:bg-white/20 text-xs dark:text-brand-cream transition-colors">
                  {t.signOut}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => {
                setMobileMenuOpen(false);
                setIsAdminMode(false);
                setCurrentPage('login');
              }} className="min-h-10 px-3 py-1 rounded bg-white hover:bg-slate-200/70 text-brand-navy border border-slate-200 shadow-sm dark:border-transparent dark:shadow-none dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold dark:text-brand-cream transition-colors">
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
            title={t.goToHome}
            onClick={() => {
              setIsAdminMode(false);
              setCurrentPage('home');
            }}
            className="flex shrink-0 items-center space-x-3 cursor-pointer group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm dark:bg-gradient-to-br dark:from-brand-navy dark:to-brand-navyDark dark:border-brand-green/50 dark:shadow-glow-green p-1 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src={theme === 'dark' ? '/recursos/IMG_2903.PNG' : '/recursos/IMG_2903_COLOR.PNG'}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="whitespace-nowrap">
              <span className="block font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-navy dark:text-white group-hover:text-brand-green transition-colors">
                Far Corners
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-brand-blueText dark:text-brand-blue font-bold">
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
                      : 'text-brand-navy/80 hover:text-brand-navy hover:bg-black/5 dark:text-slate-200 dark:hover:text-white dark:hover:bg-white/10'
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
              className="p-2.5 text-brand-navy hover:text-brand-navy rounded-xl bg-black/5 hover:bg-black/10 dark:text-slate-200 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
              title={t.searchContent}
            >
              <Search className="w-4 h-4 text-brand-blue" />
            </button>

            <button
              onClick={onOpenTickets}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-brand-navy border border-slate-300 shadow-sm dark:bg-brand-navy dark:hover:bg-brand-navyCard dark:border-brand-blue/60 dark:text-brand-blue dark:hover:text-white text-sm font-semibold transition-all dark:shadow-glow-navy"
            >
              <Ticket className="w-4 h-4 text-brand-forest dark:text-brand-lime" />
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
              className="flex sm:hidden h-11 w-11 items-center justify-center text-brand-navy bg-black/5 dark:text-slate-200 dark:bg-white/10 rounded-lg"            >
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
              className="flex h-11 w-11 items-center justify-center text-brand-navy bg-black/5 dark:text-slate-200 dark:bg-white/10 rounded-lg"            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
       <div className="xl:hidden bg-[#F8F8F2] dark:bg-brand-navy border-b border-slate-200 dark:border-white/10 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
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
                    : 'text-brand-navy hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10'
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

            <button
              onClick={toggleTheme}
              className="col-span-full flex w-full items-center justify-between px-3 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-brand-navy dark:text-slate-200 text-sm transition-colors"
            >
              <span className="flex items-center gap-2">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-lime" /> : <Moon className="w-4 h-4 text-brand-blue" />}
                {language === 'es' ? 'Tema' : 'Theme'}
              </span>
              <span className="text-xs uppercase font-semibold text-brand-green">
                {theme === 'dark' ? (language === 'es' ? 'Modo Claro' : 'Light Mode') : (language === 'es' ? 'Modo Oscuro' : 'Dark Mode')}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
