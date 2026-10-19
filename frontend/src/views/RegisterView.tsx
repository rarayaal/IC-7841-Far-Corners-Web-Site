import { useState } from 'react';
import type { FormEvent } from 'react';

export const RegisterView = () => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const inputClass =
    'w-full px-4 py-3 bg-[#00162e] border border-[#1e4066] ' +
    'rounded-xl text-white focus:border-[#77C65E] focus:outline-none';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setError('');
    setMensaje('');

    if (!nombre.trim()) {
        setError('Ingresa tu nombre completo.');
        return;
    }

    if (password !== confirmacion) {
        setError('Las contraseñas no coinciden.');
        return;
    }

    setEnviando(true);

    try {
        const respuesta = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            full_name: nombre.trim(),
            email: correo.trim(),
            contrasenia: password,
        }),
        });

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
        setError(
            typeof datos?.message === 'string'
            ? datos.message
            : 'No se pudo registrar la cuenta.'
        );
        return;
        }

        setMensaje('Cuenta creada correctamente. Ya puedes iniciar sesión.');

        setNombre('');
        setCorreo('');
        setPassword('');
        setConfirmacion('');
    } catch {
        setError(
        'No se pudo conectar con la API. Inténtalo nuevamente.'
        );
    } finally {
        setEnviando(false);
    }
    }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-8 space-y-3">
        <h1 className="font-serif text-4xl font-bold text-white">
          Crear una cuenta
        </h1>

        <p className="text-slate-300">
          Forma parte de la comunidad de Far Corners.
        </p>
      </div>

      <div className="bg-[#002244] border border-[#1e4066] rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm text-slate-300 mb-2"
            >
              Nombre completo
            </label>

            <input
              id="register-name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              maxLength={200}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-sm text-slate-300 mb-2"
            >
              Correo electrónico
            </label>

            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm text-slate-300 mb-2"
            >
              Contraseña
            </label>

            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              aria-describedby="register-password-help"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />

            <p
              id="register-password-help"
              className="text-xs text-slate-400 mt-2"
            >
              Usa entre 10 y 128 caracteres. Puedes usar una frase.
            </p>
          </div>

          <div>
            <label
              htmlFor="register-confirmation"
              className="block text-sm text-slate-300 mb-2"
            >
              Confirmar contraseña
            </label>

            <input
              id="register-confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}

          {mensaje && (
            <p role="status" className="text-sm text-slate-200">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 bg-[#77C65E] hover:bg-[#008047]
                        text-[#002244] hover:text-white font-bold
                        rounded-xl transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
        </form>
      </div>
    </div>
  );
};