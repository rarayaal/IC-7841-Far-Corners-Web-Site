// Funciones compartidas por las pruebas de sistema del bloque B1.
export const API = process.env.B1_API ?? 'http://localhost:3100';

export async function tokenAdmin() {
  const r = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.B1_ADMIN_EMAIL, password: process.env.B1_ADMIN_PASSWORD }),
  });
  return (await r.json()).data.token;
}

/** Abre una página pública del menú; en pantallas pequeñas abre antes el cajón del menú. */
export async function irA(page, nombre) {
  const visible = page.locator('header nav').getByRole('button', { name: nombre, exact: true }).first();
  if (await visible.isVisible().catch(() => false)) {
    await visible.click();
    return;
  }
  await page.getByRole('button', { name: /Abrir menú|Open menu/ }).click();
  await page.locator('header').getByRole('button', { name: nombre, exact: true }).last().click();
}

export const PAGINAS = [
  { nombre: 'Inicio', ir: async () => {} },
  { nombre: 'Historia e Impacto', ir: (p) => irA(p, 'Historia e Impacto') },
  { nombre: 'Cartelera', ir: (p) => irA(p, 'Cartelera') },
];
