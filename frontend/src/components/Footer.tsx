import React, { useState } from 'react';
import { Language, PageView } from '../types';
import { Mail, Heart, MapPin, Phone, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  language: Language;
  setCurrentPage: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#00162e] border-t border-[#1e4066] text-slate-300 text-sm font-sans relative overflow-hidden">
      {/* Mailchimp Newsletter Section */}
      <div className="border-b border-[#1e4066] bg-[#002244] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-[#77C65E]/20 text-[#DCEB4F] text-xs font-bold uppercase tracking-wider mb-2 border border-[#77C65E]/40">
              {language === 'es' ? 'Integración Mailchimp' : 'Mailchimp Newsletter'}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {language === 'es' ? 'Suscríbete a Nuestro Boletín' : 'Subscribe to Our Newsletter'}
            </h3>
            <p className="mt-2 text-slate-300">
              {language === 'es'
                ? 'Recibe noticias de nuestras producciones teatrales, audiciones, becas e historias de impacto comunitario.'
                : 'Receive updates on our theatre productions, auditions, scholarships, and community impact stories.'}
            </p>
          </div>

          <div className="w-full lg:w-auto">
            {subscribed ? (
              <div className="flex items-center space-x-3 bg-[#77C65E]/20 border border-[#77C65E]/50 text-[#F8F8F2] px-6 py-4 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-[#77C65E] shrink-0" />
                <div>
                  <span className="font-bold block">
                    {language === 'es' ? '¡Suscripción confirmada!' : 'Subscription confirmed!'}
                  </span>
                  <span className="text-xs text-[#77C65E]">
                    {language === 'es' ? 'Te hemos añadido a la lista oficial del Teatro Far Corners.' : 'Added to official Far Corners Theatre mailing list.'}
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <div className="relative flex-1">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === 'es' ? 'Tu correo electrónico...' : 'Your email address...'}
                    className="w-full pl-11 pr-4 py-3 bg-[#00162e] border border-[#1e4066] rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#77C65E] focus:ring-1 focus:ring-[#77C65E] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all whitespace-nowrap uppercase tracking-wider text-xs"
                >
                  {language === 'es' ? 'Suscribirse' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* About Far Corners */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#002244] p-1 border border-[#77C65E]/50 flex items-center justify-center">
              <img src="/recursos/IMG_2903.PNG" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">Far Corners</span>
              <span className="block text-[9px] uppercase tracking-widest text-[#4A90D6] font-bold">Teatro Comunitario</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {language === 'es'
              ? 'Organización teatral internacional sin fines de lucro enfocada en brindar oportunidades artísticas y educativas a jóvenes de comunidades en Costa Rica, China y Mozambique.'
              : 'Non-profit international theatre organization providing artistic & educational opportunities for youth in Costa Rica, China, and Mozambique.'}
          </p>
          <div className="pt-2">
            <span className="inline-block text-[11px] px-2.5 py-1 rounded bg-[#002244] text-[#DCEB4F] font-semibold border border-[#1e4066]">
              Arte que Conecta Comunidades
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-[#77C65E]/40 pb-2">
            {language === 'es' ? 'Navegación Sitio' : 'Site Navigation'}
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => setCurrentPage('home')} className="hover:text-[#77C65E] transition-colors">
                {language === 'es' ? 'Inicio & Cartelera' : 'Home & Shows'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('about')} className="hover:text-[#77C65E] transition-colors">
                {language === 'es' ? 'Historia e Impacto Global' : 'History & Global Impact'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('shows')} className="hover:text-[#77C65E] transition-colors">
                {language === 'es' ? 'Obras Teatrales' : 'Theatrical Productions'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('participate')} className="hover:text-[#77C65E] transition-colors">
                {language === 'es' ? 'Pasantías y Voluntariado' : 'Internships & Volunteering'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('donate')} className="hover:text-[#77C65E] transition-colors">
                {language === 'es' ? 'Donaciones y Registro' : 'Donations'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('contact')} className="hover:text-[#77C65E] transition-colors">
                {language === 'es' ? 'Medios de Contacto' : 'Contact Us'}
              </button>
            </li>
          </ul>
        </div>

        {/* Global Footprint */}
        <div>
          <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-[#77C65E]/40 pb-2">
            {language === 'es' ? 'Presencia Internacional' : 'Global Footprint'}
          </h4>
          <ul className="space-y-3 text-xs">
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-[#77C65E] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Costa Rica (Monteverde)</span>
                <span className="text-slate-300">Sede Principal & Campamento de Verano</span>
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-[#4A90D6] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">China</span>
                <span className="text-slate-300">Iniciativa Teatral Educativa Rural</span>
              </div>
            </li>
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-[#DCEB4F] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Mozambique</span>
                <span className="text-slate-300">Talleres Comunitarios de Artes Escénicas</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Contact & Info */}
        <div>
          <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-[#77C65E]/40 pb-2">
            {language === 'es' ? 'Contacto e Información' : 'Contact & Info'}
          </h4>
          <div className="space-y-3 text-xs">
            <p className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-[#77C65E]" />
              <span className="text-slate-200">info@farcornersmusicals.org</span>
            </p>
            <p className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-[#4A90D6]" />
              <span className="text-slate-200">+506 2645-5000 (Monteverde)</span>
            </p>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-white/10 space-y-1">
              <p>Zeffy, Stripe & SINPE Móvil Habilitados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#001021] border-t border-[#1e4066] py-6 px-4 sm:px-6 lg:px-8 text-xs text-center text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Far Corners Teatro Comunitario. Todos los derechos reservados.</p>
          <p className="text-[11px] text-slate-300">
            People • Stories • Community Through Art
          </p>
        </div>
      </div>
    </footer>
  );
};
