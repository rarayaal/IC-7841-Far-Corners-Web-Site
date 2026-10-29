import { useState, type FormEvent } from 'react';
import { apiAdmin } from '../services/apiAdmin';

interface ReplyDraftFormProps {
  mensajeId: string;
}

export const ReplyDraftForm = ({ mensajeId }: ReplyDraftFormProps) => {
  const [texto, setTexto] = useState('');
  const [idioma, setIdioma] = useState<'' | 'es' | 'en'>('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [advertencia, setAdvertencia] = useState(false);

  async function enviarRespuesta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (enviando) return;

    setError('');
    setConfirmacion('');
    setAdvertencia(false);

    const contenido = texto.trim();

    if (!contenido || contenido.length > 10000) {
      setError('La respuesta debe contener entre 1 y 10000 caracteres.');
      return;
    }

    if (!idioma) {
      setError('Selecciona el idioma de la respuesta.');
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await apiAdmin(
        `/api/v1/contact-messages/${mensajeId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            response_text: contenido,
            language: idioma,
          }),
        }
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ?? 'No se pudo confirmar el envío.'
        );
      }

      if (datos?.enviado !== true) {
        throw new Error('El servidor no confirmó el envío.');
      }

      setTexto('');
      setIdioma('');
      setAdvertencia(datos.advertencia === true);
      setConfirmacion(
        datos.message ?? 'Respuesta enviada correctamente.'
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Se perdió la conexión. Comprueba el estado del correo antes de volver a enviarlo.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviarRespuesta}
      className="mt-5 space-y-4 border-t border-brand-border pt-5"
    >
      <fieldset disabled={enviando} className="space-y-4">
        <div>
          <label
            htmlFor={`idioma-${mensajeId}`}
            className="mb-2 block text-sm font-bold text-white"
          >
            Idioma y remitente de la respuesta
          </label>

          <select
            id={`idioma-${mensajeId}`}
            required
            value={idioma}
            onChange={(evento) => {
              const valor = evento.target.value;

              if (valor === '' || valor === 'es' || valor === 'en') {
                setIdioma(valor);
              }

              setConfirmacion('');
            }}
            className="w-full rounded-xl border border-brand-border
                       bg-brand-navyDark p-3 text-sm text-white"
          >
            <option value="">Selecciona un idioma</option>
            <option value="es">
              Español — info@teatrofarcorners.org
            </option>
            <option value="en">
              Inglés — info@farcornersmusicals.org
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`respuesta-${mensajeId}`}
            className="mb-2 block text-sm font-bold text-white"
          >
            Redactar respuesta
          </label>

          <textarea
            id={`respuesta-${mensajeId}`}
            required
            maxLength={10000}
            rows={6}
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setConfirmacion('');
            }}
            placeholder="Escribe la respuesta en el idioma seleccionado…"
            className="w-full rounded-xl border border-brand-border
                       bg-brand-navyDark p-3 text-sm text-white
                       focus:border-brand-green focus:outline-none"
          />
        </div>

        <p className="text-xs text-slate-300">
          La respuesta se enviará por correo al visitante y se guardará
          en el sistema. El texto no se traduce automáticamente.
        </p>

        <button
          type="submit"
          disabled={enviando || !texto.trim() || !idioma}
          className="rounded-xl bg-brand-green px-4 py-2 text-sm
                     font-bold text-brand-navy hover:bg-brand-forest
                     hover:text-white disabled:cursor-not-allowed
                     disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : 'Enviar respuesta'}
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {confirmacion && (
        <p
          role="status"
          className={
            advertencia
              ? 'text-sm text-amber-300'
              : 'text-sm text-brand-green'
          }
        >
          {confirmacion}
        </p>
      )}
    </form>
  );
};