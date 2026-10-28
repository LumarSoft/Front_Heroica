'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { downloadBlob, toDateOnly } from '@/lib/downloadBlob'

interface Props {
  exportarUrl: string
  /** Prefijo del archivo descargado: "Descripciones" → Descripciones_2026-10-27.xlsx */
  nombreArchivo: string
  onImportar: () => void
}

const claseBoton =
  'text-xs sm:text-sm h-8 sm:h-9 px-3 border-[#E0E0E0] text-[#5A6070] hover:bg-[#EEF2FF] hover:border-[#002868] hover:text-[#002868]'

/** Botones "Exportar Excel" e "Importar Excel" de un catálogo de Configuración */
export function CatalogoExcelBotones({ exportarUrl, nombreArchivo, onImportar }: Props) {
  const [exportando, setExportando] = useState(false)

  const exportar = async () => {
    setExportando(true)
    try {
      const res = await apiFetch(exportarUrl, { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || 'No se pudo generar el Excel')
      }
      downloadBlob(await res.blob(), `${nombreArchivo}_${toDateOnly(new Date())}.xlsx`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar el Excel')
    } finally {
      setExportando(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={exportar} disabled={exportando} className={claseBoton}>
        {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Exportar Excel
      </Button>
      <Button variant="outline" onClick={onImportar} className={claseBoton}>
        <Upload className="h-4 w-4" />
        Importar Excel
      </Button>
    </>
  )
}
