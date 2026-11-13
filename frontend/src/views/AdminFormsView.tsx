import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Form, FormField, FormFieldType, FormSection, FormSubmission, type Language } from '../types';
import { apiAdminJson } from '../services/apiAdmin';
import { Toast, ToastRegion } from '../components/Toast';
import { adminTexts } from '../lib/adminI18n';
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  GripVertical,
  Save,
  ClipboardList,
  Inbox,
} from 'lucide-react';

const FIELD_TYPE_ORDER: FormFieldType[] = ['text', 'textarea', 'radio', 'checkbox', 'select', 'email', 'date', 'datetime'];

const CON_OPCIONES: FormFieldType[] = ['select', 'radio', 'checkbox'];

function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

let idContador = 0;
function genId(prefijo: string): string {
  idContador += 1;
  return `${prefijo}-${Date.now().toString(36)}-${idContador}`;
}

function generarFieldKey(label: string, campos: CampoDraft[]): string {
  const base = slugify(label) || 'campo';
  const existentes = new Set(campos.map((c) => c.field_key));
  let clave = base;
  let n = 2;
  while (existentes.has(clave)) clave = `${base}_${n++}`;
  return clave;
}

// Renderiza overlays en document.body para que position:fixed funcione
// contra el viewport (y no contra un ancestro con transform/scroll).
const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  createPortal(children, document.body);

type FormsTexts = (typeof adminTexts)['es']['forms'];

// Idioma compartido dentro de este archivo: evita prop-drilling por todos los subcomponentes.
const FormsLang = createContext<Language>('es');

function useFormsTexts(): FormsTexts {
  return adminTexts[useContext(FormsLang)].forms;
}

// Bloquea el scroll del fondo mientras hay un overlay encima.
function useLockBodyScroll() {
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, []);
}

// ---------- Modal de confirmación genérico ----------

const ModalConfirmar: React.FC<{
  mensaje: React.ReactNode;
  onCancelar: () => void;
  onConfirmar: () => void;
  titulo?: string;
  textoCancelar?: string;
  textoConfirmar?: string;
}> = ({ mensaje, onCancelar, onConfirmar, titulo, textoCancelar, textoConfirmar }) => {
  const txt = useFormsTexts();
  useLockBodyScroll();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-brand-navy border border-brand-border w-full max-w-md rounded-2xl p-6 space-y-4 text-sm">
        <h4 className="font-serif text-lg font-bold text-white">{titulo ?? txt.confirmDeleteTitle}</h4>
        <p className="text-slate-300 text-xs">{mensaje}</p>
        <div className="flex gap-2">
          <button onClick={onCancelar} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl">
            {textoCancelar ?? txt.cancel}
          </button>
          <button onClick={onConfirmar} className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-bold rounded-xl">
            {textoConfirmar ?? txt.confirmDelete}
          </button>
        </div>
      </div>
    </div>
  );
};

// Área de descripción de sección que crece automáticamente según el contenido.
const TextareaDescripcion: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full resize-none bg-transparent text-xs text-slate-300 placeholder:text-slate-500 border-b border-dashed border-white/20 hover:border-white/50 focus:border-solid focus:border-brand-green focus:outline-none py-1 min-h-[2rem]"
    />
  );
};

// ---------- Modelo de borrador (todo se guarda al final) ----------

interface SeccionDraft {
  localId: string;
  nombre: string;
  descripcion: string;
  esHuerfana: boolean;
}

interface CampoDraft {
  localId: string;
  id: string | null; // id en la BD (null si es nuevo)
  field_key: string;
  label: string;
  field_type: FormFieldType;
  seccionId: string; // referencia a SeccionDraft.localId
  options: string[] | null;
  required: boolean;
}

const SEC = 'seccion:';
const CAM = 'campo:';
const NSEC = 'nueva-seccion:';
const SIN_SECCION_OPCION = '__sin_seccion__';

type Vista = 'list' | 'editor' | 'respuestas';

export const AdminFormsView: React.FC<{ language: Language }> = ({ language }) => {
  const txt = adminTexts[language].forms;
  const [forms, setForms] = useState<Form[]>([]);
  const [cargandoForms, setCargandoForms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vista, setVista] = useState<Vista>('list');
  const [formSlug, setFormSlug] = useState<string | null>(null);
  const [formAEliminar, setFormAEliminar] = useState<Form | null>(null);

  const cargarForms = useCallback(async () => {
    setCargandoForms(true);
    setError(null);
    try {
      const data = await apiAdminJson<Form[]>('/api/v1/forms');
      setForms(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargandoForms(false);
    }
  }, []);

  useEffect(() => {
    cargarForms();
  }, [cargarForms]);

  const crearForm = async () => {
    setError(null);
    try {
      const nuevo = await apiAdminJson<{ slug: string }>('/api/v1/forms', {
        method: 'POST',
        body: JSON.stringify({ title: 'Sin título' }),
      });
      await cargarForms();
      setFormSlug(nuevo.slug);
      setVista('editor');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const eliminarForm = async (form: Form) => {
    setError(null);
    try {
      await apiAdminJson(`/api/v1/forms/${form.slug}`, { method: 'DELETE' });
      if (formSlug === form.slug) {
        setFormSlug(null);
        setVista('list');
      }
      await cargarForms();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formActual = formSlug ? (forms.find((f) => f.slug === formSlug) ?? null) : null;

  if (vista === 'editor' && formSlug && formActual) {
    return (
      <FormsLang.Provider value={language}>
        <EditorFormulario
          form={formActual}
          onVolver={() => {
            setFormSlug(null);
            setVista('list');
          }}
          onGuardado={cargarForms}
        />
      </FormsLang.Provider>
    );
  }

  if (vista === 'respuestas' && formSlug && formActual) {
    return (
      <FormsLang.Provider value={language}>
        <VistaRespuestas
          form={formActual}
          onVolver={() => {
            setFormSlug(null);
            setVista('list');
          }}
        />
      </FormsLang.Provider>
    );
  }

  // ----- Vista de lista -----

  return (
    <FormsLang.Provider value={language}>
      <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-white">{txt.listTitle}</h3>
          <p className="text-xs text-slate-300">{txt.listSubtitle}</p>
        </div>
        <button
          onClick={crearForm}
          className="px-4 py-2 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>{txt.newForm}</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-xl px-4 py-3">{error}</div>
      )}

      {cargandoForms ? (
        <div className="flex items-center justify-center py-16 text-slate-300">
          <Loader2 className="w-7 h-7 text-brand-green animate-spin mr-3" />
          <span className="text-sm">{txt.loading}</span>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-brand-navy border border-brand-border rounded-2xl p-8 text-center text-slate-400 text-sm">
          {txt.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div key={form.slug} className="bg-brand-navy border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
              <div>
                <h4 className="font-serif font-bold text-white text-sm leading-snug">{form.title}</h4>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" /> {form.field_count} {txt.questions}
                  </span>
                  <span className="flex items-center gap-1">
                    <Inbox className="w-3.5 h-3.5" /> {form.submission_count} {txt.responses}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setFormSlug(form.slug);
                    setVista('editor');
                  }}
                  className="flex-1 px-3 py-1.5 bg-brand-green/15 hover:bg-brand-green/25 text-brand-lime text-xs font-bold rounded-lg"
                >
                  {txt.edit}
                </button>
                <button
                  onClick={() => {
                    setFormSlug(form.slug);
                    setVista('respuestas');
                  }}
                  className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-lg"
                >
                  {txt.viewResponses}
                </button>
                <button
                  onClick={() => setFormAEliminar(form)}
                  className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300"
                  title={txt.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formAEliminar && (
        <Portal>
          <ModalConfirmar
            mensaje={txt.deleteFormMessage.replace('{name}', formAEliminar.title)}
            onCancelar={() => setFormAEliminar(null)}
            onConfirmar={() => {
              const objetivo = formAEliminar;
              setFormAEliminar(null);
              eliminarForm(objetivo);
            }}
          />
        </Portal>
      )}
      </div>
    </FormsLang.Provider>
  );
};

// ---------- Editor de formulario ----------

interface EditorFormularioProps {
  form: Form;
  onVolver: () => void;
  onGuardado: () => void;
}

const EditorFormulario: React.FC<EditorFormularioProps> = ({ form, onVolver, onGuardado }) => {
  const txt = useFormsTexts();
  const [titulo, setTitulo] = useState(form.title);

  const [secciones, setSecciones] = useState<SeccionDraft[]>([]);
  const [campos, setCampos] = useState<CampoDraft[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');

  const [salirAbierto, setSalirAbierto] = useState(false);

  const [modalCampoAbierto, setModalCampoAbierto] = useState(false);
  const [campoEditando, setCampoEditando] = useState<CampoDraft | null>(null);
  const [campoAEliminar, setCampoAEliminar] = useState<CampoDraft | null>(null);
  const [insertarDespuesDe, setInsertarDespuesDe] = useState<string | null>(null);
  const [fCampo, setFCampo] = useState({ label: '', field_type: 'text' as FormFieldType, options: [] as string[], required: false });
  const [seccionSel, setSeccionSel] = useState<string>('');
  const [nombreNuevaSeccion, setNombreNuevaSeccion] = useState('');

  const [seccionEditando, setSeccionEditando] = useState<string | null>(null);
  const [seccionTitulo, setSeccionTitulo] = useState('');
  const [seccionAEliminar, setSeccionAEliminar] = useState<string | null>(null);

  const [previaAbierta, setPreviaAbierta] = useState(false);

  const [activeTipo, setActiveTipo] = useState<'campo' | 'seccion' | null>(null);
  const [recienteId, setRecienteId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const skipDirty = useRef(false);
  const seccionesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipDirty.current) {
      skipDirty.current = false;
      return;
    }
    setDirty(true);
  }, [titulo, secciones, campos]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await apiAdminJson<{ sections?: FormSection[]; fields?: FormField[] } | FormField[]>(`/api/v1/forms/${form.slug}/fields`);
      const payload = Array.isArray(data)
        ? { sections: [] as FormSection[], fields: data }
        : {
            sections: Array.isArray(data?.sections) ? data.sections : ([] as FormSection[]),
            fields: Array.isArray(data?.fields) ? data.fields : ([] as FormField[]),
          };
      skipDirty.current = true;

      const secs: SeccionDraft[] = [];
      const porNombre = new Map<string, string>();
      const nuevosCampos: CampoDraft[] = [];

      const asegurarSeccion = (nombre: string, descripcion: string, esHuerfana: boolean) => {
        if (!porNombre.has(nombre)) {
          const seccionId = genId('sec');
          porNombre.set(nombre, seccionId);
          secs.push({ localId: seccionId, nombre, descripcion, esHuerfana });
        }
        return porNombre.get(nombre)!;
      };

      for (const s of payload.sections) asegurarSeccion(s.name, s.description ?? '', s.orphan === true);
      for (const f of payload.fields) asegurarSeccion(f.section, '', f.section === '');

      for (const f of payload.fields) {
        nuevosCampos.push({
          localId: genId('campo'),
          id: f.id,
          field_key: f.field_key,
          label: f.label,
          field_type: f.field_type,
          seccionId: porNombre.get(f.section)!,
          options: f.options,
          required: f.required,
        });
      }

      setSecciones(secs);
      setCampos(nuevosCampos);
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [form.slug]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const marcarReciente = (localId: string) => {
    setRecienteId(localId);
    window.setTimeout(() => setRecienteId((prev) => (prev === localId ? null : prev)), 900);
  };

  const esSeccionHuerfana = (seccionId: string) =>
    secciones.find((s) => s.localId === seccionId)?.esHuerfana === true;

  // ----- Preguntas (edición local, sin backend) -----

  const abrirNueva = (seccionId: string, despuesDe: string | null) => {
    setCampoEditando(null);
    setFCampo({ label: '', field_type: 'text', options: [], required: false });
    setInsertarDespuesDe(despuesDe);
    setSeccionSel(esSeccionHuerfana(seccionId) ? SIN_SECCION_OPCION : seccionId);
    setNombreNuevaSeccion('');
    setModalCampoAbierto(true);
  };

  const abrirEdicion = (campo: CampoDraft) => {
    setCampoEditando(campo);
    setFCampo({
      label: campo.label,
      field_type: campo.field_type,
      options: campo.options ?? [],
      required: campo.required,
    });
    setInsertarDespuesDe(null);
    setSeccionSel(esSeccionHuerfana(campo.seccionId) ? SIN_SECCION_OPCION : campo.seccionId);
    setNombreNuevaSeccion('');
    setModalCampoAbierto(true);
  };

  const guardarCampo = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const opciones = fCampo.options.map((o) => o.trim()).filter(Boolean);
    if (CON_OPCIONES.includes(fCampo.field_type) && opciones.length === 0) {
      setError(txt.optionsRequired);
      return;
    }
    if (!fCampo.label.trim()) {
      setError(txt.questionRequired);
      return;
    }

    let seccionId = seccionSel;
    if (seccionSel === '__nueva') {
      seccionId = genId('sec');
      setSecciones((prev) => [...prev, { localId: seccionId, nombre: nombreNuevaSeccion.trim(), descripcion: '', esHuerfana: false }]);
    } else if (seccionSel === SIN_SECCION_OPCION) {
      const existente = secciones.find((s) => s.esHuerfana);
      if (existente) {
        seccionId = existente.localId;
      } else {
        seccionId = genId('sec');
        setSecciones((prev) => [...prev, { localId: seccionId, nombre: '', descripcion: '', esHuerfana: true }]);
      }
    }

    if (campoEditando) {
      const cambioSeccion = campoEditando.seccionId !== seccionId;
      setCampos((prev) => {
        const idx = prev.findIndex((c) => c.localId === campoEditando.localId);
        if (idx < 0) return prev;
        const actualizado: CampoDraft = {
          ...campoEditando,
          label: fCampo.label.trim(),
          field_type: fCampo.field_type,
          options: CON_OPCIONES.includes(fCampo.field_type) ? opciones : null,
          required: fCampo.required,
          seccionId,
        };
        if (!cambioSeccion) {
          const arr = [...prev];
          arr[idx] = actualizado;
          return arr;
        }
        const arr = prev.filter((c) => c.localId !== campoEditando.localId);
        let pos = arr.length;
        for (let i = arr.length - 1; i >= 0; i -= 1) {
          if (arr[i].seccionId === seccionId) {
            pos = i + 1;
            break;
          }
        }
        arr.splice(pos, 0, actualizado);
        return arr;
      });
      if (cambioSeccion) marcarReciente(campoEditando.localId);
    } else {
      const nuevo: CampoDraft = {
        localId: genId('campo'),
        id: null,
        field_key: generarFieldKey(fCampo.label, campos),
        label: fCampo.label.trim(),
        field_type: fCampo.field_type,
        seccionId,
        options: CON_OPCIONES.includes(fCampo.field_type) ? opciones : null,
        required: fCampo.required,
      };
      setCampos((prev) => {
        const arr = [...prev];
        let pos = arr.length;
        if (insertarDespuesDe) {
          const idx = arr.findIndex((c) => c.localId === insertarDespuesDe);
          pos = idx >= 0 ? idx + 1 : arr.length;
        } else {
          for (let i = arr.length - 1; i >= 0; i -= 1) {
            if (arr[i].seccionId === seccionId) {
              pos = i + 1;
              break;
            }
          }
        }
        arr.splice(pos, 0, nuevo);
        return arr;
      });
      marcarReciente(nuevo.localId);
    }

    setModalCampoAbierto(false);
  };

  const eliminarCampo = (campo: CampoDraft) => {
    setCampoAEliminar(campo);
  };

  const confirmarEliminarCampo = () => {
    if (!campoAEliminar) return;
    setCampos((prev) => prev.filter((c) => c.localId !== campoAEliminar.localId));
    setCampoAEliminar(null);
  };

  // ----- Secciones (edición local) -----

  const insertarSeccion = (indice: number) => {
    const nueva: SeccionDraft = { localId: genId('sec'), nombre: '', descripcion: '', esHuerfana: false };
    setSecciones((prev) => {
      const arr = [...prev];
      arr.splice(indice, 0, nueva);
      return arr;
    });
  };

  const guardarNombreSeccion = (localId: string, nombre: string) => {
    const limpio = nombre.trim();
    setSecciones((prev) =>
      prev.map((s) => (s.localId === localId ? { ...s, nombre: limpio, esHuerfana: s.esHuerfana && limpio === '' } : s))
    );
    setSeccionEditando(null);
  };

  const confirmarEliminarSeccion = (mode: 'delete' | 'orphan') => {
    if (!seccionAEliminar) return;
    const secId = seccionAEliminar;

    if (mode === 'delete') {
      setCampos((prev) => prev.filter((c) => c.seccionId !== secId));
    } else {
      let destino = genId('sec');
      // reutilizar una sección "Sin sección" existente si la hay
      const existente = secciones.find((s) => s.localId !== secId && s.esHuerfana);
      if (existente) destino = existente.localId;
      else setSecciones((prev) => [...prev, { localId: destino, nombre: '', descripcion: '', esHuerfana: true }]);
      setCampos((prev) => prev.map((c) => (c.seccionId === secId ? { ...c, seccionId: destino } : c)));
    }

    setSecciones((prev) => prev.filter((s) => s.localId !== secId));
    setSeccionAEliminar(null);
  };

  // ----- Guardar todo -----

  const guardar = async () => {
    if (!titulo.trim()) {
      setError(txt.titleRequired);
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const sections = secciones.map((s) => ({ name: s.nombre, description: s.descripcion.trim() || null, orphan: s.esHuerfana }));
      const fields = campos.map((c) => {
        const sec = secciones.find((s) => s.localId === c.seccionId);
        return {
          field_key: c.field_key,
          label: c.label,
          field_type: c.field_type,
          section: sec ? sec.nombre : '',
          options: c.options,
          required: c.required,
        };
      });
      await apiAdminJson(`/api/v1/forms/${form.slug}/structure`, {
        method: 'PUT',
        body: JSON.stringify({
          title: titulo.trim(),
          sections,
          fields,
        }),
      });
      setAviso(txt.saved);
      setDirty(false);
      onGuardado();
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const volver = () => {
    if (dirty) {
      setSalirAbierto(true);
      return;
    }
    onVolver();
  };

  const salirSinGuardar = () => {
    setSalirAbierto(false);
    onVolver();
  };

  // ----- DnD -----

  const handleDragStart = (e: DragStartEvent) => {
    const tipo = String(e.active.id).startsWith(SEC) ? 'seccion' : 'campo';
    setActiveTipo(tipo);
    if (tipo === 'seccion') {
      // Al contraer las preguntas la vista puede quedar al pie de la página;
      // acomodamos el scroll arriba para ver todas las secciones.
      requestAnimationFrame(() => {
        seccionesRef.current?.scrollIntoView({ block: 'start' });
      });
    }
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const a = String(active.id);
    const o = String(over.id);
    if (a === o) return;

    if (a.startsWith(SEC) && o.startsWith(SEC)) {
      setSecciones((arr) => {
        const from = arr.findIndex((s) => SEC + s.localId === a);
        const to = arr.findIndex((s) => SEC + s.localId === o);
        if (from >= 0 && to >= 0) return arrayMove(arr, from, to);
        return arr;
      });
      return;
    }

    if (a.startsWith(CAM)) {
      const aLocal = a.slice(CAM.length);

      if (o.startsWith(CAM)) {
        const oLocal = o.slice(CAM.length);
        setCampos((arr) => {
          const fromIdx = arr.findIndex((c) => c.localId === aLocal);
          const overIdx = arr.findIndex((c) => c.localId === oLocal);
          if (fromIdx < 0 || overIdx < 0) return arr;
          const seccionDestino = arr[overIdx].seccionId;
          const moved = arrayMove(arr, fromIdx, overIdx);
          const nuevoIdx = moved.findIndex((c) => c.localId === aLocal);
          moved[nuevoIdx] = { ...moved[nuevoIdx], seccionId: seccionDestino };
          return moved;
        });
      } else if (o.startsWith(SEC)) {
        const oSeccion = o.slice(SEC.length);
        setCampos((arr) => {
          const fromIdx = arr.findIndex((c) => c.localId === aLocal);
          if (fromIdx < 0) return arr;
          const activo = arr[fromIdx];
          const sin = arr.filter((c) => c.localId !== aLocal);
          let pos = sin.length;
          for (let i = sin.length - 1; i >= 0; i -= 1) {
            if (sin[i].seccionId === oSeccion) {
              pos = i + 1;
              break;
            }
          }
          sin.splice(pos, 0, { ...activo, seccionId: oSeccion });
          return sin;
        });
      }
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTipo(null);
    if (!over) return;
    const a = String(active.id);
    const o = String(over.id);

    // Arrastrar una pregunta sobre una zona "nueva sección" crea una sección
    // sin nombre en esa posición y mueve la pregunta a ella.
    if (a.startsWith(CAM) && o.startsWith(NSEC)) {
      const indice = Number(o.slice(NSEC.length));
      const aLocal = a.slice(CAM.length);
      const nuevaId = genId('sec');
      setSecciones((prev) => {
        const arr = [...prev];
        arr.splice(indice, 0, { localId: nuevaId, nombre: '', descripcion: '', esHuerfana: false });
        return arr;
      });
      setCampos((prev) => prev.map((c) => (c.localId === aLocal ? { ...c, seccionId: nuevaId } : c)));
      marcarReciente(aLocal);
    }
  };

  const seccionesSortables = secciones.map((s) => SEC + s.localId);

  return (
    <div className="space-y-5 animate-fadeIn">
      <style>{`
        @keyframes fcFieldIn {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: none; }
        }
        .fc-field-in { animation: fcFieldIn 0.5s ease; }
      `}</style>

      {/* Barra superior */}
      <div className="flex items-center gap-3">
        <button onClick={volver} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 shrink-0" title={txt.back}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={txt.titlePlaceholder}
            title={txt.titlePlaceholder}
            className="w-full bg-transparent font-serif text-xl font-bold text-white border-b border-dashed border-white/30 hover:border-white/60 focus:border-solid focus:border-brand-green focus:outline-none py-1"
          />
        </div>
        {dirty && <span className="hidden sm:inline text-[11px] text-amber-300 shrink-0">{txt.unsaved}</span>}
        <button
          onClick={() => setPreviaAbierta(true)}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shrink-0"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">{txt.preview}</span>
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="px-4 py-2 bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white text-xs font-extrabold rounded-xl shadow-glow-green flex items-center space-x-1.5 uppercase tracking-wider shrink-0 disabled:opacity-50"
        >
          {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{guardando ? txt.saving : txt.save}</span>
        </button>
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-xl px-4 py-3">{error}</div>}

      {cargando ? (
        <div className="flex items-center justify-center py-16 text-slate-300">
          <Loader2 className="w-7 h-7 text-brand-green animate-spin mr-3" />
          <span className="text-sm">{txt.loading}</span>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <SortableContext items={seccionesSortables} strategy={verticalListSortingStrategy}>
            <div ref={seccionesRef} className="space-y-3">
              {secciones.length === 0 && (
                <ZonaNuevaSeccion indice={0} onAgregar={() => insertarSeccion(0)} />
              )}
              {secciones.map((seccion, i) => (
                <React.Fragment key={seccion.localId}>
                  <SeccionCard
                    seccion={seccion}
                    campos={campos.filter((c) => c.seccionId === seccion.localId)}
                    colapsada={activeTipo === 'seccion'}
                    recienteId={recienteId}
                    renombrando={seccionEditando === seccion.localId}
                    tituloRenombrando={seccionTitulo}
                    setTituloRenombrando={setSeccionTitulo}
                    onIniciarRenombrar={() => {
                      setSeccionEditando(seccion.localId);
                      setSeccionTitulo(seccion.nombre);
                    }}
                    onGuardarRenombrar={(nombre) => guardarNombreSeccion(seccion.localId, nombre)}
                    onCancelarRenombrar={() => setSeccionEditando(null)}
                    onEliminarSeccion={() => setSeccionAEliminar(seccion.localId)}
                    onEditarCampo={abrirEdicion}
                    onEliminarCampo={eliminarCampo}
                    onAgregarCampo={(despuesDe) => abrirNueva(seccion.localId, despuesDe)}
                    onCambiarDescripcion={(localId, valor) =>
                      setSecciones((prev) => prev.map((s) => (s.localId === localId ? { ...s, descripcion: valor } : s)))
                    }
                  />
                  {activeTipo !== 'seccion' && (
                    <ZonaNuevaSeccion indice={i + 1} onAgregar={() => insertarSeccion(i + 1)} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modalCampoAbierto && (
        <Portal>
          <ModalCampo
            esEdicion={!!campoEditando}
            fCampo={fCampo}
            setFCampo={setFCampo}
            seccionSel={seccionSel}
            setSeccionSel={setSeccionSel}
            nombreNuevaSeccion={nombreNuevaSeccion}
            setNombreNuevaSeccion={setNombreNuevaSeccion}
            secciones={secciones}
            onCerrar={() => setModalCampoAbierto(false)}
            onGuardar={guardarCampo}
          />
        </Portal>
      )}

      {seccionAEliminar && (
        <Portal>
          <ModalEliminarSeccion
            titulo={secciones.find((s) => s.localId === seccionAEliminar)?.nombre || txt.thisSection}
            onCancelar={() => setSeccionAEliminar(null)}
            onConfirmar={confirmarEliminarSeccion}
          />
        </Portal>
      )}

      {campoAEliminar && (
        <Portal>
          <ModalConfirmar
            mensaje={txt.deleteQuestionMessage.replace('{name}', campoAEliminar.label)}
            onCancelar={() => setCampoAEliminar(null)}
            onConfirmar={confirmarEliminarCampo}
          />
        </Portal>
      )}

      {previaAbierta && (
        <Portal>
          <ModalPrevia titulo={titulo} secciones={secciones} campos={campos} onCerrar={() => setPreviaAbierta(false)} />
        </Portal>
      )}

      {salirAbierto && (
        <Portal>
          <ModalConfirmar
            titulo={txt.unsaved}
            mensaje={txt.unsavedLeaveMessage}
            textoCancelar={txt.stay}
            textoConfirmar={txt.leave}
            onCancelar={() => setSalirAbierto(false)}
            onConfirmar={salirSinGuardar}
          />
        </Portal>
      )}

      {aviso && (
        <Portal>
          <ToastRegion>
            <Toast message={aviso} onClose={() => setAviso('')} closeLabel={txt.closeNotification} />
          </ToastRegion>
        </Portal>
      )}
    </div>
  );
};

// ---------- Zona "nueva sección" (entre secciones) ----------

const ZonaNuevaSeccion: React.FC<{ indice: number; onAgregar: () => void }> = ({ indice, onAgregar }) => {
  const txt = useFormsTexts();
  const { setNodeRef, isOver } = useDroppable({ id: NSEC + indice });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 border-dashed transition-colors ${
        isOver ? 'border-brand-green bg-brand-green/10' : 'border-white/10 hover:border-white/25'
      }`}
    >
      <button
        onClick={onAgregar}
        className="w-full py-2 text-[11px] font-bold text-slate-400 hover:text-brand-lime flex items-center justify-center space-x-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{txt.addSection}</span>
      </button>
    </div>
  );
};

// ---------- Sección (arrastrable) ----------

interface SeccionCardProps {
  seccion: SeccionDraft;
  campos: CampoDraft[];
  colapsada: boolean;
  recienteId: string | null;
  renombrando: boolean;
  tituloRenombrando: string;
  setTituloRenombrando: (t: string) => void;
  onIniciarRenombrar: () => void;
  onGuardarRenombrar: (nombre: string) => void;
  onCancelarRenombrar: () => void;
  onEliminarSeccion: () => void;
  onEditarCampo: (campo: CampoDraft) => void;
  onEliminarCampo: (campo: CampoDraft) => void;
  onAgregarCampo: (despuesDe: string | null) => void;
  onCambiarDescripcion: (localId: string, valor: string) => void;
}

const SeccionCard: React.FC<SeccionCardProps> = ({
  seccion,
  campos,
  colapsada,
  recienteId,
  renombrando,
  tituloRenombrando,
  setTituloRenombrando,
  onIniciarRenombrar,
  onGuardarRenombrar,
  onCancelarRenombrar,
  onEliminarSeccion,
  onEditarCampo,
  onEliminarCampo,
  onAgregarCampo,
  onCambiarDescripcion,
}) => {
  const txt = useFormsTexts();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: SEC + seccion.localId,
    data: { tipo: 'seccion' },
  });

  const camposSortables = campos.map((c) => CAM + c.localId);
  const tituloMostrar = seccion.esHuerfana
    ? txt.noSection
    : seccion.nombre === ''
    ? txt.unnamedSection
    : seccion.nombre;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-brand-navy border rounded-2xl overflow-hidden ${isDragging ? 'opacity-60 border-brand-green/50' : 'border-brand-border'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="bg-brand-navyDark px-4 py-2.5 flex items-center gap-2 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
      >
        <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
        {renombrando ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onGuardarRenombrar(tituloRenombrando);
            }}
            className="flex items-center gap-2 flex-1"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="text"
              value={tituloRenombrando}
              onChange={(e) => setTituloRenombrando(e.target.value)}
              placeholder={txt.sectionNamePlaceholder}
              className="flex-1 px-2 py-1 bg-brand-navy border border-brand-border rounded text-xs text-white"
            />
            <button type="submit" className="p-1 rounded bg-brand-green text-brand-navy" title={txt.save}>
              <Save className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={onCancelarRenombrar} className="p-1 rounded bg-white/10 text-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <>
            <span className="text-xs font-bold text-brand-lime uppercase tracking-wider flex-1 truncate">{tituloMostrar}</span>
            <button
              onClick={onIniciarRenombrar}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              title={txt.renameSection}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onEliminarSeccion}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-300 shrink-0"
              title={txt.deleteSection}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          colapsada ? 'max-h-0 opacity-0' : 'max-h-[6000px] opacity-100'
        }`}
      >
        <div className="px-4 pt-3">
          <TextareaDescripcion
            value={seccion.descripcion}
            onChange={(v) => onCambiarDescripcion(seccion.localId, v)}
            placeholder={txt.descriptionPlaceholder}
          />
        </div>

        <SortableContext items={camposSortables} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-white/5 pb-3">
            {campos.map((campo) => (
              <CampoItem
                key={campo.localId}
                campo={campo}
                reciente={recienteId === campo.localId}
                onEditar={onEditarCampo}
                onEliminar={onEliminarCampo}
                onAgregarDespues={onAgregarCampo}
              />
            ))}
          </ul>
        </SortableContext>

        {campos.length === 0 && (
          <button
            onClick={() => onAgregarCampo(null)}
            className="w-full py-2.5 text-[11px] font-bold text-slate-400 hover:text-brand-lime flex items-center justify-center space-x-1.5"
            title={txt.newQuestion}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{txt.newQuestion}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- Pregunta (arrastrable) ----------

interface CampoItemProps {
  campo: CampoDraft;
  reciente: boolean;
  onEditar: (campo: CampoDraft) => void;
  onEliminar: (campo: CampoDraft) => void;
  onAgregarDespues: (despuesDe: string) => void;
}

const CampoItem: React.FC<CampoItemProps> = ({ campo, reciente, onEditar, onEliminar, onAgregarDespues }) => {
  const txt = useFormsTexts();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: CAM + campo.localId,
    data: { tipo: 'campo' },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative ${reciente ? 'fc-field-in' : ''}`}
    >
      <div className={`px-4 py-3 flex items-center gap-3 text-xs ${isDragging ? 'opacity-40 bg-brand-green/5' : ''}`}>
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing shrink-0"
          title={txt.dragQuestion}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{campo.label}</span>
            {campo.required && <span className="text-brand-lime">*</span>}
          </div>
          <span className="text-[11px] text-slate-400">
            {txt.fieldTypes[campo.field_type]}
          </span>
        </div>
        <button onClick={() => onEditar(campo)} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 shrink-0" title={txt.editQuestion}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onEliminar(campo)} className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 shrink-0" title={txt.deleteQuestion}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        onClick={() => onAgregarDespues(campo.localId)}
        className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-10 px-2.5 py-0.5 bg-brand-green text-brand-navy text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shadow-glow-green"
        title={txt.newQuestion}
      >
        <Plus className="w-3 h-3" />
        <span>{txt.newQuestion}</span>
      </button>
    </li>
  );
};

// ---------- Modal agregar/editar pregunta ----------

interface ModalCampoProps {
  esEdicion: boolean;
  fCampo: { label: string; field_type: FormFieldType; options: string[]; required: boolean };
  setFCampo: React.Dispatch<React.SetStateAction<{ label: string; field_type: FormFieldType; options: string[]; required: boolean }>>;
  seccionSel: string;
  setSeccionSel: (s: string) => void;
  nombreNuevaSeccion: string;
  setNombreNuevaSeccion: (s: string) => void;
  secciones: SeccionDraft[];
  onCerrar: () => void;
  onGuardar: (e: React.FormEvent) => void;
}

const ModalCampo: React.FC<ModalCampoProps> = ({
  esEdicion,
  fCampo,
  setFCampo,
  seccionSel,
  setSeccionSel,
  nombreNuevaSeccion,
  setNombreNuevaSeccion,
  secciones,
  onCerrar,
  onGuardar,
}) => {
  const txt = useFormsTexts();
  useLockBodyScroll();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <form onSubmit={onGuardar} className="bg-brand-navyDark p-5 rounded-2xl border border-brand-green/40 space-y-4 text-xs w-full max-w-lg my-auto">
        <div className="flex justify-between items-center">
          <h4 className="font-serif text-sm font-bold text-brand-lime">{esEdicion ? txt.editQuestionTitle : txt.newQuestionTitle}</h4>
          <button type="button" onClick={onCerrar} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-slate-300 mb-1">{txt.questionLabel}</label>
          <input
            type="text"
            required
            autoFocus
            value={fCampo.label}
            onChange={(e) => setFCampo((p) => ({ ...p, label: e.target.value }))}
            placeholder={txt.questionPlaceholder}
            className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1">{txt.questionType}</label>
            <select
              value={fCampo.field_type}
              onChange={(e) => setFCampo((p) => ({ ...p, field_type: e.target.value as FormFieldType }))}
              className="fc-select w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
            >
              {FIELD_TYPE_ORDER.map((ft) => (
                <option key={ft} value={ft}>
                  {txt.fieldTypes[ft]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-300 mb-1">{txt.section}</label>
            <select value={seccionSel} onChange={(e) => setSeccionSel(e.target.value)} className="fc-select w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white">
              <option value={SIN_SECCION_OPCION}>{txt.noSection}</option>
              {secciones.filter((s) => !s.esHuerfana).map((s) => (
                <option key={s.localId} value={s.localId}>
                  {s.nombre === '' ? txt.unnamedSection : s.nombre}
                </option>
              ))}
              <option value="__nueva">{txt.newSectionOption}</option>
            </select>
          </div>
        </div>

        {seccionSel === '__nueva' && (
          <div>
            <label className="block text-slate-300 mb-1">{txt.newSectionName}</label>
            <input
              type="text"
              value={nombreNuevaSeccion}
              onChange={(e) => setNombreNuevaSeccion(e.target.value)}
              placeholder={txt.newSectionNamePlaceholder}
              className="w-full px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
            />
          </div>
        )}

        {CON_OPCIONES.includes(fCampo.field_type) && (
          <div>
            <label className="block text-slate-300 mb-1">{txt.options}</label>
            <div className="space-y-2">
              {fCampo.options.map((opcion, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opcion}
                    onChange={(e) =>
                      setFCampo((p) => {
                        const next = [...p.options];
                        next[i] = e.target.value;
                        return { ...p, options: next };
                      })
                    }
                    placeholder={`${txt.optionPlaceholder} ${i + 1}`}
                    className="flex-1 px-3 py-2 bg-brand-navy border border-brand-border rounded text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setFCampo((p) => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                    className="p-1.5 rounded bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFCampo((p) => ({ ...p, options: [...p.options, ''] }))}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{txt.addOption}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-slate-200">
            <input
              type="checkbox"
              checked={fCampo.required}
              onChange={(e) => setFCampo((p) => ({ ...p, required: e.target.checked }))}
              className="accent-brand-green"
            />
            <span>{txt.required}</span>
          </label>
          <button type="submit" className="px-5 py-2 bg-brand-green text-brand-navy font-extrabold rounded-lg">
            {esEdicion ? txt.saveChanges : txt.addQuestionButton}
          </button>
        </div>
      </form>
    </div>
  );
};

// ---------- Modal eliminar sección ----------

interface ModalEliminarSeccionProps {
  titulo: string;
  onCancelar: () => void;
  onConfirmar: (mode: 'delete' | 'orphan') => void;
}

const ModalEliminarSeccion: React.FC<ModalEliminarSeccionProps> = ({ titulo, onCancelar, onConfirmar }) => {
  const txt = useFormsTexts();
  useLockBodyScroll();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-brand-navy border border-brand-border w-full max-w-md rounded-2xl p-6 space-y-4 text-sm">
        <h4 className="font-serif text-lg font-bold text-white">{txt.deleteSectionTitle}</h4>
        <p className="text-slate-300 text-xs">
          {txt.deleteSectionMessage.split('{name}')[0]}
          <span className="text-brand-lime font-bold">{titulo}</span>
          {txt.deleteSectionMessage.split('{name}')[1]}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => onConfirmar('delete')}
            className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 rounded-xl text-left"
          >
            <span className="font-bold block">{txt.deleteSectionAndQuestions}</span>
            <span className="text-[11px] text-red-300/80">{txt.deleteSectionAndQuestionsHint}</span>
          </button>
          <button
            onClick={() => onConfirmar('orphan')}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 rounded-xl text-left"
          >
            <span className="font-bold block">{txt.deleteSectionKeepQuestions}</span>
            <span className="text-[11px] text-slate-400">{txt.deleteSectionKeepQuestionsHint}</span>
          </button>
        </div>
        <button onClick={onCancelar} className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl">
          {txt.cancel}
        </button>
      </div>
    </div>
  );
};

// ---------- Vista previa ----------

interface ModalPreviaProps {
  titulo: string;
  secciones: SeccionDraft[];
  campos: CampoDraft[];
  onCerrar: () => void;
}

const ModalPrevia: React.FC<ModalPreviaProps> = ({ titulo, secciones, campos, onCerrar }) => {
  const txt = useFormsTexts();
  useLockBodyScroll();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-brand-navy border border-brand-border w-full max-w-2xl h-full max-h-[88vh] flex flex-col rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-brand-navyDark flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-bold text-white">{titulo || txt.previewFallbackTitle}</h3>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 shrink-0 ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-brand-cream">
          {campos.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">{txt.previewEmpty}</p>
          )}
          {secciones.map((seccion) => {
            const deSeccion = campos.filter((c) => c.seccionId === seccion.localId);
            if (deSeccion.length === 0) return null;
            return (
              <div key={seccion.localId} className="space-y-4">
                <h4 className="font-serif text-sm font-bold text-brand-lime uppercase tracking-wider border-b border-white/10 pb-1">
                  {seccion.esHuerfana ? txt.noSection : seccion.nombre === '' ? txt.unnamedSection : seccion.nombre}
                </h4>
                {seccion.descripcion && <p className="text-xs text-slate-400 whitespace-pre-wrap">{seccion.descripcion}</p>}
                {deSeccion.map((campo) => (
                  <CampoPrevia key={campo.localId} campo={campo} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CampoPrevia: React.FC<{ campo: CampoDraft }> = ({ campo }) => {
  const txt = useFormsTexts();
  const opciones = campo.options ?? [];
  const clase = 'w-full px-3.5 py-2.5 bg-brand-navyDark border border-brand-border rounded-lg text-sm text-white/60 pointer-events-none';

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1">
        {campo.label} {campo.required && <span className="text-brand-lime">*</span>}
      </label>
      {campo.field_type === 'textarea' && <textarea disabled rows={3} className={clase} />}
      {campo.field_type === 'select' && (
        <select disabled className={`${clase} fc-select`}>
          <option>{txt.choose}</option>
        </select>
      )}
      {campo.field_type === 'radio' && (
        <div className="space-y-2">
          {opciones.map((opcion) => (
            <label key={opcion} className="flex items-center space-x-2 text-xs text-slate-300">
              <input type="radio" disabled className="accent-brand-green" />
              <span>{opcion}</span>
            </label>
          ))}
        </div>
      )}
      {campo.field_type === 'checkbox' && (
        <div className="space-y-2">
          {opciones.map((opcion) => (
            <label key={opcion} className="flex items-center space-x-2 text-xs text-slate-300">
              <input type="checkbox" disabled className="accent-brand-green" />
              <span>{opcion}</span>
            </label>
          ))}
        </div>
      )}
      {campo.field_type === 'date' && <input disabled type="date" className={clase} />}
      {campo.field_type === 'datetime' && <input disabled type="datetime-local" className={clase} />}
      {campo.field_type === 'email' && <input disabled type="email" placeholder={txt.emailPlaceholder} className={clase} />}
      {campo.field_type === 'text' && <input disabled type="text" placeholder={txt.shortAnswer} className={clase} />}
    </div>
  );
};

// ---------- Vista de respuestas ----------

interface VistaRespuestasProps {
  form: Form;
  onVolver: () => void;
}

const VistaRespuestas: React.FC<VistaRespuestasProps> = ({ form, onVolver }) => {
  const [campos, setCampos] = useState<FormField[]>([]);
  const [envios, setEnvios] = useState<FormSubmission[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envioAbierto, setEnvioAbierto] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const txt = useFormsTexts();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [c, e] = await Promise.all([
        apiAdminJson<{ sections?: FormSection[]; fields?: FormField[] } | FormField[]>(`/api/v1/forms/${form.slug}/fields`),
        apiAdminJson<FormSubmission[]>(`/api/v1/forms/${form.slug}/submissions`),
      ]);
      setCampos(Array.isArray(c) ? c : (Array.isArray(c?.fields) ? c.fields : []));
      setEnvios(e);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, [form.slug]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarEstado = async (envio: FormSubmission, status: FormSubmission['status']) => {
    setError(null);
    try {
      await apiAdminJson(`/api/v1/forms/${form.slug}/submissions/${envio.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setAviso(txt.stateUpdated);
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const labelCampo = (fieldKey: string) => {
    const campo = campos.find((c) => c.field_key === fieldKey);
    return campo ? campo.label : fieldKey;
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <button onClick={onVolver} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200" title={txt.back}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="font-serif text-xl font-bold text-white">{form.title}</h3>
          <p className="text-xs text-slate-300">{txt.responsesTitle}</p>
        </div>
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs rounded-xl px-4 py-3">{error}</div>}

      {cargando ? (
        <div className="flex items-center justify-center py-16 text-slate-300">
          <Loader2 className="w-7 h-7 text-brand-green animate-spin mr-3" />
          <span className="text-sm">{txt.loading}</span>
        </div>
      ) : (
        <ListaEnvios
          envios={envios}
          envioAbierto={envioAbierto}
          setEnvioAbierto={setEnvioAbierto}
          labelCampo={labelCampo}
          cambiarEstado={cambiarEstado}
        />
      )}

      {aviso && (
        <Portal>
          <ToastRegion>
            <Toast message={aviso} onClose={() => setAviso('')} closeLabel={txt.closeNotification} />
          </ToastRegion>
        </Portal>
      )}
    </div>
  );
};

// ---------- Lista de envíos ----------

interface ListaEnviosProps {
  envios: FormSubmission[];
  envioAbierto: string | null;
  setEnvioAbierto: React.Dispatch<React.SetStateAction<string | null>>;
  labelCampo: (fieldKey: string) => string;
  cambiarEstado: (envio: FormSubmission, status: FormSubmission['status']) => void;
}

const ListaEnvios: React.FC<ListaEnviosProps> = ({ envios, envioAbierto, setEnvioAbierto, labelCampo, cambiarEstado }) => {
  const txt = useFormsTexts();
  if (envios.length === 0) {
    return (
      <div className="bg-brand-navy border border-brand-border rounded-2xl p-8 text-center text-slate-400 text-sm">
        {txt.noResponses}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {envios.map((envio) => {
        const abierto = envioAbierto === envio.id;
        const entradas = Object.entries(envio.data ?? {});
        return (
          <div key={envio.id} className="bg-brand-navy border border-brand-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 flex flex-wrap items-center gap-3 text-xs">
              <FileText className="w-4 h-4 text-brand-green shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-white block truncate">{envio.user_name}</span>
                <span className="text-[11px] text-slate-400">{envio.user_email}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{new Date(envio.created_at).toLocaleString()}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  envio.status === 'approved'
                    ? 'bg-brand-green/20 text-brand-green'
                    : envio.status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300'
                    : envio.status === 'reviewed'
                    ? 'bg-brand-blue/20 text-brand-blue'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {txt.status[envio.status]}
              </span>
              <button
                onClick={() => setEnvioAbierto(abierto ? null : envio.id)}
                className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-200"
              >
                {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {abierto && (
              <div className="border-t border-white/10 px-4 py-4 space-y-4 bg-brand-navyDark">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {entradas.map(([clave, valor]) => {
                    const texto = Array.isArray(valor)
                      ? valor.join(', ')
                      : valor === true
                      ? txt.yes
                      : valor === false
                      ? txt.no
                      : String(valor ?? '');
                    return (
                      <div key={clave} className="text-xs">
                        <span className="text-slate-400 block">{labelCampo(clave)}</span>
                        <span className="text-white whitespace-pre-wrap">{texto || '—'}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                  {(['pending', 'reviewed', 'approved', 'rejected'] as const).map((estado) => (
                    <button
                      key={estado}
                      onClick={() => cambiarEstado(envio, estado)}
                      disabled={envio.status === estado}
                      className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all disabled:opacity-40 ${
                        envio.status === estado ? 'bg-brand-green text-brand-navy' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {txt.status[estado]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
