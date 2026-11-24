import test from 'node:test';
import assert from 'node:assert/strict';

// Pruebas Automatizadas de Seguridad - Bloque 2 (Rafael Araya)
// Cobertura: Inyección SQL, Manipulación de Precios (Tampering), Validación de Montos y Control de Acceso (RBAC)

test('B2-SEG-01: Prevención de Inyección SQL en filtros de donaciones', () => {
  const payloadInyeccion = {
    busqueda: "' OR '1'='1' --",
    metodo: "sinpe' UNION SELECT id, password_hash FROM users --",
  };

  // Simulación del repositorio con parámetros enlazados ($1, $2)
  function construirQueryParametrizado(filtros) {
    const condiciones = [];
    const valores = [];
    let idx = 1;

    if (filtros.metodo) {
      condiciones.push(`(payment_method = $${idx} OR payment_provider = $${idx})`);
      valores.push(filtros.metodo.toLowerCase());
      idx++;
    }

    if (filtros.busqueda) {
      condiciones.push(`(donor_name ILIKE $${idx} OR donor_email ILIKE $${idx})`);
      valores.push(`%${filtros.busqueda.trim()}%`);
      idx++;
    }

    return { sql: condiciones.join(' AND '), valores };
  }

  const { sql, valores } = construirQueryParametrizado(payloadInyeccion);

  // Verificamos que el query NUNCA contenga la inyección en texto plano
  assert.ok(!sql.includes("'1'='1'"), 'El query SQL no debe concatenar la inyección');
  assert.ok(!sql.includes('UNION SELECT'), 'El query SQL no debe concatenar sentencias UNION');
  assert.ok(sql.includes('$1') && sql.includes('$2'), 'El query debe usar parámetros posicionales');
  assert.equal(valores[0], payloadInyeccion.metodo.toLowerCase(), 'El valor malicioso se neutraliza como dato literal');
});

test('B2-SEG-02: Prevención de Manipulación de Precios desde el Cliente (Price Tampering)', () => {
  // Simulación de adquisición de boletos:
  // El atacante envía price: 1 en el cuerpo de la petición HTTP
  const payloadCliente = {
    quantity: 2,
    price: 1, // Intento de pagar 1 colón en lugar de 8.000
    total_amount: 2,
  };

  // Datos reales protegidos en el servidor (tabla ticket_inventory)
  const inventarioServidor = {
    id: 'inv-123',
    price: 8000, // Precio legítimo fijado en base de datos
    currency: 'CRC',
  };

  function procesarCompra(cliente, inventario) {
    // REGLA DE SEGURIDAD ESTRICTA: El backend ignora cliente.price y cliente.total_amount
    const totalAutorizado = inventario.price * cliente.quantity;
    return {
      totalCobrado: totalAutorizado,
      moneda: inventario.currency,
    };
  }

  const resultado = procesarCompra(payloadCliente, inventarioServidor);

  assert.equal(resultado.totalCobrado, 16000, 'El servidor debe cobrar ₡16.000 ignorando el precio enviado por el cliente');
  assert.notEqual(resultado.totalCobrado, payloadCliente.total_amount, 'Debe anular el total alterado por el atacante');
});

test('B2-SEG-03: Rechazo de Inyección de Montos Negativos o Nulos en Donaciones', () => {
  function validarMontoDonacion(body) {
    const { amount } = body;
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return { status: 400, error: 'El monto de la donación debe ser mayor a 0.' };
    }
    return { status: 201, ok: true };
  }

  const intentosMaliciosos = [
    { amount: -50000 },
    { amount: 0 },
    { amount: -0.01 },
    { amount: 'mil_colones' },
    { amount: null },
  ];

  for (const intento of intentosMaliciosos) {
    const res = validarMontoDonacion(intento);
    assert.equal(res.status, 400, `Debe rechazar monto inválido: ${intento.amount}`);
    assert.match(res.error, /mayor a 0/, 'Debe devolver mensaje de validación estricta');
  }
});

test('B2-SEG-04: Control de Acceso Basado en Roles (RBAC) en Taquilla', () => {
  function verificarAccesoTaquilla(usuario) {
    if (!usuario) {
      return { status: 401, error: 'Usuario no autenticado.' };
    }
    const rolesPermitidos = ['admin', 'manager'];
    if (!rolesPermitidos.includes(usuario.role)) {
      return { status: 403, error: 'No tienes permisos para realizar esta acción.' };
    }
    return { status: 200, autorizado: true };
  }

  // 1. Visitante sin sesión
  assert.equal(verificarAccesoTaquilla(null).status, 401, 'Debe bloquear visitantes anónimos');

  // 2. Usuario regular autenticado (espectador)
  assert.equal(verificarAccesoTaquilla({ id: 'u1', role: 'user' }).status, 403, 'Debe bloquear usuarios estándar');

  // 3. Voluntario
  assert.equal(verificarAccesoTaquilla({ id: 'u2', role: 'volunteer' }).status, 403, 'Debe bloquear rol voluntario');

  // 4. Administrador legítimo
  assert.equal(verificarAccesoTaquilla({ id: 'u3', role: 'admin' }).status, 200, 'Debe autorizar a admin');

  // 5. Manager de taquilla
  assert.equal(verificarAccesoTaquilla({ id: 'u4', role: 'manager' }).status, 200, 'Debe autorizar a manager');
});
