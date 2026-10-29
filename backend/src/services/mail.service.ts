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
  const puerto = Number(variableObligatoria('SMTP_PORT'));
  const seguro = variableObligatoria('SMTP_SECURE');

  if (
    !['true', 'false'].includes(seguro) ||
    ![465, 587].includes(puerto) ||
    (puerto === 465 && seguro !== 'true') ||
    (puerto === 587 && seguro !== 'false')
  ) {
    throw new Error('La configuración del puerto SMTP y TLS no es válida.');
  }

  return nodemailer.createTransport({
    host: variableObligatoria('SMTP_HOST'),
    port: puerto,
    secure: seguro === 'true',
    requireTLS: puerto === 587,
    auth: {
      user: variableObligatoria('SMTP_USER'),
      pass: variableObligatoria('SMTP_PASSWORD'),
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