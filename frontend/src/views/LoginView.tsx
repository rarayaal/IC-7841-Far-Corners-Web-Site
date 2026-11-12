import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Language } from '../types';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { guardarSesion } from '../services/sesion';

interface LoginViewProps {
  language: Language;
  onLoginCorrecto: () => void;
}

export const LoginView = ({ language, onLoginCorrecto }: LoginViewProps) => {
  const es = language === 'es';
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [googleEnviando, setGoogleEnviando] = useState(false);
  const ocupado = enviando || googleEnviando;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ocupado) return;
    setError('');
    setEnviando(true);
    try {
      const respuesta = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: correo.trim(), password }),
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        throw new Error(datos?.detail || datos?.message ||
          (es ? 'No se pudo iniciar sesión.' : 'Unable to sign in.'));
      }
      guardarSesion(datos?.data?.token, datos?.data?.user);
      setPassword('');
      onLoginCorrecto();
    } catch (err) {
      setError(err instanceof Error ? err.message :
        (es ? 'No se pudo conectar con la API.' : 'Unable to connect to the API.'));
    } finally {
      setEnviando(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-brand-navyDark border border-brand-border ' +
    'rounded-xl text-white focus:border-brand-green focus:outline-none';

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-8 space-y-3">
        <h1 className="font-serif text-4xl font-bold text-white">
          {es ? 'Iniciar sesión' : 'Sign in'}
        </h1>
        <p className="text-slate-300">
          {es ? 'Ingresa con tu cuenta de Far Corners.' : 'Sign in to your Far Corners account.'}
        </p>
      </div>
      <div className="bg-brand-navy border border-brand-border rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={ocupado} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm text-slate-300 mb-2">
                {es ? 'Correo electrónico' : 'Email address'}
              </label>
              <input id="login-email" name="email" type="email" autoComplete="username"
                required maxLength={254} value={correo}
                onChange={(event) => setCorreo(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm text-slate-300 mb-2">
                {es ? 'Contraseña' : 'Password'}
              </label>
              <input id="login-password" name="password" type="password" autoComplete="current-password"
                required maxLength={128} value={password}
                onChange={(event) => setPassword(event.target.value)} className={inputClass} />
            </div>
            <button type="submit" disabled={ocupado}
              className="w-full py-3 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {enviando ? (es ? 'Verificando…' : 'Verifying…') : (es ? 'Iniciar sesión' : 'Sign in')}
            </button>
          </fieldset>
        </form>
        <div className="my-6 border-t border-white/10 pt-6">
          <GoogleLoginButton disabled={enviando} language={language}
            onLoadingChange={setGoogleEnviando}
            onSuccess={() => { setError(''); onLoginCorrecto(); }}
            onError={setError} />
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  );
};
