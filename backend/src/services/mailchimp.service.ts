import 'dotenv/config';

interface DatosSuscripcion {
  email: string;
  first_name: string;
  last_name: string;
}

interface RespuestaMailchimp {
  id?: string;
  status?: string;
  title?: string;
}

export class ErrorMailchimp extends Error {
  constructor(
    public readonly status: number,
    public readonly titulo: string
  ) {
    super('No se pudo completar la solicitud a Mailchimp.');
    this.name = 'ErrorMailchimp';
  }
}

export async function suscribirAlBoletin(
  datos: DatosSuscripcion
): Promise<void> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const servidor = process.env.MAILCHIMP_SERVER_PREFIX;
  const audiencia = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !servidor || !audiencia) {
    throw new Error('Falta configurar la conexión con Mailchimp.');
  }

  // Evita construir una dirección con un prefijo incorrecto.
  if (!/^us\d+$/.test(servidor)) {
    throw new Error('El servidor de Mailchimp no es válido.');
  }

  const autorizacion = Buffer
    .from(`farcorners:${apiKey}`)
    .toString('base64');

  const respuesta = await fetch(
    `https://${servidor}.api.mailchimp.com/3.0/lists/${
      encodeURIComponent(audiencia)
    }/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${autorizacion}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: datos.email,
        status: 'pending',
        merge_fields: {
          FNAME: datos.first_name,
          LNAME: datos.last_name,
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  const resultado: RespuestaMailchimp | null =
    await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorMailchimp(
      respuesta.status,
      resultado?.title ?? 'Error de Mailchimp'
    );
  }
}

export type EstadoNewsletter =
  | 'subscribed'
  | 'pending'
  | 'unsubscribed'
  | 'cleaned'
  | 'transactional';

interface ContactoMailchimp {
  id: string;
  email_address: string;
  status: string;
  merge_fields?: {
    FNAME?: string;
    LNAME?: string;
  };
}

interface ListadoMailchimp {
  members?: ContactoMailchimp[];
  total_items?: number;
  title?: string;
}

interface OpcionesListado {
  pagina: number;
  limite: number;
  estado?: EstadoNewsletter;
  busqueda?: string;
}

export async function obtenerContactosNewsletter({
  pagina,
  limite,
  estado,
  busqueda,
}: OpcionesListado) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const servidor = process.env.MAILCHIMP_SERVER_PREFIX;
  const audiencia = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !servidor || !audiencia) {
    throw new Error('Falta configurar la conexión con Mailchimp.');
  }

  if (!/^us\d+$/.test(servidor)) {
    throw new Error('El servidor de Mailchimp no es válido.');
  }

  if (
    !Number.isSafeInteger(pagina) ||
    pagina < 1 ||
    !Number.isInteger(limite) ||
    limite < 1 ||
    limite > 100 ||
    !Number.isSafeInteger((pagina - 1) * limite)
  ) {
    throw new Error('Los parámetros de paginación no son válidos.');
  }
  if (busqueda?.trim()) {
    return buscarContactosNewsletter({
        pagina,
        limite,
        ...(estado ? { estado } : {}),
        busqueda: busqueda.trim(),
    });
    }
  const parametros = new URLSearchParams({
    count: String(limite),
    offset: String((pagina - 1) * limite),
    sort_field: 'last_changed',
    sort_dir: 'DESC',
    fields: [
      'members.id',
      'members.email_address',
      'members.status',
      'members.merge_fields',
      'total_items',
    ].join(','),
  });

  if (estado) {
    parametros.set('status', estado);
  }

  const autorizacion = Buffer
    .from(`farcorners:${apiKey}`)
    .toString('base64');

  const respuesta = await fetch(
    `https://${servidor}.api.mailchimp.com/3.0/lists/${
      encodeURIComponent(audiencia)
    }/members?${parametros.toString()}`,
    {
      headers: {
        Authorization: `Basic ${autorizacion}`,
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  const datos: ListadoMailchimp | null =
    await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorMailchimp(
      respuesta.status,
      datos?.title ?? 'Error de Mailchimp'
    );
  }

  if (
    !Array.isArray(datos?.members) ||
    typeof datos.total_items !== 'number'
  ) {
    throw new Error('Mailchimp devolvió una respuesta inesperada.');
  }

  return {
    contactos: datos.members.map((contacto) => ({
      id: contacto.id,
      email: contacto.email_address,
      first_name: contacto.merge_fields?.FNAME ?? '',
      last_name: contacto.merge_fields?.LNAME ?? '',
      status: contacto.status,
    })),
    total: datos.total_items,
    pagina,
    limite,
    total_paginas: Math.ceil(datos.total_items / limite),
  };
}


interface ResultadoBusquedaMailchimp {
  exact_matches?: {
    members?: ContactoMailchimp[];
    total_items?: number;
  };
  full_search?: {
    members?: ContactoMailchimp[];
    total_items?: number;
  };
  title?: string;
}

async function buscarContactosNewsletter({
  pagina,
  limite,
  estado,
  busqueda,
}: OpcionesListado & { busqueda: string }) {
  const apiKey = process.env.MAILCHIMP_API_KEY!;
  const servidor = process.env.MAILCHIMP_SERVER_PREFIX!;
  const audiencia = process.env.MAILCHIMP_AUDIENCE_ID!;

  // La configuración y la paginación ya fueron validadas
  // por obtenerContactosNewsletter.
  const parametros = new URLSearchParams({
    query: busqueda,
    list_id: audiencia,
  });

  const autorizacion = Buffer
    .from(`farcorners:${apiKey}`)
    .toString('base64');

  const respuesta = await fetch(
    `https://${servidor}.api.mailchimp.com/3.0/search-members?${parametros}`,
    {
      headers: {
        Authorization: `Basic ${autorizacion}`,
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  const datos: ResultadoBusquedaMailchimp | null =
    await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorMailchimp(
      respuesta.status,
      datos?.title ?? 'Error de Mailchimp'
    );
  }

  if (
    !Array.isArray(datos?.exact_matches?.members) ||
    !Array.isArray(datos?.full_search?.members)
  ) {
    throw new Error('Mailchimp devolvió una respuesta inesperada.');
  }

  // Une coincidencias exactas y parciales sin duplicar contactos.
  const contactosUnicos = new Map<string, ContactoMailchimp>();

  for (const contacto of [
    ...datos.exact_matches.members,
    ...datos.full_search.members,
  ]) {
    contactosUnicos.set(contacto.id, contacto);
  }

  // Este endpoint no ofrece count/offset. Evitamos mostrar
  // un listado incompleto como si fuera el resultado completo.
  if (
    (datos.exact_matches.total_items ?? 0) >
      datos.exact_matches.members.length ||
    (datos.full_search.total_items ?? 0) >
      datos.full_search.members.length
  ) {
    throw new ErrorMailchimp(
      422,
      'Search Too Broad'
    );
  }

  const coincidencias = [...contactosUnicos.values()].filter(
    (contacto) => !estado || contacto.status === estado
  );

  const inicio = (pagina - 1) * limite;

  return {
    contactos: coincidencias
      .slice(inicio, inicio + limite)
      .map((contacto) => ({
        id: contacto.id,
        email: contacto.email_address,
        first_name: contacto.merge_fields?.FNAME ?? '',
        last_name: contacto.merge_fields?.LNAME ?? '',
        status: contacto.status,
      })),
    total: coincidencias.length,
    pagina,
    limite,
    total_paginas: Math.ceil(coincidencias.length / limite),
  };
}