import React, { useState } from 'react';
import { Language } from '../types';
import { Send, CheckCircle2 } from 'lucide-react';
import { useContactChannels } from '../hooks/useContactChannels';
import { ContactChannelsList } from '../components/ContactChannelsList';

interface ContactViewProps {
  language: Language;
}

export const ContactView: React.FC<ContactViewProps> = ({ language }) => {
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
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      }),
    });

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
      setErrorEnvio(
        typeof datos?.message === 'string'
          ? datos.message
          : language === 'es'
            ? 'No se pudo enviar el mensaje.'
            : 'The message could not be sent.'
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#77C65E]/20 text-[#DCEB4F] text-xs font-bold uppercase tracking-wider border border-[#77C65E]/40">
          {language === 'es' ? 'Atención a la Comunidad' : 'Get in Touch'}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
          {language === 'es' ? 'Contacto y Canales Oficiales' : 'Contact Far Corners Theatre'}
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          {language === 'es'
            ? '¿Tienes preguntas sobre boletería, inscripciones al campamento o pasantías? Envíanos un mensaje directo.'
            : 'Have questions regarding ticket sales, camp enrollment, or internships? Reach out to us.'}
        </p>
      </div>

      {/* Main Aligned Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Contact Information Box */}
        <div className="bg-[#002244] border border-[#1e4066] rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-2xl font-bold text-white border-b border-white/10 pb-3">
            {language === 'es'
              ? 'Información de Contacto'
              : 'Contact Information'}
          </h3>

          {cargandoContactos && (
            <p role="status" className="text-xs text-slate-300">
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
              <p className="text-xs text-slate-300">
                {language === 'es'
                  ? 'No hay medios de contacto publicados.'
                  : 'No contact information is currently available.'}
              </p>
            )
          )}
        </div>

        {/* Contact Form Box */}
        <div className="bg-[#002244] border border-[#1e4066] rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-white border-b border-white/10 pb-3">Formulario Mensaje Directo</h3>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre..."
                      className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-lg text-xs text-white focus:border-[#77C65E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      maxLength={254}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@correo.com"
                      className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-lg text-xs text-white focus:border-[#77C65E] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Asunto *</label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Consulta sobre boletería / campamento / pasantías..."
                    className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-lg text-xs text-white focus:border-[#77C65E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mensaje *</label>
                  <textarea
                    required
                    rows={4}
                    maxLength={10000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Escribe aquí tu consulta en detalle..."
                    className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-lg text-xs text-white focus:border-[#77C65E] focus:outline-none"
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
                  className="w-full py-3.5 bg-[#77C65E] hover:bg-[#008047]
                            text-[#002244] hover:text-white text-xs font-extrabold
                            rounded-xl shadow-glow-green transition-all flex
                            items-center justify-center space-x-2 uppercase tracking-wider
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {enviando
                      ? language === 'es' ? 'Enviando…' : 'Sending…'
                      : language === 'es' ? 'Enviar mensaje' : 'Send message'}
                  </span>
                </button>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex p-3 rounded-full bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="font-serif text-xl font-bold text-white">¡Mensaje Enviado con Éxito!</h4>
                <p className="text-xs text-slate-300">
                  Gracias <strong className="text-white">{formData.name}</strong>. Responderemos a tu correo (<span className="text-[#DCEB4F]">{formData.email}</span>) a la brevedad.
                </p>
                <button
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      subject: '',
                      message: '',
                    });
                    setErrorEnvio('');
                    setSubmitted(false);
                  }}
                  className="px-6 py-2.5 bg-white/10 text-white text-xs font-semibold rounded-xl"
                >
                  Enviar Otro Mensaje
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
