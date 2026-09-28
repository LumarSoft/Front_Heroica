import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'

/** Abre un adjunto mediante la API autenticada, incluso cuando está en Vercel Blob privado. */
export async function openPersonalArchivo(personalId: number, url: string): Promise<void> {
  return openArchivo(API_ENDPOINTS.PERSONAL.OPEN_ARCHIVO(personalId), { url })
}

export async function openArchivo(endpoint: string, body?: Record<string, string>): Promise<void> {
  const popup = window.open('', '_blank')
  if (!popup) throw new Error('El navegador bloqueó la nueva pestaña')

  try {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) {
      const data: unknown = await response.json()
      const message =
        typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'No se pudo abrir el archivo'
      throw new Error(message)
    }
    const objectUrl = URL.createObjectURL(await response.blob())
    popup.location.replace(objectUrl)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  } catch (error) {
    popup.close()
    throw error
  }
}
