/**
 * Generador de Códigos QR autónomo en TypeScript sin dependencias externas.
 * Implementa el estándar QR (ISO/IEC 18004) en Modo Byte con corrección de error 'M'.
 */

// Tablas de Galois Field GF(2^8) para Reed-Solomon con polinomio irreducible 0x11D (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], factor);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

function rsCompute(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLength);
  const remainder = new Uint8Array(ecLength);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecLength - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecLength - 1] = gfMul(gen[ecLength], factor);
  }
  return remainder;
}

// Especificaciones por versión para nivel 'M':
// Version 2 (25x25): total codewords = 44, data codewords = 28, ec codewords = 16, alignment = [6, 18]
// Version 3 (29x29): total codewords = 70, data codewords = 44, ec codewords = 26, alignment = [6, 22]
// Version 4 (33x33): total codewords = 100, data codewords = 64, ec codewords = 36, alignment = [6, 26]
interface QrVersionSpec {
  version: number;
  size: number;
  dataCapacityBytes: number;
  totalCodewords: number;
  ecCodewords: number;
  alignPos: number[];
}

const VERSIONS: QrVersionSpec[] = [
  { version: 2, size: 25, dataCapacityBytes: 26, totalCodewords: 44, ecCodewords: 16, alignPos: [6, 18] },
  { version: 3, size: 29, dataCapacityBytes: 42, totalCodewords: 70, ecCodewords: 26, alignPos: [6, 22] },
  { version: 4, size: 33, dataCapacityBytes: 62, totalCodewords: 100, ecCodewords: 36, alignPos: [6, 26] },
  { version: 5, size: 37, dataCapacityBytes: 84, totalCodewords: 134, ecCodewords: 48, alignPos: [6, 30] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8Bytes = Buffer.from(text, 'utf8');

  // Elegir la menor versión capaz de albergar el texto
  const spec = VERSIONS.find((v) => v.dataCapacityBytes >= utf8Bytes.length) || VERSIONS[VERSIONS.length - 1];
  const size = spec.size;

  // 1. Crear bitstream con Byte Mode (0100)
  const bitstream: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  // Indicador de modo (Byte Mode = 4)
  pushBits(4, 4);
  // Indicador de cantidad de caracteres (8 bits para versiones 1-9)
  pushBits(utf8Bytes.length, 8);
  // Datos
  for (let i = 0; i < utf8Bytes.length; i++) {
    pushBits(utf8Bytes[i], 8);
  }
  // Terminador
  const maxDataBits = spec.dataCapacityBytes * 8;
  const termLen = Math.min(4, maxDataBits - bitstream.length);
  pushBits(0, termLen);

  // Pad a múltiplo de 8
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // Convertir a bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < bitstream.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bitstream[i + j];
    }
    dataBytes.push(byte);
  }

  // Pad bytes alternantes 0xEC y 0x11 hasta llenar la capacidad
  const padPatterns = [0xec, 0x11];
  let pIdx = 0;
  while (dataBytes.length < spec.dataCapacityBytes) {
    dataBytes.push(padPatterns[pIdx % 2]);
    pIdx++;
  }

  // 2. Calcular corrección de error Reed-Solomon
  const ecBytes = rsCompute(new Uint8Array(dataBytes), spec.ecCodewords);
  const fullCodewords = new Uint8Array(dataBytes.length + ecBytes.length);
  fullCodewords.set(dataBytes);
  fullCodewords.set(ecBytes, dataBytes.length);

  // 3. Crear matriz
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );

  // Función auxiliar para colocar patrones fijos
  function setFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            matrix[mr][mc] = false; // Separator
          } else if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[mr][mc] = true;
          } else {
            matrix[mr][mc] = false;
          }
        }
      }
    }
  }

  // Tres patrones de búsqueda
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Patrones de alineación
  for (const ar of spec.alignPos) {
    for (const ac of spec.alignPos) {
      if (matrix[ar][ac] !== null) continue; // Si solapa con finders, omitir
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const mr = ar + r;
          const mc = ac + c;
          if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
            matrix[mr][mc] = true;
          } else {
            matrix[mr][mc] = false;
          }
        }
      }
    }
  }

  // Patrones de sincronización (timing patterns)
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Módulo oscuro fijo
  matrix[size - 8][8] = true;

  // Reservar áreas de información de formato (15 bits)
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 4. Colocar datos en zigzag
  let bitIdx = 0;
  const allBits: number[] = [];
  for (const b of fullCodewords) {
    for (let k = 7; k >= 0; k--) {
      allBits.push((b >> k) & 1);
    }
  }

  let upward = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Saltar columna de timing vertical

    const cols = [rightCol, rightCol - 1];
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of cols) {
        if (matrix[r][c] === null) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          // Máscara 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bitVal === 1) !== mask;
        }
      }
    }
    upward = !upward;
  }

  // 5. Escribir formato con Máscara 0 y Nivel 'M' (00 + 000 = 00000 => BCH = 0x5412 XOR)
  // Formato: Nivel M (00), Mask 0 (000) => 15 bits = 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Top-left
  for (let i = 0; i <= 5; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  // Split finders
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatBits[7 + i] === 1;

  return matrix.map((row) => row.map((cell) => !!cell));
}

export function generateQrSvg(text: string, moduleSize = 8, margin = 4): string {
  const matrix = generateQrMatrix(text);
  const count = matrix.length;
  const totalModules = count + margin * 2;
  const sizePx = totalModules * moduleSize;

  let rects = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="#0A192F"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizePx} ${sizePx}" width="${sizePx}" height="${sizePx}"><rect width="${sizePx}" height="${sizePx}" fill="#FFFFFF"/>${rects}</svg>`;
}

export function generateQrDataUri(text: string): string {
  const svg = generateQrSvg(text);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
