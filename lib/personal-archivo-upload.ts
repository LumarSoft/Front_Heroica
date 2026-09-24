import { put } from '@vercel/blob/client'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'

export const MAX_ARCHIVO_PERSONAL_BYTES = 10 * 1024 * 1024

const MIME_POR_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const MIME_PERMITIDOS = new Set(Object.values(MIME_POR_EXTENSION))

export type DestinoArchivoPersonal = 'documento' | 'recibo'

type UploadTokenResponse =
  | { success: true; data: { modo: 'directo'; token: string; pathname: string } | { modo: 'servidor' } }
  | { success: false; message: string }

export type ArchivoPersonalPreparado = { modo: 'servidor' } | { modo: 'directo'; url: string; nombre_original: string }

function resolverContentType(file: File): string {
  if (MIME_PERMITIDOS.has(file.type)) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_POR_EXTENSION[extension] ?? ''
}

export async function prepararArchivoPersonal(
  file: File,
  personalId: number,
  destino: DestinoArchivoPersonal,
): Promise<ArchivoPersonalPreparado> {
  if (file.size <= 0) throw new Error('El archivo está vacío o es inválido')
  if (file.size > MAX_ARCHIVO_PERSONAL_BYTES) throw new Error('El archivo supera el máximo de 10 MB')

  const contentType = resolverContentType(file)
  if (!contentType) throw new Error('Solo se permiten archivos PDF o imagen (JPG, PNG, WebP)')

  try {
    const response = await apiFetch(API_ENDPOINTS.PERSONAL.UPLOAD_ARCHIVO_TOKEN(personalId), {
      method: 'POST',
      body: JSON.stringify({ destino, content_type: contentType, tamano_bytes: file.size }),
    })
    const data = (await response.json()) as UploadTokenResponse
    if (!response.ok || !data.success) {
      throw new Error(data.success ? 'No se pudo preparar la subida' : data.message)
    }
    if (data.data.modo === 'servidor') return { modo: 'servidor' }

    const blob = await put(data.data.pathname, file, {
      access: 'private',
      token: data.data.token,
      contentType,
      multipart: file.size > 4 * 1024 * 1024,
    })
    return { modo: 'directo', url: blob.url, nombre_original: file.name }
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo subir el archivo. Revisá tu conexión e intentá nuevamente.')
    }
    throw error
  }
}
