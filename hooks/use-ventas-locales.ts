import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { LocalExternoVentas } from '@/lib/types'

export interface SucursalOpcion {
  id: number
  nombre: string
}

export interface UseVentasLocalesResult {
  locales: LocalExternoVentas[]
  sucursales: SucursalOpcion[]
  isLoading: boolean
  error: string
  guardandoId: number | null
  recargar: () => Promise<void>
  asignarSucursal: (localId: number, sucursalId: number | null) => Promise<void>
}

export function useVentasLocales(): UseVentasLocalesResult {
  const [locales, setLocales] = useState<LocalExternoVentas[]>([])
  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [guardandoId, setGuardandoId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [resLocales, resSucursales] = await Promise.all([
        apiFetch(API_ENDPOINTS.VENTAS.LOCALES, { cache: 'no-store' }),
        apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL),
      ])
      const [jsonLocales, jsonSucursales] = await Promise.all([resLocales.json(), resSucursales.json()])
      if (!resLocales.ok) throw new Error(jsonLocales.message || 'Error al cargar los locales')
      setLocales(jsonLocales.data as LocalExternoVentas[])
      if (resSucursales.ok) {
        const lista = (jsonSucursales.data ?? []) as SucursalOpcion[]
        setSucursales(lista.map(s => ({ id: s.id, nombre: s.nombre })))
      }
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los locales')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const asignarSucursal = useCallback(
    async (localId: number, sucursalId: number | null) => {
      setGuardandoId(localId)
      try {
        const response = await apiFetch(API_ENDPOINTS.VENTAS.LOCAL(localId), {
          method: 'PUT',
          body: JSON.stringify({ sucursal_id: sucursalId }),
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo actualizar el local')
        toast.success(sucursalId ? 'Local vinculado. Sus ventas ya se ven en esa sucursal.' : 'Se desvinculó el local')
        await cargar()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el local')
      } finally {
        setGuardandoId(null)
      }
    },
    [cargar],
  )

  return { locales, sucursales, isLoading, error, guardandoId, recargar: cargar, asignarSucursal }
}
