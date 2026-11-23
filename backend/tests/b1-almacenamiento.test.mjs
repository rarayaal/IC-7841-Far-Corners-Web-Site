// B1 · CU-22 (RF-22) — Almacenamiento en Cloudflare R2 con URLs prefirmadas.
// Credenciales ficticias: la firma se calcula localmente, sin red.
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.R2_ACCOUNT_ID = '00000000000000000000000000000000';
process.env.R2_ACCESS_KEY_ID = 'AKIAFAKEFAKEFAKEFAKE';
process.env.R2_SECRET_ACCESS_KEY = 'fake-secret-key-for-unit-tests-only';
process.env.R2_BUCKET = 'bucket-de-prueba';
process.env.R2_PUBLIC_URL = 'https://pub-prueba.r2.dev';

const storage = await import('../dist/services/storage.service.js');

const MB = 1024 * 1024;

test('TC-B1-22-U03 imágenes WebP, JPEG y PNG tienen límite de 10 MB', () => {
  for (const mime of ['image/webp', 'image/jpeg', 'image/png']) {
    assert.equal(storage.limitePorMime(mime), 10 * MB);
    assert.equal(storage.esImagen(mime), true);
  }
});

test('TC-B1-22-U04 el PDF tiene límite de 25 MB y no es imagen', () => {
  assert.equal(storage.limitePorMime('application/pdf'), 25 * MB);
  assert.equal(storage.esImagen('application/pdf'), false);
});

test('TC-B1-22-U05 formatos no permitidos no tienen límite (se rechazan)', () => {
  for (const mime of ['image/gif', 'image/svg+xml', 'text/html', 'application/x-msdownload', '', 'IMAGE/JPEG']) {
    assert.equal(storage.limitePorMime(mime), undefined, mime);
  }
});

test('TC-B1-22-U06 generarLlave produce llaves válidas con la extensión del tipo', () => {
  const esperado = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
  for (const [mime, ext] of Object.entries(esperado)) {
    const llave = storage.generarLlave(mime);
    assert.match(llave, storage.FORMATO_LLAVE);
    assert.ok(llave.endsWith(`.${ext}`), llave);
    assert.ok(llave.startsWith(`media/${new Date().getUTCFullYear()}/`));
  }
});

test('TC-B1-22-U07 las llaves generadas son únicas', () => {
  const llaves = new Set(Array.from({ length: 200 }, () => storage.generarLlave('image/jpeg')));
  assert.equal(llaves.size, 200);
});

test('TC-B1-22-U08 FORMATO_LLAVE rechaza recorridos de ruta y llaves mal formadas', () => {
  const invalidas = [
    '../etc/passwd',
    'media/../2026/00000000-0000-0000-0000-000000000000.jpg',
    'media/2026/archivo.jpg',
    'media/26/00000000-0000-0000-0000-000000000000.jpg',
    'media/2026/00000000-0000-0000-0000-000000000000.exe',
    'otra/2026/00000000-0000-0000-0000-000000000000.jpg',
    'media/2026/00000000-0000-0000-0000-000000000000.jpg/extra',
    '',
  ];
  for (const llave of invalidas) assert.doesNotMatch(llave, storage.FORMATO_LLAVE, llave);
});

test('TC-B1-22-U09 urlPublica concatena la URL pública del bucket y la llave', () => {
  assert.equal(
    storage.urlPublica('media/2026/a.jpg'),
    'https://pub-prueba.r2.dev/media/2026/a.jpg'
  );
});

test('TC-B1-22-U10 la URL prefirmada expira en 5 minutos y apunta al bucket', async () => {
  const llave = storage.generarLlave('image/jpeg');
  const url = new URL(await storage.prefirmarSubida(llave, 'image/jpeg', 1234));

  assert.equal(storage.EXPIRACION_URL_SEGUNDOS, 300);
  assert.equal(url.searchParams.get('X-Amz-Expires'), '300');
  assert.ok(url.searchParams.get('X-Amz-Signature'));
  assert.ok(url.hostname.endsWith('.r2.cloudflarestorage.com'));
  assert.ok(url.pathname.includes('bucket-de-prueba') || url.hostname.startsWith('bucket-de-prueba'));
  assert.ok(url.pathname.endsWith(llave));
});

test('TC-B1-22-U11 la firma obliga a usar el tipo y tamaño validados', async () => {
  const url = new URL(await storage.prefirmarSubida('media/2026/x.jpg', 'image/png', 99));
  const firmados = (url.searchParams.get('X-Amz-SignedHeaders') ?? '').split(';');

  assert.ok(firmados.includes('content-type'));
  assert.ok(firmados.includes('content-length'));
});
