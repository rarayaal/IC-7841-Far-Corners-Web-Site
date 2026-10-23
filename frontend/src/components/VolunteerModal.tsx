import React, { useState } from 'react';
import { Language, Opportunity } from '../types';
import { X, UserCheck, CheckCircle2, Upload } from 'lucide-react';

interface VolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  language: Language;
}

export const VolunteerModal: React.FC<VolunteerModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  language,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [experience, setExperience] = useState('');
  const [fileName, setFileName] = useState('');

  if (!isOpen || !opportunity) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFileName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-navy border border-brand-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-brand-cream">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-brand-navyDark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white leading-tight">
                {language === 'es' ? 'Formulario de Postulación' : 'Application Form'}
              </h3>
              <p className="text-xs text-brand-lime font-semibold">
                {opportunity.title}
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-brand-navyDark p-3.5 rounded-xl border border-white/10 text-xs text-slate-300">
                <span className="font-bold text-white block">Ubicación y Duración:</span>
                <span className="text-slate-300">{opportunity.location} • {opportunity.period}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Sofia Watson"
                  className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sofia@email.com"
                    className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">País de Residencia *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Costa Rica / EE.UU..."
                    className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Experiencia / Motivación *</label>
                <textarea
                  required
                  rows={3}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Cuéntanos brevemente sobre tu formación en teatro, música o tu interés en participar..."
                  className="w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none"
                ></textarea>
              </div>

              {/* CV / Document Demo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adjuntar Hoja de Vida / Resumen (Opcional)</label>
                <div className="border border-dashed border-brand-border bg-brand-navyDark p-4 rounded-xl text-center cursor-pointer hover:border-brand-green transition-colors">
                  <Upload className="w-6 h-6 text-brand-green mx-auto mb-1" />
                  <span className="text-xs text-slate-300 block">
                    {fileName ? fileName : 'Haz clic para seleccionar archivo PDF o DOCX'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileName(e.target.files[0].name);
                      }
                    }}
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer text-xs text-brand-blue font-bold underline mt-1 inline-block">
                    Examinar archivo
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs"
              >
                Enviar Postulación Oficial
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">¡Postulación Recibida!</h4>
              <p className="text-sm text-slate-300">
                Gracias, <strong className="text-white">{fullName}</strong>. El equipo directivo de Far Corners evaluará tu perfil para el puesto de <span className="text-brand-lime font-bold">{opportunity.title}</span>.
              </p>
              <div className="p-4 bg-brand-navyDark rounded-xl border border-white/10 text-xs text-slate-300">
                Recibirás una notificación por correo electrónico (<span className="text-white">{email}</span>) para agendar una entrevista virtual.
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-brand-green text-brand-navy font-extrabold rounded-xl"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
