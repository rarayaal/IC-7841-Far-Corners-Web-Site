// B1 · CU-01/02/03 (contenido institucional), CU-22 (multimedia) y CU-24 (retiro).
// Se ejercitan las validaciones de los controladores con petición/respuesta
// simuladas: todas responden antes de tocar la base de datos.
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.R2_ACCOUNT_ID = '00000000000000000000000000000000';
process.env.R2_ACCESS_KEY_ID = 'AKIAFAKEFAKEFAKEFAKE';
process.env.R2_SECRET_ACCESS_KEY = 'fake-secret-key-for-unit-tests-only';
process.env.R2_BUCKET = 'bucket-de-prueba';
process.env.R2_PUBLIC_URL = 'https://pub-prueba.r2.dev';

const media = await import('../dist/controllers/media.controller.js');
const institucional = await import('../dist/controllers/institutional.controller.js');
const repoInst = await import('../dist/repositories/institutional.repository.js');
const retiro = await import('../dist/repositories/retirement.repository.js');

const MB = 1024 * 1024;

function res() {
  const r = {
    statusCode: null,
    body: null,
    status(c) { r.statusCode = c; return r; },
    json(b) { r.body = b; return r; },
  };
  return r;
}

const UUID = '11111111-1111-4111-8111-111111111111';
const LLAVE = 'media/2026/22222222-2222-4222-8222-222222222222.jpg';

// ---------------------------------------------------------------- CU-22: presign
async function presign(body) {
  const r = res();
  await media.solicitarUrlPrefirmada({ body }, r);
  return r;
}

test('TC-B1-22-V01 presign válido devuelve URL, llave y método PUT', async () => {
  const r = await presign({ filename: 'foto.jpg', mime_type: 'image/jpeg', size_bytes: 1000 });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.method, 'PUT');
  assert.equal(r.body.expires_in, 300);
  assert.match(r.body.key, /^media\/\d{4}\//);
  assert.equal(r.body.headers['Content-Type'], 'image/jpeg');
});

test('TC-B1-22-V02 presign sin nombre de archivo → 400', async () => {
  for (const filename of [undefined, '', '   ', 123]) {
    const r = await presign({ filename, mime_type: 'image/jpeg', size_bytes: 10 });
    assert.equal(r.statusCode, 400, String(filename));
  }
});

test('TC-B1-22-V03 presign con formato no permitido → 422', async () => {
  for (const mime_type of ['image/gif', 'image/svg+xml', 'text/plain', undefined]) {
    const r = await presign({ filename: 'a', mime_type, size_bytes: 10 });
    assert.equal(r.statusCode, 422, String(mime_type));
  }
});

test('TC-B1-22-V04 presign con tamaño inválido → 400', async () => {
  for (const size_bytes of [0, -5, 1.5, '100', null, undefined]) {
    const r = await presign({ filename: 'a', mime_type: 'image/png', size_bytes });
    assert.equal(r.statusCode, 400, String(size_bytes));
  }
});

test('TC-B1-22-V05 frontera: imagen de exactamente 10 MB pasa y 10 MB + 1 byte falla', async () => {
  const justo = await presign({ filename: 'a', mime_type: 'image/webp', size_bytes: 10 * MB });
  const exceso = await presign({ filename: 'a', mime_type: 'image/webp', size_bytes: 10 * MB + 1 });
  assert.equal(justo.statusCode, 200);
  assert.equal(exceso.statusCode, 422);
});

test('TC-B1-22-V06 frontera: PDF de 25 MB pasa y 25 MB + 1 byte falla; un PDF de 11 MB es válido', async () => {
  const justo = await presign({ filename: 'p.pdf', mime_type: 'application/pdf', size_bytes: 25 * MB });
  const exceso = await presign({ filename: 'p.pdf', mime_type: 'application/pdf', size_bytes: 25 * MB + 1 });
  const medio = await presign({ filename: 'p.pdf', mime_type: 'application/pdf', size_bytes: 11 * MB });
  assert.equal(justo.statusCode, 200);
  assert.equal(exceso.statusCode, 422);
  assert.equal(medio.statusCode, 200);
});

// ---------------------------------------------------------------- CU-22: confirm
async function confirmar(body) {
  const r = res();
  await media.confirmarCarga({ body, user: { userId: UUID } }, r);
  return r;
}

test('TC-B1-22-V07 confirm con llave inválida → 400', async () => {
  for (const key of [undefined, '', '../x', 'media/2026/x.jpg', 5]) {
    const r = await confirmar({ key, filename: 'a.jpg', usage_authorized: true, content_id: UUID });
    assert.equal(r.statusCode, 400, String(key));
  }
});

test('TC-B1-22-V08 confirm exige declarar autorización de uso del contenido', async () => {
  for (const usage_authorized of [undefined, false, 'true', 1]) {
    const r = await confirmar({ key: LLAVE, filename: 'a.jpg', usage_authorized, content_id: UUID });
    assert.equal(r.statusCode, 400, String(usage_authorized));
  }
});

test('TC-B1-22-V09 confirm exige exactamente una asociación (contenido, proyecto o evento)', async () => {
  const base = { key: LLAVE, filename: 'a.jpg', usage_authorized: true };
  const ninguna = await confirmar(base);
  const dos = await confirmar({ ...base, content_id: UUID, project_id: UUID });
  const tres = await confirmar({ ...base, content_id: UUID, project_id: UUID, event_id: UUID });
  assert.equal(ninguna.statusCode, 400);
  assert.equal(dos.statusCode, 400);
  assert.equal(tres.statusCode, 400);
});

test('TC-B1-22-V10 confirm rechaza identificadores de asociación que no son UUID', async () => {
  for (const content_id of ['1', 'abc', "' OR 1=1 --", 42]) {
    const r = await confirmar({ key: LLAVE, filename: 'a.jpg', usage_authorized: true, content_id });
    assert.equal(r.statusCode, 400, String(content_id));
  }
});

// ---------------------------------------------------------------- CU-01/02/03
const valido = {
  page_slug: 'about',
  language: 'es',
  title: 'Nuestra historia',
  content: 'Texto',
  is_published: true,
};

async function registrar(section, body) {
  const r = res();
  await institucional.registrarContenido(
    { params: { section }, body, user: { userId: UUID }, ip: '127.0.0.1' },
    r
  );
  return r;
}

test('TC-B1-01-V01 las secciones editables incluyen historia, impacto, visión, footer, junta, producción y galerías', () => {
  for (const s of ['history', 'impact', 'future', 'footer', 'board', 'production', 'gallery']) {
    assert.ok(repoInst.SECCIONES_INSTITUCIONALES.includes(s), s);
  }
  assert.deepEqual([...repoInst.IDIOMAS_INSTITUCIONALES], ['es', 'en']);
});

test('TC-B1-01-V02 sección inexistente → 404', async () => {
  for (const s of ['nope', '', 'HISTORY', "history'; DROP TABLE users;--"]) {
    const r = await registrar(s, valido);
    assert.equal(r.statusCode, 404, s);
  }
});

test('TC-B1-01-V03 identificador de página inválido → 400', async () => {
  for (const page_slug of ['Mayúsculas', 'con espacios', '-inicio', 'fin-', 'a--b', 'x'.repeat(192), 5, null]) {
    const r = await registrar('history', { ...valido, page_slug });
    assert.equal(r.statusCode, 400, String(page_slug));
  }
});

test('TC-B1-01-V04 idioma distinto de es/en → 400', async () => {
  for (const language of ['fr', 'ES', '', undefined, 1]) {
    const r = await registrar('history', { ...valido, language });
    assert.equal(r.statusCode, 400, String(language));
  }
});

test('TC-B1-01-V05 frontera del título: vacío o de solo espacios falla; 256 caracteres falla', async () => {
  for (const title of ['', '   ', 'x'.repeat(256), undefined, 7]) {
    const r = await registrar('history', { ...valido, title });
    assert.equal(r.statusCode, 400, String(title).slice(0, 10));
  }
});

test('TC-B1-01-V06 frontera del contenido: vacío falla y 20001 caracteres falla', async () => {
  for (const content of ['', '  ', 'x'.repeat(20001), undefined]) {
    const r = await registrar('history', { ...valido, content });
    assert.equal(r.statusCode, 400, String(content).slice(0, 10));
  }
});

test('TC-B1-01-V07 el botón requiere texto y destino, o ninguno', async () => {
  const soloTexto = await registrar('history', { ...valido, cta_label: 'Ver' });
  const soloDestino = await registrar('history', { ...valido, cta_target: '/donar' });
  assert.equal(soloTexto.statusCode, 400);
  assert.equal(soloDestino.statusCode, 400);
});

test('TC-B1-01-V08 el destino del botón rechaza protocolos peligrosos', async () => {
  for (const cta_target of ['javascript:alert(1)', 'data:text/html,hola', '//evil.com', 'ftp://x.org', 'sin-protocolo']) {
    const r = await registrar('history', { ...valido, cta_label: 'Ir', cta_target });
    assert.equal(r.statusCode, 400, cta_target);
  }
});

test('TC-B1-01-V09 el orden debe ser entero entre 0 y 2147483647', async () => {
  for (const display_order of [-1, 1.5, 2147483648, '3', null]) {
    const r = await registrar('history', { ...valido, display_order });
    assert.equal(r.statusCode, 400, String(display_order));
  }
});

test('TC-B1-01-V10 la visibilidad debe ser booleana', async () => {
  for (const is_published of ['true', 1, undefined, null]) {
    const r = await registrar('history', { ...valido, is_published });
    assert.equal(r.statusCode, 400, String(is_published));
  }
});

test('TC-B1-01-V11 modificar y borrar con identificador no UUID → 400/404 sin tocar la BD', async () => {
  const m = res();
  await institucional.modificarContenido(
    { params: { section: 'history', id: 'no-es-uuid' }, body: valido, user: { userId: UUID }, ip: null },
    m
  );
  const b = res();
  await institucional.borrarContenido(
    { params: { section: 'history', id: 'no-es-uuid' }, user: { userId: UUID }, ip: null },
    b
  );
  assert.ok([400, 404].includes(m.statusCode), String(m.statusCode));
  assert.ok([400, 404].includes(b.statusCode), String(b.statusCode));
});

// ---------------------------------------------------------------- CU-24
test('TC-B1-24-V01 solo son retirables institucional, proyecto, evento y multimedia', () => {
  for (const tipo of ['institutional', 'project', 'event', 'media']) {
    assert.equal(retiro.esTipoRetirable(tipo), true, tipo);
  }
});

test('TC-B1-24-V02 tipos no retirables o con trampa de prototipo se rechazan', () => {
  for (const tipo of ['users', 'donations', '', '__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    assert.equal(retiro.esTipoRetirable(tipo), false, tipo);
  }
});

test('TC-B1-24-V03 cada tipo retirable exige su permiso y apunta a una tabla fija', () => {
  const { TIPOS_RETIRABLES: t } = retiro;
  assert.equal(t.institutional.permiso, 'content:manage');
  assert.equal(t.project.permiso, 'projects:manage');
  assert.equal(t.event.permiso, 'events:manage');
  assert.equal(t.media.permiso, 'media:manage');
  assert.equal(t.institutional.tabla, 'institutional_content');
  assert.equal(t.media.tabla, 'media');
});
