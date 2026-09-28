import { put } from '@vercel/blob/client'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'

export const MAX_ARCHIVO_SOLICITUD_BYTES = 10 * 1024 * 1024

const MIME_POR_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export interface ArchivoSolicitudSubido {
  url: string
  nombre: string
}

type UploadTokenResponse =
  | { success: true; data: { modo: 'directo'; token: string; pathname: string } | { modo: 'servidor' } }
  | { success: false; message: string }

interface UploadServidorResponse {
  success: boolean
  message?: string
  data?: { url: string; nombre_original: string }
}

// Algunos navegadores (Windows sin visor de PDF asociado) entregan file.type vacío.
function resolverContentType(file: File): string {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_POR_EXTENSION[extension] ?? ''
}

async function subirPorServidor(file: File): Promise<ArchivoSolicitudSubido> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.UPLOAD_ARCHIVO, { method: 'POST', body: fd, headers: {} })
  const data = (await res.json()) as UploadServidorResponse
  if (!res.ok || !data.data) throw new Error(data.message || 'Error al subir archivo')
  return { url: data.data.url, nombre: data.data.nombre_original }
}

/**
 * Sube un adjunto de solicitud. En producción el archivo va directo del navegador a Vercel Blob
 * (con un token emitido por la API), porque las funciones de Vercel rechazan bodies de más de 4.5 MB.
 */
export async function subirArchivoSolicitud(file: File): Promise<ArchivoSolicitudSubido> {
  if (file.size > MAX_ARCHIVO_SOLICITUD_BYTES) throw new Error('El archivo supera el máximo de 10 MB')
  const contentType = resolverContentType(file)

  try {
    const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.UPLOAD_ARCHIVO_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType, tamano_bytes: file.size }),
    })
    const data = (await res.json()) as UploadTokenResponse
    if (!data.success) throw new Error(data.message || 'Error al subir archivo')
    if (data.data.modo === 'servidor') return await subirPorServidor(file)

    const blob = await put(data.data.pathname, file, {
      access: 'private',
      token: data.data.token,
      contentType,
    })
    return { url: blob.url, nombre: file.name }
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      throw new Error('No se pudo subir el archivo. Revisá tu conexión e intentá de nuevo.')
    }
    throw err
  }
}
