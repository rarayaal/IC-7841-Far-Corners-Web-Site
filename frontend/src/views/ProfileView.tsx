import { useEffect, useState, type FormEvent } from 'react';
import { apiAdminJson as api } from '../services/apiAdmin';
import {
  adminTexts,
  participantTypeLabel,
  roleLabel,
} from '../lib/adminI18n';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  participant_type: string | null;
  status: string;
}

export const ProfileView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language].profile;
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [nombre, setNombre] = useState('');
  const [contraseniaActual, setContraseniaActual] = useState('');
  const [contraseniaNueva, setContraseniaNueva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const datos = await api<{ data: Profile }>('/api/v1/me');
        if (!activo) return;
        setPerfil(datos.data);
        setNombre(datos.data.full_name);
      } catch (e) {
        if (activo) setError(e instanceof Error ? e.message : txt.loadError);
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;

    const nuevoNombre = nombre.trim();
    if (!nuevoNombre) {
      setError(txt.nameRequired);
      return;
    }

    const quiereCambiarContrasenia = contraseniaNueva.length > 0;
    if (quiereCambiarContrasenia) {
      if (contraseniaNueva.length < 10 || contraseniaNueva.length > 128) {
        setError(txt.passwordLength);
        return;
      }
      if (!contraseniaActual) {
        setError(txt.passwordRequired);
        return;
      }
    }

    setGuardando(true);
    setError('');
    setAviso('');

    try {
      const datos = await api<{ data: Profile }>('/api/v1/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: nuevoNombre,
          ...(quiereCambiarContrasenia
            ? {
                current_password: contraseniaActual,
                new_password: contraseniaNueva,
              }
            : {}),
        }),
      });

      setPerfil(datos.data);
      setNombre(datos.data.full_name);
      setContraseniaActual('');
      setContraseniaNueva('');
      setAviso(
        quiereCambiarContrasenia ? txt.passwordChanged : txt.saved
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.saveError);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 space-y-5 animate-fadeIn">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">
          {txt.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {txt.subtitle}
        </p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-500 dark:text-slate-300">
          {txt.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-500 dark:text-red-300">
          {error}
        </p>
      )}

      {perfil && (
        <form
          onSubmit={guardar}
          className="space-y-5 rounded-2xl border border-brand-border bg-white dark:bg-brand-navy p-6"
        >
          <div>
            <label
              htmlFor="perfil-nombre"
              className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
            >
              {txt.name}
            </label>
            <input
              id="perfil-nombre"
              type="text"
              required
              maxLength={200}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-white dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 dark:bg-brand-navyDark border border-brand-border p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">
                {txt.email}
              </p>
              <p className="text-brand-navy dark:text-white break-words">{perfil.email}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-brand-navyDark border border-brand-border p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">
                {txt.role}
              </p>
              <p className="text-brand-navy dark:text-white">{roleLabel(perfil.role, language)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-brand-navyDark border border-brand-border p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">
                {txt.participantType}
              </p>
              <p className="text-brand-navy dark:text-white">
                {perfil.participant_type
                  ? participantTypeLabel(perfil.participant_type, language)
                  : '—'}
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t border-brand-border pt-5">
            <h2 className="font-serif text-lg font-bold text-brand-navy dark:text-white">
              {txt.passwordSection}
            </h2>
            <p className="text-xs text-slate-400">{txt.passwordHint}</p>
            <div>
              <label
                htmlFor="perfil-contrasenia-actual"
                className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
              >
                {txt.currentPassword}
              </label>
              <input
                id="perfil-contrasenia-actual"
                type="password"
                autoComplete="current-password"
                value={contraseniaActual}
                onChange={(e) => setContraseniaActual(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-white dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="perfil-contrasenia-nueva"
                className="mb-1 block text-sm text-slate-600 dark:text-slate-300"
              >
                {txt.newPassword}
              </label>
              <input
                id="perfil-contrasenia-nueva"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                value={contraseniaNueva}
                onChange={(e) => setContraseniaNueva(e.target.value)}
                className="w-full rounded-lg border border-brand-border bg-white dark:bg-brand-navyDark p-3 text-sm text-brand-navy dark:text-white focus:border-brand-green focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-navy disabled:opacity-50"
          >
            {guardando ? adminTexts[language].common.saving : txt.save}
          </button>
        </form>
      )}

      {aviso && (
        <ToastRegion>
          <Toast
            message={aviso}
            onClose={() => setAviso('')}
            closeLabel={adminTexts[language].common.closeNotification}
          />
        </ToastRegion>
      )}
    </section>
  );
};
