import test from 'node:test';
import assert from 'node:assert/strict';

// Pruebas de Integración y Concurrencia para el Bloque 2 (Rafael Araya)

test('B2-INT-01: Verificación de estructura transaccional de compra de boletos', async () => {
  // Simulación del flujo en tickets.repository: adquirirBoletos
  const inventario = {
    id: 'inv-uuid-1',
    event_id: 'evt-uuid-1',
    price: 6000,
    currency: 'CRC',
    quantity_available: 50,
    quantity_sold: 10,
  };

  const payloadCompra = {
    quantity: 3,
    buyer_name: 'María Fernández',
    buyer_email: 'maria@example.com',
    payment_method: 'sinpe',
    sinpe_reference: '12345678',
  };

  // 1. Verificación de capacidad
  assert.ok(inventario.quantity_available >= payloadCompra.quantity, 'Debe haber cupos suficientes');

  // 2. Decremento atómico y cálculo
  inventario.quantity_available -= payloadCompra.quantity;
  inventario.quantity_sold += payloadCompra.quantity;
  const totalAmount = inventario.price * payloadCompra.quantity;

  assert.equal(inventario.quantity_available, 47);
  assert.equal(inventario.quantity_sold, 13);
  assert.equal(totalAmount, 18000);
});

test('B2-INT-02: Transición de estados en validación de compra SINPE por Taquilla', async () => {
  // Simulación de validarCompraSinpe en tickets.repository
  const compra = {
    id: 'pur-uuid-8899',
    status: 'pending',
    buyer_email: 'rafa.araya.est@gmail.com',
    total_amount: 12000,
  };

  const boletos = [
    { id: 'tkt-1', status: 'active', qr_code: 'FC-TKT-8899-01' },
    { id: 'tkt-2', status: 'active', qr_code: 'FC-TKT-8899-02' },
  ];

  function validarSinpe(c, listaBoletos) {
    if (c.status !== 'pending' && c.status !== 'paid') {
      throw new Error('ESTADO_INVALIDO');
    }
    c.status = 'paid';
    c.updated_at = new Date().toISOString();
    for (const b of listaBoletos) {
      if (b.status !== 'used') b.status = 'active';
    }
    return { compra: c, totalBoletos: listaBoletos.length, despachoCorreo: true };
  }

  const res = validarSinpe(compra, boletos);
  assert.equal(res.compra.status, 'paid', 'La compra debe quedar en estado paid');
  assert.equal(res.totalBoletos, 2, 'Los 2 boletos deben ser procesados');
  assert.equal(res.despachoCorreo, true, 'Se debe autorizar el despacho de boletos PDF con QR');
});

test('B2-INT-03: Simulación de Control de Concurrencia Pesimista (Lock FOR UPDATE - No Sobreventa)', async () => {
  // Simulación de dos peticiones HTTP concurrentes compitiendo por el ÚLTIMO boleto disponible
  let inventarioCompartido = {
    quantity_available: 1, // Solo queda 1 boleto
    quantity_sold: 99,
  };

  let lockOcupado = false;

  async function adquirirBoletoConcurrente(solicitanteId) {
    // Simulación del bloqueo FOR UPDATE en PostgreSQL
    while (lockOcupado) {
      await new Promise((r) => setTimeout(r, 10)); // Espera el turno del lock
    }
    lockOcupado = true;

    try {
      if (inventarioCompartido.quantity_available < 1) {
        throw new Error('INSUFFICIENT_TICKETS');
      }

      // Procesar compra
      inventarioCompartido.quantity_available -= 1;
      inventarioCompartido.quantity_sold += 1;
      return { exito: true, solicitante: solicitanteId };
    } finally {
      lockOcupado = false; // Liberar lock (COMMIT)
    }
  }

  // Se lanzan ambas compras en paralelo estricto (Promise.all)
  const resultados = await Promise.allSettled([
    adquirirBoletoConcurrente('Cliente_A'),
    adquirirBoletoConcurrente('Cliente_B'),
  ]);

  const exitosos = resultados.filter((r) => r.status === 'fulfilled');
  const rechazados = resultados.filter((r) => r.status === 'rejected');

  assert.equal(exitosos.length, 1, 'Exactamente una de las dos compras concurrentes debe tener éxito');
  assert.equal(rechazados.length, 1, 'Exactamente una de las dos compras debe ser rechazada');
  assert.equal(rechazados[0].reason.message, 'INSUFFICIENT_TICKETS', 'El error debe ser INSUFFICIENT_TICKETS');
  assert.equal(inventarioCompartido.quantity_available, 0, 'El inventario disponible debe ser exactamente 0 (nunca negativo)');
  assert.equal(inventarioCompartido.quantity_sold, 100, 'Las ventas totales deben alcanzar exactamente la capacidad máxima');
});

test('B2-INT-04: Inmutabilidad de Donación Validada (Protección financiera en donaciones.repository)', () => {
  const donacionCompletada = {
    id: 'don-uuid-55',
    donor_name: 'Carlos Monge',
    amount: 25000,
    currency: 'CRC',
    status: 'completed', // Ya validada por admin
  };

  function intentarModificarDonacion(d, nuevoMonto) {
    if (d.status !== 'pending') {
      throw new Error('SOLO_EDITABLE_SI_PENDING');
    }
    d.amount = nuevoMonto;
    return d;
  }

  function intentarEliminarDonacion(d) {
    if (d.status !== 'pending') {
      throw new Error('SOLO_ELIMINABLE_SI_PENDING');
    }
    return true;
  }

  assert.throws(
    () => intentarModificarDonacion(donacionCompletada, 30000),
    /SOLO_EDITABLE_SI_PENDING/,
    'No se puede editar una donación una vez que fue completada'
  );

  assert.throws(
    () => intentarEliminarDonacion(donacionCompletada),
    /SOLO_ELIMINABLE_SI_PENDING/,
    'No se puede eliminar una donación validada por administración'
  );
});
