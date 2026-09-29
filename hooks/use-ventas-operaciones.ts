import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { FiltrosVentas, OperacionVenta, PaginacionVentas } from '@/lib/types'

export interface UseVentasOperacionesResult {
  operaciones: OperacionVenta[]
  paginacion: PaginacionVentas | null
  pagina: number
  setPagina: (pagina: number) => void
  isLoading: boolean
  error: string
}

export function useVentasOperaciones(filtros: FiltrosVentas, habilitado: boolean): UseVentasOperacionesResult {
  const [operaciones, setOperaciones] = useState<OperacionVenta[]>([])
  const [paginacion, setPaginacion] = useState<PaginacionVentas | null>(null)
  const [paginaPorFiltros, setPaginaPorFiltros] = useState({ filtros, pagina: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // La página se recuerda junto con los filtros: si cambian, se vuelve a la primera
  // sin un render intermedio que consulte la página vieja con los filtros nuevos.
  const pagina = paginaPorFiltros.filtros === filtros ? paginaPorFiltros.pagina : 1
  const setPagina = useCallback((nueva: number) => setPaginaPorFiltros({ filtros, pagina: nueva }), [filtros])

  useEffect(() => {
    if (!habilitado) {
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    setError('')

    apiFetch(API_ENDPOINTS.VENTAS.OPERACIONES(filtros, pagina), { signal: controller.signal })
      .then(async response => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'Error al cargar las operaciones')
        setOperaciones(json.data.operaciones as OperacionVenta[])
        setPaginacion(json.data.paginacion as PaginacionVentas)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Error al cargar las operaciones')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [filtros, pagina, habilitado])

  return { operaciones, paginacion, pagina, setPagina, isLoading, error }
}
