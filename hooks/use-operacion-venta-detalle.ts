import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { LineaOperacionVenta, OperacionVenta } from '@/lib/types'

export interface UseOperacionVentaDetalleResult {
  lineas: LineaOperacionVenta[]
  isLoading: boolean
  error: string
}

export function useOperacionVentaDetalle(operacion: OperacionVenta | null): UseOperacionVentaDetalleResult {
  const [lineas, setLineas] = useState<LineaOperacionVenta[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!operacion) {
      setLineas([])
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    apiFetch(API_ENDPOINTS.VENTAS.DETALLE_OPERACION(operacion.fuente, operacion.fecha, operacion.transaccionId), {
      signal: controller.signal,
    })
      .then(async response => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Error al cargar el detalle')
        setLineas(json.data as LineaOperacionVenta[])
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Error al cargar el detalle')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [operacion])

  return { lineas, isLoading, error }
}
