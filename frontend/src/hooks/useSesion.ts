import { useEffect, useState } from 'react';
import { EVENTO_SESION, interpretarUsuario } from '../services/sesion';
import type { UsuarioSesion } from '../services/sesion';

export function useSesion() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  useEffect(() => {
    let controller: AbortController | undefined;
    let vencimiento: ReturnType<typeof setTimeout> | undefined;

    async function verificar(mostrarCarga = true) {
      controller?.abort();
      clearTimeout(vencimiento);
      const actual = new AbortController();
      controller = actual;
      const token = localStorage.getItem('auth_token');
      if (mostrarCarga) setVerificandoSesion(true);

      if (!token) {
        localStorage.removeItem('auth_user');
        setUsuario(null);
        setVerificandoSesion(false);
        return;
      }

      try {
        const respuesta = await fetch('/api/v1/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: actual.signal,
        });
        const datos = await respuesta.json().catch(() => null);
        if (!respuesta.ok) throw new Error('La sesión ya no está disponible.');
        const cuenta = interpretarUsuario(datos?.data);
        if (actual.signal.aborted || localStorage.getItem('auth_token') !== token) return;

        // El perfil viene de la API; el contenido guardado en el navegador no autoriza el panel.
        localStorage.setItem('auth_user', JSON.stringify(cuenta));
        setUsuario((prev) =>
          prev && JSON.stringify(prev) === JSON.stringify(cuenta) ? prev : cuenta
        );

        // El JWT ya fue validado por la API. Su fecha solo controla la salida visual al vencer.
        const segmento = token.split('.')[1];
        if (segmento) {
          const payload = JSON.parse(atob(segmento.replace(/-/g, '+').replace(/_/g, '/')));
          if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) {
            vencimiento = setTimeout(() => { void verificar(); },
              Math.max(0, Math.min(payload.exp * 1000 - Date.now() + 100, 2147483647)));
          }
        }
      } catch {
        if (actual.signal.aborted || localStorage.getItem('auth_token') !== token) return;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUsuario(null);
      } finally {
        if (!actual.signal.aborted) setVerificandoSesion(false);
      }
    }

    const alCambiar = () => { void verificar(); };
    const alVolver = () => { void verificar(false); };
    const alCambiarOtraPestana = (event: StorageEvent) => {
      if (event.key === 'auth_token' || event.key === null) alCambiar();
    };
    void verificar();
    window.addEventListener(EVENTO_SESION, alCambiar);
    window.addEventListener('storage', alCambiarOtraPestana);
    window.addEventListener('focus', alVolver);
    return () => {
      controller?.abort();
      clearTimeout(vencimiento);
      window.removeEventListener(EVENTO_SESION, alCambiar);
      window.removeEventListener('storage', alCambiarOtraPestana);
      window.removeEventListener('focus', alVolver);
    };
  }, []);

  return { usuario, verificandoSesion };
}
