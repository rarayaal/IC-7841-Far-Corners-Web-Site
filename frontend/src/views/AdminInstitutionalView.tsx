import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { apiAdminJson as api } from '../services/apiAdmin';
import {
  SCOPES_BY_SECTION,
  type InstitutionalContent,
  type InstitutionalSection,
} from '../services/institutional';
import { adminTexts, statusLabel } from '../lib/adminI18n';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast, ToastRegion } from '../components/Toast';
import type { Language } from '../types';

interface ContentForm {
  id?: string;
  page_slug: string;
  language: Language;
  title: string;
  subtitle: string;
  subtitle_en?: string;
  content: string;
  content_en?: string;
  image_url?: string;
  cta_label: string;
  cta_target: string;
  display_order: number;
  is_published: boolean;
}

// Únicamente Junta Directiva y Equipo de Producción para este panel
const SECCIONES: InstitutionalSection[] = ['board', 'production'];

const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_BOARD_SEEDS = [
  {
    page_slug: 'jose-pablo-arias',
    title: 'José Pablo Arias Mora',
    subtitle: 'Presidente',
    subtitle_en: 'President',
    content: 'Líder comunitario y gestor cultural con amplia trayectoria en el desarrollo del teatro musical y proyectos comunitarios en Monteverde.',
    content_en: 'Community leader and cultural manager with extensive experience developing musical theatre and community initiatives in Monteverde.',
    image_url: '/recursos/IMG_2908.PNG',
    display_order: 1,
  },
  {
    page_slug: 'isaac-matamoros',
    title: 'Isaac Matamoros Trejos',
    subtitle: 'Vicepresidente',
    subtitle_en: 'Vice President',
    content: 'Comprometido con la formación artística de jóvenes y el fortalecimiento de la educación escénica accesible.',
    content_en: 'Dedicated to artistic youth development and strengthening accessible performing arts education.',
    image_url: '/recursos/IMG_2909.PNG',
    display_order: 2,
  },
  {
    page_slug: 'luis-dario-villalobos',
    title: 'Luis Dario Villalobos Castro',
    subtitle: 'Tesorero',
    subtitle_en: 'Treasurer',
    content: 'Especialista en administración financiera y gestión de fondos transparentes para organizaciones sin fines de lucro.',
    content_en: 'Specialist in financial administration and transparent non-profit fund management.',
    image_url: '/recursos/IMG_2910.PNG',
    display_order: 3,
  },
  {
    page_slug: 'stacy-ohrt',
    title: 'Stacy Ohrt-Billingslea',
    subtitle: 'Vocal',
    subtitle_en: 'Board member',
    content: 'Impulsora de vínculos internacionales y programas de intercambio para jóvenes talentos escénicos.',
    content_en: 'Promoter of international partnerships and exchange programs for young stage talent.',
    image_url: '/recursos/IMG_2911.PNG',
    display_order: 4,
  },
  {
    page_slug: 'susu-gray',
    title: 'Susu Gray',
    subtitle: 'Vocal',
    subtitle_en: 'Board member',
    content: 'Promotora de las artes escénicas en comunidades rurales y conservación de la memoria histórica comunitaria.',
    content_en: 'Advocate for performing arts in rural communities and community historic preservation.',
    image_url: '/recursos/IMG_2912.PNG',
    display_order: 5,
  },
  {
    page_slug: 'shanae-wise',
    title: 'Shanae Wise',
    subtitle: 'Vocal',
    subtitle_en: 'Board member',
    content: 'Gestora de voluntariado, alianzas con centros educativos y proyectos de inclusión comunitaria.',
    content_en: 'Coordinator of volunteering, educational partnerships, and community inclusion initiatives.',
    image_url: '/recursos/IMG_2913.PNG',
    display_order: 6,
  },
];

const DEFAULT_PRODUCTION_SEEDS = [
  {
    page_slug: 'direccion-general',
    title: 'Dirección Escénica',
    subtitle: 'Dirección general',
    subtitle_en: 'General direction',
    content: 'Liderazgo artístico, conceptualización de montajes y guía interpretativa para el elenco comunitario.',
    content_en: 'Artistic leadership, show conceptualization, and performance guidance for the community cast.',
    image_url: '/recursos/IMG_2914.PNG',
    display_order: 1,
  },
  {
    page_slug: 'direccion-musical',
    title: 'Dirección Musical',
    subtitle: 'Dirección musical',
    subtitle_en: 'Music direction',
    content: 'Preparación vocal, ensamble coral y coordinación de instrumentación en vivo para las temporadas.',
    content_en: 'Vocal coaching, choral arrangement, and live orchestration coordination for our production seasons.',
    image_url: '/recursos/IMG_2916.PNG',
    display_order: 2,
  },
  {
    page_slug: 'coreografia',
    title: 'Coreografía y Danza',
    subtitle: 'Coreografía',
    subtitle_en: 'Choreography',
    content: 'Diseño de rutinas de baile adaptadas a todas las edades y niveles de experiencia escénica.',
    content_en: 'Designing dance routines tailored to all age groups and experience levels.',
    image_url: '/recursos/IMG_2917.PNG',
    display_order: 3,
  },
  {
    page_slug: 'produccion-tecnica',
    title: 'Producción Técnica',
    subtitle: 'Producción técnica y escenografía',
    subtitle_en: 'Technical production & stage design',
    content: 'Iluminación, diseño sonoro, escenografía e infraestructura teatral comunitaria.',
    content_en: 'Lighting, sound design, set construction, and theatre technical infrastructure.',
    image_url: '/recursos/IMG_2918.PNG',
    display_order: 4,
  },
];

const formVacio = (section: InstitutionalSection): ContentForm => ({
  page_slug: SCOPES_BY_SECTION[section]?.[0] ?? '',
  language: 'es',
  title: '',
  subtitle: '',
  subtitle_en: '',
  content: '',
  content_en: '',
  image_url: '',
  cta_label: '',
  cta_target: '',
  display_order: 0,
  is_published: true,
});

/** Procesa y optimiza suavemente la imagen cargada en el navegador para guardarla directamente */
function procesarArchivoImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const AdminInstitutionalView = ({ language }: { language: Language }) => {
  const txt = adminTexts[language];
  const t = txt.institutional;

  const [seccion, setSeccion] = useState<InstitutionalSection>('board');
  const [items, setItems] = useState<InstitutionalContent[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState<ContentForm | null>(null);
  const [porEliminar, setPorEliminar] = useState<InstitutionalContent | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function sembrarSiVacio(sec: InstitutionalSection): Promise<InstitutionalContent[]> {
    const seeds = sec === 'board' ? DEFAULT_BOARD_SEEDS : DEFAULT_PRODUCTION_SEEDS;
    for (const s of seeds) {
      try {
        await api(`/api/v1/institutional/${sec}`, {
          method: 'POST',
          body: JSON.stringify({
            page_slug: s.page_slug,
            language: 'es',
            title: s.title,
            subtitle: s.subtitle,
            subtitle_en: s.subtitle_en,
            content: s.content,
            content_en: s.content_en,
            image_url: s.image_url ?? null,
            cta_label: null,
            cta_target: null,
            display_order: s.display_order,
            is_published: true,
          }),
        });
      } catch {
        // Continuar si ya existe
      }
    }
    return api<InstitutionalContent[]>(`/api/v1/institutional/${sec}/admin`);
  }

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError('');
    setFormulario(null);

    async function cargar() {
      try {
        let datos = await api<InstitutionalContent[]>(
          `/api/v1/institutional/${seccion}/admin`
        );
        if (datos.length === 0) {
          datos = await sembrarSiVacio(seccion);
        }
        if (activo) setItems(datos);
      } catch (e) {
        if (activo) {
          setItems([]);
          setError(e instanceof Error ? e.message : t.loadError);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargar();
    return () => {
      activo = false;
    };
  }, [seccion]);

  function abrirNuevo() {
    setFormulario(formVacio(seccion));
    setError('');
    setAviso('');
  }

  function abrirEdicion(item: InstitutionalContent) {
    setFormulario({
      id: item.id,
      page_slug: item.page_slug,
      language: item.language,
      title: item.title,
      subtitle: item.subtitle ?? '',
      subtitle_en: item.subtitle_en ?? '',
      content: item.content,
      content_en: item.content_en ?? '',
      image_url: item.image_url ?? '',
      cta_label: item.cta_label ?? '',
      cta_target: item.cta_target ?? '',
      display_order: item.display_order,
      is_published: item.is_published,
    });
    setError('');
    setAviso('');
  }

  async function manejarSeleccionArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo || !formulario) return;

    if (!archivo.type.startsWith('image/')) {
      setError(language === 'es' ? 'El archivo seleccionado debe ser una imagen válida (PNG, JPG, WEBP).' : 'The selected file must be an image (PNG, JPG, WEBP).');
      return;
    }

    setSubiendoFoto(true);
    setError('');

    try {
      const dataUrl = await procesarArchivoImagen(archivo);
      setFormulario((prev) => prev ? { ...prev, image_url: dataUrl } : null);
      setAviso(language === 'es' ? 'Fotografía cargada con éxito.' : 'Photo loaded successfully.');
    } catch {
      setError(language === 'es' ? 'No se pudo procesar la fotografía.' : 'Could not process the photo.');
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!formulario || guardando) return;

    if (!formulario.title.trim()) {
      setError(t.titleRequired);
      return;
    }

    if (!formulario.content.trim()) {
      setError(t.contentRequired);
      return;
    }

    if (!FORMATO_SLUG.test(formulario.page_slug)) {
      setError(t.slugInvalid);
      return;
    }

    setGuardando(true);
    setError('');
    setAviso('');

    const esEdicion = Boolean(formulario.id);

    try {
      const body = JSON.stringify({
        page_slug: formulario.page_slug,
        language: formulario.language,
        title: formulario.title.trim(),
        subtitle: formulario.subtitle.trim() || null,
        subtitle_en: formulario.subtitle_en?.trim() || null,
        content: formulario.content.trim(),
        content_en: formulario.content_en?.trim() || null,
        image_url: formulario.image_url?.trim() || null,
        cta_label: formulario.cta_label.trim() || null,
        cta_target: formulario.cta_target.trim() || null,
        display_order: formulario.display_order,
        is_published: formulario.is_published,
      });

      const { contenido } = await api<{ contenido: InstitutionalContent }>(
        esEdicion
          ? `/api/v1/institutional/${seccion}/${formulario.id}`
          : `/api/v1/institutional/${seccion}`,
        { method: esEdicion ? 'PUT' : 'POST', body }
      );

      setItems((actuales) =>
        (esEdicion
          ? actuales.map((i) => (i.id === contenido.id ? contenido : i))
          : [...actuales, contenido]
        ).sort(
          (a, b) =>
            a.display_order - b.display_order ||
            a.page_slug.localeCompare(b.page_slug) ||
            a.language.localeCompare(b.language)
        )
      );

      // Refrescar de la API para garantizar sincronización total de datos
      try {
        const frescos = await api<InstitutionalContent[]>(
          `/api/v1/institutional/${seccion}/admin`
        );
        if (frescos && frescos.length > 0) {
          setItems(frescos);
        }
      } catch {
        // Fallback al estado local
      }

      setAviso(esEdicion ? t.updated : t.created);
      setFormulario(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.saveError);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!porEliminar || borrando) return;

    setBorrando(true);
    setError('');

    try {
      await api<{ message: string }>(
        `/api/v1/institutional/${seccion}/${porEliminar.id}`,
        { method: 'DELETE' }
      );
      setItems((actuales) => actuales.filter((i) => i.id !== porEliminar.id));
      setAviso(t.deleted);
      setPorEliminar(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.deleteError);
      setPorEliminar(null);
    } finally {
      setBorrando(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-[#1e4066] bg-[#F8F8F2] dark:bg-[#00162e] p-3 text-sm text-brand-navy dark:text-white focus:border-[#77C65E] focus:outline-none';
  const labelClass = 'mb-1 block text-sm text-slate-600 dark:text-slate-300 font-bold';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-navy dark:text-white">{t.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={abrirNuevo}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#77C65E] px-4 py-2 text-sm font-bold text-[#002244] transition-colors hover:bg-[#008047] hover:text-white sm:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {language === 'es' ? 'Agregar persona' : 'Add member'}
        </button>
      </div>

      {/* Selector de pestañas: Únicamente Junta Directiva y Equipo de Producción */}
      <div
        role="tablist"
        className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/10 pb-2"
      >
        {SECCIONES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={seccion === s}
            onClick={() => setSeccion(s)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              seccion === s
                ? 'bg-[#77C65E] text-[#002244] shadow-sm'
                : 'bg-white dark:bg-[#002244] text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white'
            }`}
          >
            {t.sections[s]}
          </button>
        ))}
      </div>

      {cargando && (
        <p role="status" className="text-slate-600 dark:text-slate-300">
          {t.loading}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          {error}
        </p>
      )}

      {!cargando && items.length === 0 && !error && (
        <div className="p-8 text-center space-y-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-brand-navy/30">
          <p className="text-slate-600 dark:text-slate-300">{t.empty}</p>
          <button
            type="button"
            onClick={async () => {
              setCargando(true);
              const seeded = await sembrarSiVacio(seccion);
              setItems(seeded);
              setCargando(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-green text-brand-navy font-bold text-xs hover:bg-brand-forest hover:text-white transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {language === 'es' ? 'Cargar miembros oficiales en esta sección' : 'Load default members'}
          </button>
        </div>
      )}

      {formulario && (
        <form
          onSubmit={guardar}
          className="space-y-5 rounded-2xl border border-slate-200 dark:border-[#1e4066] bg-white dark:bg-[#002244] p-5 sm:p-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
            <h3 className="font-bold text-lg text-brand-navy dark:text-white">
              {formulario.id ? (language === 'es' ? 'Editar persona' : 'Edit member') : (language === 'es' ? 'Agregar nueva persona' : 'Add new member')} ·{' '}
              {t.sections[seccion]}
            </h3>
            <button
              type="button"
              onClick={() => setFormulario(null)}
              aria-label={txt.common.cancel}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/10 hover:text-brand-navy dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <fieldset disabled={guardando} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="inst-slug" className={labelClass}>
                  {language === 'es' ? 'Identificador (slug) *' : 'Identifier (slug) *'}
                </label>
                <input
                  id="inst-slug"
                  type="text"
                  required
                  maxLength={191}
                  value={formulario.page_slug}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      page_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    })
                  }
                  className={inputClass}
                  placeholder="ej. nombre-apellido"
                />
              </div>

              <div>
                <label htmlFor="inst-idioma" className={labelClass}>
                  {t.language}
                </label>
                <select
                  id="inst-idioma"
                  value={formulario.language}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      language: e.target.value as Language,
                    })
                  }
                  className={`${inputClass} fc-select`}
                >
                  <option value="es">{t.languageEs}</option>
                  <option value="en">{t.languageEn}</option>
                </select>
              </div>

              <div>
                <label htmlFor="inst-orden" className={labelClass}>
                  {t.order}
                </label>
                <input
                  id="inst-orden"
                  type="number"
                  min={0}
                  step={1}
                  value={formulario.display_order}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      display_order: Math.max(0, Math.trunc(Number(e.target.value)) || 0),
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {/* Nombre completo */}
            <div>
              <label htmlFor="inst-titulo" className={labelClass}>
                {language === 'es' ? 'Nombre completo de la persona *' : 'Full Name *'}
              </label>
              <input
                id="inst-titulo"
                type="text"
                required
                maxLength={255}
                value={formulario.title}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!formulario.id) {
                    const autoSlug = val
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setFormulario({ ...formulario, title: val, page_slug: autoSlug || formulario.page_slug });
                  } else {
                    setFormulario({ ...formulario, title: val });
                  }
                }}
                className={inputClass}
                placeholder={language === 'es' ? 'Ej. José Pablo Arias Mora' : 'E.g. Jane Doe'}
              />
            </div>

            {/* Carga y URL de Fotografía */}
            <div>
              <label className={labelClass}>
                {language === 'es' ? 'Fotografía o Retrato de la persona' : 'Photo or Portrait'}
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-[#1e4066] bg-[#F8F8F2] dark:bg-[#00162e]">
                {formulario.image_url ? (
                  <div className="relative group shrink-0">
                    <img
                      key={formulario.image_url}
                      src={formulario.image_url}
                      alt="Previa"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-green shadow-md animate-fadeIn"
                    />
                    <button
                      type="button"
                      onClick={() => setFormulario({ ...formulario, image_url: '' })}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white shadow hover:bg-red-700 transition-colors"
                      title={language === 'es' ? 'Quitar imagen' : 'Remove image'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-brand-green/10 border-2 border-dashed border-brand-green/40 flex flex-col items-center justify-center text-brand-forest dark:text-brand-lime shrink-0">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-70" />
                    <span className="text-[10px] font-bold">{language === 'es' ? 'Sin foto' : 'No photo'}</span>
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={manejarSeleccionArchivo}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={subiendoFoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-green hover:bg-brand-forest text-brand-navy hover:text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {subiendoFoto
                        ? (language === 'es' ? 'Cargando foto...' : 'Uploading photo...')
                        : (formulario.image_url
                            ? (language === 'es' ? 'Cambiar archivo de imagen' : 'Change image file')
                            : (language === 'es' ? 'Cargar imagen desde tu computadora' : 'Upload photo from computer'))}
                    </button>

                    {formulario.image_url && (
                      <button
                        type="button"
                        onClick={() => setFormulario({ ...formulario, image_url: '' })}
                        className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 transition-colors"
                      >
                        {language === 'es' ? 'Quitar foto' : 'Remove photo'}
                      </button>
                    )}
                  </div>

                  <div>
                    <label htmlFor="inst-foto" className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      {language === 'es' ? 'O si prefieres, pega un enlace URL web directo:' : 'Or paste a direct web URL link:'}
                    </label>
                    <input
                      id="inst-foto"
                      type="text"
                      maxLength={2048}
                      placeholder="https://... o data:image/..."
                      value={formulario.image_url ?? ''}
                      onChange={(e) => setFormulario({ ...formulario, image_url: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cargos bilingües */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inst-subtitulo" className={labelClass}>
                  {language === 'es' ? 'Cargo o Función (Español)' : 'Role / Position (Spanish)'}
                </label>
                <input
                  id="inst-subtitulo"
                  type="text"
                  maxLength={1000}
                  value={formulario.subtitle}
                  onChange={(e) => setFormulario({ ...formulario, subtitle: e.target.value })}
                  className={inputClass}
                  placeholder={seccion === 'board' ? 'Ej. Presidente / Vocal' : 'Ej. Dirección musical'}
                />
              </div>

              <div>
                <label htmlFor="inst-subtitulo-en" className={labelClass}>
                  {language === 'es' ? 'Cargo o Función (Inglés)' : 'Role / Position (English)'}
                </label>
                <input
                  id="inst-subtitulo-en"
                  type="text"
                  maxLength={1000}
                  value={formulario.subtitle_en ?? ''}
                  onChange={(e) => setFormulario({ ...formulario, subtitle_en: e.target.value })}
                  className={inputClass}
                  placeholder={seccion === 'board' ? 'E.g. President / Board Member' : 'E.g. Musical Direction'}
                />
              </div>
            </div>

            {/* Biografías bilingües */}
            <div>
              <label htmlFor="inst-contenido" className={labelClass}>
                {language === 'es' ? 'Biografía / Descripción (Español) *' : 'Bio / Description (Spanish) *'}
              </label>
              <textarea
                id="inst-contenido"
                rows={4}
                required
                maxLength={20000}
                value={formulario.content}
                onChange={(e) => setFormulario({ ...formulario, content: e.target.value })}
                className={inputClass}
                placeholder={language === 'es' ? 'Trayectoria, formación y experiencia en la organización...' : 'Background and experience in the organization...'}
              />
            </div>

            <div>
              <label htmlFor="inst-contenido-en" className={labelClass}>
                {language === 'es' ? 'Biografía / Descripción (Inglés)' : 'Bio / Description (English)'}
              </label>
              <textarea
                id="inst-contenido-en"
                rows={4}
                maxLength={20000}
                value={formulario.content_en ?? ''}
                onChange={(e) => setFormulario({ ...formulario, content_en: e.target.value })}
                className={inputClass}
                placeholder="Biography and career background in English..."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {language === 'es'
                  ? 'Opcional: Si escribes la descripción en inglés, los visitantes con el sitio en inglés la verán automáticamente.'
                  : 'Optional: English speakers will see this version.'}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm text-brand-navy dark:text-white font-medium">
              <input
                type="checkbox"
                checked={formulario.is_published}
                onChange={(e) => setFormulario({ ...formulario, is_published: e.target.checked })}
              />
              {t.published}
            </label>

            <div className="flex flex-col gap-3 sm:flex-row pt-2">
              <button
                type="submit"
                className="rounded-xl bg-[#77C65E] px-5 py-2.5 text-sm font-bold text-[#002244] hover:bg-[#008047] hover:text-white transition-colors disabled:opacity-50"
              >
                {guardando ? txt.common.saving : txt.common.save}
              </button>
              <button
                type="button"
                onClick={() => setFormulario(null)}
                className="rounded-xl bg-slate-100 dark:bg-white/10 px-5 py-2.5 text-sm font-bold text-brand-navy dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                {txt.common.cancel}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1e4066] bg-white dark:bg-[#002244] shadow-sm">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-[#F8F8F2] dark:bg-[#00162e] font-mono text-[11px] uppercase text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-3 sm:p-4">{language === 'es' ? 'Persona' : 'Person'}</th>
                <th className="hidden p-4 sm:table-cell">{language === 'es' ? 'Cargo (Español / Inglés)' : 'Role'}</th>
                <th className="p-3 sm:p-4">{txt.common.status}</th>
                <th className="p-3 text-right sm:p-4">{txt.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3">
                      {item.image_url ? (
                        <img
                          key={`${item.id}-${item.image_url}`}
                          src={item.image_url}
                          alt={item.title}
                          className="w-10 h-10 rounded-xl object-cover border border-brand-green/50 shrink-0 shadow-sm animate-fadeIn"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-green/20 text-brand-greenText dark:text-brand-lime flex items-center justify-center font-bold text-sm shrink-0 border border-brand-green/30">
                          {item.title.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-brand-navy dark:text-white block truncate">{item.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono block">slug: {item.page_slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-4 sm:table-cell">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-brand-forest dark:text-brand-lime block">
                        {item.subtitle || '—'}
                      </span>
                      {item.subtitle_en && (
                        <span className="text-[11px] text-slate-400 block italic">
                          EN: {item.subtitle_en}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        item.is_published
                          ? 'bg-[#77C65E]/20 text-[#77C65E] border border-[#77C65E]/30'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                      }`}
                    >
                      {statusLabel(
                        item.is_published ? 'published' : 'hidden',
                        language
                      )}
                    </span>
                  </td>
                  <td className="p-3 text-right sm:p-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(item)}
                        aria-label={txt.common.edit}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-brand-navy dark:text-white hover:bg-brand-green hover:text-brand-navy transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {txt.common.edit}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(item)}
                        aria-label={txt.common.delete}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {txt.common.delete}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(porEliminar)}
        title={txt.common.confirmDeleteTitle}
        message={
          porEliminar
            ? (language === 'es'
                ? `¿Seguro que deseas eliminar a «${porEliminar.title}» de ${t.sections[seccion]}?`
                : `Are you sure you want to delete «${porEliminar.title}» from ${t.sections[seccion]}?`)
            : ''
        }
        confirmLabel={txt.common.delete}
        busyLabel={txt.common.deleting}
        cancelLabel={txt.common.cancel}
        busy={borrando}
        onConfirm={confirmarBorrado}
        onCancel={() => setPorEliminar(null)}
      />

      <ToastRegion>
        {aviso && (
          <Toast
            message={aviso}
            variant="success"
            closeLabel={txt.common.closeNotification}
            onClose={() => setAviso('')}
          />
        )}
      </ToastRegion>
    </section>
  );
};
