import { useState, type FormEvent } from 'react';
import { apiAdmin } from '../services/apiAdmin';
import { adminTexts } from '../lib/adminI18n';
import type { Language } from '../types';

interface ReplyDraftFormProps {
  mensajeId: string;
  language?: Language;
}

export const ReplyDraftForm = ({ mensajeId, language = 'es' }: ReplyDraftFormProps) => {
  const txt = adminTexts[language].replyForm;
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
      setError(txt.charRangeError);
      return;
    }

    if (!idioma) {
      setError(txt.langRequiredError);
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
          datos?.message ?? (language === 'es' ? 'No se pudo confirmar el envío.' : 'Could not confirm delivery.')
        );
      }

      if (datos?.enviado !== true) {
        throw new Error(language === 'es' ? 'El servidor no confirmó el envío.' : 'Server did not confirm delivery.');
      }

      setTexto('');
      setIdioma('');
      setAdvertencia(datos.advertencia === true);
      setConfirmacion(
        datos.message ?? txt.success
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : (language === 'es'
              ? 'Se perdió la conexión. Comprueba el estado del correo antes de volver a enviarlo.'
              : 'Connection lost. Check email delivery status before retrying.')
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviarRespuesta}
      className="mt-5 space-y-4 border-t border-slate-200 dark:border-brand-border pt-5"
    >
      <fieldset disabled={enviando} className="space-y-4">
        <div>
          <label
            htmlFor={`idioma-${mensajeId}`}
            className="mb-2 block text-sm font-bold text-brand-navy dark:text-white"
          >
            {txt.languageLabel}
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
            className="fc-select w-full rounded-xl border border-slate-200 dark:border-brand-border
                       bg-[#F8F8F2] dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white"
          >
            <option value="">{txt.selectLanguage}</option>
            <option value="es">
              {txt.esOption}
            </option>
            <option value="en">
              {txt.enOption}
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`respuesta-${mensajeId}`}
            className="mb-2 block text-sm font-bold text-brand-navy dark:text-white"
          >
            {txt.composeLabel}
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
            placeholder={txt.placeholder}
            className="w-full rounded-xl border border-slate-200 dark:border-brand-border
                       bg-[#F8F8F2] dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white
                       focus:border-brand-green focus:outline-none"
          />
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          {txt.warningNotice}
        </p>

        <button
          type="submit"
          disabled={enviando || !texto.trim() || !idioma}
          className="rounded-xl bg-brand-green px-4 py-2 text-sm
                     font-bold text-brand-navy hover:bg-brand-forest
                     hover:text-brand-navy dark:text-white disabled:cursor-not-allowed
                     disabled:opacity-50"
        >
          {enviando ? txt.sendingBtn : txt.sendBtn}
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