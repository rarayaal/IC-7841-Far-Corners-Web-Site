interface OpcionesAdmin {
  /** Permite llamar endpoints publicos (por ejemplo, la busqueda) sin sesion. */
  tokenOpcional?: boolean;
}

export async function apiAdmin(
  ruta: string,
  opciones: RequestInit = {},
  { tokenOpcional = false }: OpcionesAdmin = {}
): Promise<Response> {
  let token: string | null = null;

  try {
    token = localStorage.getItem('auth_token');
  } catch {
    token = null;
  }

  if (!token && !tokenOpcional) {
    throw new Error('Debes iniciar sesión.');
  }

  const headers = new Headers(opciones.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (opciones.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const respuesta = await fetch(ruta, {
    ...opciones,
    headers,
  });

  if (respuesta.status === 401) {
    throw new Error(
      'La sesión es inválida o expiró. Inicia sesión nuevamente.'
    );
  }

  if (respuesta.status === 403) {
    throw new Error('No tienes permisos para realizar esta acción.');
  }

  return respuesta;
}

/**
 * Variante tipada de apiAdmin: devuelve el JSON y lanza el mensaje de la API
 * cuando la respuesta no es exitosa.
 */
export async function apiAdminJson<T>(
  ruta: string,
  opciones: RequestInit = {},
  opcionesAdmin: OpcionesAdmin = {}
): Promise<T> {
  const respuesta = await apiAdmin(ruta, opciones, opcionesAdmin);
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje =
      (datos && (datos.message || datos.detail)) ||
      `Error ${respuesta.status} al comunicarse con el servidor.`;
    throw new Error(mensaje);
  }

  return datos as T;
}
