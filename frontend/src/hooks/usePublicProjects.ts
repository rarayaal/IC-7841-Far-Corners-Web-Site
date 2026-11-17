import { useEffect, useState } from 'react';
import type { ImpactProject, Language } from '../types';
import { projectsData } from '../data/mockData';
import { loadPublicContent } from '../services/publicLocalization';

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  country: 'CR' | 'CN' | 'MZ' | null;
  image_url: string | null;
  project_year: number | null;
  participants_count: number | null;
}

type ProjectCard = Omit<ImpactProject, 'country' | 'participants'> & { country: string; participants: number | null };

/** Public cards use published DB content. Existing bilingual examples remain the fallback. */
export function usePublicProjects(language: Language) {
  const [result, setResult] = useState<{ language: Language; projects: ProjectCard[] } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void loadPublicContent<ProjectRow[]>('/api/v1/projects', language, controller.signal, rows => {
      const countries = { CR: 'Costa Rica', CN: 'China', MZ: 'Mozambique' } as const;
      const projects = rows.map(row => ({
        id: row.id, title: row.title, titleEn: row.title,
        summary: row.description ?? '', summaryEn: row.description ?? '',
        country: row.country ? countries[row.country] : '',
        year: row.project_year == null ? '' : String(row.project_year),
        image: row.image_url || '', participants: row.participants_count,
        impactMetrics: [],
      }));
      setResult({ language, projects });
    }).catch(() => { /* Keep existing bilingual examples if the API is unavailable. */ });
    return () => controller.abort();
  }, [language]);
  return result?.language === language && result.projects.length ? result.projects : projectsData;
}
