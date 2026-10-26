import { useEffect, useState, type FormEvent } from 'react';
import type { ContactChannel } from '../hooks/useContactChannels';
import { apiAdmin } from '../services/apiAdmin';

interface ContactoAdmin extends ContactChannel {
  is_published: boolean;
}

const camposTexto = [
  ['label', 'Título en español', 200, true],
  ['label_en', 'Título en inglés', 200, false],
  ['value', 'Contenido en español', 10000, true],
  ['value_en', 'Contenido en inglés', 10000, false],
  ['link_url', 'Enlace opcional', 2048, false],
] as const;

export const AdminContactChannelsView = () => {
  const [contactos, setContactos] = useState<ContactoAdmin[]>([]);
  const [editando, setEditando] = useState<ContactoAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargarContactos() {
      try {
        const respuesta = await apiAdmin('/api/v1/contact-channels/admin', {
          signal: controller.signal,
        });

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(
            datos?.message ?? 'No se pudieron cargar los contactos.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error('La API no devolvió una lista de contactos.');
        }

        setContactos(datos);
      } catch (error) {
        if (controller.signal.aborted) return;

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

  function seleccionarContacto(contacto: ContactoAdmin) {
    setEditando({ ...contacto });
    setError('');
    setConfirmacion('');
  }

  async function guardarCambios(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!editando || guardando) return;

    setError('');
    setConfirmacion('');
    setGuardando(true);

    try {
      const respuesta = await apiAdmin(
        `/api/v1/contact-channels/${editando.id}`,
        {
          method: 'PUT',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            label: editando.label,
            label_en: editando.label_en,
            value: editando.value,
            value_en: editando.value_en,
            link_url: editando.link_url,
            display_order: editando.display_order,
            is_published: editando.is_published,
          }),
        }
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ?? 'No se pudo actualizar el contacto.'
        );
      }

      const actualizado: ContactoAdmin = datos.contacto;

      setContactos((actuales) =>
        actuales
          .map((contacto) =>
            contacto.id === actualizado.id ? actualizado : contacto
          )
          .sort(
            (a, b) =>
              a.display_order - b.display_order ||
              a.id.localeCompare(b.id)
          )
      );

      setEditando(null);
      setConfirmacion('Contacto actualizado correctamente.');
    } catch (error) {
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
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-white">
          Medios de contacto
        </h2>
        <p className="text-sm text-slate-300">
          Edita la información de contacto publicada en el sitio.
        </p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          Cargando contactos...
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {confirmacion && (
        <p role="status" className="text-sm text-brand-green">
          {confirmacion}
        </p>
      )}

      {!cargando && contactos.length === 0 && !error && (
        <p className="text-slate-300">
          No hay medios de contacto registrados.
        </p>
      )}

      {!editando && contactos.map((contacto) => (
        <article
          key={contacto.id}
          className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-navy p-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <h3 className="font-bold text-white break-words">
              {contacto.label}
            </h3>

            <p className="text-sm text-slate-300 whitespace-pre-wrap break-words">
              {contacto.value}
            </p>

            <p className="text-xs text-brand-green">
              {contacto.is_published ? 'Publicado' : 'Oculto'}
              {' · Orden: '}
              {contacto.display_order}
            </p>
          </div>

          <button
            type="button"
            onClick={() => seleccionarContacto(contacto)}
            className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            Editar
          </button>
        </article>
      ))}

      {editando && (
        <form
          onSubmit={guardarCambios}
          className="space-y-4 rounded-2xl border border-brand-border bg-brand-navy p-5"
        >
          <h3 className="font-bold text-white">
            Editar medio de contacto
          </h3>

          <fieldset disabled={guardando} className="space-y-4">
            {camposTexto.map(([campo, titulo, limite, obligatorio]) => (
              <div key={campo}>
                <label
                  htmlFor={`contacto-${campo}`}
                  className="mb-1 block text-sm text-slate-300"
                >
                  {titulo}{obligatorio ? ' *' : ''}
                </label>

                <textarea
                  id={`contacto-${campo}`}
                  rows={campo === 'value' || campo === 'value_en' ? 3 : 1}
                  required={obligatorio}
                  maxLength={limite}
                  value={editando[campo] ?? ''}
                  onChange={(evento) => {
                    const valor = evento.target.value;

                    setEditando((actual) =>
                      actual ? { ...actual, [campo]: valor } : actual
                    );
                  }}
                  className="w-full rounded-lg border border-brand-border bg-brand-navyDark p-3 text-sm text-white focus:border-brand-green focus:outline-none"
                />
              </div>
            ))}

            <div>
              <label
                htmlFor="contacto-orden"
                className="mb-1 block text-sm text-slate-300"
              >
                Orden de aparición *
              </label>

              <input
                id="contacto-orden"
                type="number"
                required
                min={0}
                max={2147483647}
                step={1}
                value={
                  Number.isNaN(editando.display_order)
                    ? ''
                    : editando.display_order
                }
                onChange={(evento) => {
                  const orden = evento.target.valueAsNumber;

                  setEditando((actual) =>
                    actual ? { ...actual, display_order: orden } : actual
                  );
                }}
                className="w-full rounded-lg border border-brand-border bg-brand-navyDark p-3 text-sm text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={editando.is_published}
                onChange={(evento) => {
                  const publicado = evento.target.checked;

                  setEditando((actual) =>
                    actual ? { ...actual, is_published: publicado } : actual
                  );
                }}
              />
              Publicado en el sitio
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-navy disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditando(null);
                  setError('');
                }}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
};