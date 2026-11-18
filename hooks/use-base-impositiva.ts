'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { filtrosIniciales, totalesPor } from '@/lib/base-impositiva'
import type { ApiRespuesta, FiltrosBaseImpositiva, MovimientoImpositivo } from '@/lib/types'

/** Datos de la página Base impositiva: filtros, lista, totales y "Marcar pagado" */
export function useBaseImpositiva() {
  const [filtros, setFiltros] = useState<FiltrosBaseImpositiva>(filtrosIniciales)
  const [items, setItems] = useState<MovimientoImpositivo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [marcandoId, setMarcandoId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.BASE_IMPOSITIVA.GET(filtros), { cache: 'no-store' })
      const data: ApiRespuesta<MovimientoImpositivo[]> = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo cargar la base impositiva')
      setItems(data.data ?? [])
    } catch (err: unknown) {
      setItems([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar la base impositiva')
    } finally {
      setIsLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    void cargar()
  }, [cargar])

  /** Es lo mismo que pasar el movimiento a Saldo real desde la caja */
  const marcarPagado = useCallback(
    async (m: MovimientoImpositivo) => {
      setMarcandoId(m.id)
      try {
        const url =
          m.tipo_movimiento === 'banco'
            ? API_ENDPOINTS.CAJA_BANCO.UPDATE_ESTADO(m.id)
            : API_ENDPOINTS.MOVIMIENTOS.UPDATE_ESTADO(m.id)
        const res = await apiFetch(url, { method: 'PUT', body: JSON.stringify({ estado: 'completado' }) })
        const data: ApiRespuesta<unknown> = await res.json()
        if (!res.ok) throw new Error(data.message || 'No se pudo marcar como pagado')
        toast.success(`${m.impuesto} de ${m.sucursal_nombre} marcado como pagado`)
        await cargar()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo marcar como pagado')
      } finally {
        setMarcandoId(null)
      }
    },
    [cargar],
  )

  const totalesSucursal = useMemo(() => totalesPor(items, 'sucursal'), [items])
  const totalesPeriodo = useMemo(() => totalesPor(items, 'periodo'), [items])

  return {
    filtros,
    setFiltros,
    items,
    isLoading,
    error,
    cargar,
    marcarPagado,
    marcandoId,
    totalesSucursal,
    totalesPeriodo,
  }
}
