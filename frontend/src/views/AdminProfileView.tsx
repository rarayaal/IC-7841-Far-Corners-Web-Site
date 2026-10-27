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

export const AdminProfileView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [nombre, setNombre] = useState('');
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
        if (activo)
          setError(e instanceof Error ? e.message : txt.profile.loadError);
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
      setError(txt.profile.nameRequired);
      return;
    }

    setGuardando(true);
    setError('');
    setAviso('');

    try {
      const datos = await api<{ data: Profile }>('/api/v1/me', {
        method: 'PUT',
        body: JSON.stringify({ full_name: nuevoNombre }),
      });

      setPerfil(datos.data);
      setNombre(datos.data.full_name);
      setAviso(txt.profile.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : txt.profile.saveError);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-white">
          {txt.profile.title}
        </h2>
        <p className="text-sm text-slate-300">{txt.profile.subtitle}</p>
      </div>

      {cargando && (
        <p role="status" className="text-slate-300">
          {txt.profile.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {perfil && (
        <form
          onSubmit={guardar}
          className="space-y-4 rounded-2xl border border-brand-border bg-brand-navy p-6"
        >
          <div>
            <label
              htmlFor="perfil-nombre"
              className="mb-1 block text-sm text-slate-300"
            >
              {txt.profile.name}
            </label>
            <input
              id="perfil-nombre"
              type="text"
              required
              maxLength={200}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-brand-navyDark p-3 text-sm text-white focus:border-brand-green focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-brand-navyDark border border-brand-border p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">
                {txt.profile.email}
              </p>
              <p className="text-white break-words">{perfil.email}</p>
            </div>
            <div className="rounded-xl bg-brand-navyDark border border-brand-border p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">
                {txt.profile.role}
              </p>
              <p className="text-white">{roleLabel(perfil.role, language)}</p>
            </div>
            <div className="rounded-xl bg-brand-navyDark border border-brand-border p-3">
              <p className="text-[11px] uppercase font-mono text-slate-400">
                {txt.profile.participantType}
              </p>
              <p className="text-white">
                {perfil.participant_type
                  ? participantTypeLabel(perfil.participant_type, language)
                  : '—'}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-brand-navy disabled:opacity-50"
          >
            {guardando ? txt.common.saving : txt.profile.save}
          </button>
        </form>
      )}

      {aviso && (
        <ToastRegion>
          <Toast
            message={aviso}
            onClose={() => setAviso('')}
            closeLabel={txt.common.closeNotification}
          />
        </ToastRegion>
      )}
    </section>
  );
};
