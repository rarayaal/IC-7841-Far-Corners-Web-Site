import { Mail, Phone, MapPin, Clock, Globe } from 'lucide-react';
import type { Language } from '../types';
import type { ContactChannel } from '../hooks/useContactChannels';

interface ContactChannelsListProps {
  contactos: ContactChannel[];
  language: Language;
}

function obtenerIcono(tipo: ContactChannel['channel_type']) {
  switch (tipo) {
    case 'email':
      return Mail;

    case 'phone':
    case 'whatsapp':
    case 'sinpe':
      return Phone;

    case 'address':
    case 'international_location':
      return MapPin;

    case 'office_hours':
    case 'performance_hours':
      return Clock;

    default:
      return Globe;
  }
}

export const ContactChannelsList = ({
  contactos,
  language,
}: ContactChannelsListProps) => {
  return (
    <div className="space-y-5 text-xs text-slate-600 dark:text-slate-300">
      {contactos.map((contacto) => {
        const Icono = obtenerIcono(contacto.channel_type);

        const titulo =
          language === 'en'
            ? contacto.label_en?.trim() || contacto.label
            : contacto.label;

        const contenido =
          language === 'en'
            ? contacto.value_en?.trim() || contacto.value
            : contacto.value;

        const enlace = contacto.link_url?.trim();

        const enlacePermitido =
          enlace && /^(https?:\/\/|mailto:|tel:)/i.test(enlace);

        return (
          <div
            key={contacto.id}
            className="flex items-start gap-3"
          >
            <Icono
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-green"
            />

            <div className="min-w-0">
              <strong className="block text-brand-navy dark:text-white">
                {titulo}
              </strong>

              {enlacePermitido ? (
                <a
                  href={enlace}
                  className="whitespace-pre-wrap break-words hover:text-brand-green underline"
                >
                  {contenido}
                </a>
              ) : (
                <span className="whitespace-pre-wrap break-words">
                  {contenido}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};