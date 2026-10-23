import { useEffect, useState } from 'react';
import { ReplyDraftForm } from './ReplyDraftForm';
import { tienePermiso } from '../services/permisos';
import { apiAdmin } from '../services/apiAdmin';

interface MensajeContacto {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

const etiquetasEstado = {
  new: 'Nuevo',
  read: 'Leído',
  replied: 'Respondido',
};

export const AdminMessagesView = () => {
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
          throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }

        if (respuesta.status === 403) {
          throw new Error('No tienes permiso para consultar los mensajes.');
        }

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los mensajes.');
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
            : 'Ocurrió un error al cargar los mensajes.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    void cargarMensajes();

    return () => controller.abort();
  }, []);
  const puedeResponder =
  tienePermiso('contact_messages:read') &&
  tienePermiso('contact_messages:reply');
  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-white">
          Mensajes de contacto
        </h2>
        <p className="text-sm text-slate-300">
          Consultas recibidas desde el formulario de contacto.
        </p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          Cargando mensajes...
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}

      {!cargando && !error && mensajes.length === 0 && (
        <p className="text-slate-300">
          Todavía no hay mensajes.
        </p>
      )}

      {!cargando && !error && mensajes.map((mensaje) => (
        <details
          key={mensaje.id}
          className="rounded-2xl border border-[#1e4066] bg-[#002244]"
        >
          <summary className="cursor-pointer p-5 text-white">
            <span className="font-bold break-words">
              {mensaje.subject}
            </span>

            <span className="mt-2 block text-sm text-slate-300 break-words">
              {mensaje.name} · {mensaje.email}
            </span>

            <span className="mt-2 block text-xs text-[#77C65E]">
              {etiquetasEstado[mensaje.status]}
              {' · '}
              {new Date(mensaje.created_at).toLocaleString('es-CR')}
            </span>
          </summary>

          <div className="border-t border-[#1e4066] p-5">
            <p className="whitespace-pre-wrap break-words text-sm text-slate-200">
              {mensaje.message}
            </p>

            {puedeResponder && (
              <ReplyDraftForm mensajeId={mensaje.id} />
            )}
          </div>
        </details>
      ))}
    </section>
  );
};