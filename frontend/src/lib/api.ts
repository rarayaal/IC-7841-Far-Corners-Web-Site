const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Peticion a la API con el token de sesion (si existe) y manejo de errores.
 * Lanza un Error con el mensaje de la API cuando la respuesta no es exitosa.
 */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  const respuesta = await fetch(path, { ...options, headers });
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje =
      (datos && (datos.message || datos.detail)) ||
      `Error ${respuesta.status} al comunicarse con el servidor.`;
    throw new Error(mensaje);
  }

  return datos as T;
}
