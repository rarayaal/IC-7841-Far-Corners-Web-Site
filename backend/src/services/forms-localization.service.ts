import {
  translator, sourceLanguage,
  type DisplayLanguage, type TranslationState, type MyMemoryTranslator,
} from './translation.service.js';
import type { FormPublicoRow, FormFieldRow, SeccionEstructura } from '../repositories/forms.repository.js';

export function isDisplayLanguage(value: unknown): value is DisplayLanguage {
  return value === 'es' || value === 'en';
}

function aggregate(states: TranslationState[]): TranslationState {
  if (states.includes('pending')) return 'pending';
  if (states.includes('limited')) return 'limited';
  if (states.includes('unavailable')) return 'unavailable';
  return 'ready';
}

/** Extra presentation data only: never mutate rows or call a write repository. */
export async function localizePublishedForms(
  forms: FormPublicoRow[], language: DisplayLanguage, service: MyMemoryTranslator = translator
) {
  return Promise.all(forms.map(async form => {
    const states: TranslationState[] = [];
    const requirements = form.requirements as { es?: unknown; en?: unknown } | null;
    async function text(original: string | null, english: string | null) {
      if (language === 'en' && english?.trim()) return english;
      if (!original?.trim()) {
        if (!english?.trim()) return original;
        const value = await service.display(english, language, 'en');
        states.push(value.state); return value.text;
      }
      const value = await service.display(original, language, 'es');
      states.push(value.state); return value.text;
    }
    const title = await text(form.title, form.title_en);
    const description = await text(form.description, form.description_en);
    const period = await text(form.period, form.period_en);
    const manual = requirements?.[language];
    let items: string[] = [];
    if (Array.isArray(manual) && manual.length > 0) {
      items = manual.filter((v): v is string => typeof v === 'string');
    } else {
      const other = language === 'es' ? 'en' : 'es';
      const originals = requirements?.[other];
      if (Array.isArray(originals)) for (const value of originals) {
        if (typeof value !== 'string') continue;
        const translated = await service.display(value, language, other);
        states.push(translated.state); items.push(translated.text);
      }
    }
    return { ...form, localization: { language, title: title ?? form.title, description, period, requirements: items, state: aggregate(states) } };
  }));
}

export async function localizeFormStructure(
  sections: SeccionEstructura[], fields: FormFieldRow[], language: DisplayLanguage,
  service: MyMemoryTranslator = translator, extraTexts: string[] = []
) {
  const hint = sourceLanguage(fields.map(f => f.label).join(' '), 'en');
  const originals = new Set<string>();
  for (const text of extraTexts) if (text) originals.add(text);
  for (const section of sections) {
    if (section.name) originals.add(section.name);
    if (section.description) originals.add(section.description);
  }
  for (const field of fields) {
    if (field.section) originals.add(field.section);
    if (field.label) originals.add(field.label);
    if (Array.isArray(field.options)) for (const option of field.options) {
      if (typeof option === 'string') originals.add(option);
    }
  }
  const states: TranslationState[] = [];
  const entries: [string, string][] = [];
  for (const original of originals) {
    const value = await service.display(original, language, extraTexts.includes(original) ? 'es' : hint);
    states.push(value.state); entries.push([original, value.text]);
  }
  return { language, texts: Object.fromEntries(entries), state: aggregate(states) };
}
