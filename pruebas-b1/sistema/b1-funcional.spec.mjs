// B1 · Pruebas funcionales (5.2.5), RNF-03 (móvil) y RNF-10 (identidad visual).
// Se ejecutan en los proyectos de escritorio, tableta y móvil; las marcadas @compat también en Firefox y WebKit.
import { test, expect } from '@playwright/test';
import { API, tokenAdmin, irA, PAGINAS } from './ayudas.mjs';

const CAPTURAS = '../evidencias-b1/playwright/capturas';
const RUN = Date.now().toString(36);

// ------------------------------------------------------------------ RNF-03
for (const pagina of PAGINAS) {
  test(`TC-B1-RNF03-01 sin desplazamiento horizontal ni desbordes: ${pagina.nombre}`, async ({ page }, info) => {
    await page.goto('/');
    await pagina.ir(page);
    await page.waitForLoadState('networkidle');

    const medidas = await page.evaluate(() => ({
      ancho: window.innerWidth,
      contenido: document.documentElement.scrollWidth,
    }));
    await page.screenshot({
      path: `${CAPTURAS}/RNF03-${info.project.name}-${pagina.nombre.replace(/\W+/g, '-')}.png`,
      fullPage: true,
    });
    expect(medidas.contenido, `el contenido (${medidas.contenido}px) excede el ancho (${medidas.ancho}px)`).toBeLessThanOrEqual(medidas.ancho);
  });
}

test('TC-B1-RNF03-02 los controles táctiles principales miden al menos 24x24 px (WCAG 2.2, 2.5.8)', async ({ page }) => {
  await page.goto('/');
  const pequenos = await page.evaluate(() =>
    [...document.querySelectorAll('header button, header a')]
      .filter((e) => e.offsetParent !== null)
      .map((e) => ({ t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) }))
      .filter((e) => e.w < 24 || e.h < 24)
  );
  expect(pequenos).toEqual([]);
});

test('TC-B1-RNF03-03 el encabezado muestra un solo botón de búsqueda en cada ancho evaluado', async ({ page }) => {
  for (const ancho of [375, 640, 768, 1024, 1279, 1366]) {
    await page.setViewportSize({ width: ancho, height: 800 });
    await page.goto('/');
    const visibles = await page.locator('header button:visible').evaluateAll(
      (botones) => botones.filter((b) => b.querySelector('svg.lucide-search')).length
    );
    expect(visibles, `a ${ancho} px hay ${visibles} botones de búsqueda`).toBe(1);
  }
});

// ------------------------------------------------------------------ Idioma (selector ES | EN)
test('TC-B1-IDI-01 el sitio abre en español, cambia a inglés y conserva el idioma al recargar @compat', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('button', { name: /ES, Español/ })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /EN, English/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: /EN, English/ })).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: /EN, English/ })).toHaveAttribute('aria-pressed', 'true');
});

test('TC-B1-IDI-02 sin preferencia guardada el idioma inicial es el español aunque el navegador esté en inglés', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await ctx.close();
});

// ------------------------------------------------------------------ Contacto (selector de motivo)
async function abrirContacto(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Contáctanos' }).first().click();
}

test('TC-B1-CON-01 el motivo es un selector con las 8 opciones del cliente @compat', async ({ page }) => {
  await abrirContacto(page);
  const select = page.locator('form select');
  await expect(select).toBeVisible();
  const opciones = await select.locator('option:not([disabled])').allInnerTexts();
  expect(opciones).toEqual([
    'Quiero participar en una producción',
    'Me interesa ser voluntario/a',
    'Quiero conocer los programas y talleres',
    'Me interesa realizar una pasantía',
    'Quiero apoyar o realizar una donación',
    'Me gustaría proponer una alianza o colaboración',
    'Tengo una consulta general',
    'Otro motivo',
  ]);
});

test('TC-B1-CON-02 sin elegir motivo el formulario no se envía', async ({ page }) => {
  await abrirContacto(page);
  let enviado = false;
  page.on('request', (r) => { if (r.url().includes('/contact-messages') && r.method() === 'POST') enviado = true; });
  const form = page.locator('form').filter({ has: page.locator('select') });
  await form.locator('input[type="text"]').first().fill('[B1-TEST] Persona Sintética');
  await form.locator('input[type="email"]').fill('b1@prueba.test');
  await form.locator('textarea').fill('Mensaje sintético sin motivo.');
  await form.locator('button[type="submit"]').click();
  await page.waitForTimeout(500);
  expect(enviado).toBe(false);
  await expect(form).toBeVisible();
});

test('TC-B1-CON-03 con «Otro motivo» el mensaje pide especificarlo y el envío guarda el motivo elegido', async ({ page }) => {
  await abrirContacto(page);
  const form = page.locator('form').filter({ has: page.locator('select') });
  await form.locator('input[type="text"]').first().fill(`[B1-TEST] Persona ${RUN}`);
  await form.locator('input[type="email"]').fill(`b1-${RUN}@prueba.test`);
  await form.locator('select').selectOption({ label: 'Otro motivo' });
  await expect(form.locator('textarea')).toHaveAttribute('placeholder', /motivo/i);
  await form.locator('textarea').fill('Mensaje sintético con otro motivo.');
  await form.locator('button[type="submit"]').click();
  await expect(page.getByText(/Gracias/)).toBeVisible();

  // Efecto en el sistema: el mensaje quedó almacenado con el motivo elegido.
  const h = { Authorization: `Bearer ${await tokenAdmin()}` };
  const lista = await (await fetch(`${API}/api/v1/contact-messages`, { headers: h })).json();
  const mensajes = Array.isArray(lista) ? lista : lista.messages ?? lista.data ?? lista.items ?? [];
  const m = mensajes.find((x) => x.name === `[B1-TEST] Persona ${RUN}`);
  expect(m, 'el mensaje debe estar almacenado').toBeTruthy();
  expect(m.subject).toBe('Otro motivo');
});

test('TC-B1-CON-04 al cambiar el idioma las opciones del motivo se traducen y se conserva la elección', async ({ page }) => {
  await abrirContacto(page);
  const select = page.locator('form select');
  await select.selectOption({ label: 'Me interesa ser voluntario/a' });
  await page.getByRole('button', { name: /EN, English/ }).click();
  await expect(select.locator('option:checked')).toHaveText("I'm interested in volunteering");
});

// ------------------------------------------------------------------ RNF-10 / observaciones del cliente
test('TC-B1-RNF10-01 al hacer scroll el menú usa vidrio esmerilado (fondo translúcido con desenfoque)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 600));
  const header = page.locator('header').first();
  await expect.poll(async () => header.evaluate((e) => getComputedStyle(e).backdropFilter)).toContain('blur');
});

test('TC-B1-RNF10-02 el encabezado de Inicio muestra fotografías reales de las producciones', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const fotos = await page.locator('section').first().locator('img').evaluateAll((imgs) =>
    imgs.map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }))
  );
  const cargadas = fotos.filter((f) => f.src?.startsWith('/obras/'));
  expect(cargadas.length).toBeGreaterThanOrEqual(1);
  expect(cargadas.find((f) => f.ok), 'al menos una fotografía debe cargar').toBeTruthy();
});

test('TC-B1-RNF10-03 la historia muestra el mosaico de 5 fotografías reales cuando no hay fotos subidas', async ({ page }) => {
  await page.goto('/');
  await irA(page, 'Historia e Impacto');
  const mosaico = page.locator('img[src^="/obras/"]');
  await expect(mosaico.first()).toBeVisible();
  expect(await mosaico.count()).toBeGreaterThanOrEqual(5);
  // Al abrir una foto se muestra el visor de galería.
  await page.getByRole('button', { name: /Ver fotos de nuestra historia/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('TC-B1-RNF10-04 el visor de galería y la reseña de una persona se cierran al pulsar fuera y con la tecla Esc', async ({ page }) => {
  await page.goto('/');
  await irA(page, 'Historia e Impacto');

  // Visor de galería
  await page.getByRole('button', { name: /Ver fotos de nuestra historia/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(4, 100);
  await expect(page.getByRole('dialog')).toBeHidden();

  // Reseña de una persona de la junta directiva
  await page.getByText(/Ver reseña completa/).first().click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await page.mouse.click(4, 100);
  await expect(dialogo).toBeHidden();
  await page.getByText(/Ver reseña completa/).first().click();
  await expect(dialogo).toBeVisible();
  await dialogo.getByRole('button', { name: /Cerrar|Close/ }).click();
  await expect(dialogo).toBeHidden();
});
