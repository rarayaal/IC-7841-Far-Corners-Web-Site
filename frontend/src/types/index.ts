export type Language = 'es' | 'en';

export type TranslationState = 'ready' | 'pending' | 'limited' | 'unavailable';

export interface FormTextLocalization {
  language: Language;
  texts: Record<string, string>;
  state: TranslationState;
}

export type PageView = 'home' | 'about' | 'shows' | 'participate' | 'donate' | 'contact' | 'admin' | 'register' | 'login' | 'profile';

export interface Show {
  id: string;
  title: string;
  year: number;
  status: 'current' | 'upcoming' | 'past';
  poster: string;
  banner: string;
  dates: string;
  location: string;
  priceGeneral: number;
  priceVIP: number;
  priceStudent: number;
  availableTickets: number;
  director: string;
  synopsis: string;
  synopsisEn: string;
  /** PDF del programa de mano; se usa cuando la obra no tiene boletería. */
  programUrl?: string;
  /** Actores y personajes que participan en la obra. Vacío = elenco por anunciar. */
  cast: { name: string; role: string; photo?: string; biography?: string }[];
  /** Fotos de la obra para la galería (URLs). */
  gallery?: string[];
  performances?: {
    id: string;
    starts_at: string;
    ends_at?: string;
    venue: string;
    max_capacity: number;
    status: string;
    inventory?: any[];
  }[];
}

export interface ImpactProject {
  id: string;
  title: string;
  titleEn: string;
  country: 'Costa Rica' | 'China' | 'Mozambique';
  year: string;
  summary: string;
  summaryEn: string;
  image: string;
  participants: number;
  impactMetrics: string[];
  /** Fotos del proyecto para la galería (URLs). */
  gallery?: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  titleEn: string;
  type: 'internship' | 'volunteer' | 'camp';
  location: string;
  period: string;
  description: string;
  descriptionEn: string;
  requirements: string[];
  requirementsEn: string[];
}

export interface DonorTier {
  id: string;
  name: string;
  nameEn: string;
  amount: number;
  period: string;
  perks: string[];
  perksEn: string[];
  recommended?: boolean;
}

export interface AuditLogItem {
  id: string;
  user: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}

export type FormType = string;

export type FormCategory = 'internship' | 'volunteer' | 'camp';

/** Ficha con la que un formulario publicado aparece en la página pública. */
export interface PublicForm {
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  category: FormCategory | null;
  period: string | null;
  period_en: string | null;
  requirements: { es?: string[]; en?: string[] } | null;
  is_featured: boolean;
  image_url: string | null;
  /** Presentation only; the original fields above retain the database values. */
  localization?: {
    language: Language;
    title: string;
    description: string | null;
    period: string | null;
    requirements: string[];
    state: TranslationState;
  };
}

export interface Form extends PublicForm {
  is_published: boolean;
  field_count: number;
  submission_count: number;
}

export interface FormSection {
  name: string;
  description: string | null;
  orphan?: boolean;
}

export type FormFieldType =
  | 'text'
  | 'email'
  | 'date'
  | 'datetime'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox';

export interface FormField {
  id: string;
  form_type: FormType;
  section: string;
  field_key: string;
  label: string;
  label_en: string | null;
  field_type: FormFieldType;
  options: string[] | null;
  required: boolean;
  display_order: number;
}

export interface FormSnapshot {
  title: string;
  sections: FormSection[];
  fields: {
    field_key: string;
    label: string;
    field_type: FormFieldType;
    section: string;
    options: string[] | null;
    required: boolean;
  }[];
}

export interface FormSubmission {
  id: string;
  form_type: FormType;
  opportunity_id: string | null;
  user_id: string;
  data: Record<string, unknown>;
  /** Estructura del formulario tal como estaba cuando se envió. */
  form_snapshot?: FormSnapshot | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  user_name: string;
  user_email: string;
  created_at: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}
