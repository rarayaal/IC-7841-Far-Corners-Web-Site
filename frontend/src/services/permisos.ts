interface UsuarioSesion {
  role: string;
  permissions: string[];
}

function obtenerUsuarioSesion(): UsuarioSesion | null {
  try {
    const guardado = localStorage.getItem('auth_user');

    if (!guardado) return null;

    const usuario = JSON.parse(guardado);

    if (
      !usuario ||
      typeof usuario.role !== 'string' ||
      !Array.isArray(usuario.permissions)
    ) {
      return null;
    }

    return {
      role: usuario.role,
      permissions: usuario.permissions.filter(
        (permiso: unknown): permiso is string =>
          typeof permiso === 'string'
      ),
    };
  } catch {
    return null;
  }
}

export function tienePermiso(permiso: string): boolean {
  const usuario = obtenerUsuarioSesion();

  if (!usuario) return false;

  if (usuario.role === 'admin') return true;

  return (
    usuario.role === 'manager' &&
    usuario.permissions.includes(permiso)
  );
}