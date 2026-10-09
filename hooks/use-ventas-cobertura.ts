import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { CoberturaVentas, FuenteVentas } from '@/lib/types'

export interface UseVentasCoberturaResult {
  cobertura: CoberturaVentas | null
  isLoading: boolean
}

/**
 * Qué días de ventas hay importados. Si se pasa un período, también informa los días
 * sin importar dentro de él. `version` fuerza otra consulta (ej. al terminar una sync).
 * Sin `fuente`, un día cuenta como importado si lo trajo cualquiera de las integraciones.
 */
export function useVentasCobertura(
  desde?: string,
  hasta?: string,
  version = 0,
  fuente?: FuenteVentas,
): UseVentasCoberturaResult {
  const [cobertura, setCobertura] = useState<CoberturaVentas | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    apiFetch(API_ENDPOINTS.VENTAS.COBERTURA(desde, hasta, fuente), { signal: controller.signal })
      .then(async response => {
        if (!response.ok) return
        const json = await response.json()
        setCobertura(json.data as CoberturaVentas)
      })
      // La cobertura es informativa: si falla, las pantallas siguen funcionando sin ella.
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })
    return () => controller.abort()
  }, [desde, hasta, version, fuente])

  return { cobertura, isLoading }
}
