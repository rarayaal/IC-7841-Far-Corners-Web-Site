import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const evidencias = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'evidencias');
const CLAVE = 'ClaveSintetica123';

const adminCorreo = process.env.B3_ADMIN_EMAIL;
const adminClave = process.env.B3_ADMIN_PASSWORD;

function correoNuevo() {
  return `camila.vega.${String(Date.now()).slice(-4)}@example.test`;
}

async function crearCuentaPorApi(page, nombre) {
  const correo = correoNuevo();
  const r = await page.request.post('/api/v1/users/register', {
    data: { full_name: nombre, email: correo, contrasenia: CLAVE },
  });
  expect(r.status()).toBe(201);
  return { correo, clave: CLAVE };
}

async function iniciarSesion(page, correo, clave) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.locator('#login-email').fill(correo);
  await page.locator('#login-password').fill(clave);
  await page.locator('form').getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Mi perfil' })).toBeVisible();
}

test('B3-SIS-01: el registro crea la cuenta pero la sesión no se conserva (B3-DEF-07)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Únete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Crear una cuenta' })).toBeVisible();

  const correo = correoNuevo();
  await page.locator('#register-name').fill('Cuenta Sistema B3');
  await page.locator('#register-email').fill(correo);
  await page.locator('#register-password').fill(CLAVE);
  await page.locator('#register-confirmation').fill(CLAVE);
  await page.locator('form').getByRole('button', { name: 'Crear cuenta' }).click();

  // La cuenta se creó, pero la sesión automática se pierde al validar /api/v1/me.
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible({ timeout: 15000 });
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeNull();

  await page.screenshot({ path: path.join(evidencias, 'B3-SIS-01-registro.png'), fullPage: false });
});

test('B3-SIS-02: inicio de sesión y consulta del perfil', async ({ page }) => {
  const { correo, clave } = await crearCuentaPorApi(page, 'Cuenta Sistema B3');

  await iniciarSesion(page, correo, clave);
  await page.getByRole('button', { name: 'Mi perfil' }).click();

  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
  await expect(page.locator('#perfil-nombre')).toHaveValue('Cuenta Sistema B3');
  await expect(page.getByText(correo)).toBeVisible();

  await page.screenshot({ path: path.join(evidencias, 'B3-SIS-02-perfil.png'), fullPage: false });
});

test('B3-SIS-03: actualización del nombre desde el perfil', async ({ page }) => {
  const { correo, clave } = await crearCuentaPorApi(page, 'Nombre Inicial B3');
  await iniciarSesion(page, correo, clave);

  await page.getByRole('button', { name: 'Mi perfil' }).click();
  await page.locator('#perfil-nombre').fill('Nombre Actualizado B3');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(page.getByText('Perfil actualizado correctamente.')).toBeVisible();
  await expect(page.locator('#perfil-nombre')).toHaveValue('Nombre Actualizado B3');
});

test('B3-SIS-04: búsqueda con mínimo de caracteres y resultados agrupados', async ({ page }) => {
  await page.goto('/');
  await page.getByTitle('Buscar contenido').click();

  const campo = page.getByPlaceholder('Buscar obras, proyectos, comunidades, pasantías...');
  await campo.fill('t');
  await expect(page.getByText('Escribe al menos 2 caracteres para buscar.')).toBeVisible();

  await campo.fill('teatro');
  await expect(page.getByText('Proyectos e Impacto').first()).toBeVisible();
  await expect(page.getByText('Comunidades', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Pasantías y Voluntariado').first()).toBeVisible();
  await expect(page.getByText('No se encontraron resultados para tu búsqueda.')).toBeHidden();

  await page.screenshot({ path: path.join(evidencias, 'B3-SIS-04-busqueda.png'), fullPage: false });
});

test('B3-SIS-05: alta de comunidad desde el panel administrativo', async ({ page }) => {
  test.skip(!adminCorreo || !adminClave, 'Requiere B3_ADMIN_EMAIL y B3_ADMIN_PASSWORD.');

  await iniciarSesion(page, adminCorreo, adminClave);
  await page.getByRole('button', { name: 'Acceso admin' }).click();
  await page.getByRole('button', { name: 'Comunidades', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Comunidades' })).toBeVisible();
  await page.getByRole('button', { name: 'Nueva comunidad' }).click();

  const nombre = `Comunidad UI ${Date.now()}`;
  await page.locator('#comunidad-nombre').fill(nombre);
  await page.locator('#comunidad-descripcion').fill('Creada por la prueba de sistema.');
  await page.getByLabel('Publicada en el sitio').check();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();

  await expect(page.getByText('Comunidad creada correctamente.')).toBeVisible();
  await expect(page.getByText(nombre)).toBeVisible();
  await page.screenshot({ path: path.join(evidencias, 'B3-SIS-05-comunidad.png'), fullPage: false });

  const fila = page.getByRole('row', { name: new RegExp(nombre) });
  await fila.getByRole('button', { name: 'Eliminar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page.getByText('Comunidad eliminada.')).toBeVisible();
});

test('B3-USA-01: selector de idioma accesible y cambio de idioma', async ({ page }) => {
  await page.goto('/');

  const grupo = page.getByRole('group', { name: 'Seleccionar idioma' });
  await expect(grupo).toBeVisible();
  await expect(grupo.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');

  await grupo.getByRole('button', { name: 'English' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

  const grupoEn = page.getByRole('group', { name: 'Select language' });
  await expect(grupoEn.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
});

test('B3-USA-02: objetivos táctiles del menú móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menu = page.getByRole('button', { name: 'Abrir menú' });
  await expect(menu).toBeVisible();

  const caja = await menu.boundingBox();
  expect(caja.width).toBeGreaterThanOrEqual(44);
  expect(caja.height).toBeGreaterThanOrEqual(44);

  await page.screenshot({ path: path.join(evidencias, 'B3-USA-02-movil.png'), fullPage: false });
});
