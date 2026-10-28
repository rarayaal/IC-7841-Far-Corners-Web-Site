import React, { useState } from 'react';
import { Language, PageView } from '../types';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useContactChannels } from '../hooks/useContactChannels';
import { ContactChannelsList } from './ContactChannelsList';

interface FooterProps {
  language: Language;
  setCurrentPage: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, setCurrentPage }) => {
  const {
    contactos,
    cargando: cargandoContactos,
    error: errorContactos,
  } = useContactChannels();

  const contactosDeFooter = contactos.filter((contacto) =>
    ['email', 'phone', 'whatsapp', 'social'].includes(
      contacto.channel_type
    )
  );

  const ubicaciones = contactos.filter(
    (contacto) => contacto.channel_type === 'international_location'
  );
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [aceptaBoletin, setAceptaBoletin] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensajeSuscripcion, setMensajeSuscripcion] = useState('');
  const [errorSuscripcion, setErrorSuscripcion] = useState('');

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (enviando) return;

    setMensajeSuscripcion('');
    setErrorSuscripcion('');
    setEnviando(true);

    try {
      const respuesta = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          first_name: nombre.trim(),
          last_name: apellido.trim(),
          consent: aceptaBoletin,
        }),
      });

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ??
            (language === 'es'
              ? 'No se pudo procesar la suscripción.'
              : 'Your subscription could not be processed.')
        );
      }

      setMensajeSuscripcion(
        language === 'es'
          ? datos?.message ?? 'Solicitud procesada correctamente.'
          : respuesta.status === 202
            ? 'Check your email to confirm your subscription.'
            : 'This email is already registered. If confirmation is pending, check your inbox.'
      );

      setEmail('');
      setNombre('');
      setApellido('');
      setAceptaBoletin(false);
    } catch (error) {
      setErrorSuscripcion(
        error instanceof Error
          ? error.message
          : language === 'es'
            ? 'No se pudo conectar con el servidor.'
            : 'Could not connect to the server.'
      );
    } finally {
      setEnviando(false);
    }
  }

  const inputBoletinClass =
    'w-full rounded-xl border border-brand-border bg-brand-navyDark ' +
    'px-4 py-3 text-white placeholder-slate-400 ' +
    'focus:outline-none focus:border-brand-green';

  return (
    <footer className="bg-brand-navyDark border-t border-brand-border text-slate-300 text-sm font-sans relative overflow-hidden">
      {/* Mailchimp Newsletter Section */}
      <div className="border-b border-brand-border bg-brand-navy py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-green/20 text-brand-lime text-xs font-bold uppercase tracking-wider mb-2 border border-brand-green/40">
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

          <div className="w-full lg:max-w-xl">
            <form onSubmit={handleSubscribe} className="space-y-4">
              <fieldset disabled={enviando} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="boletin-nombre"
                      className="mb-1 block text-sm text-white"
                    >
                      {language === 'es' ? 'Nombre *' : 'First name *'}
                    </label>

                    <input
                      id="boletin-nombre"
                      type="text"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className={inputBoletinClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="boletin-apellido"
                      className="mb-1 block text-sm text-white"
                    >
                      {language === 'es' ? 'Apellido *' : 'Last name *'}
                    </label>

                    <input
                      id="boletin-apellido"
                      type="text"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className={inputBoletinClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="boletin-correo"
                    className="mb-1 block text-sm text-white"
                  >
                    {language === 'es' ? 'Correo electrónico *' : 'Email address *'}
                  </label>

                  <input
                    id="boletin-correo"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputBoletinClass}
                  />
                </div>

                <label className="flex items-start gap-3 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    required
                    checked={aceptaBoletin}
                    onChange={(e) => setAceptaBoletin(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />

                  <span>
                    {language === 'es'
                      ? 'Acepto recibir el boletín y comunicaciones promocionales de FarCorners. *'
                      : 'I agree to receive the FarCorners newsletter and promotional communications. *'}
                  </span>
                </label>

                <button
                  type="submit"
                  className="btn-green rounded-xl px-6 py-3 text-sm font-bold
                            text-brand-navy disabled:opacity-50
                            disabled:cursor-not-allowed"
                >
                  {enviando
                    ? language === 'es' ? 'Procesando…' : 'Processing…'
                    : language === 'es' ? 'Suscribirse' : 'Subscribe'}
                </button>
              </fieldset>

              {mensajeSuscripcion && (
                <div
                  role="status"
                  className="flex items-start gap-2 text-sm text-brand-green"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p>{mensajeSuscripcion}</p>
                </div>
              )}

              {errorSuscripcion && (
                <p role="alert" className="text-sm text-red-300">
                  {errorSuscripcion}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* About Far Corners */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-brand-navy p-1 border border-brand-green/50 flex items-center justify-center">
              <img src="/recursos/IMG_2903.PNG" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">Far Corners</span>
              <span className="block text-[9px] uppercase tracking-widest text-brand-blue font-bold">Teatro Comunitario</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            {language === 'es'
              ? 'Organización teatral internacional sin fines de lucro enfocada en brindar oportunidades artísticas y educativas a jóvenes de comunidades en Costa Rica, China y Mozambique.'
              : 'Non-profit international theatre organization providing artistic & educational opportunities for youth in Costa Rica, China, and Mozambique.'}
          </p>
          <div className="pt-2 flex flex-col items-start gap-3">
            <span className="inline-block text-[11px] px-2.5 py-1 rounded bg-brand-navy text-brand-lime font-semibold border border-brand-border">
              Arte que Conecta Comunidades
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage('contact')}
              className="inline-flex items-center gap-2 rounded-xl
                        border border-brand-green/50 bg-brand-green/10
                        px-4 py-2.5 text-sm font-semibold text-white
                        hover:bg-brand-green/20 transition-colors"
            >
              <Mail className="h-4 w-4 text-brand-green" />
              {language === 'es' ? 'Contáctanos' : 'Contact us'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-brand-green/40 pb-2">
            {language === 'es' ? 'Navegación Sitio' : 'Site Navigation'}
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => setCurrentPage('home')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {language === 'es' ? 'Inicio & Cartelera' : 'Home & Shows'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('about')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {language === 'es' ? 'Historia e Impacto Global' : 'History & Global Impact'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('shows')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {language === 'es' ? 'Obras Teatrales' : 'Theatrical Productions'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('participate')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {language === 'es' ? 'Pasantías y Voluntariado' : 'Internships & Volunteering'}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('donate')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {language === 'es' ? 'Donaciones y Registro' : 'Donations'}
              </button>
            </li>
          </ul>
        </div>

        {/* Global Footprint */}
        <div>
          <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-brand-green/40 pb-2">
            {language === 'es' ? 'Presencia Internacional' : 'Global Footprint'}
          </h4>
          {!cargandoContactos && !errorContactos && (
            <ContactChannelsList
              contactos={ubicaciones}
              language={language}
            />
          )}
        </div>

        {/* Contact & Info */}
        <div>
          <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-4 border-b border-brand-green/40 pb-2">
            {language === 'es'
              ? 'Contacto e Información'
              : 'Contact & Info'}
          </h4>

          {cargandoContactos && (
            <p role="status" className="text-xs">
              {language === 'es' ? 'Cargando...' : 'Loading...'}
            </p>
          )}

          {errorContactos && (
            <p role="alert" className="text-xs text-red-300">
              {language === 'es'
                ? 'No se pudieron cargar los contactos.'
                : 'Contact information could not be loaded.'}
            </p>
          )}

          {!cargandoContactos && !errorContactos && (
            contactosDeFooter.length > 0 ? (
              <ContactChannelsList
                contactos={contactosDeFooter}
                language={language}
              />
            ) : (
              <p className="text-xs">
                {language === 'es'
                  ? 'No hay contactos publicados.'
                  : 'No contact information is available.'}
              </p>
            )
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-brand-navyDeep border-t border-brand-border py-6 px-4 sm:px-6 lg:px-8 text-xs text-center text-slate-400">
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
