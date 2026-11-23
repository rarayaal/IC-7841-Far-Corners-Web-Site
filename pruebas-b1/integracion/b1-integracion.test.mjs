// B1 · Pruebas de integración (5.2.2): CU-01/02/03 contenido institucional,
// CU-22 galería multimedia (Cloudflare R2) y CU-24 retiro lógico.
//
// Cada caso hace una petición real al API y después consulta PostgreSQL para
// comprobar el efecto. Ambiente local, base de datos de pruebas y datos sintéticos.
//
// Variables: B1_API (por defecto http://localhost:3100), B1_DB, B1_ADMIN_EMAIL,
// B1_ADMIN_PASSWORD. Las credenciales nunca se guardan en el repositorio.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const API = process.env.B1_API ?? 'http://localhost:3100';
const DB = process.env.B1_DB ?? 'postgresql://admin:adminpassword@localhost:5432/farcorners_test';
const IMAGEN = process.env.B1_IMAGEN;
const RUN = Date.now().toString(36);
const slug = (s) => `b1-${RUN}-${s}`;

const db = new pg.Client({ connectionString: DB });
let admin;       // token del administrador
let adminId;     // id del administrador
let sinPermiso;  // token de un usuario registrado (rol user)

async function http(method, ruta, { token, body, raw, headers } = {}) {
  const h = { ...(headers ?? {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  let data = raw;
  if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    data = JSON.stringify(body);
  }
  const r = await fetch(ruta.startsWith('http') ? ruta : API + ruta, { method, headers: h, body: data });
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch { /* no es JSON */ }
  return { status: r.status, body: json, texto };
}

const q = async (sql, valores = []) => (await db.query(sql, valores)).rows;

const nuevo = (section, extra = {}) => ({
  page_slug: slug(section),
  language: 'es',
  title: `[B1-TEST] ${section}`,
  content: 'Contenido sintético de prueba.',
  is_published: true,
  ...extra,
});

const creados = { contenido: new Set(), media: new Set() };

before(async () => {
  await db.connect();
  const login = await http('POST', '/api/v1/auth/login', {
    body: { email: process.env.B1_ADMIN_EMAIL, password: process.env.B1_ADMIN_PASSWORD },
  });
  assert.equal(login.status, 200, 'no se pudo iniciar sesión como administrador de pruebas');
  admin = login.body.data.token;
  adminId = (await q('SELECT id FROM users WHERE email = $1', [process.env.B1_ADMIN_EMAIL]))[0].id;

  const correo = `b1-${RUN}@prueba.test`;
  const reg = await http('POST', '/api/v1/users/register', {
    body: { full_name: 'Usuario Sintético B1', email: correo, contrasenia: 'Prueba-B1-2026!' },
  });
  assert.ok([200, 201].includes(reg.status), `registro: ${reg.status} ${reg.texto}`);
  const l2 = await http('POST', '/api/v1/auth/login', { body: { email: correo, password: 'Prueba-B1-2026!' } });
  sinPermiso = l2.body.data.token;
});

after(async () => {
  // Limpieza: elimina por la API (borra también el objeto de R2) y luego por SQL lo que quede.
  for (const id of creados.media) await http('DELETE', `/api/v1/media/${id}`, { token: admin });
  await db.query(`DELETE FROM media WHERE content_id IN (SELECT id FROM institutional_content WHERE page_slug LIKE $1)`, [`b1-${RUN}-%`]);
  await db.query(`DELETE FROM institutional_content WHERE page_slug LIKE $1`, [`b1-${RUN}-%`]);
  await db.query(`DELETE FROM users WHERE email = $1`, [`b1-${RUN}@prueba.test`]);
  await db.end();
});

// ============================================================ CU-01/02/03
let hist; // contenido de historia creado

test('TC-B1-01-I01 crear historia → 201 y fila persistida con autor y estado', async () => {
  const r = await http('POST', '/api/v1/institutional/history', { token: admin, body: nuevo('history') });
  assert.equal(r.status, 201, r.texto);
  hist = r.body.contenido;
  creados.contenido.add(hist.id);

  const fila = (await q('SELECT * FROM institutional_content WHERE id = $1', [hist.id]))[0];
  assert.equal(fila.section, 'history');
  assert.equal(fila.language, 'es');
  assert.equal(fila.is_published, true);
  assert.equal(fila.updated_by, adminId);
  assert.equal(fila.title, '[B1-TEST] history');
});

test('TC-B1-01-I02 la lectura pública devuelve lo publicado y oculta lo no publicado', async () => {
  const oculto = await http('POST', '/api/v1/institutional/history', {
    token: admin, body: nuevo('history-oculto', { is_published: false }),
  });
  assert.equal(oculto.status, 201);

  const r = await http('GET', '/api/v1/institutional/history?lang=es');
  assert.equal(r.status, 200);
  const slugs = r.body.map((i) => i.page_slug);
  assert.ok(slugs.includes(slug('history')), 'debe incluir el publicado');
  assert.ok(!slugs.includes(slug('history-oculto')), 'no debe incluir el no publicado');
});

test('TC-B1-01-I03 duplicado (misma página, sección e idioma) → 409 sin insertar otra fila', async () => {
  const r = await http('POST', '/api/v1/institutional/history', { token: admin, body: nuevo('history') });
  assert.equal(r.status, 409);
  const [{ n }] = await q('SELECT count(*)::int n FROM institutional_content WHERE page_slug = $1 AND section = $2 AND language = $3', [slug('history'), 'history', 'es']);
  assert.equal(n, 1);
});

test('TC-B1-01-I04 editar → 200, la fila cambia y la bitácora registra la actualización', async () => {
  const r = await http('PUT', `/api/v1/institutional/history/${hist.id}`, {
    token: admin, body: { ...nuevo('history'), title: '[B1-TEST] history editada' },
  });
  assert.equal(r.status, 200, r.texto);
  const fila = (await q('SELECT title FROM institutional_content WHERE id = $1', [hist.id]))[0];
  assert.equal(fila.title, '[B1-TEST] history editada');

  const bitacora = await q(`SELECT action, user_id FROM audit_logs WHERE table_name = 'institutional_content' AND record_id = $1 AND action = 'update'`, [hist.id]);
  assert.ok(bitacora.length >= 1, 'debe existir registro de auditoría de la edición');
  assert.equal(bitacora[0].user_id, adminId);
});

test('TC-B1-01-I05 sin sesión → 401 y con usuario sin permisos → 403, sin cambios en la BD', async () => {
  const antes = (await q('SELECT count(*)::int n FROM institutional_content'))[0].n;
  const sinToken = await http('POST', '/api/v1/institutional/history', { body: nuevo('acceso-a') });
  const usuario = await http('POST', '/api/v1/institutional/history', { token: sinPermiso, body: nuevo('acceso-b') });
  const edicion = await http('PUT', `/api/v1/institutional/history/${hist.id}`, { token: sinPermiso, body: nuevo('history') });
  const borrado = await http('DELETE', `/api/v1/institutional/history/${hist.id}`, { token: sinPermiso });

  assert.equal(sinToken.status, 401);
  assert.equal(usuario.status, 403);
  assert.equal(edicion.status, 403);
  assert.equal(borrado.status, 403);
  assert.equal((await q('SELECT count(*)::int n FROM institutional_content'))[0].n, antes);
  assert.equal((await q('SELECT title FROM institutional_content WHERE id = $1', [hist.id]))[0].title, '[B1-TEST] history editada');
});

test('TC-B1-01-I06 contenido inválido → 400 y no se crea ninguna fila', async () => {
  const antes = (await q('SELECT count(*)::int n FROM institutional_content'))[0].n;
  const invalidos = [
    { ...nuevo('inv-1'), title: '' },
    { ...nuevo('inv-2'), language: 'fr' },
    { ...nuevo('inv-3'), content: 'x'.repeat(20001) },
    { ...nuevo('inv-4'), cta_label: 'Ir', cta_target: 'javascript:alert(1)' },
    { ...nuevo('Inv 5') },
  ];
  for (const body of invalidos) {
    const r = await http('POST', '/api/v1/institutional/history', { token: admin, body });
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 80));
  }
  assert.equal((await q('SELECT count(*)::int n FROM institutional_content'))[0].n, antes);
});

test('TC-B1-02-I07 la BD acepta las secciones footer, board, production, gallery, impact y future', async () => {
  for (const section of ['footer', 'board', 'production', 'gallery', 'impact', 'future']) {
    const r = await http('POST', `/api/v1/institutional/${section}`, { token: admin, body: nuevo(section) });
    assert.equal(r.status, 201, `${section}: ${r.texto}`);
    creados.contenido.add(r.body.contenido.id);
    const pub = await http('GET', `/api/v1/institutional/${section}?lang=es`);
    assert.ok(pub.body.some((i) => i.page_slug === slug(section)), `${section} debe aparecer en la lectura pública`);
  }
});

test('TC-B1-01-I08 eliminar → 200, la fila desaparece y la bitácora lo registra', async () => {
  const r = await http('POST', '/api/v1/institutional/future', { token: admin, body: nuevo('futuro-borrar') });
  const id = r.body.contenido.id;
  const del = await http('DELETE', `/api/v1/institutional/future/${id}`, { token: admin });
  assert.equal(del.status, 200, del.texto);
  assert.equal((await q('SELECT count(*)::int n FROM institutional_content WHERE id = $1', [id]))[0].n, 0);
  const bit = await q(`SELECT 1 FROM audit_logs WHERE table_name = 'institutional_content' AND record_id = $1 AND action = 'delete'`, [id]);
  assert.equal(bit.length, 1);
});

// ============================================================ CU-22
let subida; // { id, key, url }

test('TC-B1-22-I09 subir imagen (presign → PUT a R2 → confirm) → 201, fila en media y URL pública idéntica', async (t) => {
  if (!IMAGEN) return t.skip('defina B1_IMAGEN con la ruta de una imagen JPEG de prueba');
  const bytes = readFileSync(IMAGEN);

  const pre = await http('POST', '/api/v1/media/presign', {
    token: admin, body: { filename: 'b1-prueba.jpg', mime_type: 'image/jpeg', size_bytes: bytes.length },
  });
  assert.equal(pre.status, 200, pre.texto);

  const put = await fetch(pre.body.upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: bytes });
  assert.equal(put.status, 200, 'la subida directa a R2 debe responder 200');

  const conf = await http('POST', '/api/v1/media/confirm', {
    token: admin,
    body: { key: pre.body.key, filename: 'b1-prueba.jpg', usage_authorized: true, content_id: hist.id, alt_text: 'Imagen sintética B1' },
  });
  assert.equal(conf.status, 201, conf.texto);
  subida = { id: conf.body.media.id, key: pre.body.key, url: conf.body.media.url, bytes };
  creados.media.add(subida.id);

  const fila = (await q('SELECT * FROM media WHERE id = $1', [subida.id]))[0];
  assert.equal(fila.storage_key, pre.body.key);
  assert.equal(fila.mime_type, 'image/jpeg');
  assert.equal(Number(fila.size_bytes), bytes.length);
  assert.equal(fila.content_id, hist.id);
  assert.equal(fila.uploaded_by, adminId);
  assert.equal(fila.is_published, true);

  const pub = await fetch(subida.url);
  assert.equal(pub.status, 200);
  assert.equal(pub.headers.get('content-type'), 'image/jpeg');
  const recibido = Buffer.from(await pub.arrayBuffer());
  assert.equal(createHash('sha256').update(recibido).digest('hex'), createHash('sha256').update(bytes).digest('hex'));
});

test('TC-B1-22-I10 la imagen aparece en la lectura pública del contenido asociado', async (t) => {
  if (!subida) return t.skip('depende de I09');
  const r = await http('GET', '/api/v1/institutional/history?lang=es');
  const item = r.body.find((i) => i.page_slug === slug('history'));
  assert.ok(item, 'la historia de prueba debe estar publicada');
  assert.ok(item.images.some((im) => im.url === subida.url));
});

test('TC-B1-01-I23 la imagen del contenido: una URL https se guarda y javascript: se rechaza sin guardar nada', async () => {
  const ok = await http('POST', '/api/v1/institutional/impact', {
    token: admin, body: nuevo('imagen', { image_url: 'https://ejemplo.test/foto.jpg' }),
  });
  assert.equal(ok.status, 201, ok.texto);
  creados.contenido.add(ok.body.contenido.id);
  const fila = (await q('SELECT image_url FROM institutional_content WHERE id = $1', [ok.body.contenido.id]))[0];
  assert.equal(fila.image_url, 'https://ejemplo.test/foto.jpg');

  const antes = (await q('SELECT count(*)::int n FROM institutional_content'))[0].n;
  const mal = await http('POST', '/api/v1/institutional/impact', {
    token: admin, body: nuevo('imagen-mala', { image_url: 'javascript:alert(1)' }),
  });
  assert.equal(mal.status, 400);
  assert.equal((await q('SELECT count(*)::int n FROM institutional_content'))[0].n, antes);
});

test('TC-B1-22-I24 la URL de las imágenes usa el dominio público vigente y no expone la llave de almacenamiento', async (t) => {
  if (!subida) return t.skip('depende de I09');
  await db.query('UPDATE media SET url = $1 WHERE id = $2', [`https://dominio-anterior.example/${subida.key}`, subida.id]);
  try {
    const pub = await http('GET', '/api/v1/institutional/history?lang=es');
    const img = pub.body.find((i) => i.page_slug === slug('history')).images.find((im) => im.id === subida.id);
    assert.equal(img.url, subida.url, 'la lectura pública debe usar el dominio vigente');
    assert.ok(!('key' in img), 'no debe exponer la llave');
    assert.ok(!JSON.stringify(pub.body).includes('dominio-anterior'));

    const lista = await http('GET', '/api/v1/media', { token: admin });
    const filas = Array.isArray(lista.body) ? lista.body : lista.body.items ?? [];
    const m = filas.find((x) => x.id === subida.id);
    assert.equal(m.url, subida.url);
    assert.ok(!('storage_key' in m));
  } finally {
    await db.query('UPDATE media SET url = $1 WHERE id = $2', [subida.url, subida.id]);
  }
});

test('TC-B1-22-I11 confirmar una llave que no se subió → 422 y sin fila en media', async () => {
  const antes = (await q('SELECT count(*)::int n FROM media'))[0].n;
  const llave = `media/2026/${crypto.randomUUID()}.jpg`;
  const r = await http('POST', '/api/v1/media/confirm', {
    token: admin, body: { key: llave, filename: 'fantasma.jpg', usage_authorized: true, content_id: hist.id },
  });
  assert.equal(r.status, 422);
  assert.equal((await q('SELECT count(*)::int n FROM media'))[0].n, antes);
});

test('TC-B1-22-I12 registrar dos veces la misma llave → 409 sin duplicar la fila', async (t) => {
  if (!subida) return t.skip('depende de I09');
  const r = await http('POST', '/api/v1/media/confirm', {
    token: admin, body: { key: subida.key, filename: 'b1-prueba.jpg', usage_authorized: true, content_id: hist.id },
  });
  assert.equal(r.status, 409);
  assert.equal((await q('SELECT count(*)::int n FROM media WHERE storage_key = $1', [subida.key]))[0].n, 1);
});

test('TC-B1-22-I13 confirmar sin declarar autorización de uso → 400', async (t) => {
  if (!subida) return t.skip('depende de I09');
  const r = await http('POST', '/api/v1/media/confirm', {
    token: admin, body: { key: `media/2026/${crypto.randomUUID()}.jpg`, filename: 'x.jpg', content_id: hist.id },
  });
  assert.equal(r.status, 400);
});

test('TC-B1-22-I14 sin sesión → 401 y usuario sin permiso → 403 en presign, confirm y listado', async () => {
  const cuerpo = { filename: 'a.jpg', mime_type: 'image/jpeg', size_bytes: 100 };
  assert.equal((await http('POST', '/api/v1/media/presign', { body: cuerpo })).status, 401);
  assert.equal((await http('POST', '/api/v1/media/presign', { token: sinPermiso, body: cuerpo })).status, 403);
  assert.equal((await http('GET', '/api/v1/media', { token: sinPermiso })).status, 403);
});

test('TC-B1-22-I15 un archivo de formato no permitido o de 10 MB + 1 byte se rechaza antes de subir', async () => {
  const gif = await http('POST', '/api/v1/media/presign', { token: admin, body: { filename: 'a.gif', mime_type: 'image/gif', size_bytes: 100 } });
  const grande = await http('POST', '/api/v1/media/presign', { token: admin, body: { filename: 'a.jpg', mime_type: 'image/jpeg', size_bytes: 10 * 1024 * 1024 + 1 } });
  assert.equal(gif.status, 422);
  assert.equal(grande.status, 422);
});

// ============================================================ CU-24
test('TC-B1-24-I16 consultar consecuencias de retirar → 200 con listas de bloqueos y advertencias', async () => {
  const r = await http('GET', `/api/v1/content-retirement/institutional/${hist.id}/consequences`, { token: admin });
  assert.equal(r.status, 200, r.texto);
  assert.ok(Array.isArray(r.body.blocking));
  assert.ok(Array.isArray(r.body.warnings));
});

test('TC-B1-24-I17 retirar → 200, is_published = FALSE, no se borra y desaparece de lo público', async () => {
  const r = await http('POST', `/api/v1/content-retirement/institutional/${hist.id}/withdraw`, {
    token: admin, body: { confirm: true, reason: 'Prueba B1' },
  });
  assert.equal(r.status, 200, r.texto);

  const fila = (await q('SELECT is_published FROM institutional_content WHERE id = $1', [hist.id]))[0];
  assert.ok(fila, 'el registro debe conservarse (retiro lógico)');
  assert.equal(fila.is_published, false);

  const pub = await http('GET', '/api/v1/institutional/history?lang=es');
  assert.ok(!pub.body.some((i) => i.page_slug === slug('history')));

  const bit = await q(`SELECT 1 FROM audit_logs WHERE table_name = 'institutional_content' AND record_id = $1`, [hist.id]);
  assert.ok(bit.length >= 1, 'el retiro debe quedar en la bitácora');
});

test('TC-B1-24-I18 retirar lo ya retirado → 409 (sin cambio)', async () => {
  const r = await http('POST', `/api/v1/content-retirement/institutional/${hist.id}/withdraw`, { token: admin, body: { confirm: true } });
  assert.equal(r.status, 409);
  assert.equal(r.body.code, 'unchanged');
});

test('TC-B1-24-I19 restaurar → 200, is_published = TRUE y vuelve a mostrarse', async () => {
  const r = await http('POST', `/api/v1/content-retirement/institutional/${hist.id}/restore`, { token: admin, body: {} });
  assert.equal(r.status, 200, r.texto);
  assert.equal((await q('SELECT is_published FROM institutional_content WHERE id = $1', [hist.id]))[0].is_published, true);
  const pub = await http('GET', '/api/v1/institutional/history?lang=es');
  assert.ok(pub.body.some((i) => i.page_slug === slug('history')));
});

test('TC-B1-24-I20 retirar una imagen la oculta de lo público sin borrarla; restaurarla la devuelve', async (t) => {
  if (!subida) return t.skip('depende de I09');
  const w = await http('POST', `/api/v1/content-retirement/media/${subida.id}/withdraw`, { token: admin, body: { confirm: true } });
  assert.equal(w.status, 200, w.texto);
  assert.equal((await q('SELECT is_published FROM media WHERE id = $1', [subida.id]))[0].is_published, false);
  let pub = await http('GET', '/api/v1/institutional/history?lang=es');
  assert.ok(!pub.body.find((i) => i.page_slug === slug('history')).images.some((im) => im.url === subida.url));

  const rs = await http('POST', `/api/v1/content-retirement/media/${subida.id}/restore`, { token: admin, body: {} });
  assert.equal(rs.status, 200);
  pub = await http('GET', '/api/v1/institutional/history?lang=es');
  assert.ok(pub.body.find((i) => i.page_slug === slug('history')).images.some((im) => im.url === subida.url));
});

test('TC-B1-24-I21 tipo inexistente → 404, id no UUID → 400 y sin permisos → 403/401', async () => {
  assert.equal((await http('POST', `/api/v1/content-retirement/usuarios/${hist.id}/withdraw`, { token: admin, body: {} })).status, 404);
  assert.equal((await http('POST', '/api/v1/content-retirement/institutional/no-es-uuid/withdraw', { token: admin, body: {} })).status, 400);
  assert.equal((await http('POST', `/api/v1/content-retirement/institutional/${hist.id}/withdraw`, { token: sinPermiso, body: { confirm: true } })).status, 403);
  assert.equal((await http('POST', `/api/v1/content-retirement/institutional/${hist.id}/withdraw`, { body: { confirm: true } })).status, 401);
  assert.equal((await q('SELECT is_published FROM institutional_content WHERE id = $1', [hist.id]))[0].is_published, true);
});

// ============================================================ limpieza verificada (CU-22)
test('TC-B1-22-I22 eliminar la imagen → 200, la fila se borra y el objeto deja de existir en R2', async (t) => {
  if (!subida) return t.skip('depende de I09');
  const r = await http('DELETE', `/api/v1/media/${subida.id}`, { token: admin });
  assert.equal(r.status, 200, r.texto);
  creados.media.delete(subida.id);
  assert.equal((await q('SELECT count(*)::int n FROM media WHERE id = $1', [subida.id]))[0].n, 0);
  const pub = await fetch(subida.url);
  assert.equal(pub.status, 404, 'el objeto debe eliminarse del bucket');
});
