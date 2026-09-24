'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SeguimientoFiltrosProps {
  busqueda: string
  onBusquedaChange: (value: string) => void
  resultadosCount: number
}

export function SeguimientoFiltros({ busqueda, onBusquedaChange, resultadosCount }: SeguimientoFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E0E0E0] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8A8F9C]" />
        <Input
          value={busqueda}
          onChange={event => onBusquedaChange(event.target.value)}
          placeholder="Buscar por concepto, descripción o monto..."
          aria-label="Buscar en mis solicitudes"
          className="h-10 border-[#D8DAE0] bg-[#F8F9FA] pl-9 pr-10 focus-visible:bg-white"
        />
        {busqueda && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onBusquedaChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[#666666]"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      <p className="shrink-0 px-1 text-xs font-medium text-[#8A8F9C]">
        {resultadosCount} resultado{resultadosCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
