import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { downloadBlob } from '@/lib/downloadBlob'
import type { ConfigReporteVentas, ReporteGuardadoVentas, ResultadoReporteVentas } from '@/lib/types'

const DEBOUNCE_MS = 350

/** Ejecuta el reporte cada vez que cambia la configuración (con debounce). */
export function useReporteConsulta(config: ConfigReporteVentas | null) {
  const [data, setData] = useState<ResultadoReporteVentas | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const clave = config ? JSON.stringify(config) : null

  useEffect(() => {
    if (!clave) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError('')
      apiFetch(API_ENDPOINTS.VENTAS.REPORTES_CONSULTA, { method: 'POST', body: clave, signal: controller.signal })
        .then(async response => {
          const json = await response.json()
          if (!response.ok) throw new Error(json.message || 'No se pudo armar el reporte')
          setData(json.data as ResultadoReporteVentas)
          setIsLoading(false)
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return
          setError(err instanceof Error ? err.message : 'No se pudo armar el reporte')
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [clave])

  return { data, isLoading, error }
}

export function useReporteExportar() {
  const [isExporting, setIsExporting] = useState(false)
  const exportar = useCallback(async (config: ConfigReporteVentas, nombre: string) => {
    setIsExporting(true)
    try {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.REPORTES_EXPORTAR, {
        method: 'POST',
        body: JSON.stringify({ ...config, nombre }),
        cache: 'no-store',
      })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.message || 'No se pudo generar el Excel')
      }
      const disposicion = response.headers.get('Content-Disposition') ?? ''
      const archivo = decodeURIComponent(disposicion.match(/filename\*=UTF-8''([^;]+)/)?.[1] ?? `${nombre}.xlsx`)
      downloadBlob(await response.blob(), archivo)
      toast.success('Excel generado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el Excel')
    } finally {
      setIsExporting(false)
    }
  }, [])
  return { exportar, isExporting }
}

export interface DatosReporteGuardado {
  nombre: string
  descripcion?: string
  config: ConfigReporteVentas
  compartido: boolean
}

export function useReportesGuardados() {
  const [guardados, setGuardados] = useState<ReporteGuardadoVentas[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.REPORTES_GUARDADOS, { cache: 'no-store' })
      const json = await response.json()
      if (response.ok) setGuardados(json.data as ReporteGuardadoVentas[])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const guardar = useCallback(
    async (datos: DatosReporteGuardado, id?: number): Promise<number | null> => {
      try {
        const response = await apiFetch(
          id ? API_ENDPOINTS.VENTAS.REPORTE_GUARDADO(id) : API_ENDPOINTS.VENTAS.REPORTES_GUARDADOS,
          {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(datos),
          },
        )
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo guardar el reporte')
        toast.success(id ? 'Reporte actualizado' : 'Reporte guardado')
        await cargar()
        return id ?? (json.data?.id as number) ?? null
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo guardar el reporte')
        return null
      }
    },
    [cargar],
  )

  const eliminar = useCallback(
    async (id: number) => {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.REPORTE_GUARDADO(id), { method: 'DELETE' })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        toast.error(json.message || 'No se pudo eliminar el reporte')
        return
      }
      toast.success('Reporte eliminado')
      await cargar()
    },
    [cargar],
  )

  return { guardados, isLoading, guardar, eliminar, recargar: cargar }
}
