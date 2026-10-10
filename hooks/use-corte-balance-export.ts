import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { downloadBlob } from '@/lib/downloadBlob'
import { analizarCorte } from '@/lib/corte-balance/analisis'
import { clasificarEgresos } from '@/lib/corte-balance/clasificar'
import { crearContexto } from '@/lib/corte-balance/formulas'
import { seccionesParaExportar } from '@/lib/corte-balance/secciones-export'
import { balanceDelBorrador, importesPorLinea, nombreArchivo } from '@/lib/corte-balance/valores'
import type {
  BorradorCorteBalance,
  ContextoValores,
  CorteBalanceResponse,
  DatosExportCorteBalance,
  PlantillaCorteBalance,
  ResultadoCorteBalance,
} from '@/lib/types'

type FormatoExport = 'pptx' | 'xlsx'

interface UseCorteBalanceExportResult {
  resultado: ResultadoCorteBalance | null
  contexto: ContextoValores | null
  /** Todo lo calculado para el mes: lo usan la vista previa, el PPTX y el Excel. */
  datosExport: DatosExportCorteBalance | null
  exportando: FormatoExport | null
  exportar: (formato: FormatoExport) => Promise<void>
}

/** Clasifica los egresos con la plantilla, calcula el análisis y genera el PPTX / Excel en el navegador. */
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
  const contexto = useMemo(
    () => (resultado && borrador && datos ? crearContexto(borrador, importesPorLinea(resultado), datos.mes) : null),
    [resultado, borrador, datos],
  )

  const datosExport = useMemo((): DatosExportCorteBalance | null => {
    if (!datos || !plantilla || !borrador || !resultado || !contexto) return null
    const secciones = seccionesParaExportar(resultado, borrador)
    const balance = balanceDelBorrador(borrador, resultado, plantilla, contexto)
    const analisis = analizarCorte(
      datos,
      plantilla,
      resultado,
      secciones,
      balance.ingresos,
      borrador.opciones.incluirSinClasificar,
    )
    return {
      borrador,
      resultado,
      secciones,
      balance,
      contexto,
      movimientos: datos.movimientos,
      analisis,
      moneda: datos.moneda,
      mes: datos.mes,
      sucursalNombre,
    }
  }, [datos, plantilla, borrador, resultado, contexto, sucursalNombre])

  const exportar = useCallback(
    async (formato: FormatoExport) => {
      if (!datosExport || exportando) return
      setExportando(formato)
      const aviso = toast.loading(formato === 'pptx' ? 'Generando presentación…' : 'Generando Excel…')
      try {
        const blob =
          formato === 'pptx'
            ? await (await import('@/lib/corte-balance/pptx')).generarPptx(datosExport)
            : await (await import('@/lib/corte-balance/excel')).generarExcel(datosExport)
        downloadBlob(blob, `${nombreArchivo(sucursalNombre, datosExport.mes)}.${formato}`)
        toast.success(formato === 'pptx' ? 'Presentación descargada' : 'Excel descargado')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo generar el archivo')
      } finally {
        toast.dismiss(aviso)
        setExportando(null)
      }
    },
    [datosExport, exportando, sucursalNombre],
  )

  return { resultado, contexto, datosExport, exportando, exportar }
}
