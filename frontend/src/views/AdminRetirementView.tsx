import { useEffect, useState } from 'react';
import { EyeOff, RotateCcw } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import { tienePermiso } from '../services/permisos';
import { adminTexts, formatDate } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

type ContentType = 'institutional' | 'project' | 'event' | 'media';
type Status = 'published' | 'withdrawn';

interface RetirableItem {
  id: string;
  title: string;
  detail: string;
  is_published: boolean;
  changed_at: string;
}

interface Consequence {
  code: string;
  count: number;
}

interface Consequences {
  blocking: Consequence[];
  warnings: Consequence[];
}

/** Cada tipo se retira con el mismo permiso con el que se gestiona. */
export const RETIREMENT_PERMISSIONS: Record<ContentType, string> = {
  institutional: 'content:manage',
  project: 'projects:manage',
  event: 'events:manage',
  media: 'media:manage',
};

const TIPOS = Object.keys(RETIREMENT_PERMISSIONS) as ContentType[];

export const canRetireSomething = () =>
  TIPOS.some((tipo) => tienePermiso(RETIREMENT_PERMISSIONS[tipo]));

export const AdminRetirementView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const t = txt.retirement;

  const permitidos = TIPOS.filter((tipo) =>
    tienePermiso(RETIREMENT_PERMISSIONS[tipo])
  );

  const [tipo, setTipo] = useState<ContentType>(permitidos[0]);
  const [estado, setEstado] = useState<Status>('published');
  const [items, setItems] = useState<RetirableItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [porRetirar, setPorRetirar] = useState<{
    item: RetirableItem;
    warnings: Consequence[];
  } | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError('');

    api<RetirableItem[]>(`/api/v1/content-retirement/${tipo}?status=${estado}`)
      .then((datos) => activo && setItems(datos))
      .catch((e) => {
        if (!activo) return;
        setItems([]);
        setError(e instanceof Error ? e.message : t.loadError);
      })
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [tipo, estado]);

  const describir = (consecuencias: Consequence[]) =>
    consecuencias
      .map((c) =>
        ((t.consequences as Record<string, string>)[c.code] ?? c.code).replace(
          '{count}',
          String(c.count)
        )
      )
      .join('; ');

  // Consulta primero qué otros procesos se ven afectados antes de pedir confirmación.
  async function solicitarRetiro(item: RetirableItem) {
    if (procesando) return;

    setProcesando(item.id);
    setError('');
    setAviso('');

    try {
      const { blocking, warnings } = await api<Consequences>(
        `/api/v1/content-retirement/${tipo}/${item.id}/consequences`
      );

      if (blocking.length > 0) {
        setError(
          t.blockedMessage
            .replace('{name}', item.title)
            .replace('{reasons}', describir(blocking))
        );
        return;
      }

      setPorRetirar({ item, warnings });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.withdrawError);
    } finally {
      setProcesando(null);
    }
  }

  async function cambiarEstado(
    item: RetirableItem,
    accion: 'withdraw' | 'restore'
  ) {
    setProcesando(item.id);
    setError('');

    try {
      await api<{ message: string }>(
        `/api/v1/content-retirement/${tipo}/${item.id}/${accion}`,
        { method: 'POST', body: JSON.stringify({ confirm: true }) }
      );

      setItems((actuales) => actuales.filter((i) => i.id !== item.id));
      setAviso(accion === 'withdraw' ? t.withdrawn_ok : t.restored_ok);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : accion === 'withdraw'
            ? t.withdrawError
            : t.restoreError
      );
    } finally {
      setProcesando(null);
      setPorRetirar(null);
    }
  }

  const chip = (activo: boolean) =>
    `whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
      activo
        ? 'bg-[#77C65E] text-[#002244]'
        : 'bg-white dark:bg-[#002244] text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:text-white'
    }`;

  const mensajeConfirmacion = porRetirar
    ? [
        t.confirmMessage.replace('{name}', porRetirar.item.title),
        porRetirar.warnings.length > 0
          ? `${describir(porRetirar.warnings)}.`
          : '',
      ]
        .filter(Boolean)
        .join(' ')
    : '';

  return (
    <section className="space-y-5">
      <div>
        <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white">{t.title}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>
      </div>

      <div
        role="tablist"
        className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10 pb-2"
      >
        {permitidos.map((valor) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={tipo === valor}
            onClick={() => setTipo(valor)}
            className={chip(tipo === valor)}
          >
            {t.types[valor]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(['published', 'withdrawn'] as Status[]).map((valor) => (
          <button
            key={valor}
            type="button"
            aria-pressed={estado === valor}
            onClick={() => setEstado(valor)}
            className={chip(estado === valor)}
          >
            {valor === 'published' ? t.published : t.withdrawn}
          </button>
        ))}
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 dark:text-slate-300">
          {t.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      {!cargando && items.length === 0 && !error && (
        <p className="text-slate-600 dark:text-slate-300">
          {estado === 'published' ? t.emptyPublished : t.emptyWithdrawn}
        </p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e4066] bg-white dark:bg-[#002244]">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-[#00162e] font-mono text-[11px] uppercase text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-3 sm:p-4">{t.columnTitle}</th>
                <th className="hidden p-4 md:table-cell">{t.columnDetail}</th>
                <th className="hidden p-4 sm:table-cell">{t.columnChanged}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-100 dark:bg-white/5">
                  <td className="p-3 sm:p-4">
                    <span className="font-bold text-brand-navy dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400 md:hidden">
                      {item.detail || '—'}
                    </span>
                  </td>
                  <td className="hidden p-4 md:table-cell">
                    {item.detail || '—'}
                  </td>
                  <td className="hidden p-4 font-mono sm:table-cell">
                    {formatDate(item.changed_at, language)}
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    {item.is_published ? (
                      <button
                        type="button"
                        disabled={procesando === item.id}
                        onClick={() => solicitarRetiro(item)}
                        aria-label={`${t.withdraw}: ${item.title}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                      >
                        <EyeOff className="w-3 h-3" />
                        {t.withdraw}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={procesando === item.id}
                        onClick={() => cambiarEstado(item, 'restore')}
                        aria-label={`${t.restore}: ${item.title}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#77C65E]/20 px-2.5 py-1.5 text-[10px] font-bold text-[#77C65E] hover:bg-[#77C65E]/30 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {t.restore}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(porRetirar)}
        title={t.confirmTitle}
        message={mensajeConfirmacion}
        confirmLabel={t.withdraw}
        busyLabel={t.withdrawing}
        cancelLabel={txt.common.cancel}
        busy={Boolean(procesando)}
        onConfirm={() => porRetirar && cambiarEstado(porRetirar.item, 'withdraw')}
        onCancel={() => {
          if (!procesando) setPorRetirar(null);
        }}
      />

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
