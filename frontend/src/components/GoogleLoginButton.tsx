import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: (userData: any) => void;
  onError?: (errorMessage: string) => void;
  buttonText?: 'signin_with' | 'signup_with' | 'continue_with';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  buttonText = 'continue_with',
  theme = 'outline',
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Cargar el script de Google Identity Services de forma dinámica
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      onError?.('No se pudo cargar el servicio de autenticación de Google.');
    };
    document.body.appendChild(script);
  }, [onError]);

  // Manejar la respuesta del token emitida por Google
  const handleCredentialResponse = async (response: { credential: string }) => {
    if (!response.credential) {
      onError?.('No se recibió la credencial de Google.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.message || 'Error al autenticar con Google.'
        );
      }

      // Persistir token de sesión y datos del usuario
      if (data?.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      }

      onSuccess?.(data?.data?.user);
    } catch (err: any) {
      onError?.(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar y renderizar el botón de Google cuando el script y el contenedor estén listos
  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: theme,
        size: 'large',
        text: buttonText,
        shape: 'pill',
        width: 320,
        locale: 'es',
      });
    } catch (e) {
      console.error('Error al inicializar Google Sign-In:', e);
    }
  }, [scriptLoaded, clientId, buttonText, theme]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-2.5 px-4 rounded-xl bg-white/10 text-white text-xs font-semibold animate-pulse">
        <span>Conectando con Google…</span>
      </div>
    );
  }

  // Si no se ha configurado el Client ID aún en el .env, mostramos un botón indicador
  if (!clientId) {
    return (
      <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-brand-navyDark/60 border border-white/10 text-center">
        <button
          type="button"
          onClick={() => {
            onError?.(
              'El Google Client ID no está configurado en frontend/.env (VITE_GOOGLE_CLIENT_ID).'
            );
          }}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-[44px]">
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  );
};

