import { generateQrMatrix } from '../utils/qr.js';

export interface TicketPdfItem {
  ticketNumber: number;
  totalTickets: number;
  qrCode: string;
  showTitle: string;
  seasonYear?: number;
  venue: string;
  startsAt: string;
  patronName: string;
  patronEmail: string;
  price: number;
  currency: string;
  purchaseId: string;
  status: string;
}

/**
 * Escapa texto para literales de cadena en PDF.
 */
function escapePdfText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos para Type 1 Standard Fonts
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Genera un PDF válido estándar (PDF-1.4) en Buffer sin dependencias externas.
 */
export function generarPdfBoletos(tickets: TicketPdfItem[]): Buffer {
  const objects: string[] = [];

  // Objeto 1: Catálogo (se conectará con Pages en obj 2)
  // Objeto 2: Pages (Kids)
  // Objetos de fuentes: F1 (Helvetica), F2 (Helvetica-Bold)

  const fontF1ObjIndex = 3;
  const fontF2ObjIndex = 4;

  const fontF1 = `${fontF1ObjIndex} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`;
  const fontF2 = `${fontF2ObjIndex} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`;

  const pageObjIndices: number[] = [];
  const contentObjIndices: number[] = [];

  let nextObjIndex = 5;

  const pageObjects: string[] = [];
  const contentObjects: string[] = [];

  for (const tkt of tickets) {
    const pageIndex = nextObjIndex++;
    const contentIndex = nextObjIndex++;
    pageObjIndices.push(pageIndex);
    contentObjIndices.push(contentIndex);

    // Formatear fecha y hora
    let fechaHoraStr = tkt.startsAt;
    try {
      const d = new Date(tkt.startsAt);
      if (!isNaN(d.getTime())) {
        fechaHoraStr = d.toLocaleString('es-CR', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {}

    // Generar la matriz del QR para este boleto
    const qrMatrix = generateQrMatrix(tkt.qrCode);
    const qrSize = qrMatrix.length;
    const qrBoxSize = 140; // 140x140 pt en el PDF
    const moduleSize = (qrBoxSize / qrSize).toFixed(2);
    const qrOriginX = 395;
    const qrOriginY = 465;

    // Fondo blanco con zona quieta (Quiet Zone de 4 módulos)
    const marginModules = 4;
    const quietX = (qrOriginX - marginModules * Number(moduleSize)).toFixed(2);
    const quietY = (qrOriginY - marginModules * Number(moduleSize)).toFixed(2);
    const quietSize = ((qrSize + marginModules * 2) * Number(moduleSize)).toFixed(2);

    let qrOps = `1 1 1 rg\n${quietX} ${quietY} ${quietSize} ${quietSize} re f\n0.04 0.1 0.18 rg\n`;
    for (let r = 0; r < qrSize; r++) {
      for (let c = 0; c < qrSize; c++) {
        if (qrMatrix[r][c]) {
          const mx = (qrOriginX + c * Number(moduleSize)).toFixed(2);
          const my = (qrOriginY + (qrSize - 1 - r) * Number(moduleSize)).toFixed(2);
          qrOps += `${mx} ${my} ${moduleSize} ${moduleSize} re f\n`;
        }
      }
    }

    const patron = escapePdfText(tkt.patronName || 'Asistente Far Corners');
    const email = escapePdfText(tkt.patronEmail || 'No especificado');
    const show = escapePdfText(tkt.showTitle);
    const venue = escapePdfText(tkt.venue || 'Teatro Comunitario Far Corners');
    const fecha = escapePdfText(fechaHoraStr);
    const qrStr = escapePdfText(tkt.qrCode);
    const priceStr = escapePdfText(`${tkt.currency} ${Number(tkt.price).toLocaleString()}`);
    const tktNumStr = escapePdfText(`Boleto ${tkt.ticketNumber} de ${tkt.totalTickets}`);
    const purchaseIdStr = escapePdfText(`ID Compra: ${tkt.purchaseId.slice(0, 13)}`);

    const streamContent = `
q
% Fondo general de página
0.96 0.96 0.95 rg
0 0 595 842 re f

% Contenedor principal de boleto
1 1 1 rg
30 380 535 420 re f
0.8 0.85 0.82 RG
1.5 w
30 380 535 420 re s

% Barra superior header
0.04 0.1 0.18 rg
30 730 535 70 re f

% Acento verde brillante
0.46 0.77 0.36 rg
30 726 535 4 re f

% Título header
BT
/F2 16 Tf
1 1 1 rg
50 765 Td
(FAR CORNERS COMMUNITY THEATRE) Tj
ET

BT
/F1 9 Tf
0.86 0.92 0.31 rg
50 745 Td
(BOLETO OFICIAL DE ENTRADA DIGITAL) Tj
ET

BT
/F2 10 Tf
1 1 1 rg
450 755 Td
(${tktNumStr}) Tj
ET

% Título de la Obra
BT
/F2 18 Tf
0.04 0.1 0.18 rg
50 685 Td
(${show}) Tj
ET

% Ubicación y Fecha
BT
/F1 11 Tf
0.3 0.35 0.4 rg
50 665 Td
(Lugar: ${venue}) Tj
ET

BT
/F2 11 Tf
0.1 0.5 0.3 rg
50 645 Td
(Fecha y Hora: ${fecha}) Tj
ET

% Línea divisoria
0.88 0.9 0.9 RG
1 w
50 625 310 0 re s

% Datos del Comprador
BT
/F1 9 Tf
0.4 0.45 0.5 rg
50 600 Td
(TITULAR DEL BOLETO:) Tj
ET

BT
/F2 12 Tf
0.04 0.1 0.18 rg
50 585 Td
(${patron}) Tj
ET

BT
/F1 9 Tf
0.4 0.45 0.5 rg
50 565 Td
(CORREO ELECTRONICO:) Tj
ET

BT
/F1 10 Tf
0.2 0.25 0.3 rg
50 550 Td
(${email}) Tj
ET

% Tarifa / Precio
BT
/F1 9 Tf
0.4 0.45 0.5 rg
50 520 Td
(PRECIO DEL BOLETO:) Tj
ET

BT
/F2 14 Tf
0.1 0.55 0.25 rg
50 500 Td
(${priceStr}) Tj
ET

% Estado del Boleto
BT
/F1 9 Tf
0.4 0.45 0.5 rg
200 520 Td
(ESTADO:) Tj
ET

BT
/F2 11 Tf
0.1 0.5 0.2 rg
200 500 Td
(CONFIRMADO / ACTIVO) Tj
ET

% Marco blanco del Código QR
1 1 1 rg
0.8 0.85 0.85 RG
1 w
380 450 170 170 re f
380 450 170 170 re s

% Dibujo de los módulos del QR
${qrOps}

% Código de texto debajo del QR
BT
/F1 8 Tf
0.4 0.45 0.5 rg
390 435 Td
(Codigo: ${qrStr}) Tj
ET

BT
/F1 8 Tf
0.5 0.55 0.6 rg
50 405 Td
(${purchaseIdStr}  |  Presenta este boleto digital o impreso al ingresar al teatro.) Tj
ET

% Instrucciones al pie del voucher
0.9 0.93 0.96 rg
30 330 535 35 re f
0.8 0.85 0.9 RG
0.5 w
30 330 535 35 re s

BT
/F1 8 Tf
0.25 0.35 0.45 rg
45 345 Td
(IMPORTANTE: Cada codigo QR es unico y valido para un solo ingreso. No dupliques ni compartas este archivo.) Tj
ET

Q
`;

    const streamLen = Buffer.byteLength(streamContent, 'utf8');

    const contentObj = `${contentIndex} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj`;
    contentObjects.push(contentObj);

    const pageObj = `${pageIndex} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontF1ObjIndex} 0 R /F2 ${fontF2ObjIndex} 0 R >> >> /Contents ${contentIndex} 0 R >>\nendobj`;
    pageObjects.push(pageObj);
  }

  // Objeto 1: Catalog
  const catalogObj = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;

  // Objeto 2: Pages
  const kidsStr = pageObjIndices.map((idx) => `${idx} 0 R`).join(' ');
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIndices.length} >>\nendobj`;

  // Ensamblar la lista de objetos ordenados por índice
  const allObjects: { index: number; content: string }[] = [
    { index: 1, content: catalogObj },
    { index: 2, content: pagesObj },
    { index: fontF1ObjIndex, content: fontF1 },
    { index: fontF2ObjIndex, content: fontF2 },
  ];

  for (let i = 0; i < pageObjects.length; i++) {
    allObjects.push({ index: pageObjIndices[i], content: pageObjects[i] });
    allObjects.push({ index: contentObjIndices[i], content: contentObjects[i] });
  }

  allObjects.sort((a, b) => a.index - b.index);

  // Armar PDF con tabla xref
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0]; // offset para el objeto 0

  for (const obj of allObjects) {
    offsets[obj.index] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${obj.content}\n`;
  }

  const startXref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${allObjects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= allObjects.length; i++) {
    const offsetStr = String(offsets[i] || 0).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
