'use client'

import { useState } from 'react'
import { CalendarDays, ChevronUp, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { downloadBlob, toDateOnly } from '@/lib/downloadBlob'
import { ResumenTesoreriaDialog } from '@/components/caja/ResumenTesoreriaDialog'

// Acciones poco frecuentes, a propósito discretas: se abren desde la flecha sobre el botón de nueva sucursal.
export function MasAccionesMenu() {
  const [open, setOpen] = useState(false)
  const [isExportando, setIsExportando] = useState(false)
  const [showResumen, setShowResumen] = useState(false)

  const exportarDeudas = async () => {
    setIsExportando(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.EXPORT_DEUDAS_EXCEL)
      if (!res.ok) throw new Error('Error en la respuesta del servidor')
      const blob = await res.blob()
      downloadBlob(blob, `Deudas y prestamos - Todas las sucursales ${toDateOnly(new Date())}.xlsx`)
      setOpen(false)
    } catch {
      toast.error('Error al exportar las deudas.')
    } finally {
      setIsExportando(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="w-10 h-10 rounded-full bg-white/80 text-[#002868] border border-[#E5E7EB] shadow-md opacity-60 hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Más acciones"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="left" align="end" sideOffset={8} className="w-auto p-1">
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false)
              setShowResumen(true)
            }}
            className="w-full justify-start gap-2 text-[#1A1A1A]"
          >
            <CalendarDays className="w-4 h-4 text-sky-700" />
            Resumen diario (todas las sucursales)
          </Button>
          <Button
            variant="ghost"
            onClick={exportarDeudas}
            disabled={isExportando}
            className="w-full justify-start gap-2 text-[#1A1A1A]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            {isExportando ? 'Exportando...' : 'Exportar deudas (todas las sucursales)'}
          </Button>
        </PopoverContent>
      </Popover>
      <ResumenTesoreriaDialog open={showResumen} onOpenChange={setShowResumen} />
    </>
  )
}
