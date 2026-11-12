import React, { useEffect, useState } from 'react';
import { PageView, Language, Show, Opportunity } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { TicketModal } from './components/TicketModal';
import { DonationModal } from './components/DonationModal';
import { VolunteerModal } from './components/VolunteerModal';

import { HomeView } from './views/HomeView';
import { AboutView } from './views/AboutView';
import { ShowsView } from './views/ShowsView';
import { ParticipateView } from './views/ParticipateView';
import { DonateView } from './views/DonateView';
import { ContactView } from './views/ContactView';
import { AdminView } from './views/AdminView';
import { RegisterView } from './views/RegisterView';
import { LoginView } from './views/LoginView';
import { useSesion } from './hooks/useSesion';
import { cerrarSesion, puedeAccederAlPanel } from './services/sesion';
import { showsData, opportunitiesData } from './data/mockData';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [language, setLanguage] = useState<Language>('es');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  const { usuario, verificandoSesion } = useSesion();
  const accesoAdmin = puedeAccederAlPanel(usuario);

  useEffect(() => {
    if (!verificandoSesion && !accesoAdmin) {
      setIsAdminMode(false);
      if (currentPage === 'admin') setCurrentPage('home');
    }
    if (usuario && currentPage === 'login') setCurrentPage('home');
  }, [verificandoSesion, accesoAdmin, currentPage, usuario]);

  const irAlPanel = () => {
    if (!verificandoSesion && accesoAdmin) {
      setCurrentPage('admin');
      setIsAdminMode(true);
    }
  };

  const salir = () => {
    cerrarSesion();
    setIsAdminMode(false);
    setCurrentPage('home');
  };

  const sesionIniciada = () => {
    setIsAdminMode(false);
    setCurrentPage('home');
  };

  // Cada sección se abre desde arriba, no donde quedó el scroll de la anterior.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentPage, isAdminMode]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketShow, setTicketShow] = useState<Show | null>(null);

  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [volunteerOpp, setVolunteerOpp] = useState<Opportunity | null>(null);
  const [postulacionSolicitada, setPostulacionSolicitada] = useState<Opportunity | null>(null);

  // Trigger Ticket Purchase Modal
  const handleOpenTickets = (show?: Show) => {
    setTicketShow(show || showsData[0]);
    setIsTicketOpen(true);
  };

  // Trigger Volunteer/Internship Modal
  const handleOpenVolunteer = (opp?: Opportunity) => {
    setPostulacionSolicitada(opp || opportunitiesData[0]);
  };

  useEffect(() => {
    // Si la sesión aún se está comprobando, conservamos el clic hasta que termine.
    if (verificandoSesion) return;

    if (!usuario) setIsVolunteerOpen(false);
    if (!postulacionSolicitada) return;

    setPostulacionSolicitada(null);
    if (!usuario) {
      setIsAdminMode(false);
      setCurrentPage('register');
      return;
    }

    setVolunteerOpp(postulacionSolicitada);
    setIsVolunteerOpen(true);
  }, [postulacionSolicitada, verificandoSesion, usuario]);

  return (
    <div className="min-h-screen bg-brand-navyDark text-brand-cream font-sans flex flex-col justify-between selection:bg-brand-green selection:text-brand-navy">
      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        language={language}
        setLanguage={setLanguage}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
        onOpenTickets={() => handleOpenTickets()}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        usuario={usuario}
        verificandoSesion={verificandoSesion}
        onAccederAdmin={irAlPanel}
        onCerrarSesion={salir}
      />

      {/* Main View Router */}
      <main className="flex-grow">
        {isAdminMode && accesoAdmin && !verificandoSesion ? (
          <AdminView language={language} />
        ) : (
          <>
            {currentPage === 'home' && (
              <HomeView
                language={language}
                setCurrentPage={setCurrentPage}
                onOpenTickets={handleOpenTickets}
                onOpenDonate={() => setIsDonateOpen(true)}
                onOpenVolunteer={() => handleOpenVolunteer()}
              />
            )}
            {currentPage === 'about' && (
              <AboutView
                language={language}
                setCurrentPage={setCurrentPage}
                onOpenDonate={() => setIsDonateOpen(true)}
              />
            )}
            {currentPage === 'shows' && (
              <ShowsView
                language={language}
                onOpenTickets={handleOpenTickets}
              />
            )}
            {currentPage === 'participate' && (
              <ParticipateView
                language={language}
                onSelectOpportunity={(opp) => handleOpenVolunteer(opp)}
              />
            )}
            {currentPage === 'donate' && (
              <DonateView
                language={language}
                onOpenDonateModal={() => setIsDonateOpen(true)}
              />
            )}
            {currentPage === 'contact' && (
              <ContactView language={language} />
            )}
            {currentPage === 'register' && (
              <RegisterView
                language={language}
                onSesionIniciada={sesionIniciada}
                onNavigateToLogin={() => setCurrentPage('login')}
              />
            )}
            {currentPage === 'login' && !usuario && (
              <LoginView language={language} onLoginCorrecto={sesionIniciada} />
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        language={language}
        setCurrentPage={(page) => {
          setIsAdminMode(false);
          setCurrentPage(page);
        }}
      />

      {/* Global Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        language={language}
      />

      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        show={ticketShow}
        language={language}
      />

      <DonationModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        language={language}
      />

      <VolunteerModal
        isOpen={isVolunteerOpen && !!usuario && !verificandoSesion}
        onClose={() => setIsVolunteerOpen(false)}
        opportunity={volunteerOpp}
        language={language}
        usuario={usuario}
      />
    </div>
  );
}

export default App;
