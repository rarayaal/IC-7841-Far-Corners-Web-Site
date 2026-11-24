// B1 · Pruebas de usabilidad y accesibilidad (5.2.7): axe-core (WCAG 2.2 AA) en 3 pantallas.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { PAGINAS } from './ayudas.mjs';

const SALIDA = '../evidencias-b1/playwright/axe';
mkdirSync(SALIDA, { recursive: true });

for (const pagina of PAGINAS) {
  test(`TC-B1-USA-01 accesibilidad WCAG 2.2 AA sin violaciones graves: ${pagina.nombre}`, async ({ page }, info) => {
    await page.goto('/');
    await pagina.ir(page);
    await page.waitForLoadState('networkidle');

    const r = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const resumen = r.violations.map((v) => ({
      id: v.id, impacto: v.impact, descripcion: v.help, elementos: v.nodes.length,
      ejemplo: v.nodes[0]?.html?.slice(0, 160),
    }));
    writeFileSync(`${SALIDA}/${info.project.name}-${pagina.nombre.replace(/\W+/g, '-')}.json`, JSON.stringify({ revisadas: r.passes.length, violaciones: resumen }, null, 2));

    const graves = resumen.filter((v) => ['serious', 'critical'].includes(v.impacto));
    expect(graves, JSON.stringify(graves, null, 1)).toEqual([]);
  });
}
