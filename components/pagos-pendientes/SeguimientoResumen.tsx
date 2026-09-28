'use client'

import { CheckCircle2, Clock3, ListChecks, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SeguimientoEstadoFiltro, SeguimientoPagosResumen } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SeguimientoResumenProps {
  resumen: SeguimientoPagosResumen
  filtroActivo: SeguimientoEstadoFiltro
  onFiltroChange: (filtro: SeguimientoEstadoFiltro) => void
}

export function SeguimientoResumen({ resumen, filtroActivo, onFiltroChange }: SeguimientoResumenProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Button
        type="button"
        variant="outline"
        aria-pressed={filtroActivo === 'todos'}
        onClick={() => onFiltroChange('todos')}
        className={cn(
          'h-auto min-w-0 justify-start rounded-xl border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50',
          filtroActivo === 'todos' && 'border-[#002868] ring-2 ring-[#002868]/10',
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <ListChecks className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-black text-slate-900">{resumen.todos}</span>
          <span className="block truncate text-xs font-semibold text-slate-500">Todas</span>
        </span>
      </Button>

      <Button
        type="button"
        variant="outline"
        aria-pressed={filtroActivo === 'pendiente'}
        onClick={() => onFiltroChange('pendiente')}
        className={cn(
          'h-auto min-w-0 justify-start rounded-xl border-amber-200 bg-amber-50/60 p-4 text-left shadow-sm hover:bg-amber-50',
          filtroActivo === 'pendiente' && 'border-amber-500 ring-2 ring-amber-500/15',
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Clock3 className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-black text-amber-900">{resumen.pendiente}</span>
          <span className="block truncate text-xs font-semibold text-amber-700">Pendientes</span>
        </span>
      </Button>

      <Button
        type="button"
        variant="outline"
        aria-pressed={filtroActivo === 'aprobado'}
        onClick={() => onFiltroChange('aprobado')}
        className={cn(
          'h-auto min-w-0 justify-start rounded-xl border-emerald-200 bg-emerald-50/60 p-4 text-left shadow-sm hover:bg-emerald-50',
          filtroActivo === 'aprobado' && 'border-emerald-500 ring-2 ring-emerald-500/15',
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-black text-emerald-900">{resumen.aprobado}</span>
          <span className="block truncate text-xs font-semibold text-emerald-700">Aprobadas</span>
        </span>
      </Button>

      <Button
        type="button"
        variant="outline"
        aria-pressed={filtroActivo === 'rechazado'}
        onClick={() => onFiltroChange('rechazado')}
        className={cn(
          'h-auto min-w-0 justify-start rounded-xl border-rose-200 bg-rose-50/60 p-4 text-left shadow-sm hover:bg-rose-50',
          filtroActivo === 'rechazado' && 'border-rose-500 ring-2 ring-rose-500/15',
        )}
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
          <XCircle className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-black text-rose-900">{resumen.rechazado}</span>
          <span className="block truncate text-xs font-semibold text-rose-700">Rechazadas</span>
        </span>
      </Button>
    </div>
  )
}
