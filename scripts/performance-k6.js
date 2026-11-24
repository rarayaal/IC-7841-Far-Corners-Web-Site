import http from 'k6/http';
import { check, sleep } from 'k6';

// Script oficial k6 - Pruebas de Carga y Rendimiento (Liderazgo: Rafael Araya)
// Proyecto: Far Corners Community Musical Theatre - Módulo de Boletería y Eventos

export const options = {
  stages: [
    { duration: '15s', target: 10 },  // Rampa de subida a 10 VUs (Carga normal)
    { duration: '30s', target: 30 },  // Incremento a 30 VUs (Carga alta)
    { duration: '15s', target: 50 },  // Pico máximo de 50 VUs (Apertura de taquilla)
    { duration: '10s', target: 0 },   // Rampa de descenso
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% de las peticiones deben responder en menos de 800ms
    http_req_failed: ['rate<0.01'],    // Menos del 1% de errores HTTP permitidos
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Consulta de cartelera teatral
  const resEvents = http.get(`${BASE_URL}/api/v1/events`);
  check(resEvents, {
    'Cartelera status 200': (r) => r.status === 200,
    'Cartelera responde rápido': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 2. Consulta pública de contenido institucional
  const resBoard = http.get(`${BASE_URL}/api/v1/institutional/board?lang=es`);
  check(resBoard, {
    'Junta directiva status 200': (r) => r.status === 200,
  });

  sleep(1);

  // 3. Consulta de donaciones públicas
  const resDonations = http.get(`${BASE_URL}/api/v1/donations/public`);
  check(resDonations, {
    'Donaciones públicas status 200': (r) => r.status === 200,
  });

  sleep(1);
}
