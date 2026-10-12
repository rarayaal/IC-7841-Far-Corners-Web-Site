export type Language = 'es' | 'en';

export type PageView = 'home' | 'about' | 'shows' | 'participate' | 'donate' | 'contact' | 'admin';

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
