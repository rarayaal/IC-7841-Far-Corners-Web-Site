export async function apiAdmin(
  ruta: string,
  opciones: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('Debes iniciar sesión.');
  }

  const headers = new Headers(opciones.headers);
  headers.set('Authorization', `Bearer ${token}`);

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