import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { downloadBlob } from '@/lib/downloadBlob'
import { clasificarEgresos } from '@/lib/corte-balance/clasificar'
import { seccionesParaExportar } from '@/lib/corte-balance/secciones-export'
import { balanceDelBorrador, importesPorLinea, nombreArchivo } from '@/lib/corte-balance/valores'
import type {
  BalanceCalculado,
  BorradorCorteBalance,
  CorteBalanceResponse,
  PlantillaCorteBalance,
  ResultadoCorteBalance,
  SeccionCalculada,
} from '@/lib/types'

type FormatoExport = 'pptx' | 'xlsx'

interface UseCorteBalanceExportResult {
  resultado: ResultadoCorteBalance | null
  secciones: SeccionCalculada[]
  balance: BalanceCalculado | null
  importes: Map<string, number>
  exportando: FormatoExport | null
  exportar: (formato: FormatoExport) => Promise<void>
}

/** Clasifica los egresos con la plantilla y genera el PPTX / Excel en el navegador. */
export function useCorteBalanceExport(
  datos: CorteBalanceResponse | null,
  plantilla: PlantillaCorteBalance | null,
  borrador: BorradorCorteBalance | null,
  sucursalNombre: string,
): UseCorteBalanceExportResult {
  const [exportando, setExportando] = useState<FormatoExport | null>(null)

  const resultado = useMemo(
    () => (datos && plantilla && borrador ? clasificarEgresos(datos.movimientos, plantilla, borrador.ajustes) : null),
    [datos, plantilla, borrador],
  )
  const secciones = useMemo(
    () => (resultado && borrador ? seccionesParaExportar(resultado, borrador) : []),
    [resultado, borrador],
  )
  const importes = useMemo(() => (resultado ? importesPorLinea(resultado) : new Map<string, number>()), [resultado])
  const balance = useMemo(
    () => (resultado && borrador && plantilla ? balanceDelBorrador(borrador, resultado, plantilla) : null),
    [resultado, borrador, plantilla],
  )

  const exportar = useCallback(
    async (formato: FormatoExport) => {
      if (!datos || !borrador || !resultado || !balance || exportando) return
      setExportando(formato)
      const aviso = toast.loading(formato === 'pptx' ? 'Generando presentación…' : 'Generando Excel…')
      try {
        const payload = {
          borrador,
          resultado,
          secciones,
          balance,
          importes,
          movimientos: datos.movimientos,
          moneda: datos.moneda,
          mes: datos.mes,
          sucursalNombre,
        }
        const blob =
          formato === 'pptx'
            ? await (await import('@/lib/corte-balance/pptx')).generarPptx(payload)
            : await (await import('@/lib/corte-balance/excel')).generarExcel(payload)
        downloadBlob(blob, `${nombreArchivo(sucursalNombre, datos.mes)}.${formato}`)
        toast.success(formato === 'pptx' ? 'Presentación descargada' : 'Excel descargado')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo generar el archivo')
      } finally {
        toast.dismiss(aviso)
        setExportando(null)
      }
    },
    [datos, borrador, resultado, secciones, balance, importes, sucursalNombre, exportando],
  )

  return { resultado, secciones, balance, importes, exportando, exportar }
}
