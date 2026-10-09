import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { FrecuenciaEnvioVentas, ReporteProgramadoVentas } from '@/lib/types'

export interface DatosProgramado {
  nombre: string
  frecuencia: FrecuenciaEnvioVentas
  diaSemana: number | null
  hora: number
  destinatarios: string
  sucursalIds: number[]
  reporteGuardadoId: number | null
  activo: boolean
}

export function useVentasProgramados(habilitado: boolean) {
  const [programados, setProgramados] = useState<ReporteProgramadoVentas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [enviandoId, setEnviandoId] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.PROGRAMADOS, { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.message || 'Error al cargar los envíos')
      setProgramados(json.data as ReporteProgramadoVentas[])
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los envíos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (habilitado) void cargar()
    else setIsLoading(false)
  }, [habilitado, cargar])

  const guardar = useCallback(
    async (datos: DatosProgramado, id?: number) => {
      try {
        const response = await apiFetch(id ? API_ENDPOINTS.VENTAS.PROGRAMADO(id) : API_ENDPOINTS.VENTAS.PROGRAMADOS, {
          method: id ? 'PUT' : 'POST',
          body: JSON.stringify(datos),
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo guardar el envío')
        toast.success(id ? 'Envío actualizado' : 'Envío programado')
        await cargar()
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo guardar el envío')
        return false
      }
    },
    [cargar],
  )

  const eliminar = useCallback(
    async (id: number) => {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.PROGRAMADO(id), { method: 'DELETE' })
      if (!response.ok) toast.error('No se pudo eliminar el envío')
      else toast.success('Envío eliminado')
      await cargar()
    },
    [cargar],
  )

  const enviarAhora = useCallback(
    async (id: number) => {
      setEnviandoId(id)
      try {
        const response = await apiFetch(API_ENDPOINTS.VENTAS.PROGRAMADO_ENVIAR(id), { method: 'POST' })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo enviar')
        toast.success(json.message || 'Enviado')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo enviar')
      } finally {
        setEnviandoId(null)
        await cargar()
      }
    },
    [cargar],
  )

  return { programados, isLoading, error, enviandoId, guardar, eliminar, enviarAhora }
}
