import type { Show } from '../types';

/** Mapea un evento / producción de la base de datos al formato Show del cliente */
export function mapearEventoAShow(e: any): Show {
  const primeraFuncion = e.performances?.[0];
  const boletosDisponibles = e.performances && e.performances.length > 0
    ? e.performances.reduce((acc: number, p: any) => acc + (p.max_capacity || 0), 0)
    : (e.max_capacity || 100);

  const invCrc = primeraFuncion?.inventory?.find((i: any) => i.currency === 'CRC')
    || e.inventory?.find((i: any) => i.currency === 'CRC');

  return {
    id: e.id,
    title: e.title,
    year: e.season_year || (e.event_date ? new Date(e.event_date).getFullYear() : 2026),
    status: e.status === 'past' ? 'past' : (e.is_featured || e.status === 'current' ? 'current' : 'upcoming'),
    poster: e.poster_url || '/recursos/IMG_2905.PNG',
    banner: e.banner_url || '/recursos/IMG_2903.PNG',
    dates: e.dates_label || (primeraFuncion ? new Date(primeraFuncion.starts_at).toLocaleDateString() : 'Temporada 2026'),
    location: primeraFuncion?.venue || e.venue || 'Teatro Comunitario Monteverde',
    priceGeneral: invCrc?.price || 10000,
    priceVIP: invCrc?.price || 10000,
    priceStudent: invCrc?.price || 10000,
    availableTickets: boletosDisponibles,
    director: e.director || 'Equipo Far Corners',
    synopsis: e.description || '',
    synopsisEn: e.description || '',
    cast: (e.cast || []).map((c: any) => ({
      name: c.full_name,
      role: c.role,
      photo: c.photo_url,
      biography: c.biography,
    })),
    gallery: (e.media || []).map((m: any) => (typeof m === 'string' ? m : m.url)).filter(Boolean),
    performances: e.performances || [],
  };
}

/** Una obra tiene boletería si está en cartelera y aún quedan entradas. */
export function hasTickets(show: Show): boolean {
  return show.status !== 'past' && show.availableTickets > 0;
}

/** Abre el PDF del programa de mano; si la obra aún no lo tiene, muestra su ficha. */
export function openProgram(show: Show, fallback: () => void): void {
  if (show.programUrl) {
    window.open(show.programUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  fallback();
}

