import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { downloadBlob } from '@/lib/downloadBlob'
import type { FiltrosVentas } from '@/lib/types'

export interface UseVentasExportarResult {
  exportar: (filtros: FiltrosVentas) => Promise<void>
  isExporting: boolean
}

export function useVentasExportar(): UseVentasExportarResult {
  const [isExporting, setIsExporting] = useState(false)

  const exportar = useCallback(async (filtros: FiltrosVentas) => {
    setIsExporting(true)
    try {
      const response = await apiFetch(API_ENDPOINTS.VENTAS.EXPORTAR(filtros), { cache: 'no-store' })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.message || 'No se pudo generar el Excel')
      }
      downloadBlob(await response.blob(), `Ventas_${filtros.desde}_a_${filtros.hasta}.xlsx`)
      toast.success('Excel generado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el Excel')
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { exportar, isExporting }
}
