import { useEffect, useState } from 'react';
import { apiAdmin } from '../services/apiAdmin';
import { adminTexts } from '../lib/adminI18n';
import type { Language } from '../types';

interface ContactoNewsletter {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface ListadoNewsletter {
  contactos: ContactoNewsletter[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

interface AdminNewsletterViewProps {
  language?: Language;
}

export const AdminNewsletterView = ({ language = 'es' }: AdminNewsletterViewProps) => {
  const txt = adminTexts[language].newsletter;
  const [datos, setDatos] = useState<ListadoNewsletter | null>(null);
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState('');
  const [actualizacion, setActualizacion] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargarContactos() {
      setCargando(true);
      setError('');

      try {
        const parametros = new URLSearchParams({
          pagina: String(pagina),
          limite: '20',
        });

        if (estado) {
          parametros.set('estado', estado);
        }

        if (busqueda) {
            parametros.set('busqueda', busqueda);
        
        }
        const respuesta = await apiAdmin(
          `/api/v1/newsletter/contacts?${parametros.toString()}`,
          { signal: controller.signal }
        );

        const resultado = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(
            resultado?.message ?? 'No se pudieron cargar los contactos.'
          );
        }

        if (
          !Array.isArray(resultado?.contactos) ||
          typeof resultado.total !== 'number' ||
          typeof resultado.total_paginas !== 'number'
        ) {
          throw new Error('La API devolvió una respuesta inesperada.');
        }

        if (!controller.signal.aborted) {
          // Si el total disminuyó, vuelve a una página existente.
          if (
            pagina > 1 &&
            pagina > Math.max(1, resultado.total_paginas)
          ) {
            setPagina(Math.max(1, resultado.total_paginas));
            return;
          }

          setDatos(resultado);
        }
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
  }, [pagina, estado, actualizacion, busqueda]);

  const botonClass =
    'rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ' +
    'text-white hover:bg-white/20 disabled:opacity-50 ' +
    'disabled:cursor-not-allowed';

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-white">
          {txt.title}
        </h2>

        <p className="text-sm text-slate-300">
          {txt.subtitle}
        </p>
      </div>

      <form
        onSubmit={(event) => {
            event.preventDefault();
            setPagina(1);
            setBusqueda(textoBusqueda.trim());
            setActualizacion((valor) => valor + 1);
        }}
        className="flex flex-wrap items-end gap-3"
        >
        <div className="w-full sm:max-w-sm">
            <label
            htmlFor="newsletter-busqueda"
            className="mb-1 block text-sm text-slate-300"
            >
            {txt.searchPlaceholder}
            </label>

            <input
            id="newsletter-busqueda"
            type="search"
            maxLength={254}
            value={textoBusqueda}
            onChange={(event) => setTextoBusqueda(event.target.value)}
            placeholder={txt.searchPlaceholder}
            className="w-full rounded-xl border border-brand-border
                        bg-brand-navyDark px-3 py-2 text-white"
            />
        </div>

        <button
            type="submit"
            disabled={cargando}
            className={botonClass}
        >
            {language === 'es' ? 'Buscar' : 'Search'}
        </button>

        <button
            type="button"
            disabled={cargando}
            onClick={() => {
            setTextoBusqueda('');
            setBusqueda('');
            setPagina(1);
            setActualizacion((valor) => valor + 1);
            }}
            className={botonClass}
        >
            {language === 'es' ? 'Limpiar' : 'Clear'}
        </button>
      </form>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="newsletter-estado"
            className="mb-1 block text-sm text-slate-300"
          >
            {language === 'es' ? 'Estado de suscripción' : 'Subscription status'}
          </label>

          <select
            id="newsletter-estado"
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value);
              setPagina(1);
            }}
            className="fc-select rounded-xl border border-brand-border
                       bg-brand-navyDark px-3 py-2 text-white"
          >
            <option value="">{txt.filterAll}</option>
            {Object.entries(txt.status).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={cargando}
          onClick={() => setActualizacion((valor) => valor + 1)}
          className={botonClass}
        >
          {language === 'es' ? 'Actualizar' : 'Refresh'}
        </button>

        <a
          href="https://us5.admin.mailchimp.com/audience/contacts/"
          target="_blank"
          rel="noopener noreferrer"
          className={botonClass}
        >
          {txt.manageLink}
        </a>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          {txt.loading}
        </p>
      )}

      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}

      {!cargando && !error && datos && (
        <>
          <p className="text-sm text-slate-300">
            {txt.totalSubscribers} {datos.total}
          </p>

          {datos.contactos.length === 0 ? (
            <p className="text-slate-300">
              {txt.empty}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-brand-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-navy text-white">
                  <tr>
                    <th scope="col" className="px-4 py-3">{language === 'es' ? 'Nombre' : 'First Name'}</th>
                    <th scope="col" className="px-4 py-3">{language === 'es' ? 'Apellido' : 'Last Name'}</th>
                    <th scope="col" className="px-4 py-3">{txt.table.email}</th>
                    <th scope="col" className="px-4 py-3">{txt.table.status}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10 text-slate-200">
                  {datos.contactos.map((contacto) => (
                    <tr key={contacto.id}>
                      <td className="px-4 py-3">
                        {contacto.first_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {contacto.last_name || '—'}
                      </td>
                      <td className="px-4 py-3 break-all">
                        {contacto.email}
                      </td>
                      <td className="px-4 py-3">
                        {(txt.status as Record<string, string>)[contacto.status] ??
                          contacto.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => setPagina((valor) => valor - 1)}
              className={botonClass}
            >
              {txt.pagination.prev}
            </button>

            <span className="text-sm text-slate-300">
              {txt.pagination.page
                .replace('{current}', String(datos.pagina))
                .replace('{total}', String(Math.max(1, datos.total_paginas)))}
            </span>

            <button
              type="button"
              disabled={pagina >= datos.total_paginas}
              onClick={() => setPagina((valor) => valor + 1)}
              className={botonClass}
            >
              {txt.pagination.next}
            </button>
          </div>
        </>
      )}
    </section>
  );
};