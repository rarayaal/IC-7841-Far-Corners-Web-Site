export type Language = 'es' | 'en';

export type PageView = 'home' | 'about' | 'shows' | 'participate' | 'donate' | 'contact' | 'admin' | 'register' | 'login';

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
  cast: { name: string; role: string; photo?: string }[];
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

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  country: string;
  role: string;
  status: 'Pendiente' | 'En Revisión' | 'Aprobado' | 'Entrevista';
  date: string;
}

export type FormType = string;

export interface Form {
  slug: string;
  title: string;
  description: string | null;
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

export interface FormSubmission {
  id: string;
  form_type: FormType;
  opportunity_id: string | null;
  user_id: string;
  data: Record<string, unknown>;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  user_name: string;
  user_email: string;
  created_at: string;
  review_notes?: string | null;
}
