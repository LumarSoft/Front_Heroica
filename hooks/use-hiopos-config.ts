import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { ConfigHioposVentas, DiagnosticoHiopos } from '@/lib/types'

export interface CambiosConfigHiopos {
  exportationId?: string | null
  attrFechaModificado?: number | null
  mapeo?: Record<string, string>
  diasPorTramo?: number
  reiniciarMarca?: boolean
}

export interface UseHioposConfigResult {
  config: ConfigHioposVentas | null
  isLoading: boolean
  error: string
  isGuardando: boolean
  isDiagnosticando: boolean
  diagnostico: DiagnosticoHiopos | null
  guardar: (cambios: CambiosConfigHiopos, mensaje?: string) => Promise<boolean>
  diagnosticar: (fecha: string) => Promise<void>
}

export function useHioposConfig(habilitado: boolean): UseHioposConfigResult {
  const [config, setConfig] = useState<ConfigHioposVentas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isGuardando, setIsGuardando] = useState(false)
  const [isDiagnosticando, setIsDiagnosticando] = useState(false)
  const [diagnostico, setDiagnostico] = useState<DiagnosticoHiopos | null>(null)

  const cargar = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.HIOPOS_CONFIG, { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.message || 'Error al leer la configuración de Hiopos')
      setConfig(json.data as ConfigHioposVentas)
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al leer la configuración de Hiopos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (habilitado) void cargar()
    else setIsLoading(false)
  }, [habilitado, cargar])

  const guardar = useCallback(
    async (cambios: CambiosConfigHiopos, mensaje = 'Configuración guardada') => {
      setIsGuardando(true)
      try {
        const response = await apiFetch(API_ENDPOINTS.VENTAS.HIOPOS_CONFIG, {
          method: 'PUT',
          body: JSON.stringify(cambios),
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo guardar')
        toast.success(mensaje)
        await cargar()
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
        return false
      } finally {
        setIsGuardando(false)
      }
    },
    [cargar],
  )

  const diagnosticar = useCallback(
    async (fecha: string) => {
      setIsDiagnosticando(true)
      setDiagnostico(null)
      try {
        const response = await apiFetch(API_ENDPOINTS.VENTAS.HIOPOS_DIAGNOSTICO, {
          method: 'POST',
          body: JSON.stringify({ fecha }),
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo probar la conexión')
        const resultado = json.data as DiagnosticoHiopos
        setDiagnostico(resultado)
        if (resultado.ok) toast.success('Conexión con Hiopos OK')
        else toast.error('La prueba encontró problemas: revisá el detalle')
        await cargar()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo probar la conexión')
      } finally {
        setIsDiagnosticando(false)
      }
    },
    [cargar],
  )

  return { config, isLoading, error, isGuardando, isDiagnosticando, diagnostico, guardar, diagnosticar }
}
