import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface UseVentasConsultaResult<T> {
  data: T | null
  isLoading: boolean
  error: string
}

/** GET genérico para las pantallas de análisis de ventas. `url` null = no consultar. */
export function useVentasConsulta<T>(
  url: string | null,
  mensajeError: string,
  version = 0,
): UseVentasConsultaResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(url))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!url) {
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    apiFetch(url, { signal: controller.signal })
      .then(async response => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || mensajeError)
        setData(json.data as T)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : mensajeError)
        setIsLoading(false)
      })
    return () => controller.abort()
  }, [url, mensajeError, version])

  return { data, isLoading, error }
}
