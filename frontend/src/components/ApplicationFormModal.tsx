import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Language, Opportunity, FormField, FormSection } from '../types';
import { X, UserCheck, CheckCircle2, Loader2, Check, CloudOff, ChevronDown } from 'lucide-react';
import type { UsuarioSesion } from '../services/sesion';
import { apiAdminJson } from '../services/apiAdmin';

type EstadoGuardado = 'saved' | 'saving' | 'unsaved';

function mismosValores(a: Record<string, FieldValue>, b: Record<string, FieldValue>): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const va = a[k];
    const vb = b[k];
    if (Array.isArray(va) && Array.isArray(vb)) {
      if (va.length !== vb.length || va.some((x, i) => x !== vb[i])) return false;
    } else if (va !== vb) {
      return false;
    }
  }
  return true;
}

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  language: Language;
  usuario: UsuarioSesion | null;
}

type FieldValue = string | string[] | boolean;

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  language,
  usuario,
}) => {
  const [campos, setCampos] = useState<FormField[]>([]);
  const [seccionesMeta, setSeccionesMeta] = useState<FormSection[]>([]);
  const [valores, setValores] = useState<Record<string, FieldValue>>({});
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('saved');

  const listoRef = useRef(false);
  const valoresRef = useRef<Record<string, FieldValue>>({});
  const ultimoGuardadoRef = useRef<Record<string, FieldValue> | null>(null);
  const saveEnCursoRef = useRef(false);
  const resaveRef = useRef(false);

  const formType = opportunity?.type;

  useEffect(() => {
    if (!isOpen || !formType || !usuario) return;
    let activo = true;
    setCargando(true);
    setError(null);
    setEnviado(false);
    setCampos([]);
    setSeccionesMeta([]);
    setValores({});
    setEstadoGuardado('saved');
    listoRef.current = false;
    ultimoGuardadoRef.current = null;
    valoresRef.current = {};

    (async () => {
      try {
        const estructura = await apiAdminJson<{ sections?: FormSection[]; fields?: FormField[] } | FormField[]>(
          `/api/v1/forms/${formType}/fields`
        );
        const fields = Array.isArray(estructura)
          ? estructura
          : Array.isArray(estructura?.fields)
            ? estructura.fields
            : [];
        const sections = Array.isArray(estructura)
          ? []
          : Array.isArray(estructura?.sections)
            ? estructura.sections
            : [];

        const borrador = await apiAdminJson<{ data?: Record<string, FieldValue> | null }>(
          `/api/v1/forms/${formType}/draft`
        ).catch(() => null);

        if (!activo) return;
        const inicial = valoresIniciales(fields);
        const conBorrador = { ...inicial };
        if (borrador?.data && typeof borrador.data === 'object' && !Array.isArray(borrador.data)) {
          for (const k of Object.keys(borrador.data)) {
            if (k in inicial) conBorrador[k] = borrador.data[k];
          }
        }

        setCampos(fields);
        setSeccionesMeta(sections);
        listoRef.current = true;
        ultimoGuardadoRef.current = conBorrador;
        valoresRef.current = conBorrador;
        setValores(conBorrador);
        setEstadoGuardado('saved');
      } catch (e) {
        if (activo) setError((e as Error).message);
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [isOpen, formType, usuario]);

  const guardarBorrador = useCallback(async () => {
    if (!formType || !usuario) return;
    if (saveEnCursoRef.current) {
      resaveRef.current = true;
      return;
    }
    saveEnCursoRef.current = true;
    let ok = true;
    try {
      do {
        resaveRef.current = false;
        const datos = { ...valoresRef.current };
        setEstadoGuardado('saving');
        await apiAdminJson(`/api/v1/forms/${formType}/draft`, {
          method: 'PUT',
          body: JSON.stringify({ data: datos }),
        });
        ultimoGuardadoRef.current = datos;
      } while (resaveRef.current);
    } catch {
      ok = false;
      setEstadoGuardado('unsaved');
    } finally {
      saveEnCursoRef.current = false;
    }
    if (ok) setEstadoGuardado('saved');
  }, [formType, usuario]);

  // Mantiene la referencia sincronizada con el último estado para el autosave y el cierre.
  useEffect(() => {
    valoresRef.current = valores;
  }, [valores]);

  // Autosave con debounce: evita disparar una petición por cada tecla.
  useEffect(() => {
    if (!listoRef.current || !formType || !usuario) return;
    const guardado = ultimoGuardadoRef.current;
    if (guardado && mismosValores(valores, guardado)) {
      setEstadoGuardado('saved');
      return;
    }
    setEstadoGuardado('unsaved');
    const t = setTimeout(() => {
      guardarBorrador();
    }, 1500);
    return () => clearTimeout(t);
  }, [valores, formType, usuario, guardarBorrador]);

  // Al intentar cerrar con cambios sin guardar, guarda de inmediato (keepalive)
  // y deja que el navegador muestre su aviso nativo de "salir o quedarse".
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const guardado = ultimoGuardadoRef.current;
      if (!guardado || mismosValores(valoresRef.current, guardado)) return;

      let token: string | null = null;
      try {
        token = localStorage.getItem('auth_token');
      } catch {
        token = null;
      }
      if (token && formType && usuario) {
        try {
          fetch(`/api/v1/forms/${formType}/draft`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: valoresRef.current }),
            keepalive: true,
          });
        } catch {
          // best effort durante el cierre
        }
      }

      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formType, usuario]);

  // Bloquea el scroll del fondo mientras el formulario está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [isOpen]);

  const secciones = useMemo(() => {
    const porNombre = new Map<string, FormField[]>();
    for (const campo of campos) {
      const lista = porNombre.get(campo.section) ?? [];
      lista.push(campo);
      porNombre.set(campo.section, lista);
    }
    const orden: { name: string; description: string | null; campos: FormField[] }[] = [];
    const vistos = new Set<string>();
    for (const s of seccionesMeta) {
      const camposSeccion = porNombre.get(s.name);
      if (!camposSeccion || camposSeccion.length === 0) continue;
      vistos.add(s.name);
      orden.push({ name: s.name, description: s.description, campos: camposSeccion });
    }
    for (const [name, camposSeccion] of porNombre) {
      if (vistos.has(name)) continue;
      orden.push({ name, description: null, campos: camposSeccion });
    }
    return orden;
  }, [campos, seccionesMeta]);

  if (!isOpen || !opportunity || !usuario) return null;

  const cambiarValor = (field: FormField, valor: FieldValue) => {
    setValores((prev) => ({ ...prev, [field.field_key]: valor }));
  };

  const handleCheckboxGroup = (field: FormField, opcion: string, marcado: boolean) => {
    const actual = (valores[field.field_key] as string[]) ?? [];
    const siguiente = marcado ? [...actual, opcion] : actual.filter((o) => o !== opcion);
    cambiarValor(field, siguiente);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await apiAdminJson(`/api/v1/forms/${formType}/submissions`, {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: opportunity.id, data: valores }),
      });
      await apiAdminJson(`/api/v1/forms/${formType}/draft`, { method: 'DELETE' }).catch(() => {});
      ultimoGuardadoRef.current = { ...valores };
      setEstadoGuardado('saved');
      setEnviado(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = async () => {
    const haySinGuardar =
      ultimoGuardadoRef.current != null &&
      !mismosValores(valoresRef.current, ultimoGuardadoRef.current);
    if (haySinGuardar) {
      const guardarYSalir = window.confirm(
        language === 'es'
          ? 'Tienes cambios sin guardar. ¿Guardar y salir?'
          : 'You have unsaved changes. Save and leave?'
      );
      if (!guardarYSalir) return;
      await guardarBorrador().catch(() => {});
    }
    setEnviado(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-navy border border-brand-border w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-brand-cream">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-brand-navyDark flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-green/20 border border-brand-green/40 text-brand-green">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white leading-tight">
                  {language === 'es' ? 'Formulario de Postulación' : 'Application Form'}
                </h3>
                <span
                  className="pointer-events-none select-none flex items-center gap-1 text-[11px] font-medium"
                  aria-live="polite"
                >
                  {estadoGuardado === 'saving' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      <span className="text-slate-400">Guardando…</span>
                    </>
                  ) : estadoGuardado === 'unsaved' ? (
                    <>
                      <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">Cambios sin guardar</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-green" />
                      <span className="text-brand-green">Guardado</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-brand-lime font-semibold">{opportunity.title}</p>
            </div>
          </div>
          <button onClick={cerrar} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto">
          {enviado ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-brand-green/20 text-brand-green border border-brand-green/40">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="font-serif text-2xl font-bold text-white">¡Postulación Recibida!</h4>
              <p className="text-sm text-slate-300">
                Gracias. El equipo directivo de Far Corners evaluará tu perfil para{' '}
                <span className="text-brand-lime font-bold">{opportunity.title}</span>.
              </p>
              <button onClick={cerrar} className="w-full py-3 bg-brand-green text-brand-navy font-extrabold rounded-xl">
                Entendido
              </button>
            </div>
          ) : cargando ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-3" />
              <span className="text-sm">Cargando formulario…</span>
            </div>
          ) : error ? (
            <div className="text-center space-y-4 py-8">
              <p className="text-sm text-rose-300">{error}</p>
              <button onClick={cerrar} className="px-6 py-2.5 bg-white/10 text-white rounded-xl font-bold">
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {secciones.map((seccion) => (
                <div key={seccion.name} className="space-y-4">
                  {seccion.name && (
                    <h4 className="font-serif text-sm font-bold text-brand-lime uppercase tracking-wider border-b border-white/10 pb-1">
                      {seccion.name}
                    </h4>
                  )}
                  {seccion.description && (
                    <p className="text-xs text-slate-400 whitespace-pre-wrap">{seccion.description}</p>
                  )}
                  {seccion.campos.map((campo) => (
                    <Campo
                      key={campo.id}
                      campo={campo}
                      valor={valores[campo.field_key]}
                      onChange={(v) => cambiarValor(campo, v)}
                      onCheckboxGroup={handleCheckboxGroup}
                    />
                  ))}
                </div>
              ))}

              {campos.length > 0 && (
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full py-3.5 btn-green text-brand-navy hover:text-white font-extrabold rounded-xl shadow-glow-green transition-all uppercase tracking-wider text-xs disabled:opacity-60"
                >
                  {enviando ? 'Enviando…' : 'Enviar Postulación Oficial'}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

function valoresIniciales(campos: FormField[]): Record<string, FieldValue> {
  const inicial: Record<string, FieldValue> = {};
  for (const campo of campos) {
    if (campo.field_type === 'checkbox' && campo.options) {
      inicial[campo.field_key] = [];
    } else if (campo.field_type === 'checkbox') {
      inicial[campo.field_key] = false;
    } else {
      inicial[campo.field_key] = '';
    }
  }
  return inicial;
}

interface CampoProps {
  campo: FormField;
  valor: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  onCheckboxGroup: (field: FormField, opcion: string, marcado: boolean) => void;
}

const Campo: React.FC<CampoProps> = ({ campo, valor, onChange, onCheckboxGroup }) => {
  const opciones = campo.options ?? [];
  const requerido = campo.required;
  const claseInput =
    'w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white focus:border-brand-green focus:outline-none';

  const etiqueta = (
    <label className="block text-xs font-semibold text-slate-300 mb-1">
      {campo.label} {requerido && <span className="text-brand-lime">*</span>}
    </label>
  );

  switch (campo.field_type) {
    case 'textarea':
      return (
        <div>
          {etiqueta}
          <textarea
            required={requerido}
            rows={3}
            value={(valor as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={claseInput}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {etiqueta}
          <div className="relative">
            <select
              required={requerido}
              value={(valor as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              className={`${claseInput} appearance-none pr-9 cursor-pointer [color-scheme:dark]`}
            >
              <option value="" disabled>
                Elegir…
              </option>
              {opciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      );

    case 'radio':
      return (
        <fieldset>
          <legend className="text-xs font-semibold text-slate-300 mb-1">
            {campo.label} {requerido && <span className="text-brand-lime">*</span>}
          </legend>
          <div className="space-y-2">
            {opciones.map((opcion) => (
              <label key={opcion} className="flex items-start space-x-2 text-sm text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name={campo.field_key}
                  required={requerido}
                  checked={(valor as string) === opcion}
                  onChange={() => onChange(opcion)}
                  className="mt-0.5 accent-brand-green"
                />
                <span className="text-xs leading-relaxed">{opcion}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );

    case 'checkbox':
      if (campo.options) {
        return (
          <fieldset>
            <legend className="text-xs font-semibold text-slate-300 mb-1">
              {campo.label} {requerido && <span className="text-brand-lime">*</span>}
            </legend>
            <div className="space-y-2">
              {opciones.map((opcion) => (
                <label key={opcion} className="flex items-start space-x-2 text-sm text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(valor as string[])?.includes(opcion) ?? false}
                    onChange={(e) => onCheckboxGroup(campo, opcion, e.target.checked)}
                    className="mt-0.5 accent-brand-green"
                  />
                  <span className="text-xs leading-relaxed">{opcion}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      }
      return (
        <label className="flex items-center space-x-2 text-sm text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={(valor as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="accent-brand-green"
          />
          <span className="text-xs">{campo.label}</span>
        </label>
      );

    case 'date':
      return (
        <div>
          {etiqueta}
          <input
            type="date"
            required={requerido}
            value={(valor as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${claseInput} [color-scheme:dark]`}
          />
        </div>
      );

    case 'datetime':
      return (
        <div>
          {etiqueta}
          <input
            type="datetime-local"
            required={requerido}
            value={(valor as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${claseInput} [color-scheme:dark]`}
          />
        </div>
      );

    case 'email':
      return (
        <div>
          {etiqueta}
          <input
            type="email"
            required={requerido}
            value={(valor as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={claseInput}
          />
        </div>
      );

    default:
      return (
        <div>
          {etiqueta}
          <input
            type="text"
            required={requerido}
            value={(valor as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className={claseInput}
          />
        </div>
      );
  }
};
