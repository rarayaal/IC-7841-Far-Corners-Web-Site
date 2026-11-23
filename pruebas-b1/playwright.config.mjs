// Configuración de Playwright del bloque B1. Ambiente local; datos sintéticos.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const front = path.resolve(import.meta.dirname, '../frontend');
const evidencias = path.resolve(import.meta.dirname, '../evidencias-b1/playwright');

export default defineConfig({
  testDir: './sistema',
  outputDir: path.join(evidencias, 'artefactos'),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(evidencias, 'informe-html'), open: 'never' }],
    ['junit', { outputFile: path.join(evidencias, 'junit.xml') }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `node "${path.join(front, 'node_modules/vite/bin/vite.js')}" --config "${path.resolve(import.meta.dirname, 'vite.b1.config.mjs')}"`,
    cwd: front,
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'escritorio-1366', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'tableta-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'movil-375', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 667 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grep: /@compat/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grep: /@compat/ },
  ],
});
