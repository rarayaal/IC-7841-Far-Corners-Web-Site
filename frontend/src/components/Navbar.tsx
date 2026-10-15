import React, { useState } from 'react';
import { PageView, Language } from '../types';
import { Globe, Search, Shield, Menu, X, Heart, Ticket, Calendar, Info, Users, Mail, Sparkles } from 'lucide-react';

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

  const navItems = [
    { id: 'home' as PageView, labelEs: 'Inicio', labelEn: 'Home', icon: Calendar },
    { id: 'about' as PageView, labelEs: 'Historia e Impacto', labelEn: 'About & Impact', icon: Info },
    { id: 'shows' as PageView, labelEs: 'Cartelera y Boletos', labelEn: 'Shows & Tickets', icon: Ticket },
    { id: 'participate' as PageView, labelEs: 'Programas y Comunidad', labelEn: 'Participate', icon: Users },
    { id: 'donate' as PageView, labelEs: 'Donaciones', labelEn: 'Donate', icon: Heart },
    { id: 'contact' as PageView, labelEs: 'Contacto', labelEn: 'Contact', icon: Mail },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#00162e]/95 backdrop-blur-md border-b border-[#1e4066] transition-all duration-300">
      {/* Top Brand Tagline Bar */}
      <div className="bg-[#002244] border-b border-white/10 py-1.5 px-4 text-xs font-sans text-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-block text-[#DCEB4F] font-bold tracking-wider text-[11px] uppercase">
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
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#F8F8F2] transition-colors"
              title="Seleccionar idioma"
            >
              <Globe className="w-3.5 h-3.5 text-[#77C65E]" />
              <span className="font-semibold text-xs">{language.toUpperCase()}</span>
            </button>

            {/* Admin Mode Toggle */}
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                if (!isAdminMode) setCurrentPage('admin');
                else setCurrentPage('home');
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                isAdminMode
                  ? 'bg-[#77C65E] text-[#002244] font-extrabold shadow-glow-green'
                  : 'bg-white/10 hover:bg-white/20 text-[#F8F8F2]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#4A90D6]" />
              <span>{isAdminMode ? (language === 'es' ? 'Panel Admin' : 'Admin Panel') : (language === 'es' ? 'Acceso Admin' : 'Admin Login')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand Header */}
          <div
            onClick={() => {
              setIsAdminMode(false);
              setCurrentPage('home');
            }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002244] to-[#00162e] p-1 border border-[#77C65E]/50 shadow-glow-green group-hover:scale-105 transition-transform flex items-center justify-center">
              <img
                src="/recursos/IMG_2903.PNG"
                alt="Far Corners Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <span className="block font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-[#77C65E] transition-colors">
                Far Corners
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[#4A90D6] font-bold">
                Teatro Comunitario
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
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
                      ? 'bg-[#77C65E] text-[#002244] shadow-glow-green font-bold'
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
              <Search className="w-4 h-4 text-[#4A90D6]" />
            </button>

            <button
              onClick={onOpenTickets}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#002244] hover:bg-[#002d57] border border-[#4A90D6]/60 text-[#4A90D6] hover:text-white text-sm font-semibold transition-all shadow-glow-navy"
            >
              <Ticket className="w-4 h-4 text-[#DCEB4F]" />
              <span>{language === 'es' ? 'Boletos' : 'Tickets'}</span>
            </button>

            <button
              onClick={onOpenDonate}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#77C65E] to-[#008047] hover:from-[#008047] hover:to-[#77C65E] text-[#002244] font-extrabold text-sm shadow-glow-green transition-all transform hover:-translate-y-0.5"
            >
              <Heart className="w-4 h-4 fill-[#002244]" />
              <span>{language === 'es' ? 'Donar' : 'Donate'}</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-200 hover:text-white rounded-lg bg-white/10"
            >
              <Search className="w-5 h-5 text-[#4A90D6]" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white rounded-lg bg-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#002244] border-b border-white/10 px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
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
                    ? 'bg-[#77C65E] text-[#002244] font-bold'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <IconComp className="w-5 h-5 text-[#4A90D6]" />
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
              className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-[#00162e] border border-[#4A90D6]/50 text-[#4A90D6] text-sm font-semibold"
            >
              <Ticket className="w-4 h-4 text-[#DCEB4F]" />
              <span>{language === 'es' ? 'Boletos' : 'Tickets'}</span>
            </button>

            <button
              onClick={() => {
                onOpenDonate();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-[#77C65E] text-[#002244] text-sm font-extrabold"
            >
              <Heart className="w-4 h-4 fill-[#002244]" />
              <span>{language === 'es' ? 'Donar' : 'Donate'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
