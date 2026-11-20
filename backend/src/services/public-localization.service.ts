import { translator, type DisplayLanguage, type TranslationState, type MyMemoryTranslator } from './translation.service.js';

export type PublicContentKind = 'projects' | 'communities' | 'institutional' | 'contacts' | 'search';
type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);

/** Only explicitly selected public fields are sent to MyMemory. Originals are never overwritten. */
export async function localizePublicContent(body: unknown, kind: PublicContentKind, language: DisplayLanguage,
  service: MyMemoryTranslator = translator): Promise<{ data: unknown; state: TranslationState }> {
  const states: TranslationState[] = [];
  async function row(original: Row, fields: string[], source?: DisplayLanguage): Promise<Row> {
    const values: Row = {};
    for (const field of fields) {
      const base = original[field];
      const english = original[`${field}_en`];
      if (language === 'en' && typeof english === 'string' && english.trim()) {
        values[field] = english;
        continue;
      }
      const value = typeof base === 'string' && base.trim() ? base : english;
      if (typeof value !== 'string' || !value.trim()) continue;
      // Contact details, links and markup are not machine-translated.
      if (/^(?:https?:|mailto:|tel:)|^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value) || /<\/?[a-z][^>]*>/i.test(value)) continue;
      const result = source === language
        ? { text: value, state: 'ready' as const }
        : await service.display(value, language, source ?? (value === english ? 'en' : 'es'));
      values[field] = result.text;
      states.push(result.state);
    }
    return { ...original, localization: { language, values } };
  }
  async function visit(value: unknown, type: PublicContentKind | 'events' | 'opportunities'): Promise<unknown> {
    if (Array.isArray(value)) return Promise.all(value.map(item => visit(item, type)));
    if (!isRow(value)) return value;
    if (value.is_published === false) return value;
    if (type === 'search') {
      const result = { ...value };
      for (const name of ['events', 'projects', 'communities', 'opportunities'] as const)
        if (Array.isArray(value[name])) result[name] = await visit(value[name], name);
      return result;
    }
    if (type === 'contacts') {
      const fields = ['label'];
      if (['office_hours', 'performance_hours'].includes(String(value.channel_type))) fields.push('value');
      return row(value, fields);
    }
    if (type === 'institutional') {
      const source = value.language === 'en' ? 'en' : 'es';
      const result = await row(value, ['title', 'subtitle', 'content', 'cta_label'], source);
      if (Array.isArray(value.images)) result.images = await Promise.all(value.images.map(async image =>
        isRow(image) ? row(image, ['alt_text']) : image));
      return result;
    }
    const fields = type === 'communities' ? ['description']
      : type === 'events' ? ['description'] // Show and community names remain proper names.
      : ['title', 'description'];
    return row(value, fields);
  }
  const data = await visit(body, kind);
  const state = states.includes('pending') ? 'pending' : states.includes('limited') ? 'limited'
    : states.includes('unavailable') ? 'unavailable' : 'ready';
  return { data, state };
}
