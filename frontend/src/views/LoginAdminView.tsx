import { useState } from 'react';
import type { FormEvent } from 'react';

interface LoginAdminViewProps {
  onLoginCorrecto: () => void;
}

export const LoginAdminView = ({
  onLoginCorrecto,
}: LoginAdminViewProps) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setError('');
    setEnviando(true);

    try {
      const respuesta = await fetch('/api/v1/auth/loginAdmin', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: correo.trim(),
          contrasenia: password,
        }),
      });

      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setError(
          typeof datos?.message === 'string'
            ? datos.message
            : 'No se pudo iniciar sesión.'
        );
        return;
      }

      setPassword('');
      onLoginCorrecto();
    } catch {
      setError('No se pudo conectar con la API.');
    } finally {
      setEnviando(false);
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-[#00162e] border border-[#1e4066] ' +
    'rounded-xl text-white focus:border-[#77C65E] focus:outline-none';

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-8 space-y-3">
        <h1 className="font-serif text-4xl font-bold text-white">
          Acceso administrativo
        </h1>

        <p className="text-slate-300">
          Ingresa con tu cuenta de administrador.
        </p>
      </div>

      <div className="bg-[#002244] border border-[#1e4066] rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm text-slate-300 mb-2"
            >
              Correo electrónico
            </label>

            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm text-slate-300 mb-2"
            >
              Contraseña
            </label>

            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
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
            {enviando ? 'Verificando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};