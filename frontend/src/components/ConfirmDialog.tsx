import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busyLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  busyLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;

    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && !busy) onCancel();
    };

    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(evento) => evento.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-navy p-6 shadow-2xl text-brand-navy dark:text-brand-cream"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-full bg-red-500/20 p-2 text-red-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h3
              id="confirm-dialog-title"
              className="font-serif text-lg font-bold text-brand-navy dark:text-white"
            >
              {title}
            </h3>
            <p id="confirm-dialog-message" className="text-sm text-slate-600 dark:text-slate-300">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-brand-navy dark:text-white hover:bg-white/20 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-brand-navy dark:text-white hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
