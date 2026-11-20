import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { franc } from 'franc-min';

export type DisplayLanguage = 'es' | 'en';
export type TranslationState = 'ready' | 'pending' | 'limited' | 'unavailable';
export interface DisplayTranslation { text: string; state: TranslationState }

interface StoredCache {
  version: 1;
  usage: { date: string; characters: number };
  blockedUntil: number;
  entries: Record<string, string>;
}

interface TranslatorOptions {
  cacheFile?: string;
  email?: string;
  dailyLimit?: number;
  enabled?: boolean;
  fetchImpl?: typeof fetch;
  now?: () => number;
  intervalMs?: number;
}

const ES_WORDS = new Set('nombre nombres apellido apellidos edad fecha nacimiento ciudad país pais residencia correo teléfono telefono dirección direccion información informacion personal experiencia disponibilidad idiomas estudios requisitos pasantía pasantia voluntariado campamento taller teatro música programa sí usted tú tienes tiene eres estás está el la los las una un del de en con y para por qué cuál cuales cuáles cómo cuántos cuantos indique describe describa adjunta adjunte selecciona seleccione año años semestre'.split(' '));
const EN_WORDS = new Set('name names surname age date birth city country residence email phone address information experience availability languages education requirements internship volunteer camp workshop theatre music program yes you your yours are is do does did have has which what how why please list describe select attach year years first second third freshman sophomore junior senior other passport legal preferred school employer current the of to at an on for and or'.split(' '));

/** Detection is limited to the site's two languages; context resolves short labels. */
export function sourceLanguage(text: string, fallback: DisplayLanguage): DisplayLanguage {
  const words = text.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  let es = 0;
  let en = 0;
  for (const word of words) {
    if (ES_WORDS.has(word)) es++;
    if (EN_WORDS.has(word)) en++;
  }
  if (es !== en) return es > en ? 'es' : 'en';
  if (/[ñ¿¡]/i.test(text)) return 'es';
  if (text.trim().length < 15) return fallback;
  const detected = franc(text, { only: ['spa', 'eng'], minLength: 15 });
  return detected === 'spa' ? 'es' : detected === 'eng' ? 'en' : fallback;
}

/** Preserve whitespace/newlines and never send more than one paragraph or 450 UTF-8 bytes. */
export function splitTranslationText(text: string): string[] {
  const chunks: string[] = [];
  for (const line of text.split(/(\r?\n)/)) {
    let current = '';
    for (const token of line.match(/\s+|\S+/gu) ?? []) {
      if (Buffer.byteLength(current + token, 'utf8') <= 450) {
        current += token;
        continue;
      }
      if (current) chunks.push(current);
      current = '';
      for (const point of token) {
        if (Buffer.byteLength(current + point, 'utf8') > 450) {
          chunks.push(current);
          current = '';
        }
        current += point;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks;
}

function keyOf(text: string, source: DisplayLanguage, target: DisplayLanguage) {
  return createHash('sha256').update(`mymemory-v1\0${source}\0${target}\0${text}`).digest('hex');
}

export class MyMemoryTranslator {
  private readonly cacheFile: string;
  private readonly email: string;
  private readonly limit: number;
  private readonly enabled: boolean;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly interval: number;
  private data: StoredCache;
  private initialized: Promise<void> | undefined;
  private writable = true;
  private pending = new Set<string>();
  private tail: Promise<void> = Promise.resolve();
  private lastRequest = 0;
  private warned = false;

  constructor(options: TranslatorOptions = {}) {
    this.cacheFile = options.cacheFile ?? process.env.MYMEMORY_CACHE_FILE ?? join(homedir(), '.cache', 'farcorners-mymemory', 'cache.json');
    const email = (options.email ?? process.env.MYMEMORY_EMAIL ?? '').trim();
    this.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
    const maximum = this.email ? 45000 : 4500;
    const configured = options.dailyLimit ?? Number(process.env.MYMEMORY_DAILY_CHAR_LIMIT || maximum);
    this.limit = Number.isFinite(configured) ? Math.max(0, Math.min(maximum, Math.floor(configured))) : maximum;
    this.enabled = options.enabled ?? process.env.MYMEMORY_ENABLED !== 'false';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
    this.interval = options.intervalMs ?? 250;
    this.data = { version: 1, usage: { date: this.today(), characters: 0 }, blockedUntil: 0, entries: {} };
  }

  private today() { return new Date(this.now()).toISOString().slice(0, 10); }
  private rollDay() {
    if (this.data.usage.date !== this.today()) this.data.usage = { date: this.today(), characters: 0 };
  }

  private async initialize() {
    if (!this.initialized) this.initialized = (async () => {
      try {
        const parsed: unknown = JSON.parse(await readFile(this.cacheFile, 'utf8'));
        const data = parsed as StoredCache;
        if (!data || data.version !== 1 || !data.usage || typeof data.usage.date !== 'string' ||
            !Number.isSafeInteger(data.usage.characters) || data.usage.characters < 0 ||
            !Number.isFinite(data.blockedUntil) || !data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries)) {
          throw new Error('Invalid translation cache');
        }
        this.data = { ...data, entries: Object.fromEntries(Object.entries(data.entries).filter(([k, v]) => /^[a-f0-9]{64}$/.test(k) && typeof v === 'string').slice(-10000)) };
        this.rollDay();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          this.writable = false;
          this.warn('No se pudo leer la caché. Se conservarán los textos originales.');
        }
      }
    })();
    await this.initialized;
  }

  private warn(message: string) {
    if (!this.warned) { console.warn(`[Traducciones] ${message}`); this.warned = true; }
  }

  private async persist() {
    try {
      await mkdir(dirname(this.cacheFile), { recursive: true });
      const temporary = `${this.cacheFile}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(this.data), { encoding: 'utf8', mode: 0o600 });
      await rename(temporary, this.cacheFile);
    } catch {
      this.writable = false;
      this.warn('La carpeta de caché no es escribible. Se conservarán los textos originales.');
      throw new Error('Translation cache is not writable');
    }
  }

  private put(key: string, text: string) {
    this.data.entries[key] = text;
    const keys = Object.keys(this.data.entries);
    if (keys.length > 10000) delete this.data.entries[keys[0]];
  }

  private unavailable(): TranslationState | null {
    this.rollDay();
    if (!this.enabled || !this.writable) return 'unavailable';
    if (this.data.blockedUntil > this.now()) return 'limited';
    if (this.data.usage.characters >= this.limit) return 'limited';
    return null;
  }

  /** Non-blocking: return cached/original text and warm missing translations in the background. */
  async display(text: string, target: DisplayLanguage, hint: DisplayLanguage = 'es'): Promise<DisplayTranslation> {
    if (!text.trim() || !/[\p{L}]/u.test(text)) return { text, state: 'ready' };
    await this.initialize();
    const source = sourceLanguage(text, hint);
    if (source === target) return { text, state: 'ready' };
    const key = keyOf(text, source, target);
    if (Object.hasOwn(this.data.entries, key)) return { text: this.data.entries[key], state: 'ready' };
    const unavailable = this.unavailable();
    if (unavailable) return { text, state: unavailable };
    if (this.pending.has(key)) return { text, state: 'pending' };
    const cost = splitTranslationText(text).reduce((sum, chunk) => {
      const trimmed = chunk.trim();
      return sum + (!trimmed || Object.hasOwn(this.data.entries, keyOf(trimmed, source, target)) ? 0 : [...trimmed].length);
    }, 0);
    if (this.data.usage.characters + cost > this.limit) return { text, state: 'limited' };
    if (this.pending.size >= 600) return { text, state: 'unavailable' };
    this.pending.add(key);
    this.tail = this.tail.then(async () => {
      try {
        if (this.unavailable()) return;
        const translated: string[] = [];
        for (const chunk of splitTranslationText(text)) {
          const trimmed = chunk.trim();
          if (!trimmed) { translated.push(chunk); continue; }
          const chunkKey = keyOf(trimmed, source, target);
          let value = this.data.entries[chunkKey];
          if (value === undefined) {
            const size = [...trimmed].length;
            if (this.unavailable() || this.data.usage.characters + size > this.limit) return;
            // Persist the reservation before sending: restarts do not reset the local daily budget.
            this.data.usage.characters += size;
            await this.persist();
            const gap = this.interval - (this.now() - this.lastRequest);
            if (gap > 0) await new Promise(resolve => setTimeout(resolve, gap));
            this.lastRequest = this.now();
            const url = new URL('https://api.mymemory.translated.net/get');
            url.searchParams.set('q', trimmed);
            url.searchParams.set('langpair', `${source}|${target}`);
            if (this.email) url.searchParams.set('de', this.email);
            const response = await this.fetchImpl(url, { signal: AbortSignal.timeout(8000) });
            if (response.status === 429) {
              console.warn('[translation] MyMemory respondió HTTP 429');
              this.data.blockedUntil = this.now() + 24 * 60 * 60 * 1000;
              await this.persist();
              return;
            }
            const body = await response.json() as { responseStatus?: number | string; quotaFinished?: boolean; responseData?: { translatedText?: unknown } };
            if (Number(body.responseStatus) === 403 || body.quotaFinished) {
              console.warn('[translation] MyMemory rechazó la traducción', {
                responseStatus: body.responseStatus,
                quotaFinished: body.quotaFinished,
              });
              this.data.blockedUntil = this.now() + 24 * 60 * 60 * 1000;
              await this.persist();
              return;
            }
            const output = body.responseData?.translatedText;
            if (!response.ok || Number(body.responseStatus) !== 200 || typeof output !== 'string' ||
                !output.trim() || output.length > Math.max(2000, trimmed.length * 10) || /MYMEMORY WARNING|QUERY LENGTH LIMIT EXCEEDED/i.test(output)) {
              throw new Error('Invalid translation response');
            }
            value = output.trim();
            this.put(chunkKey, value);
            await this.persist();
          }
          const leading = chunk.match(/^\s*/u)?.[0] ?? '';
          const trailing = chunk.match(/\s*$/u)?.[0] ?? '';
          translated.push(leading + value + trailing);
        }
        this.put(key, translated.join(''));
        await this.persist();
      } catch (error) {
        console.warn('[translation] Falló la traducción', {
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });

        // A short circuit-breaker avoids retry storms. Error messages never replace site content.
        this.data.blockedUntil = Math.max(
          this.data.blockedUntil,
          this.now() + 60000
        );

        try {
          if (this.writable) await this.persist();
        } catch {
          /* original text remains available */
        }
      } finally {
        this.pending.delete(key);
      }
    });
    return { text, state: 'pending' };
  }

  async whenIdle() { await this.tail; }
}

export const translator = new MyMemoryTranslator();
