import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { AgrupacionVentas, ComparacionVentas, FiltrosVentas, PanelVentas } from '@/lib/types'

export interface UseVentasPanelResult {
  data: PanelVentas | null
  isLoading: boolean
  error: string
}

export function useVentasPanel(
  filtros: FiltrosVentas,
  agrupacion: AgrupacionVentas,
  comparacion: ComparacionVentas,
  habilitado: boolean,
  /** Cambia cuando hay ventas nuevas importadas: fuerza otra consulta. */
  version = 0,
): UseVentasPanelResult {
  const [data, setData] = useState<PanelVentas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!habilitado) {
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    apiFetch(API_ENDPOINTS.VENTAS.PANEL(filtros, agrupacion, comparacion), { signal: controller.signal })
      .then(async response => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Error al cargar el panel de ventas')
        setData(json.data as PanelVentas)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Error al cargar el panel de ventas')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [filtros, agrupacion, comparacion, habilitado, version])

  return { data, isLoading, error }
}
