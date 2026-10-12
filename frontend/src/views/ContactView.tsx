import React, { useState } from 'react';
import { Language } from '../types';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock } from 'lucide-react';

interface ContactViewProps {
  language: Language;
}

export const ContactView: React.FC<ContactViewProps> = ({ language }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
        <div className="bg-[#002244] border border-[#1e4066] rounded-3xl p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-white border-b border-white/10 pb-3">Información de Contacto</h3>

            <div className="space-y-5 text-xs text-slate-300">
              <div className="flex items-start space-x-3.5">
                <MapPin className="w-5 h-5 text-[#77C65E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Sede Central y Teatro:</strong>
                  <span>Monteverde, Puntarenas, Costa Rica (Cerca de la Reserva Biológica Monteverde)</span>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Mail className="w-5 h-5 text-[#4A90D6] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Correo Institucional:</strong>
                  <span>info@farcornersmusicals.org</span>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Phone className="w-5 h-5 text-[#DCEB4F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Teléfono & WhatsApp:</strong>
                  <span>+506 2645-5000 / +506 8888-9999</span>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Clock className="w-5 h-5 text-[#77C65E] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Horario de Taquilla y Oficina:</strong>
                  <span>Lunes a Viernes: 9:00 AM - 5:00 PM</span>
                  <p className="text-[10px] text-slate-400">Días de función: Abierto hasta el inicio de la obra</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#00162e] border border-white/10 text-xs text-slate-300">
            <span className="font-bold text-white block">Ubicación Internacional:</span>
            <span>Programas activos en Costa Rica (Monteverde), China y Mozambique.</span>
          </div>
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
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Escribe aquí tu consulta en detalle..."
                    className="w-full px-3.5 py-2.5 bg-[#00162e] border border-[#1e4066] rounded-lg text-xs text-white focus:border-[#77C65E] focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#77C65E] hover:bg-[#008047] text-[#002244] hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensaje a la Organización</span>
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
                  onClick={() => setSubmitted(false)}
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
