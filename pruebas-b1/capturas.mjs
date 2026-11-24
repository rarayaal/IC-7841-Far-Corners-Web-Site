// Capturas reales de los reportes de ZAP y del panel de SonarQube para el informe del Bloque 1.
// Variables: SONAR_ADMIN_PW (contraseña local de SonarQube, no se guarda en el repositorio).
import { chromium } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ev = path.resolve(import.meta.dirname, '../evidencias-b1');
const salida = (n) => path.join(ev, 'imagenes', n);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

for (const [archivo, nombre] of [['zap-frontend.html', 'zap-frontend.png'], ['zap-api.html', 'zap-api.png']]) {
  await page.goto(pathToFileURL(path.join(ev, 'seguridad', archivo)).href);
  await page.screenshot({ path: salida(nombre) });
}

const base = 'http://localhost:9000';
await page.goto(`${base}/sessions/new`);
await page.locator('input[name="login"], input[type="text"]').first().fill('admin');
await page.locator('input[type="password"]').first().fill(process.env.SONAR_ADMIN_PW);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.pathname.includes('sessions'));

await page.goto(`${base}/dashboard?id=farcorners-b1`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Dismiss' }).click({ timeout: 3000 }).catch(() => {});
await page.waitForTimeout(500);
await page.screenshot({ path: salida('sonar-panel.png') });

await page.goto(`${base}/project/issues?id=farcorners-b1&resolved=false`);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2500);
await page.screenshot({ path: salida('sonar-hallazgos.png') });

await browser.close();
console.log('capturas listas');
