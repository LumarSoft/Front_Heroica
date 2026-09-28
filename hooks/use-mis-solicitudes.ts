'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { misSolicitudesPagoResponseSchema } from '@/lib/schemas'
import type { MisSolicitudesPagoResponse, PagoPendiente } from '@/lib/types'

interface UseMisSolicitudesOptions {
  sucursalId: number
  moneda: 'ARS' | 'USD'
  enabled: boolean
}

interface UseMisSolicitudesResult {
  solicitudes: PagoPendiente[]
  isLoading: boolean
  error: string
  refresh: () => Promise<void>
}

export function useMisSolicitudes({ sucursalId, moneda, enabled }: UseMisSolicitudesOptions): UseMisSolicitudesResult {
  const [solicitudes, setSolicitudes] = useState<PagoPendiente[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async (): Promise<void> => {
    if (!Number.isInteger(sucursalId) || sucursalId <= 0) return

    try {
      setIsLoading(true)
      setError('')
      const params = new URLSearchParams({ sucursal_id: String(sucursalId), moneda })
      const response = await apiFetch(`${API_ENDPOINTS.PAGOS_PENDIENTES.GET_MIS_SOLICITUDES}?${params}`)
      const payload: unknown = await response.json()

      if (!response.ok) {
        const message =
          typeof payload === 'object' && payload !== null && 'message' in payload
            ? String(payload.message)
            : 'Error al cargar tus solicitudes'
        throw new Error(message)
      }

      const parsed: MisSolicitudesPagoResponse = misSolicitudesPagoResponseSchema.parse(payload)
      setSolicitudes(parsed.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar tus solicitudes')
    } finally {
      setIsLoading(false)
    }
  }, [moneda, sucursalId])

  useEffect(() => {
    if (enabled) void refresh()
  }, [enabled, refresh])

  return { solicitudes, isLoading, error, refresh }
}
