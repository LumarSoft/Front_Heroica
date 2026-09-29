import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCantidad } from '@/lib/formatters'
import type { PaginacionVentas } from '@/lib/types'

interface VentasPaginacionProps {
  paginacion: PaginacionVentas
  onChange: (pagina: number) => void
  disabled?: boolean
}

export function VentasPaginacion({ paginacion, onChange, disabled = false }: VentasPaginacionProps) {
  const { pagina, totalPaginas, total, porPagina } = paginacion
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, total)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#5A6B8C]">
      <span>
        {formatCantidad(desde)}–{formatCantidad(hasta)} de {formatCantidad(total)} operaciones
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || pagina <= 1}
          onClick={() => onChange(pagina - 1)}
          className="cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>
        <span className="tabular-nums">
          {pagina} / {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || pagina >= totalPaginas}
          onClick={() => onChange(pagina + 1)}
          className="cursor-pointer"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
