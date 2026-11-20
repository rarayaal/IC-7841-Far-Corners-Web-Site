import React, { useState } from 'react';
import { Language, PageView } from '../types';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useContactChannels } from '../hooks/useContactChannels';
import { ContactChannelsList } from './ContactChannelsList';
import { getTranslations } from '../lib/i18n';
import { useInstitutionalContent } from '../hooks/useInstitutionalContent';

interface FooterProps {
  language: Language;
  setCurrentPage: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, setCurrentPage }) => {
  const t = getTranslations(language).footer;
  const {
    contactos,
    cargando: cargandoContactos,
    error: errorContactos,
  } = useContactChannels(language);

  // Textos editables desde el panel de administración (sección «Pie de página»).
  // Si aún no hay contenido publicado se usan los textos por defecto.
  const { items: footerItems } = useInstitutionalContent('footer', language);
  const footerContent = footerItems[0];
  const aboutDesc = footerContent?.content ?? t.aboutDesc;
  const taglineBadge = footerContent?.subtitle ?? t.taglineBadge;
  const slogan = footerContent?.title ?? 'People • Stories • Community Through Art';

  const contactosDeFooter = contactos.filter((contacto) =>
    ['email', 'phone', 'whatsapp', 'sinpe', 'social'].includes(
      contacto.channel_type
    )
  );

  const ubicaciones = contactos.filter(
    (contacto) => contacto.channel_type === 'international_location'
  );
  const mostrarUbicaciones =
    !cargandoContactos && !errorContactos && ubicaciones.length > 0;
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
          datos?.message ?? t.errorProcess
        );
      }

      setMensajeSuscripcion(
        language === 'es'
          ? datos?.message ?? t.successPending
          : respuesta.status === 202
            ? t.successPending
            : t.successAlready
      );

      setEmail('');
      setNombre('');
      setApellido('');
      setAceptaBoletin(false);
    } catch (error) {
      setErrorSuscripcion(
        error instanceof Error
          ? error.message
          : t.errorConnection
      );
    } finally {
      setEnviando(false);
    }
  }

  const inputBoletinClass =
    'w-full rounded-xl border border-slate-300 dark:border-brand-border bg-white dark:bg-brand-navyDark ' +
    'px-4 py-3 text-brand-navy dark:text-white placeholder-slate-400 ' +
    'focus:outline-none focus:border-brand-green';

  return (
    <footer className="bg-[#F8F8F2] dark:bg-brand-navyDark border-t border-slate-200 dark:border-brand-border text-slate-600 dark:text-slate-300 text-sm font-sans relative overflow-hidden transition-colors">
      {/* Mailchimp Newsletter Section */}
      <div className="border-b border-slate-200 dark:border-brand-border bg-slate-100 dark:bg-brand-navy py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-lime text-xs font-bold uppercase tracking-wider mb-2 border border-brand-green/50">
              {t.newsletterBadge}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white tracking-tight">
              {t.newsletterTitle}
            </h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t.newsletterSubtitle}
            </p>
          </div>

          <div className="w-full lg:max-w-xl">
            <form onSubmit={handleSubscribe} className="space-y-4">
              <fieldset disabled={enviando} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="boletin-nombre"
                      className="mb-1 block text-sm font-medium text-brand-navy dark:text-white"
                    >
                      {t.firstName}
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
                      className="mb-1 block text-sm font-medium text-brand-navy dark:text-white"
                    >
                      {t.lastName}
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
                    className="mb-1 block text-sm font-medium text-brand-navy dark:text-white"
                  >
                    {t.email}
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

                <label className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-200">
                  <input
                    type="checkbox"
                    required
                    checked={aceptaBoletin}
                    onChange={(e) => setAceptaBoletin(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />

                  <span>
                    {t.consent}
                  </span>
                </label>

                <button
                  type="submit"
                  className="btn-green rounded-xl px-6 py-3 text-sm font-bold
                            text-brand-navy disabled:opacity-50
                            disabled:cursor-not-allowed"
                >
                  {enviando ? t.processingBtn : t.subscribeBtn}
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
      <div className={`max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 ${mostrarUbicaciones ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}>
        {/* About Far Corners */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-brand-navy p-1 border border-slate-200 dark:border-brand-green/50 flex items-center justify-center shadow-sm dark:shadow-none">
              <img src="/recursos/IMG_2903_COLOR.PNG" alt="Logo" className="w-full h-full object-contain dark:hidden" />
              <img src="/recursos/IMG_2903.PNG" alt="Logo" className="w-full h-full object-contain hidden dark:block" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold text-brand-navy dark:text-white tracking-tight">Far Corners</span>
              <span className="block text-[9px] uppercase tracking-widest text-brand-blue font-bold">{language === 'es' ? 'Teatro Comunitario' : 'Community Theatre'}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {aboutDesc}
          </p>
          <div className="pt-2 flex flex-col items-start gap-3">
            <span className="inline-block text-[11px] px-2.5 py-1 rounded bg-white dark:bg-brand-navy text-brand-forest dark:text-brand-lime font-semibold border border-slate-200 dark:border-brand-border shadow-sm dark:shadow-none">
              {taglineBadge}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage('contact')}
              className="inline-flex items-center gap-2 rounded-xl
                        border border-brand-green/50 bg-brand-green/10
                        px-4 py-2.5 text-sm font-semibold text-brand-navy dark:text-white
                        hover:bg-brand-green/20 transition-colors"
            >
              <Mail className="h-4 w-4 text-brand-forest dark:text-brand-green" />
              {t.contactUsBtn}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-serif text-base font-bold text-brand-navy dark:text-white uppercase tracking-wider mb-4 border-b border-brand-green/40 pb-2">
            {t.siteNav}
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => setCurrentPage('home')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {t.homeAndShows}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('about')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {t.aboutImpact}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('shows')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {t.shows}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('participate')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {t.internships}
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentPage('donate')} className="inline-block py-1.5 hover:text-brand-green transition-colors">
                {t.donations}
              </button>
            </li>
          </ul>
        </div>

        {/* Dónde estamos (oculto si no hay ubicaciones publicadas) */}
        {mostrarUbicaciones && (
        <div>
          <h4 className="font-serif text-base font-bold text-brand-navy dark:text-white uppercase tracking-wider mb-4 border-b border-brand-green/40 pb-2">
            {t.globalFootprint}
          </h4>
          <ContactChannelsList
            contactos={ubicaciones}
            language={language}
          />
        </div>
        )}

        {/* Contact & Info */}
        <div>
          <h4 className="font-serif text-base font-bold text-brand-navy dark:text-white uppercase tracking-wider mb-4 border-b border-brand-green/40 pb-2">
            {t.contactAndInfo}
          </h4>

          {cargandoContactos && (
            <p role="status" className="text-xs">
              {t.loadingContacts}
            </p>
          )}

          {errorContactos && (
            <p role="alert" className="text-xs text-red-300">
              {t.errorContacts}
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
                {t.noContacts}
              </p>
            )
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-200/70 dark:bg-brand-navyDeep border-t border-slate-200 dark:border-brand-border py-6 px-4 sm:px-6 lg:px-8 text-xs text-center text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t.copyright}</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {slogan}
          </p>
        </div>
      </div>
    </footer>
  );
};
