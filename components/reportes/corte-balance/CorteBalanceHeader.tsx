'use client'

import { useState } from 'react'
import { ArrowLeft, Eraser, FileSpreadsheet, Presentation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface CorteBalanceHeaderProps {
  sucursalNombre: string
  moneda: 'ARS' | 'USD'
  mes: string
  exportando: 'pptx' | 'xlsx' | null
  puedeExportar: boolean
  onMesChange: (mes: string) => void
  onBack: () => void
  onExportar: (formato: 'pptx' | 'xlsx') => void
  onDescartarBorrador: () => void
}

export function CorteBalanceHeader({
  sucursalNombre,
  moneda,
  mes,
  exportando,
  puedeExportar,
  onMesChange,
  onBack,
  onExportar,
  onDescartarBorrador,
}: CorteBalanceHeaderProps) {
  const [confirmar, setConfirmar] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-[#E0E0E0] bg-white">
      <div className="container mx-auto flex flex-col gap-3 px-4 py-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 cursor-pointer rounded-lg text-[#5A6070] hover:bg-[#002868]/8 hover:text-[#002868]"
            aria-label="Volver a Reportes"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-[#002868]">Corte de balance mensual — {moneda}</h1>
            <p className="text-[10px] leading-none text-[#9AA0AC]">{sucursalNombre}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="mes-corte" className="text-sm font-medium whitespace-nowrap">
            Mes:
          </Label>
          <Input
            id="mes-corte"
            type="month"
            value={mes}
            onChange={e => e.target.value && onMesChange(e.target.value)}
            className="h-9 w-auto"
          />
          <Button variant="ghost" size="sm" onClick={() => setConfirmar(true)} title="Vaciar lo cargado a mano">
            <Eraser className="h-4 w-4" /> Reiniciar
          </Button>
          <Button
            variant="outline"
            className="h-9"
            onClick={() => onExportar('xlsx')}
            disabled={!puedeExportar || exportando !== null}
          >
            {exportando === 'xlsx' ? <LoadingSpinner className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </Button>
          <Button
            className="h-9 bg-[#002868] text-white hover:bg-[#003d8f]"
            onClick={() => onExportar('pptx')}
            disabled={!puedeExportar || exportando !== null}
            title="PowerPoint editable; también se puede importar en Canva"
          >
            {exportando === 'pptx' ? <LoadingSpinner className="h-4 w-4" /> : <Presentation className="h-4 w-4" />}
            Presentación (PPTX)
          </Button>
        </div>
      </div>
      <DeleteDialog
        open={confirmar}
        nombre="todo lo cargado a mano en este mes (ingresos, RRHH, ajustes, conclusión y opciones)"
        onCancel={() => setConfirmar(false)}
        onConfirm={() => {
          setConfirmar(false)
          onDescartarBorrador()
        }}
      />
    </header>
  )
}
