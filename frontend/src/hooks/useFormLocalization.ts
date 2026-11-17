import { useEffect, useState } from 'react';
import type { FormTextLocalization, Language } from '../types';
import { apiAdminJson } from '../services/apiAdmin';

export function displayFormText(text: string, localization: FormTextLocalization | null): string {
  return localization && Object.prototype.hasOwnProperty.call(localization.texts, text)
    ? localization.texts[text] : text;
}

/** Read presentation data separately: changing language never reloads answers or drafts. */
export function useFormLocalization(formType: string | undefined, language: Language, enabled: boolean) {
  const [result, setResult] = useState<{ formType: string; localization: FormTextLocalization } | null>(null);
  useEffect(() => {
    if (!enabled || !formType) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function load() {
      try {
        const data = await apiAdminJson<{ localization?: FormTextLocalization }>(
          `/api/v1/forms/${encodeURIComponent(formType!)}/fields?lang=${language}`,
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        if (data.localization?.language === language && data.localization.texts) {
          const keepPolling = data.localization.state === 'pending' && ++attempts < 60;
          const localization = data.localization.state === 'pending' && !keepPolling
            ? { ...data.localization, state: 'unavailable' as const } : data.localization;
          setResult({ formType: formType!, localization });
          // Bounded polling; already queued translations continue on the server after leaving.
          if (keepPolling) timer = setTimeout(load, 3000);
        }
      } catch {
        // The original form remains usable if translations are unavailable.
      }
    }
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [formType, language, enabled]);
  return enabled && result !== null && result.formType === formType && result.localization.language === language
    ? result.localization : null;
}
