// B1 · Pruebas de sistema (5.2.3) y funcionales (5.2.5) desde la interfaz real.
// Ambiente local, API y base de datos de pruebas (puertos 3100 / farcorners_test).
// Variables: B1_ADMIN_EMAIL, B1_ADMIN_PASSWORD, B1_IMAGEN.
import { test, expect } from '@playwright/test';

const API = process.env.B1_API ?? 'http://localhost:3100';
const IMAGEN = process.env.B1_IMAGEN;
const RUN = Date.now().toString(36);
const TITULO = `[B1-TEST] Historia ${RUN}`;
const CAPTURAS = '../evidencias-b1/playwright/capturas';

let original = null; // fila de historia antes de editarla (para restaurarla)

async function token() {
  const r = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.B1_ADMIN_EMAIL, password: process.env.B1_ADMIN_PASSWORD }),
  });
  return (await r.json()).data.token;
}

async function filaHistoria(h) {
  const filas = await (await fetch(`${API}/api/v1/institutional/history/admin`, { headers: h })).json();
  return filas.find((f) => f.page_slug === 'about' && f.language === 'es');
}

async function limpiar() {
  const t = await token();
  const h = { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  const lista = await (await fetch(`${API}/api/v1/media`, { headers: h })).json().catch(() => []);
  for (const m of Array.isArray(lista) ? lista : lista.items ?? []) {
    if ((m.alt_text ?? '').startsWith('Foto sintética B1')) {
      await fetch(`${API}/api/v1/media/${m.id}`, { method: 'DELETE', headers: h });
    }
  }
  if (original) {
    const f = await filaHistoria(h);
    if (f) {
      await fetch(`${API}/api/v1/institutional/history/${f.id}`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({
          page_slug: original.page_slug, language: original.language, title: original.title,
          subtitle: original.subtitle, content: original.content, cta_label: original.cta_label,
          cta_target: original.cta_target, display_order: original.display_order, is_published: true,
        }),
      });
    }
  }
}

async function iniciarSesionComoAdmin(page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesión' }).first().click();
  await page.locator('#login-email').fill(process.env.B1_ADMIN_EMAIL);
  await page.locator('#login-password').fill(process.env.B1_ADMIN_PASSWORD);
  await page.locator('form').filter({ has: page.locator('#login-email') }).locator('button[type="submit"]').click();
  await expect(page.getByRole('button', { name: 'Acceso admin' })).toBeVisible();
}

async function abrirAdmin(page, pestaña) {
  await page.getByRole('button', { name: 'Acceso admin' }).click();
  await page.getByRole('button', { name: pestaña, exact: true }).click();
}

async function irAHistoriaPublica(page) {
  await page.locator('header').getByRole('button', { name: 'Historia e Impacto' }).first().click();
}

test.describe.configure({ mode: 'serial' });
// El panel de administración se evalúa en escritorio.
test.beforeEach(async ({}, info) => { test.skip(info.project.name !== 'escritorio-1366', 'flujo del panel: solo escritorio'); });
test.afterAll(limpiar);

test('TC-B1-SIS-01 el administrador edita la historia, sube una foto y ambas se ven en la página pública', async ({ page }) => {
  test.skip(!IMAGEN, 'defina B1_IMAGEN');
  const h = { Authorization: `Bearer ${await token()}` };
  original = await filaHistoria(h);
  expect(original, 'la base de pruebas debe tener la historia sembrada').toBeTruthy();

  await iniciarSesionComoAdmin(page);

  // 1) Editar la historia desde el panel
  await abrirAdmin(page, 'Contenido institucional');
  await page.getByRole('tab', { name: 'Historia', exact: true }).click();
  await page.getByRole('row', { name: new RegExp(original.title) }).getByRole('button', { name: 'Editar' }).click();
  await page.locator('#inst-titulo').fill(TITULO);
  await page.getByLabel('Publicado en el sitio').check();
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('cell', { name: TITULO })).toBeVisible();

  // 2) Subir una foto asociada a esa historia
  await page.getByRole('button', { name: 'Galería', exact: true }).click();
  await page.getByRole('button', { name: 'Subir archivo' }).first().click();
  await page.locator('#media-archivo').setInputFiles(IMAGEN);
  const opcion = page.locator('#media-destino option', { hasText: TITULO });
  await expect(opcion).toHaveCount(1);
  await page.locator('#media-destino').selectOption(await opcion.getAttribute('value'));
  await page.locator('#media-alt').fill('Foto sintética B1');
  await page.getByLabel(/Confirmo que tenemos autorización/).check();
  await page.locator('form').filter({ has: page.locator('#media-archivo') }).getByRole('button', { name: 'Subir archivo' }).click();
  await expect(page.getByText(/addams-2026-01\.jpg/).first()).toBeVisible({ timeout: 30_000 });

  // 3) Verlo en la página pública
  await irAHistoriaPublica(page);
  await expect(page.getByRole('heading', { name: TITULO })).toBeVisible();
  await expect(page.locator('img[src*="r2.dev"]').first()).toBeVisible();
  await page.screenshot({ path: `${CAPTURAS}/SIS-01-historia-publica.png`, fullPage: true });
});

test('TC-B1-SIS-02 el administrador retira la historia desde el panel y deja de verse en la página pública; al restaurarla vuelve', async ({ page }) => {
  await iniciarSesionComoAdmin(page);
  await abrirAdmin(page, 'Retirar contenido');

  // Retirar
  await page.getByRole('tab', { name: 'Publicado' }).or(page.getByRole('button', { name: 'Publicado', exact: true })).first().click();
  const fila = page.getByRole('row', { name: TITULO });
  await expect(fila).toBeVisible();
  await fila.getByRole('button', { name: 'Retirar' }).click();
  await page.screenshot({ path: `${CAPTURAS}/SIS-02-confirmacion.png` });
  await page.getByRole('dialog').getByRole('button', { name: /Retirar|Confirmar/ }).last().click();
  await expect(fila).toBeHidden();

  // Ya no se ve en la página pública (vuelve el texto por defecto)
  await irAHistoriaPublica(page);
  await expect(page.getByRole('heading', { name: TITULO })).toHaveCount(0);

  // Restaurar desde la pestaña de retirados
  await abrirAdmin(page, 'Retirar contenido');
  await page.getByRole('tab', { name: 'Retirado' }).or(page.getByRole('button', { name: 'Retirado', exact: true })).first().click();
  const retirada = page.getByRole('row', { name: TITULO });
  await expect(retirada).toBeVisible();
  await retirada.getByRole('button', { name: 'Restaurar' }).click();
  const dlg = page.getByRole('dialog');
  if (await dlg.isVisible().catch(() => false)) await dlg.getByRole('button', { name: /Restaurar|Confirmar/ }).last().click();
  await expect(retirada).toBeHidden();

  await irAHistoriaPublica(page);
  await expect(page.getByRole('heading', { name: TITULO })).toBeVisible();
});
