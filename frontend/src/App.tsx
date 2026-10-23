import React, { useState } from 'react';
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
import { LoginAdminView } from './views/LoginAdminView';
import { showsData, opportunitiesData } from './data/mockData';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [language, setLanguage] = useState<Language>('es');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketShow, setTicketShow] = useState<Show | null>(null);

  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [volunteerOpp, setVolunteerOpp] = useState<Opportunity | null>(null);

  // Trigger Ticket Purchase Modal
  const handleOpenTickets = (show?: Show) => {
    setTicketShow(show || showsData[0]);
    setIsTicketOpen(true);
  };

  // Trigger Volunteer/Internship Modal
  const handleOpenVolunteer = (opp?: Opportunity) => {
    setVolunteerOpp(opp || opportunitiesData[0]);
    setIsVolunteerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#9e1b32] selection:text-white">
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
      />

      {/* Main View Router */}
      <main className="flex-grow">
        {isAdminMode ? (
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
              <RegisterView />
            )}
            {currentPage === 'loginAdmin' && (
              <LoginAdminView
                onLoginCorrecto={() => {
                  setCurrentPage('admin');
                  setIsAdminMode(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer language={language} setCurrentPage={setCurrentPage} />

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
        isOpen={isVolunteerOpen}
        onClose={() => setIsVolunteerOpen(false)}
        opportunity={volunteerOpp}
        language={language}
      />
    </div>
  );
}

export default App;
