import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import 'dotenv/config';

// Cloudflare R2 expone la API de S3. Los archivos viajan directo del navegador
// al bucket mediante URLs prefirmadas; el servidor solo guarda los metadatos.

export const MIME_IMAGENES = ['image/webp', 'image/jpeg', 'image/png'] as const;
export const MIME_DOCUMENTOS = ['application/pdf'] as const;

export const LIMITE_IMAGEN_BYTES = 10 * 1024 * 1024;
export const LIMITE_DOCUMENTO_BYTES = 25 * 1024 * 1024;

export const EXPIRACION_URL_SEGUNDOS = 5 * 60;

const EXTENSION_POR_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export const FORMATO_LLAVE =
  /^media\/\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png|pdf)$/;

interface ConfiguracionAlmacenamiento {
  bucket: string;
  publicUrl: string;
  cliente: S3Client;
}

let configuracion: ConfiguracionAlmacenamiento | null | undefined;

// Quita las barras finales sin usar expresiones regulares (evita retroceso excesivo).
function sinBarrasFinales(texto: string) {
  let fin = texto.length;

  while (fin > 0 && texto[fin - 1] === '/') fin -= 1;

  return texto.slice(0, fin);
}

// Se lee de forma diferida para que la API arranque aunque R2 no esté
// configurado; solo los endpoints de multimedia responden 503.
function obtenerConfiguracion() {
  if (configuracion !== undefined) return configuracion;

  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
    R2_ENDPOINT,
  } = process.env;

  const endpoint =
    R2_ENDPOINT ||
    (R2_ACCOUNT_ID
      ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  if (
    !endpoint ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET ||
    !R2_PUBLIC_URL
  ) {
    configuracion = null;
    return configuracion;
  }

  configuracion = {
    bucket: R2_BUCKET,
    publicUrl: sinBarrasFinales(R2_PUBLIC_URL),
    cliente: new S3Client({
      region: 'auto',
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      // R2 no admite los checksums opcionales que el SDK agrega por defecto;
      // con ellos la URL prefirmada exigiría cabeceras que el navegador no envía.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
  };

  return configuracion;
}

export class AlmacenamientoNoConfiguradoError extends Error {
  constructor() {
    super('El almacenamiento de archivos no está configurado.');
  }
}

function requerirConfiguracion() {
  const config = obtenerConfiguracion();

  if (!config) throw new AlmacenamientoNoConfiguradoError();

  return config;
}

export function limitePorMime(mime: string) {
  if ((MIME_IMAGENES as readonly string[]).includes(mime)) {
    return LIMITE_IMAGEN_BYTES;
  }

  if ((MIME_DOCUMENTOS as readonly string[]).includes(mime)) {
    return LIMITE_DOCUMENTO_BYTES;
  }

  return undefined;
}

export function esImagen(mime: string) {
  return (MIME_IMAGENES as readonly string[]).includes(mime);
}

export function generarLlave(mime: string) {
  const anio = new Date().getUTCFullYear();

  return `media/${anio}/${crypto.randomUUID()}.${EXTENSION_POR_MIME[mime]}`;
}

// La URL se calcula al leer, con el dominio público vigente, para que un cambio
// de R2_PUBLIC_URL no deje enlaces obsoletos en los registros ya guardados.
export function urlVigente(urlGuardada: string, llave: string | null | undefined) {
  if (!llave) return urlGuardada;

  const config = obtenerConfiguracion();

  return config ? `${config.publicUrl}/${llave}` : urlGuardada;
}

export function urlPublica(llave: string) {
  return `${requerirConfiguracion().publicUrl}/${llave}`;
}

export async function prefirmarSubida(
  llave: string,
  mime: string,
  bytes: number
) {
  const { cliente, bucket } = requerirConfiguracion();

  return getSignedUrl(
    cliente,
    new PutObjectCommand({
      Bucket: bucket,
      Key: llave,
      ContentType: mime,
      ContentLength: bytes,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    {
      expiresIn: EXPIRACION_URL_SEGUNDOS,
      // Obliga a que el PUT use exactamente el tipo y tamaño validados.
      signableHeaders: new Set(['content-type', 'content-length']),
    }
  );
}

// Devuelve tipo y tamaño reales del objeto, o undefined si no existe.
export async function consultarObjeto(llave: string) {
  const { cliente, bucket } = requerirConfiguracion();

  try {
    const respuesta = await cliente.send(
      new HeadObjectCommand({ Bucket: bucket, Key: llave }),
      { abortSignal: AbortSignal.timeout(5000) }
    );

    return {
      mime: respuesta.ContentType ?? '',
      bytes: respuesta.ContentLength ?? 0,
    };
  } catch (error) {
    const nombre = (error as { name?: string }).name;
    const estado = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;

    if (nombre === 'NotFound' || nombre === 'NoSuchKey' || estado === 404) {
      return undefined;
    }

    throw error;
  }
}

export async function eliminarObjeto(llave: string) {
  const { cliente, bucket } = requerirConfiguracion();

  await cliente.send(new DeleteObjectCommand({ Bucket: bucket, Key: llave }));
}
