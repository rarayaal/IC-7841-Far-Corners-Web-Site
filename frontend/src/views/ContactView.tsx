import React, { useState } from 'react';
import { Language } from '../types';
import { Send, CheckCircle2 } from 'lucide-react';
import { useContactChannels } from '../hooks/useContactChannels';
import { ContactChannelsList } from '../components/ContactChannelsList';
import { getTranslations } from '../lib/i18n';

interface ContactViewProps {
  language: Language;
}

export const ContactView: React.FC<ContactViewProps> = ({ language }) => {
  const t = getTranslations(language).views.contact;
  const {
  contactos,
  cargando: cargandoContactos,
  error: errorContactos,
} = useContactChannels();

const contactosDePagina = contactos.filter((contacto) =>
  [
    'address',
    'email',
    'phone',
    'whatsapp',
    'office_hours',
    'performance_hours',
    'international_location',
    'social',
  ].includes(contacto.channel_type)
);
  const motivos =
    language === 'es'
      ? [
          'Quiero participar en una producción',
          'Me interesa ser voluntario/a',
          'Quiero conocer los programas y talleres',
          'Me interesa realizar una pasantía',
          'Quiero apoyar o realizar una donación',
          'Me gustaría proponer una alianza o colaboración',
          'Tengo una consulta general',
          'Otro motivo',
        ]
      : [
          'I want to take part in a production',
          "I'm interested in volunteering",
          'I want to learn about the programs and workshops',
          "I'm interested in an internship",
          'I want to support or make a donation',
          "I'd like to propose a partnership or collaboration",
          'I have a general question',
          'Other reason',
        ];
  // Se guarda el índice para conservar la elección al cambiar de idioma.
  const [motivo, setMotivo] = useState('');
  const esOtroMotivo = motivo === String(motivos.length - 1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
const [enviando, setEnviando] = useState(false);
const [errorEnvio, setErrorEnvio] = useState('');

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (enviando) return;

  setErrorEnvio('');
  setEnviando(true);

  try {
    const respuesta = await fetch('/api/v1/contact-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: motivos[Number(motivo)] ?? '',
        message: formData.message.trim(),
      }),
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      setErrorEnvio(
        typeof datos?.message === 'string'
          ? datos.message
          : t.errorDefault
      );
      return;
    }

    setSubmitted(true);
  } catch {
    setErrorEnvio(
      language === 'es'
        ? 'No se pudo conectar con la API. Inténtalo nuevamente.'
        : 'Could not connect to the API. Please try again.'
    );
  } finally {
    setEnviando(false);
  }
};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-forest dark:text-brand-lime text-xs font-bold uppercase tracking-wider border border-brand-green/40">
          {t.channelsTitle}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-navy dark:text-white tracking-tight">
          {t.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Main Aligned Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Contact Information Box */}
        <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-2xl font-bold text-brand-navy dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
            {t.channelsSubtitle}
          </h3>

          {cargandoContactos && (
            <p role="status" className="text-xs text-slate-600 dark:text-slate-300">
              {language === 'es'
                ? 'Cargando contactos...'
                : 'Loading contact information...'}
            </p>
          )}

          {errorContactos && (
            <p role="alert" className="text-xs text-red-300">
              {language === 'es'
                ? 'No se pudo cargar la información de contacto.'
                : 'Contact information could not be loaded.'}
            </p>
          )}

          {!cargandoContactos && !errorContactos && (
            contactosDePagina.length > 0 ? (
              <ContactChannelsList
                contactos={contactosDePagina}
                language={language}
              />
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {language === 'es'
                  ? 'No hay medios de contacto publicados.'
                  : 'No contact information is currently available.'}
              </p>
            )
          )}
        </div>

        {/* Contact Form Box */}
        <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-brand-navy dark:text-white border-b border-slate-200 dark:border-white/10 pb-3">
              {t.formTitle}
            </h3>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.nameLabel} *</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t.namePlaceholder}
                      className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.emailLabel} *</label>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t.emailPlaceholder}
                      className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.subjectLabel} *</label>
                  <select
                    required
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="fc-select w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                  >
                    <option value="" disabled>
                      {language === 'es' ? 'Selecciona un motivo…' : 'Select a reason…'}
                    </option>
                    {motivos.map((m, i) => (
                      <option key={m} value={String(i)}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{t.messageLabel} *</label>
                  <textarea
                    required
                    rows={4}
                    maxLength={10000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      esOtroMotivo
                        ? language === 'es'
                          ? 'Cuéntanos cuál es el motivo de tu contacto…'
                          : 'Tell us the reason for your message…'
                        : t.messagePlaceholder
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border rounded-lg text-xs text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
                  ></textarea>
                </div>

                {errorEnvio && (
                  <p role="alert" className="text-sm text-red-300">
                    {errorEnvio}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-3.5 btn-green
                            text-brand-navy hover:text-brand-navy dark:text-white text-xs font-extrabold
                            rounded-xl shadow-glow-green transition-all flex
                            items-center justify-center space-x-2 uppercase tracking-wider
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {enviando ? t.sendingBtn : t.sendBtn}
                  </span>
                </button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-serif text-xl font-bold text-brand-navy dark:text-white">{t.successTitle}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {language === 'es' ? (
                    <>Gracias <strong className="text-brand-navy dark:text-white">{formData.name}</strong>. Responderemos a tu correo (<span className="text-brand-forest dark:text-brand-lime">{formData.email}</span>) a la brevedad.</>
                  ) : (
                    <>Thank you <strong className="text-brand-navy dark:text-white">{formData.name}</strong>. We will reply to your email (<span className="text-brand-forest dark:text-brand-lime">{formData.email}</span>) shortly.</>
                  )}
                </p>
                <button
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      subject: '',
                      message: '',
                    });
                    setMotivo('');
                    setErrorEnvio('');
                    setSubmitted(false);
                  }}
                  className="px-6 py-2.5 bg-white/10 text-brand-navy dark:text-white text-xs font-semibold rounded-xl hover:bg-white/20 transition-colors"
                >
                  {t.sendAnotherBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
