import { useState, type FormEvent } from 'react';

interface ReplyDraftFormProps {
  mensajeId: string;
}

export const ReplyDraftForm = ({ mensajeId }: ReplyDraftFormProps) => {
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  async function guardarBorrador(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardando) return;

    const respuestaTexto = texto.trim();

    setError('');
    setConfirmacion('');

    if (!respuestaTexto || respuestaTexto.length > 10000) {
      setError('La respuesta debe contener entre 1 y 10000 caracteres.');
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        `/api/v1/contact-messages/${mensajeId}/replies`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            response_text: respuestaTexto,
          }),
        }
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ?? 'No se pudo guardar el borrador.'
        );
      }

      setTexto('');
      setConfirmacion(
        'Respuesta guardada correctamente. No se ha enviado por correo.'
        );
    } catch (error) {
      console.error('Error al guardar borrador:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={guardarBorrador}
      className="mt-5 space-y-3 border-t border-[#1e4066] pt-5"
    >
      <label
        htmlFor={`respuesta-${mensajeId}`}
        className="block text-sm font-bold text-white"
      >
        Redactar respuesta
      </label>

      <textarea
        id={`respuesta-${mensajeId}`}
        value={texto}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setConfirmacion('');
        }}
        required
        maxLength={10000}
        rows={5}
        disabled={guardando}
        placeholder="Escribe una respuesta para este mensaje..."
        className="w-full rounded-xl border border-[#1e4066] bg-[#00162e] p-3 text-sm text-white focus:border-[#77C65E] focus:outline-none disabled:opacity-60"
      />

      <p className="text-xs text-slate-300">
        La respuesta se guardará en el sistema. El envío por correo todavía
        no está habilitado.
        </p>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {confirmacion && (
        <p role="status" className="text-sm text-[#77C65E]">
          {confirmacion}
        </p>
      )}

      <button
        type="submit"
        disabled={guardando || !texto.trim()}
        className="rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] hover:bg-[#008047] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Guardar respuesta'}
      </button>
    </form>
  );
};