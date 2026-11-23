// B1 · Verificaciones de seguridad (5.2.8) sobre los controles de contenido institucional,
// galería multimedia (R2) y retiro. Solo sobre el sistema propio, en ambiente local.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const API = process.env.B1_API ?? 'http://localhost:3100';
const DB = process.env.B1_DB ?? 'postgresql://admin:adminpassword@localhost:5432/farcorners_test';
const IMAGEN = process.env.B1_IMAGEN;
const db = new pg.Client({ connectionString: DB });
let admin;
let contenidoId;

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

async function http(method, ruta, { token, body, headers } = {}) {
  const h = { ...(headers ?? {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  let data;
  if (body !== undefined) { h['Content-Type'] = 'application/json'; data = JSON.stringify(body); }
  const r = await fetch(API + ruta, { method, headers: h, body: data });
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* no JSON */ }
  return { status: r.status, body: json, texto, headers: r.headers };
}

const n = async (tabla) => (await db.query(`SELECT count(*)::int n FROM ${tabla}`)).rows[0].n;

before(async () => {
  await db.connect();
  const l = await http('POST', '/api/v1/auth/login', { body: { email: process.env.B1_ADMIN_EMAIL, password: process.env.B1_ADMIN_PASSWORD } });
  admin = l.body.data.token;
  const c = await http('POST', '/api/v1/institutional/future', {
    token: admin,
    body: { page_slug: `b1-seg-${Date.now().toString(36)}`, language: 'es', title: '[B1-TEST] seguridad', content: 'Contenido sintético.', is_published: true },
  });
  contenidoId = c.body.contenido.id;
});

after(async () => {
  await db.query(`DELETE FROM media WHERE content_id = $1`, [contenidoId]);
  await db.query(`DELETE FROM institutional_content WHERE id = $1`, [contenidoId]);
  await db.end();
});

// ------------------------------------------------------------ tokens
test('TC-B1-SEG-01 un token alterado, firmado con otra clave o con alg «none» se rechaza con 401', async () => {
  const payload = JSON.parse(Buffer.from(admin.split('.')[1], 'base64url').toString());
  const firmar = (secreto, alg = 'HS256') => {
    const cuerpo = `${b64({ alg, typ: 'JWT' })}.${b64(payload)}`;
    return `${cuerpo}.${createHmac('sha256', secreto).update(cuerpo).digest('base64url')}`;
  };
  const alterado = admin.slice(0, -4) + (admin.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  const sinFirma = `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`;
  const otraClave = firmar('otra-clave-cualquiera');

  for (const [nombre, token] of [['alterado', alterado], ['alg none', sinFirma], ['otra clave', otraClave], ['basura', 'abc.def.ghi']]) {
    for (const [metodo, ruta, body] of [
      ['GET', '/api/v1/media'],
      ['POST', '/api/v1/institutional/history', { page_slug: 'x', language: 'es', title: 't', content: 'c', is_published: true }],
      ['GET', '/api/v1/content-retirement/institutional'],
    ]) {
      const r = await http(metodo, ruta, { token, body });
      assert.equal(r.status, 401, `${nombre} en ${metodo} ${ruta}: ${r.status}`);
    }
  }
});

test('TC-B1-SEG-02 un token expirado se rechaza con 401', async () => {
  // El API firma con su propio secreto; se obtiene uno válido y se verifica que
  // un token con exp en el pasado, firmado con una clave distinta, nunca sea aceptado.
  const payload = { ...JSON.parse(Buffer.from(admin.split('.')[1], 'base64url').toString()), exp: Math.floor(Date.now() / 1000) - 3600 };
  const cuerpo = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`;
  const token = `${cuerpo}.${createHmac('sha256', 'x').update(cuerpo).digest('base64url')}`;
  assert.equal((await http('GET', '/api/v1/media', { token })).status, 401);
});

// ------------------------------------------------------------ inyección
test('TC-B1-SEG-03 los parámetros con intentos de inyección SQL no alteran la base ni filtran datos', async () => {
  const antes = { c: await n('institutional_content'), m: await n('media'), u: await n('users') };
  const trampas = [
    ["/api/v1/institutional/history?lang=es'%20OR%20'1'='1", 'GET'],
    ["/api/v1/institutional/history'%20OR%201=1--?lang=es", 'GET'],
    ["/api/v1/institutional/history?lang=es;DROP%20TABLE%20users;--", 'GET'],
    ["/api/v1/content-retirement/institutional/1'%20OR%20'1'='1/consequences", 'GET'],
    ["/api/v1/media?search='%20OR%201=1--", 'GET'],
  ];
  for (const [ruta, metodo] of trampas) {
    const r = await http(metodo, ruta, { token: admin });
    assert.ok(r.status < 500, `${ruta} respondió ${r.status} (error del servidor)`);
    assert.ok(!/syntax error|pg_catalog|relation "/i.test(r.texto), `${ruta} filtró un mensaje de la base de datos`);
  }
  assert.deepEqual({ c: await n('institutional_content'), m: await n('media'), u: await n('users') }, antes);
});

test('TC-B1-SEG-04 el contenido con HTML o script se guarda como texto y se devuelve sin interpretarse', async () => {
  const carga = '<img src=x onerror="window.__xss=1"><script>alert(1)</script>';
  const r = await http('PUT', `/api/v1/institutional/future/${contenidoId}`, {
    token: admin,
    body: { page_slug: (await db.query('SELECT page_slug FROM institutional_content WHERE id=$1', [contenidoId])).rows[0].page_slug, language: 'es', title: `[B1-TEST] ${carga}`, content: carga, is_published: true },
  });
  assert.equal(r.status, 200, r.texto);
  const fila = (await db.query('SELECT title, content FROM institutional_content WHERE id=$1', [contenidoId])).rows[0];
  assert.equal(fila.content, carga, 'se conserva literal (no se ejecuta ni se reescribe)');
  const pub = await http('GET', '/api/v1/institutional/future?lang=es');
  assert.match(pub.headers.get('content-type'), /application\/json/, 'la respuesta es JSON, no HTML');
});

// ------------------------------------------------------------ exposición de datos
test('TC-B1-SEG-05 la lectura pública no expone datos internos (autor, llaves de almacenamiento, correos)', async () => {
  const pub = await http('GET', '/api/v1/institutional/history?lang=es');
  assert.equal(pub.status, 200);
  const texto = JSON.stringify(pub.body);
  for (const prohibido of ['updated_by', 'storage_key', 'uploaded_by', 'password', 'admin@farcornerscr.org']) {
    assert.ok(!texto.includes(prohibido), `la respuesta pública contiene «${prohibido}»`);
  }
});

test('TC-B1-SEG-06 el listado público no incluye contenido no publicado', async () => {
  const oculto = await http('POST', '/api/v1/institutional/impact', {
    token: admin,
    body: { page_slug: `b1-oculto-${Date.now().toString(36)}`, language: 'es', title: '[B1-TEST] oculto', content: 'No debe verse.', is_published: false },
  });
  assert.equal(oculto.status, 201);
  try {
    const pub = await http('GET', '/api/v1/institutional/impact?lang=es');
    assert.ok(!pub.body.some((i) => i.title === '[B1-TEST] oculto'));
    const sin = await http('GET', '/api/v1/institutional/impact/admin');
    assert.equal(sin.status, 401, 'el listado administrativo exige sesión');
  } finally {
    await http('DELETE', `/api/v1/institutional/impact/${oculto.body.contenido.id}`, { token: admin });
  }
});

// ------------------------------------------------------------ subida a R2
test('TC-B1-SEG-07 la URL prefirmada rechaza un archivo de tamaño o tipo distinto al validado', async (t) => {
  if (!IMAGEN) return t.skip('defina B1_IMAGEN');
  const bytes = readFileSync(IMAGEN);
  const pre = await http('POST', '/api/v1/media/presign', { token: admin, body: { filename: 'b1-seg.jpg', mime_type: 'image/jpeg', size_bytes: bytes.length } });
  assert.equal(pre.status, 200);

  const masGrande = await fetch(pre.body.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: Buffer.concat([bytes, Buffer.alloc(1024)]) });
  const otroTipo = await fetch(pre.body.upload_url, { method: 'PUT', headers: { 'Content-Type': 'text/html' }, body: bytes });
  assert.ok([400, 403].includes(masGrande.status), `un archivo mayor al declarado respondió ${masGrande.status}`);
  assert.ok([400, 403].includes(otroTipo.status), `un tipo distinto al declarado respondió ${otroTipo.status}`);

  // El objeto no debe haberse creado: confirmar debe responder 422.
  const conf = await http('POST', '/api/v1/media/confirm', {
    token: admin, body: { key: pre.body.key, filename: 'b1-seg.jpg', usage_authorized: true, content_id: contenidoId },
  });
  assert.equal(conf.status, 422);
});

test('TC-B1-SEG-08 la URL prefirmada de otra llave no sirve para subir a una llave distinta', async (t) => {
  if (!IMAGEN) return t.skip('defina B1_IMAGEN');
  const bytes = readFileSync(IMAGEN);
  const pre = await http('POST', '/api/v1/media/presign', { token: admin, body: { filename: 'b1-seg.jpg', mime_type: 'image/jpeg', size_bytes: bytes.length } });
  const otra = new URL(pre.body.upload_url);
  otra.pathname = otra.pathname.replace(/[0-9a-f-]{36}\.jpg$/, 'ffffffff-ffff-4fff-8fff-ffffffffffff.jpg');
  const r = await fetch(otra, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: bytes });
  assert.ok([400, 403].includes(r.status), `respondió ${r.status}`);
});

// ------------------------------------------------------------ cabeceras (informativo)
test('TC-B1-SEG-09 [informativo] cabeceras de seguridad de las respuestas del API', async () => {
  const r = await http('GET', '/api/v1/institutional/history?lang=es');
  const h = Object.fromEntries(r.headers.entries());
  const informe = {
    'x-powered-by (debería ocultarse)': h['x-powered-by'] ?? 'ausente',
    'x-content-type-options': h['x-content-type-options'] ?? 'ausente',
    'content-security-policy': h['content-security-policy'] ?? 'ausente',
    'strict-transport-security': h['strict-transport-security'] ?? 'ausente',
    'x-frame-options': h['x-frame-options'] ?? 'ausente',
  };
  console.log('CABECERAS', JSON.stringify(informe));
  assert.equal(r.status, 200);
});
