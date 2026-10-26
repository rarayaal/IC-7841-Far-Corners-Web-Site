import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error';
  onClose: () => void;
  closeLabel: string;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'success',
  onClose,
  closeLabel,
  duration = 5000,
}) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const temporizador = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(temporizador);
  }, [message, variant, duration]);

  const esError = variant === 'error';
  const Icono = esError ? AlertCircle : CheckCircle2;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-2xl animate-fadeIn ${
        esError
          ? 'border-red-400/40 bg-red-500 text-white'
          : 'border-brand-lime bg-brand-green text-brand-navy'
      }`}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-bold">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className={`rounded-lg p-1 transition-colors ${
          esError ? 'hover:bg-white/20' : 'hover:bg-black/10'
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

/** Fixed container so every admin view shows its notice in the same place. */
export const ToastRegion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-x-4 bottom-4 z-[60] space-y-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm">
    {children}
  </div>
);
