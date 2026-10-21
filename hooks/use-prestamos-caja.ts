'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { ApiRespuesta, CajaPrestamo, Prestamo, PrestamosPorConfirmar } from '@/lib/types'

const VACIO: PrestamosPorConfirmar = { pedidos: [], devoluciones: [] }

/**
 * Préstamos de una caja: lo que espera que esta sucursal lo acepte (solo esta caja y moneda,
 * para el contador del botón) y el estado de cuenta de la sucursal.
 */
export function usePrestamosCaja(sucursalId: number, cajaTipo: CajaPrestamo, moneda: 'ARS' | 'USD') {
  const [porConfirmar, setPorConfirmar] = useState<PrestamosPorConfirmar>(VACIO)
  const [estadoCuenta, setEstadoCuenta] = useState<Prestamo[]>([])
  const [isLoadingCuenta, setIsLoadingCuenta] = useState(false)
  const [enCurso, setEnCurso] = useState<string | null>(null)

  const cargarPorConfirmar = useCallback(async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.PRESTAMOS.POR_CONFIRMAR(sucursalId, cajaTipo, moneda), {
        cache: 'no-store',
      })
      const data: ApiRespuesta<PrestamosPorConfirmar> = await res.json()
      setPorConfirmar(res.ok && data.data ? data.data : VACIO)
    } catch {
      setPorConfirmar(VACIO)
    }
  }, [sucursalId, cajaTipo, moneda])

  const cargarEstadoCuenta = useCallback(async () => {
    try {
      setIsLoadingCuenta(true)
      const res = await apiFetch(API_ENDPOINTS.PRESTAMOS.ESTADO_CUENTA(sucursalId, moneda), { cache: 'no-store' })
      const data: ApiRespuesta<Prestamo[]> = await res.json()
      setEstadoCuenta(res.ok && data.data ? data.data : [])
    } catch {
      setEstadoCuenta([])
    } finally {
      setIsLoadingCuenta(false)
    }
  }, [sucursalId, moneda])

  useEffect(() => {
    void cargarPorConfirmar()
  }, [cargarPorConfirmar])

  /** POST de una acción (aceptar, rechazar, anular…). Devuelve true si salió bien y recarga todo. */
  const accion = useCallback(
    async (clave: string, url: string, body: object = {}): Promise<boolean> => {
      try {
        setEnCurso(clave)
        const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) })
        const data: ApiRespuesta<unknown> = await res.json()
        if (!res.ok) throw new Error(data.message || 'No se pudo completar la acción')
        toast.success(data.message || 'Listo')
        await Promise.all([cargarPorConfirmar(), cargarEstadoCuenta()])
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo completar la acción')
        return false
      } finally {
        setEnCurso(null)
      }
    },
    [cargarPorConfirmar, cargarEstadoCuenta],
  )

  return {
    porConfirmar,
    cantidadPorConfirmar: porConfirmar.pedidos.length + porConfirmar.devoluciones.length,
    estadoCuenta,
    isLoadingCuenta,
    enCurso,
    cargarPorConfirmar,
    cargarEstadoCuenta,
    accion,
  }
}

export type PrestamosCajaState = ReturnType<typeof usePrestamosCaja>
