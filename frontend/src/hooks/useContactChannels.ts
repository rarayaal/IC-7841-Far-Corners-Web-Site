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

export function useContactChannels() {
  const [contactos, setContactos] = useState<ContactChannel[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargarContactos() {
      try {
        const respuesta = await fetch('/api/v1/contact-channels', {
          signal: controller.signal,
        });

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los medios de contacto.');
        }

        const datos: ContactChannel[] = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error('La API no devolvió una lista de contactos.');
        }

        setContactos(datos);
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
  }, []);

  return { contactos, cargando, error };
}