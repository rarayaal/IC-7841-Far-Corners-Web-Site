import { useState } from 'react';
import type { FormEvent } from 'react';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import type { Language } from '../types';
import { getTranslations } from '../lib/i18n';

interface RegisterViewProps {
  language: Language;
  onNavigateToLogin?: () => void;
  onSesionIniciada?: () => void;
}

export const RegisterView = ({
  language,
  onNavigateToLogin,
  onSesionIniciada,
}: RegisterViewProps) => {
  const t = getTranslations(language).auth;
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const inputClass =
    'w-full px-4 py-3 bg-[#F8F8F2] dark:bg-brand-navyDark border border-slate-200 dark:border-brand-border ' +
    'rounded-xl text-brand-navy dark:text-white focus:border-brand-green focus:outline-none';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (enviando) return;

    setError('');
    setMensaje('');

    if (!nombre.trim()) {
      setError(t.errors.fullNameRequired);
      return;
    }

    if (password !== confirmacion) {
      setError(t.errors.passwordsDoNotMatch);
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch('/api/v1/users/register', {
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
            : t.errors.registerFailed
        );
        return;
      }

      setMensaje(t.success.accountCreated);

      setNombre('');
      setCorreo('');
      setPassword('');
      setConfirmacion('');
    } catch {
      setError(t.errors.serverError);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-8 space-y-3">
        <h1 className="font-serif text-4xl font-bold text-brand-navy dark:text-white">
          {t.registerTitle}
        </h1>

        <p className="text-slate-600 dark:text-slate-300">
          {t.registerSubtitle}
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy border border-slate-200 dark:border-brand-border rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              {t.fullName}
            </label>

            <input
              id="register-name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              maxLength={200}
              placeholder={t.fullNamePlaceholder}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              {t.email}
            </label>

            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder={t.emailPlaceholder}
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              {t.password}
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
              className="text-xs text-slate-500 dark:text-slate-400 mt-2"
            >
              {t.passwordHelp}
            </p>
          </div>

          <div>
            <label
              htmlFor="register-confirmation"
              className="block text-sm text-slate-600 dark:text-slate-300 mb-2"
            >
              {t.confirmPassword}
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
            <p role="status" className="text-sm text-slate-700 dark:text-slate-200">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 btn-green
                        text-brand-navy hover:text-brand-navy dark:text-white font-bold
                        rounded-xl transition-colors
                        disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? t.creatingAccountBtn : t.createAccountBtn}
          </button>
        </form>

        {/* Separador de autenticación federada */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-brand-navy px-3 text-slate-500 dark:text-slate-400 font-medium">
              {t.orContinueWith}
            </span>
          </div>
        </div>

        {/* Botón de Google OAuth */}
        <GoogleLoginButton
          language={language}
          buttonText="continue_with"
          onSuccess={(user) => {
            setError('');
            setMensaje(t.googleSuccess(user?.full_name || ''));
            onSesionIniciada?.();
          }}
          onError={(errMsg) => {
            setError(errMsg);
          }}
        />

        {onNavigateToLogin && (
          <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-6">
            {t.alreadyHaveAccount}{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-brand-green hover:underline font-semibold"
            >
              {t.signInHere}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};