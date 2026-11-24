import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { pool } from '../../dist/db.js';
import {
  registrarComunidad,
  modificarComunidad,
  borrarComunidad,
} from '../../dist/controllers/communities.controller.js';
import {
  registrarEstudiante,
  modificarEstudiante,
} from '../../dist/controllers/students.controller.js';
import {
  registrarVoluntario,
  modificarVoluntario,
} from '../../dist/controllers/volunteers.controller.js';
import { buscar } from '../../dist/controllers/search.controller.js';
import { updateMyProfileController } from '../../dist/controllers/auth.controller.js';

// Respuesta mínima de Express para revisar código y cuerpo sin levantar el servidor.
function nuevaRespuesta() {
  const res = { codigo: 0, cuerpo: null };
  res.status = (codigo) => {
    res.codigo = codigo;
    return res;
  };
  res.json = (cuerpo) => {
    res.cuerpo = cuerpo;
    return res;
  };
  res.send = (cuerpo) => {
    res.cuerpo = cuerpo;
    return res;
  };
  return res;
}

// Cambia pool.query durante una prueba y lo restaura al terminar.
async function conBaseFalsa(consulta, prueba) {
  const original = pool.query;
  pool.query = consulta;
  try {
    await prueba();
  } finally {
    pool.query = original;
  }
}

function filaComunidad(datos = {}) {
  return {
    id: 'comunidad-1',
    name: 'Comunidad de prueba',
    description: null,
    is_published: false,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...datos,
  };
}

function filaEstudiante(datos = {}) {
  return {
    id: 'estudiante-1',
    user_id: 'usuario-1',
    university: 'Universidad de prueba',
    start_date: null,
    end_date: null,
    status: 'active',
    ...datos,
  };
}

function filaVoluntario(datos = {}) {
  return {
    id: 'voluntario-1',
    user_id: 'usuario-1',
    interests: 'Teatro',
    availability: 'Fines de semana',
    status: 'active',
    ...datos,
  };
}

test('B3-UNI-01: comunidades rechaza un nombre vacío sin consultar la base', async () => {
  let consultas = 0;
  await conBaseFalsa(
    async () => {
      consultas++;
      return { rows: [] };
    },
    async () => {
      const res = nuevaRespuesta();
      await registrarComunidad({ body: { name: '   ' } }, res);
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /nombre/i);
      assert.equal(consultas, 0);
    }
  );
});

test('B3-UNI-02: comunidades registra el nombre sin espacios sobrantes', async () => {
  let valores = null;
  await conBaseFalsa(
    async (_sql, parametros) => {
      valores = parametros;
      return { rows: [filaComunidad({ name: 'Comunidad Nueva' })] };
    },
    async () => {
      const res = nuevaRespuesta();
      await registrarComunidad(
        { body: { name: '  Comunidad Nueva  ', description: '  ', is_published: 0 } },
        res
      );
      assert.equal(res.codigo, 201);
      // Una descripción vacía se guarda como cadena vacía y no como NULL.
      assert.deepEqual(valores, ['Comunidad Nueva', '', false]);
      assert.equal(res.cuerpo.name, 'Comunidad Nueva');
    }
  );
});

test('B3-UNI-03: comunidades responde 404 al modificar una que no existe', async () => {
  await conBaseFalsa(
    async () => ({ rows: [] }),
    async () => {
      const res = nuevaRespuesta();
      await modificarComunidad({ params: { id: 'no-existe' }, body: { name: 'Otro nombre' } }, res);
      assert.equal(res.codigo, 404);
      assert.match(res.cuerpo.message, /no encontrada/i);
    }
  );
});

test('B3-UNI-04: comunidades responde 404 al eliminar una que no existe', async () => {
  await conBaseFalsa(
    async () => ({ rows: [] }),
    async () => {
      const res = nuevaRespuesta();
      await borrarComunidad({ params: { id: 'no-existe' } }, res);
      assert.equal(res.codigo, 404);
    }
  );
});

test('B3-UNI-05: estudiantes exige el identificador de usuario', async () => {
  let consultas = 0;
  await conBaseFalsa(
    async () => {
      consultas++;
      return { rows: [] };
    },
    async () => {
      const res = nuevaRespuesta();
      await registrarEstudiante({ body: { university: 'UCR' } }, res);
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /usuario/i);
      assert.equal(consultas, 0);
    }
  );
});

test('B3-UNI-06: estudiantes rechaza un estado fuera del catálogo', async () => {
  await conBaseFalsa(
    async () => ({ rows: [filaEstudiante()] }),
    async () => {
      const res = nuevaRespuesta();
      await modificarEstudiante(
        { params: { id: 'estudiante-1' }, body: { status: 'graduado' } },
        res
      );
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /active/);
    }
  );
});

test('B3-UNI-07: estudiantes responde 404 al modificar un perfil inexistente', async () => {
  await conBaseFalsa(
    async () => ({ rows: [] }),
    async () => {
      const res = nuevaRespuesta();
      await modificarEstudiante(
        { params: { id: 'no-existe' }, body: { status: 'active' } },
        res
      );
      assert.equal(res.codigo, 404);
    }
  );
});

test('B3-UNI-08: voluntarios exige el identificador de usuario', async () => {
  let consultas = 0;
  await conBaseFalsa(
    async () => {
      consultas++;
      return { rows: [] };
    },
    async () => {
      const res = nuevaRespuesta();
      await registrarVoluntario({ body: { interests: 'Teatro' } }, res);
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /usuario/i);
      assert.equal(consultas, 0);
    }
  );
});

test('B3-UNI-09: voluntarios acepta el estado pending', async () => {
  let valores = null;
  await conBaseFalsa(
    async (_sql, parametros) => {
      valores = parametros;
      return { rows: [filaVoluntario({ status: 'pending' })] };
    },
    async () => {
      const res = nuevaRespuesta();
      await modificarVoluntario(
        {
          params: { id: 'voluntario-1' },
          body: { interests: 'Teatro', availability: 'Sábados', status: 'pending' },
        },
        res
      );
      assert.equal(res.codigo, 200);
      assert.equal(valores[2], 'pending');
      assert.equal(res.cuerpo.status, 'pending');
    }
  );
});

test('B3-UNI-10: la búsqueda exige el parámetro q', async () => {
  let consultas = 0;
  await conBaseFalsa(
    async () => {
      consultas++;
      return { rows: [] };
    },
    async () => {
      const res = nuevaRespuesta();
      await buscar({ query: {} }, res);
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /"q"/);
      assert.equal(consultas, 0);
    }
  );
});

test('B3-UNI-11: la búsqueda devuelve los cuatro grupos de contenido', async () => {
  let consultas = 0;
  await conBaseFalsa(
    async () => {
      consultas++;
      return { rows: [{ id: 'fila-1' }] };
    },
    async () => {
      const res = nuevaRespuesta();
      await buscar({ query: { q: 'teatro' } }, res);
      assert.equal(res.codigo, 200);
      assert.equal(consultas, 4);
      assert.equal(res.cuerpo.query, 'teatro');
      assert.equal(res.cuerpo.events.length, 1);
      assert.equal(res.cuerpo.projects.length, 1);
      assert.equal(res.cuerpo.communities.length, 1);
      assert.equal(res.cuerpo.opportunities.length, 1);
    }
  );
});

test('B3-UNI-12: el perfil exige el nombre completo', async () => {
  const res = nuevaRespuesta();
  await updateMyProfileController({ user: { userId: 'usuario-1' }, body: {} }, res);
  assert.equal(res.codigo, 400);
  assert.match(res.cuerpo.message, /nombre/i);
});

test('B3-UNI-13: el perfil rechaza una contraseña nueva fuera de rango', async () => {
  await conBaseFalsa(
    async () => ({ rows: [filaEstudiante()] }),
    async () => {
      const res = nuevaRespuesta();
      await updateMyProfileController(
        {
          user: { userId: 'usuario-1' },
          body: { full_name: 'Daniel Zeas', new_password: 'corta' },
        },
        res
      );
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /10 y 128/);
    }
  );
});

test('B3-UNI-14: el perfil rechaza una contraseña actual incorrecta con un hash heredado bcrypt', async () => {
  // Los usuarios sembrados conservan hashes bcrypt; el controlador los compara con bcrypt.
  const hash = await bcrypt.hash('Correcta12345', 4);
  await conBaseFalsa(
    async (sql) => {
      if (/SELECT/i.test(sql) && /password_hash/i.test(sql)) {
        return { rows: [{ id: 'usuario-1', password_hash: hash }] };
      }
      return { rows: [{ id: 'usuario-1', full_name: 'Daniel Zeas' }] };
    },
    async () => {
      const res = nuevaRespuesta();
      await updateMyProfileController(
        {
          user: { userId: 'usuario-1' },
          body: {
            full_name: 'Daniel Zeas',
            current_password: 'Incorrecta123',
            new_password: 'NuevaClave123',
          },
        },
        res
      );
      assert.equal(res.codigo, 400);
      assert.match(res.cuerpo.message, /actual es incorrecta/i);
    }
  );
});

test('B3-UNI-15: el perfil actualiza únicamente el nombre', async () => {
  let actualizaciones = 0;
  await conBaseFalsa(
    async (sql) => {
      if (/UPDATE users/i.test(sql)) actualizaciones++;
      return {
        rows: [
          { id: 'usuario-1', full_name: 'Daniel Zeas Brown', email: 'd@example.test', role: 'user', status: 'active' },
        ],
      };
    },
    async () => {
      const res = nuevaRespuesta();
      await updateMyProfileController(
        { user: { userId: 'usuario-1' }, body: { full_name: '  Daniel Zeas Brown  ' } },
        res
      );
      assert.equal(res.codigo, 200);
      assert.equal(res.cuerpo.data.full_name, 'Daniel Zeas Brown');
      assert.equal(actualizaciones, 1);
    }
  );
});

test('B3-UNI-16: el perfil verifica la contraseña argon2id y guarda un hash argon2id', async () => {
  const hash = await argon2.hash('Correcta12345', { type: argon2.argon2id });
  let cambioClave = false;
  let hashNuevo = null;
  await conBaseFalsa(
    async (sql, parametros) => {
      if (/UPDATE users/i.test(sql) && /password_hash/i.test(sql)) {
        cambioClave = true;
        hashNuevo = parametros[0];
      }
      if (/SELECT/i.test(sql) && /password_hash/i.test(sql)) {
        return { rows: [{ id: 'usuario-1', password_hash: hash }] };
      }
      return { rows: [{ id: 'usuario-1', full_name: 'Daniel Zeas' }] };
    },
    async () => {
      const res = nuevaRespuesta();
      await updateMyProfileController(
        {
          user: { userId: 'usuario-1' },
          body: {
            full_name: 'Daniel Zeas',
            current_password: 'Correcta12345',
            new_password: 'NuevaClave123',
          },
        },
        res
      );
      assert.equal(res.codigo, 200);
      assert.equal(cambioClave, true);
      assert.match(hashNuevo, /^\$argon2id\$/);
    }
  );
});

// Caracteriza el defecto B3-DEF-01: el nombre se guarda antes de validar la
// contraseña nueva, por lo que una solicitud rechazada deja un cambio parcial.
test('B3-UNI-17: el perfil guarda el nombre aunque rechace la contraseña (B3-DEF-01)', async () => {
  let seActualizoNombre = false;
  await conBaseFalsa(
    async (sql) => {
      if (/UPDATE users/i.test(sql) && !/password_hash/i.test(sql)) seActualizoNombre = true;
      return { rows: [{ id: 'usuario-1', full_name: 'Nombre Parcial' }] };
    },
    async () => {
      const res = nuevaRespuesta();
      await updateMyProfileController(
        {
          user: { userId: 'usuario-1' },
          body: { full_name: 'Nombre Parcial', new_password: 'corta' },
        },
        res
      );
      assert.equal(res.codigo, 400);
      assert.equal(seActualizoNombre, true);
    }
  );
});
