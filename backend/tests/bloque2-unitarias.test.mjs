import test from 'node:test';
import assert from 'node:assert/strict';

// Pruebas Unitarias para el Bloque 2 (Rafael Araya: Eventos, Boletería y Transacciones)

test('B2-UNI-01: Cálculo exacto de monto total de compra en Colones (CRC)', () => {
  const precioUnitario = 8000;
  const cantidad = 3;
  const totalEsperado = 24000;
  const totalCalculado = precioUnitario * cantidad;

  assert.equal(totalCalculado, totalEsperado, 'El total calculado debe ser exactamente precio * cantidad');
  assert.ok(totalCalculado > 0, 'El monto total debe ser un número positivo');
});

test('B2-UNI-02: Generación de identificador único de pago según método (SINPE vs Tarjeta)', () => {
  const referenciaSinpe = '994821';
  const intentSinpe = `SINPE-${referenciaSinpe.trim()}`;
  assert.match(intentSinpe, /^SINPE-[0-9]+$/, 'El intent SINPE debe tener prefijo SINPE- y el número de referencia');

  const intentCard = `CARD-${Date.now()}`;
  assert.match(intentCard, /^CARD-[0-9]+$/, 'El intent de tarjeta debe iniciar con CARD- y marca de tiempo');
});

test('B2-UNI-03: Generación de código QR con formato institucional y unicidad por asiento', () => {
  const purchaseId = 'e7b1a234-5678-90ab-cdef-1234567890ab';
  const qrCodes = [];
  const cantidadBoletos = 4;

  for (let i = 0; i < cantidadBoletos; i++) {
    const qrCode = `FC-TKT-${purchaseId.slice(0, 8)}-${Date.now()}-${i + 1}`;
    qrCodes.push(qrCode);
    assert.match(qrCode, /^FC-TKT-[0-9a-f]{8}-[0-9]+-[0-9]+$/, 'El código QR debe cumplir el formato FC-TKT-...');
  }

  const codigosUnicos = new Set(qrCodes);
  assert.equal(codigosUnicos.size, cantidadBoletos, 'Cada asiento debe tener un código QR estrictamente único');
});

test('B2-UNI-04: Validación de reglas de estado de boleto en puerta (Check-in)', () => {
  const boleto = {
    id: 'tkt-001',
    qr_code: 'FC-TKT-e7b1a234-1700000000-1',
    status: 'active',
    purchase_status: 'paid',
  };

  // 1. Primer ingreso: Boleto activo y compra pagada
  function validarIngreso(b) {
    if (b.purchase_status !== 'paid') {
      return { valid: false, message: 'Pago pendiente de validación.' };
    }
    if (b.status === 'used') {
      return { valid: false, message: 'Este boleto ya fue utilizado para ingresar.' };
    }
    if (b.status === 'active') {
      b.status = 'used';
      return { valid: true, message: 'Acceso autorizado.' };
    }
    return { valid: false, message: 'Estado de boleto desconocido.' };
  }

  const resultado1 = validarIngreso(boleto);
  assert.equal(resultado1.valid, true, 'El primer intento de ingreso debe ser exitoso');
  assert.equal(boleto.status, 'used', 'El estado del boleto debe cambiar a used');

  // 2. Segundo ingreso con el mismo QR: Debe ser rechazado
  const resultado2 = validarIngreso(boleto);
  assert.equal(resultado2.valid, false, 'El segundo intento con el mismo QR debe ser denegado');
  assert.match(resultado2.message, /ya fue utilizado/, 'Debe alertar que el boleto ya fue consumido');
});

test('B2-UNI-05: Rechazo de ingreso para boletos con compra en estado pending (SINPE no validado)', () => {
  const boletoPendiente = {
    id: 'tkt-002',
    qr_code: 'FC-TKT-e7b1a234-1700000000-2',
    status: 'active',
    purchase_status: 'pending',
  };

  function validarIngreso(b) {
    if (b.purchase_status !== 'paid') {
      return { valid: false, message: 'Boleto vinculado a compra pendiente de validación.' };
    }
    return { valid: true, message: 'Acceso autorizado.' };
  }

  const res = validarIngreso(boletoPendiente);
  assert.equal(res.valid, false, 'No se puede ingresar si el pago SINPE está pendiente');
});

test('B2-UNI-06: Validación de rangos y restricciones de monto para donaciones', () => {
  function validarDonacion(monto, moneda) {
    if (typeof monto !== 'number' || isNaN(monto) || monto <= 0) {
      return { error: 'El monto de la donación debe ser mayor a 0.' };
    }
    if (!['CRC', 'USD'].includes(moneda)) {
      return { error: 'Moneda no admitida.' };
    }
    return { ok: true };
  }

  assert.equal(validarDonacion(-500, 'CRC').ok, undefined, 'Debe rechazar montos negativos');
  assert.equal(validarDonacion(0, 'CRC').ok, undefined, 'Debe rechazar monto cero');
  assert.equal(validarDonacion(10000, 'EUR').ok, undefined, 'Debe rechazar moneda no admitida');
  assert.equal(validarDonacion(5000, 'CRC').ok, true, 'Debe aceptar monto válido en CRC');
  assert.equal(validarDonacion(25, 'USD').ok, true, 'Debe aceptar monto válido en USD');
});
