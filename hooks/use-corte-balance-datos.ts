import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { CorteBalanceResponse, PlantillaCorteBalance, Sucursal } from '@/lib/types'

interface UseCorteBalanceDatosResult {
  sucursal: Sucursal | null
  datos: CorteBalanceResponse | null
  plantilla: PlantillaCorteBalance | null
  plantillaModificada: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null
  setPlantilla: (plantilla: PlantillaCorteBalance) => void
  descartarCambiosPlantilla: () => void
  guardarPlantilla: () => Promise<void>
  restablecerPlantilla: () => Promise<void>
}

const mensajeDe = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback)

/**
 * Egresos del mes, catálogo y plantilla del Corte de balance. La plantilla se
 * puede editar en memoria (vale para la exportación actual) y guardarse como
 * plantilla global si el usuario tiene permiso.
 */
export function useCorteBalanceDatos(sucursalId: number, mes: string, moneda: string): UseCorteBalanceDatosResult {
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [datos, setDatos] = useState<CorteBalanceResponse | null>(null)
  const [plantilla, setPlantillaState] = useState<PlantillaCorteBalance | null>(null)
  const [plantillaModificada, setPlantillaModificada] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Para leer dentro del efecto de carga sin agregarlo como dependencia
  const modificadaRef = useRef(false)

  useEffect(() => {
    let cancelado = false
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
      .then(async res => {
        const json = (await res.json()) as { data: Sucursal; message?: string }
        if (!res.ok) throw new Error(json.message ?? 'Error al cargar la sucursal')
        if (!cancelado) setSucursal(json.data)
      })
      .catch((err: unknown) => !cancelado && setError(mensajeDe(err, 'Error al cargar la sucursal')))
    return () => {
      cancelado = true
    }
  }, [sucursalId])

  useEffect(() => {
    let cancelado = false
    setIsLoading(true)
    setError(null)
    apiFetch(API_ENDPOINTS.REPORTES.CORTE_BALANCE(sucursalId, mes, moneda), { cache: 'no-store' })
      .then(async res => {
        const json = (await res.json()) as { data: CorteBalanceResponse; message?: string }
        if (!res.ok) throw new Error(json.message ?? 'Error al cargar los egresos')
        if (cancelado) return
        setDatos(json.data)
        // Si el usuario estaba editando la plantilla, se conserva al cambiar de mes
        setPlantillaState(prev => (prev && modificadaRef.current ? prev : json.data.plantilla))
      })
      .catch((err: unknown) => !cancelado && setError(mensajeDe(err, 'Error al cargar los egresos')))
      .finally(() => !cancelado && setIsLoading(false))
    return () => {
      cancelado = true
    }
  }, [sucursalId, mes, moneda])

  const setPlantilla = useCallback((p: PlantillaCorteBalance) => {
    modificadaRef.current = true
    setPlantillaState(p)
    setPlantillaModificada(true)
  }, [])

  const descartarCambiosPlantilla = useCallback(() => {
    modificadaRef.current = false
    setPlantillaModificada(false)
    if (datos) setPlantillaState(datos.plantilla)
  }, [datos])

  const persistir = useCallback(
    async (method: 'PUT' | 'DELETE') => {
      if (!plantilla) return
      setIsSaving(true)
      try {
        const res = await apiFetch(API_ENDPOINTS.REPORTES.PLANTILLA_CORTE_BALANCE, {
          method,
          body: method === 'PUT' ? JSON.stringify({ plantilla }) : undefined,
        })
        const json = (await res.json()) as { data?: { plantilla: PlantillaCorteBalance }; message?: string }
        if (!res.ok || !json.data) throw new Error(json.message ?? 'No se pudo guardar la plantilla')
        const guardada = json.data.plantilla
        modificadaRef.current = false
        setPlantillaState(guardada)
        setPlantillaModificada(false)
        setDatos(prev =>
          prev
            ? {
                ...prev,
                plantilla: guardada,
                plantillaEsPorDefecto: method === 'DELETE',
                plantillaActualizadaEn: method === 'PUT' ? new Date().toISOString() : null,
              }
            : prev,
        )
        toast.success(method === 'PUT' ? 'Plantilla guardada para todas las sucursales' : 'Plantilla restablecida')
      } catch (err: unknown) {
        toast.error(mensajeDe(err, 'No se pudo guardar la plantilla'))
      } finally {
        setIsSaving(false)
      }
    },
    [plantilla],
  )

  const guardarPlantilla = useCallback(() => persistir('PUT'), [persistir])
  const restablecerPlantilla = useCallback(() => persistir('DELETE'), [persistir])

  return {
    sucursal,
    datos,
    plantilla,
    plantillaModificada,
    isLoading,
    isSaving,
    error,
    setPlantilla,
    descartarCambiosPlantilla,
    guardarPlantilla,
    restablecerPlantilla,
  }
}
