import { useEffect, useState } from 'react';
import { ReplyDraftForm } from './ReplyDraftForm';
import { tienePermiso } from '../services/permisos';
import { apiAdmin } from '../services/apiAdmin';
import { adminTexts } from '../lib/adminI18n';
import type { Language } from '../types';

interface MensajeContacto {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

interface AdminMessagesViewProps {
  language?: Language;
}

export const AdminMessagesView = ({ language = 'es' }: AdminMessagesViewProps) => {
  const txt = adminTexts[language].messages;
  const [mensajes, setMensajes] = useState<MensajeContacto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargarMensajes() {
      try {
        const respuesta = await apiAdmin('/api/v1/contact-messages', {
          signal: controller.signal,
        });

        if (respuesta.status === 401) {
          throw new Error(txt.sessionExpired);
        }

        if (respuesta.status === 403) {
          throw new Error(txt.noPermission);
        }

        if (!respuesta.ok) {
          throw new Error(txt.loadError);
        }

        const datos: MensajeContacto[] = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error('La API no devolvió una lista de mensajes.');
        }

        setMensajes(datos);
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error('Error al cargar mensajes:', error);

        setError(
          error instanceof Error
            ? error.message
            : txt.loadError
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarMensajes();

    return () => controller.abort();
  }, [language, txt.sessionExpired, txt.noPermission, txt.loadError]);

  const puedeResponder =
    tienePermiso('contact_messages:read') &&
    tienePermiso('contact_messages:reply');

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white">
          {txt.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {txt.subtitle}
        </p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 dark:text-slate-300">
          {txt.loading}
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}

      {!cargando && !error && mensajes.length === 0 && (
        <p className="text-slate-600 dark:text-slate-300">
          {txt.empty}
        </p>
      )}

      {!cargando && !error && mensajes.map((mensaje) => (
        <details
          key={mensaje.id}
          className="rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy"
        >
          <summary className="cursor-pointer p-5 text-brand-navy dark:text-white">
            <span className="font-bold break-words">
              {mensaje.subject}
            </span>

            <span className="mt-2 block text-sm text-slate-600 dark:text-slate-300 break-words">
              {mensaje.name} · {mensaje.email}
            </span>

            <span className="mt-2 block text-xs text-brand-green">
              {txt.status[mensaje.status]}
              {' · '}
              {new Date(mensaje.created_at).toLocaleString(language === 'es' ? 'es-CR' : 'en-US')}
            </span>
          </summary>

          <div className="border-t border-slate-200 dark:border-brand-border p-5">
            <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
              {mensaje.message}
            </p>

            {puedeResponder && (
              <ReplyDraftForm mensajeId={mensaje.id} language={language} />
            )}
          </div>
        </details>
      ))}
    </section>
  );
};