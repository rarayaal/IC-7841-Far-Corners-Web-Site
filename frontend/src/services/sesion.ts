export interface UsuarioSesion {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active';
  permissions: string[];
}

export const EVENTO_SESION = 'farcorners:sesion';

export function interpretarUsuario(valor: unknown): UsuarioSesion {
  if (typeof valor !== 'object' || valor === null) {
    throw new Error('La API no devolvió una cuenta válida.');
  }
  const u = valor as Record<string, unknown>;
  if (
    typeof u.id !== 'string' || !u.id ||
    typeof u.full_name !== 'string' || typeof u.email !== 'string' ||
    !['admin', 'manager', 'user'].includes(String(u.role)) ||
    u.status !== 'active' || !Array.isArray(u.permissions) ||
    !u.permissions.every((p: unknown) => typeof p === 'string')
  ) {
    throw new Error('La API no devolvió una cuenta activa válida.');
  }
  return {
    id: u.id, full_name: u.full_name, email: u.email,
    role: u.role as UsuarioSesion['role'], status: 'active',
    permissions: u.permissions as string[],
  };
}

export function guardarSesion(token: unknown, datosUsuario: unknown): UsuarioSesion {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('La API no devolvió una sesión válida.');
  }
  const usuario = interpretarUsuario(datosUsuario);
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(usuario));
  window.dispatchEvent(new Event(EVENTO_SESION));
  return usuario;
}

export function cerrarSesion(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.google?.accounts.id.disableAutoSelect?.();
  window.dispatchEvent(new Event(EVENTO_SESION));
}

export function puedeAccederAlPanel(usuario: UsuarioSesion | null): boolean {
  return usuario?.role === 'admin' || usuario?.role === 'manager';
}
