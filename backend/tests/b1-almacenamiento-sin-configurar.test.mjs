// B1 · CU-22 (RF-22) — Almacenamiento R2 sin configurar.
// Archivo aparte porque la configuración se lee una sola vez por proceso.
import test from 'node:test';
import assert from 'node:assert/strict';

const storage = await import('../dist/services/storage.service.js');

for (const nombre of [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
  'R2_ENDPOINT',
]) {
  delete process.env[nombre];
}

test('TC-B1-22-U01 sin variables R2, prefirmar lanza AlmacenamientoNoConfiguradoError', async () => {
  await assert.rejects(
    () => storage.prefirmarSubida('media/2026/x.jpg', 'image/jpeg', 100),
    storage.AlmacenamientoNoConfiguradoError
  );
});

test('TC-B1-22-U02 sin variables R2, urlPublica lanza AlmacenamientoNoConfiguradoError', () => {
  assert.throws(
    () => storage.urlPublica('media/2026/x.jpg'),
    storage.AlmacenamientoNoConfiguradoError
  );
});

test('TC-B1-22-U14 sin variables R2, urlVigente conserva la URL guardada', () => {
  assert.equal(storage.urlVigente('https://guardada.example/media/2026/a.jpg', 'media/2026/a.jpg'), 'https://guardada.example/media/2026/a.jpg');
});
