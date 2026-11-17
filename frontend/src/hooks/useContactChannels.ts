import type { Language } from '../types';
import { loadPublicContent } from '../services/publicLocalization';
import { useEffect, useState } from 'react';

export interface ContactChannel {
  id: string;
  channel_type:
    | 'address'
    | 'email'
    | 'phone'
    | 'whatsapp'
    | 'office_hours'
    | 'performance_hours'
    | 'international_location'
    | 'sinpe'
    | 'donation_url'
    | 'social';
  label: string;
  label_en: string | null;
  value: string;
  value_en: string | null;
  link_url: string | null;
  display_order: number;
}

export function useContactChannels(language: Language = 'es') {
  const [contactos, setContactos] = useState<ContactChannel[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargarContactos() {
      try {
        await loadPublicContent<ContactChannel[]>('/api/v1/contact-channels', language, controller.signal,
          datos => { setContactos(datos); setCargando(false); setError(''); });
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Error al cargar contactos:', error);

        setError(
          error instanceof Error
            ? error.message
            : 'No se pudo conectar con el servidor.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarContactos();

    return () => controller.abort();
  }, [language]);

  return { contactos, cargando, error };
}