import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { Client } from 'pg';

// Pruebas de integración del Bloque 3 contra la API compilada y una base real.
const API = process.env.B3_API_URL;
const URL_BD = process.env.B3_DATABASE_URL;
const CLAVE = 'ClaveSintetica123';
const ID_MANAGER = '33333333-3333-4333-8333-333333333301';
const ID_USUARIO = '33333333-3333-4333-8333-333333333302';
const ID_PASANTE = '33333333-3333-4333-8333-333333333303';
const ID_PASANTE2 = '33333333-3333-4333-8333-333333333304';
const ID_VOLUNTARIO = '33333333-3333-4333-8333-333333333305';
const ID_PERMISO_USERS = '11111111-1111-1111-1111-111111110001';

let bd;
const tokens = {};

async function api(ruta, { metodo = 'GET', token, cuerpo } = {}) {
  const opciones = { method: metodo, headers: {} };
  if (token) opciones.headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch(`${API}${ruta}`, opciones);
  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { estado: respuesta.status, datos };
}

async function iniciarSesion(correo) {
  if (tokens[correo]) return tokens[correo];
  const r = await api('/api/v1/auth/login', {
    metodo: 'POST',
    cuerpo: { email: correo, password: CLAVE },
  });
  assert.equal(r.estado, 200, `No se pudo iniciar sesión con ${correo}`);
  tokens[correo] = r.datos.data.token;
  return tokens[correo];
}

before(async () => {
  bd = new Client({ connectionString: URL_BD });
  await bd.connect();

  const hash = await bcrypt.hash(CLAVE, 10);
  const filas = [
    [ID_MANAGER, 'Gestora Bloque Tres', 'b3.manager@example.test', 'manager', null],
    [ID_USUARIO, 'Usuario Bloque Tres', 'b3.usuario@example.test', 'user', null],
    [ID_PASANTE, 'Pasante Bloque Tres', 'b3.pasante@example.test', 'user', 'internship'],
    [ID_PASANTE2, 'Pasante Dos Bloque Tres', 'b3.pasante2@example.test', 'user', 'internship'],
    [ID_VOLUNTARIO, 'Voluntario Bloque Tres', 'b3.voluntario@example.test', 'user', 'volunteer'],
  ];

  for (const [id, nombre, correo, rol, tipo] of filas) {
    await bd.query(
      `INSERT INTO users (id, full_name, email, password_hash, role, status, participant_type)
       VALUES ($1, $2, $3, $4, $5, 'active', $6)
       ON CONFLICT (email) DO NOTHING`,
      [id, nombre, correo, hash, rol, tipo]
    );
  }

  // La gestora solo recibe users:manage; no tiene community:manage.
  await bd.query(
    `INSERT INTO user_permissions (user_id, permission_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [ID_MANAGER, ID_PERMISO_USERS]
  );

  await bd.query(
    `INSERT INTO events (id, title, description, event_date, max_capacity, is_published)
     VALUES
       ('44444444-4444-4444-8444-444444444401', 'Teatro Sintético B3', 'Obra publicada', NOW(), 50, TRUE),
       ('44444444-4444-4444-8444-444444444402', 'Obra Diferente B3', 'Otra obra publicada', NOW(), 50, TRUE),
       ('44444444-4444-4444-8444-444444444403', 'Teatro Oculto B3', 'Obra sin publicar', NOW(), 50, FALSE)
     ON CONFLICT (id) DO NOTHING`
  );

  await bd.query(
    `INSERT INTO projects (id, title, description, is_published)
     VALUES
       ('55555555-5555-4555-8555-555555555501', 'Proyecto Teatro B3', 'Proyecto publicado', TRUE),
       ('55555555-5555-4555-8555-555555555502', 'Proyecto Oculto B3', 'Proyecto sin publicar', FALSE)
     ON CONFLICT (id) DO NOTHING`
  );

  await bd.query(
    `INSERT INTO opportunities (id, type, title, description, is_published)
     VALUES
       ('66666666-6666-4666-8666-666666666601', 'volunteer', 'Oportunidad Teatro B3', 'Voluntariado publicado', TRUE),
       ('66666666-6666-4666-8666-666666666602', 'volunteer', 'Oportunidad Oculta B3', 'Voluntariado sin publicar', FALSE)
     ON CONFLICT (id) DO NOTHING`
  );
});

after(async () => {
  if (bd) await bd.end();
});

test('B3-INT-01: el inicio de sesión devuelve token sin el hash de la contraseña', async () => {
  const r = await api('/api/v1/auth/login', {
    metodo: 'POST',
    cuerpo: { email: 'b3.manager@example.test', password: CLAVE },
  });

  assert.equal(r.estado, 200);
  assert.ok(r.datos.data.token);
  assert.equal(r.datos.data.user.email, 'b3.manager@example.test');
  assert.equal(r.datos.data.user.password_hash, undefined);
  assert.deepEqual(r.datos.data.user.permissions, ['users:manage']);
});

test('B3-INT-02: la gestora crea una comunidad y queda guardada', async () => {
  const token = await iniciarSesion('b3.manager@example.test');
  const nombre = `Comunidad Integración ${Date.now()}`;

  const r = await api('/api/v1/communities', {
    metodo: 'POST',
    token,
    cuerpo: { name: `  ${nombre}  `, description: 'Creada en pruebas', is_published: true },
  });

  assert.equal(r.estado, 201);
  assert.equal(r.datos.name, nombre);

  const fila = await bd.query('SELECT name, is_published FROM communities WHERE id = $1', [r.datos.id]);
  assert.equal(fila.rows[0].name, nombre);
  assert.equal(fila.rows[0].is_published, true);
});

test('B3-INT-03: un usuario sin rol de gestión no puede crear comunidades', async () => {
  const token = await iniciarSesion('b3.usuario@example.test');
  const r = await api('/api/v1/communities', {
    metodo: 'POST',
    token,
    cuerpo: { name: 'Comunidad no autorizada' },
  });

  assert.equal(r.estado, 403);
});

test('B3-INT-04: sin token la gestión de estudiantes responde 401', async () => {
  const r = await api('/api/v1/students');
  assert.equal(r.estado, 401);
});

// Caracteriza B3-DEF-02: la consulta pública no filtra por is_published.
test('B3-INT-05: la consulta pública expone comunidades sin publicar (B3-DEF-02)', async () => {
  const token = await iniciarSesion('b3.manager@example.test');
  const nombre = `Comunidad Borrador ${Date.now()}`;

  const creada = await api('/api/v1/communities', {
    metodo: 'POST',
    token,
    cuerpo: { name: nombre, is_published: false },
  });
  assert.equal(creada.estado, 201);

  const publica = await api('/api/v1/communities');
  assert.equal(publica.estado, 200);
  const encontrada = publica.datos.find((c) => c.id === creada.datos.id);
  assert.ok(encontrada, 'La comunidad sin publicar apareció en la consulta pública');
});

test('B3-INT-06: la búsqueda agrupa resultados y omite contenido sin publicar', async () => {
  const r = await api('/api/v1/search?q=Teatro');

  assert.equal(r.estado, 200);
  assert.equal(r.datos.query, 'Teatro');

  const titulosEventos = r.datos.events.map((e) => e.title);
  const titulosProyectos = r.datos.projects.map((p) => p.title);
  const titulosOportunidades = r.datos.opportunities.map((o) => o.title);

  assert.ok(titulosEventos.includes('Teatro Sintético B3'));
  assert.ok(!titulosEventos.includes('Teatro Oculto B3'));
  assert.ok(titulosProyectos.includes('Proyecto Teatro B3'));
  assert.ok(!titulosProyectos.includes('Proyecto Oculto B3'));
  assert.ok(titulosOportunidades.includes('Oportunidad Teatro B3'));
  assert.ok(!titulosOportunidades.includes('Oportunidad Oculta B3'));
});

// Caracteriza B3-DEF-03: el comodín % del usuario se pasa tal cual a ILIKE.
test('B3-INT-07: el comodín % devuelve todo el contenido publicado (B3-DEF-03)', async () => {
  const comodin = await api(`/api/v1/search?q=${encodeURIComponent('%')}`);
  const inexistente = await api('/api/v1/search?q=zzzzsinresultados');

  assert.equal(comodin.estado, 200);
  assert.equal(comodin.datos.events.length, 2);
  assert.equal(inexistente.datos.events.length, 0);
});

test('B3-INT-08: ciclo completo de un perfil de estudiante', async () => {
  const token = await iniciarSesion('b3.manager@example.test');

  const candidatosAntes = await api('/api/v1/students/candidates', { token });
  assert.ok(candidatosAntes.datos.some((c) => c.id === ID_PASANTE));

  const creado = await api('/api/v1/students', {
    metodo: 'POST',
    token,
    cuerpo: {
      user_id: ID_PASANTE,
      university: 'Universidad de Costa Rica',
      start_date: '2026-01-15',
      end_date: '2026-05-15',
    },
  });
  assert.equal(creado.estado, 201);
  assert.equal(creado.datos.university, 'Universidad de Costa Rica');

  const candidatosDespues = await api('/api/v1/students/candidates', { token });
  assert.ok(!candidatosDespues.datos.some((c) => c.id === ID_PASANTE));

  const modificado = await api(`/api/v1/students/${creado.datos.id}`, {
    metodo: 'PUT',
    token,
    cuerpo: { university: 'Universidad Nacional', status: 'inactive' },
  });
  assert.equal(modificado.estado, 200);
  assert.equal(modificado.datos.status, 'inactive');

  const borrado = await api(`/api/v1/students/${creado.datos.id}`, { metodo: 'DELETE', token });
  assert.equal(borrado.estado, 204);

  const usuario = await bd.query('SELECT participant_type FROM users WHERE id = $1', [ID_PASANTE]);
  assert.equal(usuario.rows[0].participant_type, null);
});

// Caracteriza B3-DEF-06: los campos omitidos en el PUT se guardan como NULL.
test('B3-INT-09: el PUT de estudiante borra los campos omitidos (B3-DEF-06)', async () => {
  const token = await iniciarSesion('b3.manager@example.test');

  const creado = await api('/api/v1/students', {
    metodo: 'POST',
    token,
    cuerpo: { user_id: ID_PASANTE2, university: 'Instituto Tecnológico de Costa Rica' },
  });
  assert.equal(creado.estado, 201);

  const modificado = await api(`/api/v1/students/${creado.datos.id}`, {
    metodo: 'PUT',
    token,
    cuerpo: { status: 'active' },
  });

  assert.equal(modificado.estado, 200);
  assert.equal(modificado.datos.university, null);

  await api(`/api/v1/students/${creado.datos.id}`, { metodo: 'DELETE', token });
});

test('B3-INT-10: ciclo completo de un perfil de voluntario con estado pending', async () => {
  const token = await iniciarSesion('b3.manager@example.test');

  const creado = await api('/api/v1/volunteers', {
    metodo: 'POST',
    token,
    cuerpo: { user_id: ID_VOLUNTARIO, interests: 'Teatro', availability: 'Sábados' },
  });
  assert.equal(creado.estado, 201);

  const modificado = await api(`/api/v1/volunteers/${creado.datos.id}`, {
    metodo: 'PUT',
    token,
    cuerpo: { interests: 'Teatro y danza', availability: 'Domingos', status: 'pending' },
  });
  assert.equal(modificado.estado, 200);
  assert.equal(modificado.datos.status, 'pending');

  const borrado = await api(`/api/v1/volunteers/${creado.datos.id}`, { metodo: 'DELETE', token });
  assert.equal(borrado.estado, 204);

  const usuario = await bd.query('SELECT participant_type FROM users WHERE id = $1', [ID_VOLUNTARIO]);
  assert.equal(usuario.rows[0].participant_type, null);
});

test('B3-INT-11: asignar el tipo de participante deja registro en la auditoría', async () => {
  const token = await iniciarSesion('b3.manager@example.test');

  const r = await api(`/api/v1/admin/users/${ID_USUARIO}/participant-type`, {
    metodo: 'PATCH',
    token,
    cuerpo: { participant_type: 'camp' },
  });
  assert.equal(r.estado, 200);

  const fila = await bd.query(
    `SELECT action, table_name, new_values FROM audit_logs
     WHERE record_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [ID_USUARIO]
  );
  assert.equal(fila.rows.length, 1);
  assert.equal(fila.rows[0].action, 'update');
  assert.equal(fila.rows[0].table_name, 'users');
  assert.equal(fila.rows[0].new_values.participant_type, 'camp');
});

// Caracteriza B3-DEF-04: el CRUD de comunidades no escribe bitácora.
test('B3-INT-12: el CRUD de comunidades no genera auditoría (B3-DEF-04)', async () => {
  const token = await iniciarSesion('b3.manager@example.test');
  const antes = await bd.query('SELECT COUNT(*)::int AS total FROM audit_logs WHERE table_name = $1', [
    'communities',
  ]);

  const creada = await api('/api/v1/communities', {
    metodo: 'POST',
    token,
    cuerpo: { name: `Comunidad Auditada ${Date.now()}` },
  });
  assert.equal(creada.estado, 201);

  await api(`/api/v1/communities/${creada.datos.id}`, {
    metodo: 'PUT',
    token,
    cuerpo: { name: 'Comunidad modificada' },
  });
  await api(`/api/v1/communities/${creada.datos.id}`, { metodo: 'DELETE', token });

  const despues = await bd.query('SELECT COUNT(*)::int AS total FROM audit_logs WHERE table_name = $1', [
    'communities',
  ]);
  assert.equal(despues.rows[0].total, antes.rows[0].total);
});

// Caracteriza B3-DEF-07: el token del registro público no sirve para /me.
test('B3-INT-13: registro público, duplicado y sesión posterior (B3-DEF-07)', async () => {
  const correo = `b3.nuevo.${Date.now()}@example.test`;

  const registro = await api('/api/v1/users/register', {
    metodo: 'POST',
    cuerpo: { full_name: 'Cuenta Nueva B3', email: correo, contrasenia: CLAVE },
  });
  assert.equal(registro.estado, 201);
  assert.ok(registro.datos.data.token);

  const perfilConTokenDeRegistro = await api('/api/v1/me', { token: registro.datos.data.token });
  assert.equal(perfilConTokenDeRegistro.estado, 401);

  const duplicado = await api('/api/v1/users/register', {
    metodo: 'POST',
    cuerpo: { full_name: 'Cuenta Nueva B3', email: correo, contrasenia: CLAVE },
  });
  assert.equal(duplicado.estado, 409);

  const sesion = await api('/api/v1/auth/login', {
    metodo: 'POST',
    cuerpo: { email: correo, password: CLAVE },
  });
  assert.equal(sesion.estado, 200);

  const perfil = await api('/api/v1/me', { token: sesion.datos.data.token });
  assert.equal(perfil.estado, 200);
  assert.equal(perfil.datos.data.email, correo);
});

// Caracteriza B3-DEF-01: el nombre se guarda aunque la solicitud termine en 400.
test('B3-INT-14: el perfil guarda el nombre antes de rechazar la contraseña (B3-DEF-01)', async () => {
  const token = await iniciarSesion('b3.usuario@example.test');
  const nuevoNombre = `Nombre Actualizado ${Date.now()}`;

  const r = await api('/api/v1/me', {
    metodo: 'PUT',
    token,
    cuerpo: { full_name: nuevoNombre, new_password: 'corta' },
  });
  assert.equal(r.estado, 400);
  assert.match(r.datos.message, /10 y 128/);

  const fila = await bd.query('SELECT full_name FROM users WHERE id = $1', [ID_USUARIO]);
  assert.equal(fila.rows[0].full_name, nuevoNombre);

  await bd.query('UPDATE users SET full_name = $1 WHERE id = $2', ['Usuario Bloque Tres', ID_USUARIO]);
});

test('B3-INT-15: la bandeja de postulaciones lista y cambia el estado de un envío', async () => {
  const token = await iniciarSesion('b3.manager@example.test');
  const idEnvio = '77777777-7777-4777-8777-777777777701';

  await bd.query(
    `INSERT INTO form_submissions (id, form_type, user_id, data)
     VALUES ($1, 'internship', $2, '{"campo":"valor"}'::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [idEnvio, ID_USUARIO]
  );

  const lista = await api('/api/v1/forms/submissions', { token });
  assert.equal(lista.estado, 200);
  assert.ok(lista.datos.some((e) => e.id === idEnvio && e.status === 'pending'));

  const cambio = await api(`/api/v1/forms/internship/submissions/${idEnvio}/status`, {
    metodo: 'PUT',
    token,
    cuerpo: { status: 'approved', review_notes: 'Revisado en pruebas' },
  });
  assert.equal(cambio.estado, 200);
  assert.equal(cambio.datos.status, 'approved');

  const fila = await bd.query('SELECT status, review_notes FROM form_submissions WHERE id = $1', [idEnvio]);
  assert.equal(fila.rows[0].status, 'approved');
  assert.equal(fila.rows[0].review_notes, 'Revisado en pruebas');
});

test('B3-INT-16: un usuario sin rol de gestión no accede a la bandeja de envíos', async () => {
  const token = await iniciarSesion('b3.usuario@example.test');
  const r = await api('/api/v1/forms/submissions', { token });
  assert.equal(r.estado, 403);
});
