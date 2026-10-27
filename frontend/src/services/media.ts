import { apiAdminJson } from './apiAdmin';

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  alt_text: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  project_id: string | null;
  event_id: string | null;
  content_id: string | null;
  uploaded_at: string;
  is_published: boolean;
  association_label: string | null;
  content_section: string | null;
}

export type MediaAssociation =
  | { project_id: string }
  | { event_id: string }
  | { content_id: string };

export const IMAGE_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
export const DOCUMENT_TYPES = ['application/pdf'];
export const ACCEPTED_TYPES = [...IMAGE_TYPES, ...DOCUMENT_TYPES];

export const IMAGE_LIMIT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_LIMIT_BYTES = 25 * 1024 * 1024;

export function isImage(mime: string | null): boolean {
  return mime !== null && IMAGE_TYPES.includes(mime);
}

/** Devuelve la clave de error de validación o null si el archivo es aceptable. */
export function validateFile(file: File): 'type' | 'size' | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'type';

  const limit = isImage(file.type) ? IMAGE_LIMIT_BYTES : DOCUMENT_LIMIT_BYTES;

  return file.size > limit ? 'size' : null;
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PresignResponse {
  key: string;
  upload_url: string;
  headers: Record<string, string>;
}

/** Envía el archivo directo al bucket y reporta el avance (0-100). */
function putToBucket(
  presign: PresignResponse,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('PUT', presign.upload_url);

    Object.entries(presign.headers).forEach(([name, value]) =>
      request.setRequestHeader(name, value)
    );

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`UPLOAD_${request.status}`));

    request.onerror = () => reject(new Error('UPLOAD_NETWORK'));

    request.send(file);
  });
}

interface UploadParams {
  file: File;
  altText: string;
  association: MediaAssociation;
  onProgress: (percent: number) => void;
}

/**
 * Carga en tres pasos (CU-22): pide la URL prefirmada, sube el archivo
 * directo a Cloudflare R2 y confirma para que la API registre el recurso.
 */
export async function uploadMedia({
  file,
  altText,
  association,
  onProgress,
}: UploadParams): Promise<MediaItem> {
  const presign = await apiAdminJson<PresignResponse>('/api/v1/media/presign', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    }),
  });

  await putToBucket(presign, file, onProgress);

  const { media } = await apiAdminJson<{ media: MediaItem }>(
    '/api/v1/media/confirm',
    {
      method: 'POST',
      body: JSON.stringify({
        key: presign.key,
        filename: file.name,
        alt_text: altText.trim() || null,
        usage_authorized: true,
        ...association,
      }),
    }
  );

  return media;
}
