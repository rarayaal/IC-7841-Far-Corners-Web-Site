import 'dotenv/config';
import nodemailer from 'nodemailer';

export type IdiomaCorreo = 'es' | 'en';

function variableObligatoria(nombre: string): string {
  const valor = process.env[nombre]?.trim();

  if (!valor) {
    throw new Error(`Falta configurar ${nombre}.`);
  }

  return valor;
}

function crearTransportador() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  const puertoNum = Number(process.env.SMTP_PORT?.trim() || 587);
  const seguroStr = process.env.SMTP_SECURE?.trim();
  const esSeguro = seguroStr === 'true' || puertoNum === 465;

  if (!host || !user || !pass) {
    throw new Error('Faltan credenciales SMTP obligatorias (SMTP_HOST, SMTP_USER o SMTP_PASSWORD).');
  }

  return nodemailer.createTransport({
    host,
    port: puertoNum,
    secure: esSeguro,
    requireTLS: puertoNum === 587,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

interface DatosRespuestaCorreo {
  destinatario: string;
  nombre: string;
  asuntoOriginal: string;
  respuesta: string;
  idioma: IdiomaCorreo;
}

export async function enviarRespuestaPorCorreo({
  destinatario,
  nombre,
  asuntoOriginal,
  respuesta,
  idioma,
}: DatosRespuestaCorreo) {
  if (idioma !== 'es' && idioma !== 'en') {
    throw new Error('El idioma del correo no es válido.');
  }

  const sufijo = idioma === 'es' ? 'ES' : 'EN';

  const nombreRemitente = variableObligatoria(
    `MAIL_FROM_NAME_${sufijo}`
  );
  const direccionRemitente = variableObligatoria(
    `MAIL_FROM_ADDRESS_${sufijo}`
  );
  const direccionRespuesta = variableObligatoria(
    `MAIL_REPLY_TO_${sufijo}`
  );

  const saludo = idioma === 'es'
    ? `Hola, ${nombre}:`
    : `Hello, ${nombre}:`;

  const despedida = idioma === 'es'
    ? 'Gracias por contactar con Teatro Comunitario Far Corners.'
    : 'Thank you for contacting Far Corners Community Theatre.';

  // Elimina saltos de línea del asunto.
  const asunto = asuntoOriginal.replace(/[\r\n]+/g, ' ').trim();
  console.log('Remitente seleccionado:', {
    idioma,
    nombreRemitente,
    direccionRemitente,
    direccionRespuesta,
    });
  const resultado = await crearTransportador().sendMail({
    from: {
      name: nombreRemitente,
      address: direccionRemitente,
    },
    to: {
      address: destinatario,
      name: nombre,
    },
    replyTo: direccionRespuesta,
    subject: idioma === 'es'
      ? `Respuesta a tu consulta: ${asunto}`
      : `Response to your inquiry: ${asunto}`,
    text: [
      saludo,
      respuesta,
      despedida,
      nombreRemitente,
    ].join('\n\n'),
  });

  if (resultado.accepted.length === 0) {
    throw new Error('El servidor de correo no aceptó el destinatario.');
  }

  return {
    messageId: resultado.messageId,
  };
}

interface DatosBoletosCorreo {
  destinatario: string;
  nombre: string;
  tituloObra: string;
  cantidadBoletos: number;
  pdfBuffer: Buffer;
  qrCodes?: string[];
  idioma?: IdiomaCorreo;
}

export async function enviarBoletosPorCorreo({
  destinatario,
  nombre,
  tituloObra,
  cantidadBoletos,
  pdfBuffer,
  qrCodes,
  idioma = 'es',
}: DatosBoletosCorreo) {
  // Si no hay configuración SMTP en el entorno, registramos el envío simulado
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn(
      `[SIMULACIÓN CORREO BOLETOS - Sin SMTP en .env] No hay credenciales SMTP en el archivo .env. ` +
      `Para envío real a la bandeja de entrada, añade SMTP_HOST, SMTP_USER y SMTP_PASSWORD.\n` +
      `Destinatario: ${destinatario} (${nombre}) | Obra: "${tituloObra}" | Boletos: ${cantidadBoletos}`
    );
    return {
      messageId: `simulated-${Date.now()}`,
      simulated: true,
    };
  }

  try {
    const sufijo = idioma === 'es' ? 'ES' : 'EN';
    const nombreRemitente =
      process.env[`MAIL_FROM_NAME_${sufijo}`]?.trim() || 'Far Corners Community Theatre';
    const direccionRemitente =
      process.env[`MAIL_FROM_ADDRESS_${sufijo}`]?.trim() ||
      process.env.SMTP_USER?.trim() ||
      'tickets@farcorners.org';
    const direccionRespuesta =
      process.env[`MAIL_REPLY_TO_${sufijo}`]?.trim() || direccionRemitente;

    const transportador = crearTransportador();
    const asunto =
      idioma === 'es'
        ? `Tus Boletos y Códigos QR para "${tituloObra}" - Far Corners Community Theatre`
        : `Your Tickets & QR Codes for "${tituloObra}" - Far Corners Community Theatre`;

    const saludo = idioma === 'es' ? `¡Hola, ${nombre}!` : `Hello, ${nombre}!`;
    const listaQr = qrCodes && qrCodes.length > 0
      ? (idioma === 'es'
          ? `Tus códigos de acceso oficiales:\n${qrCodes.map((c, i) => `  • Asiento #${i + 1}: ${c}`).join('\n')}`
          : `Your official entrance codes:\n${qrCodes.map((c, i) => `  • Seat #${i + 1}: ${c}`).join('\n')}`)
      : '';

    const cuerpoTexto =
      idioma === 'es'
        ? [
            saludo,
            `¡Tu pago ha sido validado exitosamente en la taquilla de Far Corners Community Theatre!`,
            `Adjunto a este correo encontrarás tus ${cantidadBoletos} boleto(s) oficial(es) en PDF con su respectivo código QR para la obra "${tituloObra}".`,
            listaQr,
            `Presenta el código QR desde tu teléfono o impreso directamente en la entrada de la sala.`,
            `¡Esperamos que disfrutes la función!`,
            nombreRemitente,
          ].filter(Boolean).join('\n\n')
        : [
            saludo,
            `Your payment has been successfully validated at Far Corners Community Theatre box office!`,
            `Attached you will find your ${cantidadBoletos} official ticket(s) in PDF format with individual QR codes for "${tituloObra}".`,
            listaQr,
            `Present your QR code from your phone or printed at the entrance.`,
            `We look forward to seeing you at the show!`,
            nombreRemitente,
          ].filter(Boolean).join('\n\n');

    const sanitizedFilename = `Boletos_${tituloObra.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const resultado = await transportador.sendMail({
      from: {
        name: nombreRemitente,
        address: direccionRemitente,
      },
      to: {
        name: nombre,
        address: destinatario,
      },
      replyTo: direccionRespuesta,
      subject: asunto,
      text: cuerpoTexto,
      attachments: [
        {
          filename: sanitizedFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return {
      messageId: resultado.messageId,
      simulated: false,
    };
  } catch (error) {
    console.error('Error al enviar correo con boletos PDF:', error);
    // Devolvemos el error pero no bloqueamos la experiencia del usuario
    return {
      messageId: null,
      error: (error as Error).message,
    };
  }
}

interface DatosConfirmacionCompra {
  destinatario: string;
  nombre: string;
  tituloObra: string;
  cantidadBoletos: number;
  montoTotal: number;
  moneda: string;
  metodoPago: string;
  referencia?: string;
  idioma?: IdiomaCorreo;
}

export async function enviarConfirmacionCompraPendiente({
  destinatario,
  nombre,
  tituloObra,
  cantidadBoletos,
  montoTotal,
  moneda,
  metodoPago,
  referencia,
  idioma = 'es',
}: DatosConfirmacionCompra) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn(
      `[SIMULACIÓN CONFIRMACIÓN PENDIENTE - Sin SMTP en .env] Solicitud de compra (${cantidadBoletos} boletos, ${moneda} ${montoTotal}) para "${tituloObra}" registrada para ${destinatario} (${nombre}).`
    );
    return {
      messageId: `simulated-pending-${Date.now()}`,
      simulated: true,
    };
  }

  try {
    const sufijo = idioma === 'es' ? 'ES' : 'EN';
    const nombreRemitente =
      process.env[`MAIL_FROM_NAME_${sufijo}`]?.trim() || 'Far Corners Community Theatre';
    const direccionRemitente =
      process.env[`MAIL_FROM_ADDRESS_${sufijo}`]?.trim() ||
      process.env.SMTP_USER?.trim() ||
      'tickets@farcorners.org';
    const direccionRespuesta =
      process.env[`MAIL_REPLY_TO_${sufijo}`]?.trim() || direccionRemitente;

    const transportador = crearTransportador();
    const asunto =
      idioma === 'es'
        ? `Hemos recibido tu solicitud de boletos para "${tituloObra}" - Far Corners Community Theatre`
        : `Ticket purchase request received for "${tituloObra}" - Far Corners Community Theatre`;

    const cuerpoTexto =
      idioma === 'es'
        ? [
            `¡Hola, ${nombre}!`,
            `Hemos recibido tu solicitud de compra de ${cantidadBoletos} boleto(s) para la obra "${tituloObra}".`,
            `Detalles del registro de compra:`,
            `  • Método de pago: ${metodoPago.toUpperCase()}`,
            `  • Monto total: ${moneda === 'CRC' ? '₡' : '$'}${montoTotal.toLocaleString()} ${moneda}`,
            referencia ? `  • Comprobante / Referencia: ${referencia}` : null,
            `Estado actual: EN PROCESO DE VALIDACIÓN.`,
            `Nuestro equipo de taquilla verificará tu comprobante en breve. Una vez validado, te llegará automáticamente un segundo correo con tus boletos oficiales en PDF y los códigos QR para ingresar a la sala.`,
            `¡Muchas gracias por apoyar el teatro comunitario!`,
            nombreRemitente,
          ].filter(Boolean).join('\n\n')
        : [
            `Hello, ${nombre}!`,
            `We have received your ticket purchase request for ${cantidadBoletos} ticket(s) for "${tituloObra}".`,
            `Purchase details:`,
            `  • Payment method: ${metodoPago.toUpperCase()}`,
            `  • Total amount: ${moneda === 'CRC' ? '₡' : '$'}${montoTotal.toLocaleString()} ${moneda}`,
            referencia ? `  • Reference / Receipt: ${referencia}` : null,
            `Current status: PENDING VERIFICATION.`,
            `Our box office staff will verify your receipt shortly. Once validated, you will receive a follow-up email containing your official PDF tickets and QR codes for entrance.`,
            `Thank you for supporting community theatre!`,
            nombreRemitente,
          ].filter(Boolean).join('\n\n');

    const resultado = await transportador.sendMail({
      from: {
        name: nombreRemitente,
        address: direccionRemitente,
      },
      to: {
        name: nombre,
        address: destinatario,
      },
      replyTo: direccionRespuesta,
      subject: asunto,
      text: cuerpoTexto,
    });

    return {
      messageId: resultado.messageId,
      simulated: false,
    };
  } catch (error) {
    console.error('Error al enviar confirmación de compra pendiente:', error);
    return {
      messageId: null,
      error: (error as Error).message,
    };
  }
}
