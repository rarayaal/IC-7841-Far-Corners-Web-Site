import type { Language } from '../types';

/** Merge presentation copies only in public views. Never use this for editor/form payloads. */
export function publicDisplay<T>(value: T, language: Language): T {
  if (Array.isArray(value)) return value.map(item => publicDisplay(item, language)) as T;
  if (!value || typeof value !== 'object') return value;
  const row = value as Record<string, unknown>;
  const result = Object.fromEntries(Object.entries(row).map(([key, item]) =>
    [key, key === 'localization' ? item : publicDisplay(item, language)]));
  const metadata = row.localization as { language?: unknown; values?: unknown } | undefined;
  if (metadata?.language === language && metadata.values && typeof metadata.values === 'object')
    Object.assign(result, metadata.values);
  return result as T;
}

function pause(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 3000);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

/** Bounded polling is cancelled when the view, language or search changes. */
export async function loadPublicContent<T>(url: string, language: Language, signal: AbortSignal,
  onData: (data: T) => void): Promise<void> {
  const localizedUrl = `${url}${url.includes('?') ? '&' : '?'}lang=${language}`;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(localizedUrl, { signal, cache: 'no-store' });
      if (!response.ok) throw new Error(language === 'es' ? 'No se pudo cargar el contenido.' : 'Could not load content.');
      const data = await response.json() as T;
      if (signal.aborted) return;
      onData(publicDisplay(data, language));
      if (response.headers.get('X-Translation-State') !== 'pending') return;
    } catch (error) {
      if (signal.aborted || attempt > 0) return;
      throw error;
    }
    await pause(signal);
  }
}
