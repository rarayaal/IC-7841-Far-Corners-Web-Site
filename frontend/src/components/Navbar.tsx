import React, { useEffect, useState } from 'react';
import { PageView, Language } from '../types';
import { Globe, Search, Shield, Menu, X, Heart, Ticket, Calendar, Info, Users, UserPlus } from 'lucide-react';

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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Al bajar, el menú pasa a vidrio esmerilado: fondo translúcido y desenfoque.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'home' as PageView, labelEs: 'Inicio', labelEn: 'Home', icon: Calendar },
    { id: 'about' as PageView, labelEs: 'Historia e Impacto', labelEn: 'About & Impact', icon: Info },
    { id: 'shows' as PageView, labelEs: 'Cartelera', labelEn: 'Shows', icon: Ticket },
    { id: 'participate' as PageView, labelEs: 'Programas y Comunidad', labelEn: 'Programs & Community', icon: Users },
    { id: 'register' as PageView, labelEs: 'Únete', labelEn: 'Join us', icon: UserPlus },
  ];

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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-brand-lime font-bold tracking-wider text-[11px] uppercase">
              Arte que Conecta Comunidades
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="text-slate-300 text-xs">
              {language === 'es' ? 'Costa Rica • China • Mozambique' : 'Costa Rica • China • Mozambique'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              className="flex min-h-10 items-center space-x-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-brand-cream transition-colors"
              title={language === 'es' ? 'Seleccionar idioma' : 'Select language'}
              aria-label={language === 'es' ? 'Cambiar idioma a inglés' : 'Switch language to Spanish'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-green" />
              <span className="font-semibold text-xs">{language.toUpperCase()}</span>
            </button>

            {/* Admin Mode Toggle */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);

                if (isAdminMode) {
                  setCurrentPage('admin');
                  return;
                }

                setCurrentPage('loginAdmin');
              }}
              className={`flex min-h-10 items-center space-x-1.5 px-3 py-1 rounded text-xs transition-colors ${
                isAdminMode
                  ? 'bg-brand-green text-brand-navy font-extrabold shadow-glow-green'
                  : 'bg-white/10 hover:bg-white/20 text-brand-cream'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-brand-blue" />
              <span>{isAdminMode ? (language === 'es' ? 'Panel Admin' : 'Admin Panel') : (language === 'es' ? 'Acceso Admin' : 'Admin Login')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand Header */}
          <button
            type="button"
            aria-label={language === 'es' ? 'Far Corners, ir al inicio' : 'Far Corners, go to home'}
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
                Teatro Comunitario
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
                  {language === 'es' ? item.labelEs : item.labelEn}
                </button>
              );
            })}
          </nav>

          {/* Actions: Search, Tickets & Donate */}
          <div className="hidden sm:flex items-center space-x-2.5">
            <button
              onClick={onOpenSearch}
              className="p-2.5 text-slate-200 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title={language === 'es' ? 'Buscar contenido' : 'Search content'}
            >
              <Search className="w-4 h-4 text-brand-blue" />
            </button>

            <button
              onClick={onOpenTickets}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navyCard border border-brand-blue/60 text-brand-blue hover:text-white text-sm font-semibold transition-all shadow-glow-navy"
            >
              <Ticket className="w-4 h-4 text-brand-lime" />
              <span>{language === 'es' ? 'Boletos' : 'Tickets'}</span>
            </button>

            <button
              onClick={goToDonate}
              aria-current={currentPage === 'donate' && !isAdminMode ? 'page' : undefined}
              className="btn-green flex items-center space-x-2 px-4 py-2 rounded-xl text-brand-navy hover:text-white font-extrabold text-sm shadow-glow-green transform hover:-translate-y-0.5"
            >
              <Heart className="w-4 h-4 fill-brand-navy" />
              <span>{language === 'es' ? 'Donar' : 'Donate'}</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex xl:hidden items-center space-x-2">
            <button
              onClick={onOpenSearch}
              aria-label={language === 'es' ? 'Buscar' : 'Search'}
              className="flex h-11 w-11 items-center justify-center text-slate-200 hover:text-white rounded-lg bg-white/10"
            >
              <Search className="w-5 h-5 text-brand-blue" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? (language === 'es' ? 'Cerrar menú' : 'Close menu')
                  : (language === 'es' ? 'Abrir menú' : 'Open menu')
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
                <span>{language === 'es' ? item.labelEs : item.labelEn}</span>
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
              <span>{language === 'es' ? 'Boletos' : 'Tickets'}</span>
            </button>

            <button
              onClick={goToDonate}
              className="btn-green flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-brand-navy text-sm font-extrabold"
            >
              <Heart className="w-4 h-4 fill-brand-navy" />
              <span>{language === 'es' ? 'Donar' : 'Donate'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
