// B1 · Seguridad en la interfaz (5.2.8): el contenido con HTML o script se muestra como texto y no se ejecuta.
import { test, expect } from '@playwright/test';
import { API, tokenAdmin, irA } from './ayudas.mjs';

test('TC-B1-SEG-10 un script guardado como contenido institucional se muestra como texto y no se ejecuta', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio-1366', 'basta una ejecución');
  const token = await tokenAdmin();
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const filas = await (await fetch(`${API}/api/v1/institutional/history/admin`, { headers: h })).json();
  const original = filas.find((f) => f.page_slug === 'about' && f.language === 'es');
  const carga = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  const cuerpo = (extra) => JSON.stringify({
    page_slug: original.page_slug, language: original.language, title: original.title, subtitle: original.subtitle,
    content: original.content, cta_label: original.cta_label, cta_target: original.cta_target,
    display_order: original.display_order, is_published: true, ...extra,
  });

  try {
    const r = await fetch(`${API}/api/v1/institutional/history/${original.id}`, { method: 'PUT', headers: h, body: cuerpo({ title: `[B1-TEST] ${carga}`, content: carga }) });
    expect(r.status).toBe(200);

    let dialogos = 0;
    page.on('dialog', (d) => { dialogos += 1; d.dismiss(); });
    await page.goto('/');
    await irA(page, 'Historia e Impacto');
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(dialogos).toBe(0);
    await expect(page.getByText('<script>window.__xss=2</script>').first()).toBeVisible();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
  } finally {
    await fetch(`${API}/api/v1/institutional/history/${original.id}`, { method: 'PUT', headers: h, body: cuerpo({}) });
  }
});
