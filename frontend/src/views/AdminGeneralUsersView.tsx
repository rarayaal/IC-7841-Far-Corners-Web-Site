import { useEffect, useState, type FormEvent } from 'react';
import { apiAdmin } from '../services/apiAdmin';

interface UsuarioGeneral {
  id: string;
  full_name: string;
  email: string;
  role: 'visitor' | 'user';
  status: 'active' | 'inactive';
  participant_type: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminGeneralUsersView = () => {
  const [usuarios, setUsuarios] = useState<UsuarioGeneral[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [actualizacion, setActualizacion] = useState(0);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function cargarUsuarios() {
      setCargando(true);
      setError('');

      try {
        const respuesta = await apiAdmin(
          '/api/v1/admin/general-users',
          { signal: controller.signal }
        );

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          throw new Error(
            datos?.message ?? 'No se pudieron cargar los usuarios.'
          );
        }

        if (!Array.isArray(datos)) {
          throw new Error('La API no devolvió una lista de usuarios.');
        }

        if (!controller.signal.aborted) {
          setUsuarios(datos);
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

    void cargarUsuarios();

    return () => controller.abort();
  }, [actualizacion]);

  function cerrarFormulario() {
    setFormularioAbierto(false);
    setEditando(null);
    setNombre('');
    setCorreo('');
    setPassword('');
  }

  function abrirCreacion() {
    cerrarFormulario();
    setError('');
    setConfirmacion('');
    setFormularioAbierto(true);
  }

  function abrirEdicion(usuario: UsuarioGeneral) {
    setEditando(usuario.id);
    setNombre(usuario.full_name);
    setCorreo(usuario.email);
    setPassword('');
    setError('');
    setConfirmacion('');
    setFormularioAbierto(true);
  }

  async function guardarUsuario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (procesando) return;

    setError('');
    setConfirmacion('');

    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (
      !editando &&
      (
        password.length < 12 ||
        new TextEncoder().encode(password).length > 72
      )
    ) {
      setError(
        'La contraseña debe tener al menos 12 caracteres y no superar 72 bytes.'
      );
      return;
    }

    setProcesando(true);

    try {
      const respuesta = await apiAdmin(
        editando
          ? `/api/v1/admin/general-users/${editando}`
          : '/api/v1/admin/general-users',
        {
          method: editando ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: nombre.trim(),
            email: correo.trim(),
            ...(!editando ? { password } : {}),
          }),
        }
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ?? 'No se pudo guardar el usuario.'
        );
      }

      if (!datos?.usuario?.id) {
        throw new Error('La API devolvió una respuesta inesperada.');
      }

      const usuario: UsuarioGeneral = datos.usuario;

      setUsuarios((actuales) =>
        editando
          ? actuales.map((actual) =>
              actual.id === usuario.id ? usuario : actual
            )
          : [usuario, ...actuales]
      );

      cerrarFormulario();
      setConfirmacion(datos.message ?? 'Usuario guardado correctamente.');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setProcesando(false);
    }
  }

  async function cambiarEstado(usuario: UsuarioGeneral) {
    if (procesando) return;

    const nuevoEstado =
      usuario.status === 'active' ? 'inactive' : 'active';

    const accion =
      nuevoEstado === 'inactive' ? 'desactivar' : 'reactivar';

    if (!window.confirm(`¿Deseas ${accion} a ${usuario.full_name}?`)) {
      return;
    }

    setError('');
    setConfirmacion('');
    setProcesando(true);

    try {
      const respuesta = await apiAdmin(
        `/api/v1/admin/general-users/${usuario.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nuevoEstado }),
        }
      );

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          datos?.message ?? 'No se pudo cambiar el estado.'
        );
      }

      if (!datos?.usuario?.id) {
        throw new Error('La API devolvió una respuesta inesperada.');
      }

      const actualizado: UsuarioGeneral = datos.usuario;

      setUsuarios((actuales) =>
        actuales.map((actual) =>
          actual.id === actualizado.id ? actualizado : actual
        )
      );

      setConfirmacion(
        datos.message ?? 'Estado actualizado correctamente.'
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setProcesando(false);
    }
  }

  const botonClass =
    'rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold ' +
    'text-white hover:bg-white/20 disabled:opacity-50 ' +
    'disabled:cursor-not-allowed';

  const inputClass =
    'w-full rounded-xl border border-brand-border ' +
    'bg-brand-navyDark px-3 py-2 text-white';

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-white">
          Usuarios generales
        </h2>
        <p className="text-sm text-slate-300">
          Gestión de cuentas sin acceso al panel administrativo.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={abrirCreacion}
          disabled={cargando || procesando || formularioAbierto}
          className={botonClass}
        >
          Crear usuario
        </button>

        <button
          type="button"
          onClick={() => {
            setConfirmacion('');
            setActualizacion((valor) => valor + 1);
          }}
          disabled={cargando || procesando || formularioAbierto}
          className={botonClass}
        >
          Actualizar
        </button>
      </div>

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

      {formularioAbierto && (
        <form
          onSubmit={guardarUsuario}
          className="rounded-2xl border border-brand-border bg-brand-navy p-5"
        >
          <fieldset disabled={procesando} className="space-y-4">
            <h3 className="font-bold text-white">
              {editando ? 'Editar usuario' : 'Crear usuario'}
            </h3>

            <div>
              <label
                htmlFor="usuario-general-nombre"
                className="mb-1 block text-sm text-slate-300"
              >
                Nombre completo
              </label>
              <input
                id="usuario-general-nombre"
                required
                maxLength={200}
                autoComplete="off"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="usuario-general-correo"
                className="mb-1 block text-sm text-slate-300"
              >
                Correo electrónico
              </label>
              <input
                id="usuario-general-correo"
                type="email"
                required
                maxLength={254}
                autoComplete="off"
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
                className={inputClass}
              />
            </div>

            {!editando && (
              <div>
                <label
                  htmlFor="usuario-general-password"
                  className="mb-1 block text-sm text-slate-300"
                >
                  Contraseña
                </label>
                <input
                  id="usuario-general-password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Al menos 12 caracteres. Máximo 72 bytes.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className={botonClass}
              >
                {procesando ? 'Guardando…' : 'Guardar'}
              </button>

              <button
                type="button"
                onClick={cerrarFormulario}
                className={botonClass}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {cargando && (
        <p role="status" className="text-slate-300">
          Cargando usuarios…
        </p>
      )}

      {!cargando && !error && usuarios.length === 0 && (
        <p className="text-slate-300">
          No hay usuarios generales registrados.
        </p>
      )}

      {!cargando && usuarios.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-navy text-white">
              <tr>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3">Correo</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 text-slate-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-3">{usuario.full_name}</td>
                  <td className="px-4 py-3 break-all">{usuario.email}</td>
                  <td className="px-4 py-3">
                    {usuario.status === 'active' ? 'Activo' : 'Inactivo'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(usuario)}
                        disabled={procesando || formularioAbierto}
                        className={botonClass}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => void cambiarEstado(usuario)}
                        disabled={procesando || formularioAbierto}
                        className={botonClass}
                      >
                        {usuario.status === 'active'
                          ? 'Desactivar'
                          : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};