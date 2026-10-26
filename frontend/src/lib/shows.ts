import type { Show } from '../types';

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
