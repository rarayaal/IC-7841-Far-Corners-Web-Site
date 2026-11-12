import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { guardarSesion } from '../services/sesion';
import type { UsuarioSesion } from '../services/sesion';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: {
            type?: 'standard' | 'icon';
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            width?: number;
            locale?: string;
          }) => void;
          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

let cargaGoogle: Promise<void> | null = null;
function cargarGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (cargaGoogle) return cargaGoogle;
  cargaGoogle = new Promise<void>((resolve, reject) => {
    const existente = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    const script = existente || document.createElement('script');
    script.addEventListener('load', () => {
      if (window.google?.accounts?.id) resolve();
      else { script.remove(); reject(new Error('Google Identity Services no está disponible.')); }
    }, { once: true });
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error('No se pudo cargar el inicio de sesión con Google.'));
    }, { once: true });
    if (!existente) {
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }).catch((error) => { cargaGoogle = null; throw error; });
  return cargaGoogle;
}

interface GoogleLoginButtonProps {
  onSuccess?: (usuario: UsuarioSesion) => void;
  onError?: (message: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  buttonText?: 'signin_with' | 'signup_with' | 'continue_with';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  language?: Language;
  disabled?: boolean;
}

export const GoogleLoginButton = (props: GoogleLoginButtonProps) => {
  const { buttonText = 'continue_with', theme = 'outline', language = 'es', disabled = false } = props;
  const callbacks = useRef(props);
  callbacks.current = props;
  const buttonRef = useRef<HTMLDivElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const ocupado = useRef(false);
  const [loading, setLoading] = useState(false);
  const [preparado, setPreparado] = useState(false);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    contenedorRef.current?.toggleAttribute('inert', disabled || loading);
  }, [disabled, loading]);

  useEffect(() => {
    if (!clientId) return;
    let activo = true;
    let peticion: AbortController | undefined;
    setPreparado(false);

    async function autenticar(response: { credential: string }) {
      if (!activo || ocupado.current || callbacks.current.disabled) return;
      if (!response.credential) {
        callbacks.current.onError?.('No se recibió la credencial de Google.');
        return;
      }
      ocupado.current = true;
      setLoading(true);
      callbacks.current.onLoadingChange?.(true);
      peticion = new AbortController();
      try {
        const res = await fetch('/api/v1/auth/google', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: response.credential }), signal: peticion.signal,
        });
        const data = await res.json().catch(() => null);
        if (!activo) return;
        if (!res.ok) throw new Error(data?.detail || data?.message || 'No se pudo iniciar sesión con Google.');
        const usuario = guardarSesion(data?.data?.token, data?.data?.user);
        callbacks.current.onSuccess?.(usuario);
      } catch (error) {
        if (activo) callbacks.current.onError?.(error instanceof Error ? error.message : 'Error de conexión.');
      } finally {
        ocupado.current = false;
        if (activo) {
          setLoading(false);
          callbacks.current.onLoadingChange?.(false);
        }
      }
    }

    void cargarGoogle().then(() => {
      if (!activo || !buttonRef.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId, callback: (response) => { void autenticar(response); }, auto_select: false,
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard', theme, size: 'large', text: buttonText,
        shape: 'pill', width: 280, locale: language,
      });
      setPreparado(true);
    }).catch((error) => {
      if (activo) callbacks.current.onError?.(error instanceof Error ? error.message : 'Google no está disponible.');
    });
    return () => {
      activo = false;
      peticion?.abort();
      if (ocupado.current) callbacks.current.onLoadingChange?.(false);
      ocupado.current = false;
    };
  }, [clientId, buttonText, theme, language]);

  if (!clientId) {
    return <p className="text-center text-xs text-slate-400">
      {language === 'es' ? 'El acceso con Google aún no está disponible.' : 'Google sign-in is not available yet.'}
    </p>;
  }
  return (
    <div className="space-y-2" aria-busy={loading}>
      <div className={`flex justify-center w-full min-h-[44px] ${disabled || loading ? 'pointer-events-none opacity-50' : ''}`}
        ref={contenedorRef}>
        <div ref={buttonRef} className="flex justify-center" />
      </div>
      {(!preparado || loading) && <p role="status" className="text-center text-xs text-slate-300">
        {language === 'es' ? (loading ? 'Conectando con Google…' : 'Cargando Google…') : (loading ? 'Connecting to Google…' : 'Loading Google…')}
      </p>}
    </div>
  );
};
