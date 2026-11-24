import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Levanta una base temporal, carga el esquema del repositorio, arranca la API
// compilada y ejecuta las pruebas de integración del Bloque 3.
const aqui = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(aqui, '../..');
const repo = path.resolve(backend, '..');

const CONTENEDOR = 'farcorners_b3_it';
const PUERTO_BD = 55432;
const PUERTO_API = 3911;
const URL_BD = `postgresql://admin:clave_sintetica@127.0.0.1:${PUERTO_BD}/farcorners`;

function correr(comando, argumentos, opciones = {}) {
  return spawnSync(comando, argumentos, { encoding: 'utf8', ...opciones });
}

async function esperar(condicion, intentos, esperaMs) {
  for (let i = 0; i < intentos; i++) {
    if (await condicion()) return true;
    await new Promise((r) => setTimeout(r, esperaMs));
  }
  return false;
}

function limpiarContenedor() {
  correr('docker', ['rm', '-f', CONTENEDOR]);
}

function arrancarBase() {
  limpiarContenedor();

  const inicio = correr('docker', [
    'run',
    '-d',
    '--name',
    CONTENEDOR,
    '-e',
    'POSTGRES_USER=admin',
    '-e',
    'POSTGRES_PASSWORD=clave_sintetica',
    '-e',
    'POSTGRES_DB=farcorners',
    '-p',
    `${PUERTO_BD}:5432`,
    'postgres:16-alpine',
  ]);

  if (inicio.status !== 0) {
    console.error('No se pudo arrancar la base temporal:', inicio.stderr);
    process.exit(1);
  }
}

async function esperarBase() {
  const lista = await esperar(
    () => correr('docker', ['exec', CONTENEDOR, 'pg_isready', '-U', 'admin', '-d', 'farcorners']).status === 0,
    60,
    1000
  );

  if (!lista) {
    console.error('La base temporal no quedó lista a tiempo.');
    correr('docker', ['logs', '--tail', '40', CONTENEDOR]);
    process.exit(1);
  }
}

function cargarEsquema() {
  const sql = readFileSync(path.join(repo, 'db-init', 'init.sql'), 'utf8');
  const carga = correr(
    'docker',
    ['exec', '-i', CONTENEDOR, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'admin', '-d', 'farcorners'],
    { input: sql }
  );

  if (carga.status !== 0) {
    console.error('No se pudo cargar el esquema:', carga.stderr.slice(-3000));
    process.exit(1);
  }
}

async function esperarApi() {
  const viva = await esperar(
    async () => {
      try {
        const r = await fetch(`http://127.0.0.1:${PUERTO_API}/api/health`);
        return r.ok;
      } catch {
        return false;
      }
    },
    60,
    500
  );

  if (!viva) {
    console.error('La API de pruebas no respondió a tiempo.');
    process.exit(1);
  }
}

arrancarBase();
await esperarBase();
cargarEsquema();

const api = spawn('node', ['dist/server.js'], {
  cwd: backend,
  env: {
    ...process.env,
    DATABASE_URL: URL_BD,
    PORT: String(PUERTO_API),
    JWT_SECRET: 'clave_sintetica_para_pruebas_de_integracion_bloque3_far_corners_2026_0123456789',
    NODE_ENV: 'test',
    MYMEMORY_ENABLED: 'false',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let salidaApi = '';
api.stdout.on('data', (d) => (salidaApi += d));
api.stderr.on('data', (d) => (salidaApi += d));

await esperarApi();

const pruebas = spawnSync('node', ['--test', 'tests/integration/bloque3.test.mjs'], {
  cwd: backend,
  env: {
    ...process.env,
    B3_API_URL: `http://127.0.0.1:${PUERTO_API}`,
    B3_DATABASE_URL: URL_BD,
  },
  stdio: 'inherit',
});

api.kill('SIGTERM');

if (pruebas.status !== 0 && salidaApi.trim()) {
  console.error('--- Salida de la API ---');
  console.error(salidaApi.slice(-4000));
}

if (process.env.CONSERVAR_BD !== '1') {
  limpiarContenedor();
}

process.exit(pruebas.status ?? 1);
