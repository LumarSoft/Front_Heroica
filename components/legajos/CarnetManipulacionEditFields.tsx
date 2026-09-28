'use client'

import { FileCheck2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CarnetManipulacionEditFieldsProps {
  archivoActual: string
  archivoSeleccionado: File | null
  vencimiento: string
  onArchivoChange: (file: File | null) => void
  onVencimientoChange: (value: string) => void
}

export function CarnetManipulacionEditFields({
  archivoActual,
  archivoSeleccionado,
  vencimiento,
  onArchivoChange,
  onVencimientoChange,
}: CarnetManipulacionEditFieldsProps) {
  const nombreVisible = archivoSeleccionado?.name || archivoActual

  return (
    <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-[#002868]/20 bg-[#F0F4FF] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#002868]">Datos del carnet</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="carnet-archivo" className="text-xs font-semibold text-[#444]">
            Archivo del carnet <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="carnet-archivo"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={event => onArchivoChange(event.target.files?.[0] ?? null)}
            className="bg-white file:mr-2"
          />
          {nombreVisible && (
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-700">
              <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {archivoSeleccionado ? 'Seleccionado' : 'Archivo actual'}: {nombreVisible}
              </span>
            </p>
          )}
          <p className="text-[10px] text-[#8A8F9C]">PDF, JPG, PNG o WebP — máximo 10 MB.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="carnet-vencimiento" className="text-xs font-semibold text-[#444]">
            Fecha de vencimiento <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="carnet-vencimiento"
            type="date"
            value={vencimiento}
            onChange={event => onVencimientoChange(event.target.value)}
            className="bg-white"
          />
        </div>
      </div>
    </div>
  )
}
