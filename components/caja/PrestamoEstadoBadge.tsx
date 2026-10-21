'use client'
import { cn } from '@/lib/utils'
import type { EstadoDevolucion, Prestamo } from '@/lib/types'

type EstadoVista = 'solicitado' | 'vigente' | 'parcial' | 'cancelado' | 'rechazado' | 'anulado'

const ESTILOS: Record<EstadoVista | EstadoDevolucion, { label: string; clase: string }> = {
  solicitado: { label: 'Solicitado', clase: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  vigente: { label: 'Vigente', clase: 'bg-amber-50 text-amber-800 border-amber-200' },
  parcial: { label: 'Parcial', clase: 'bg-sky-50 text-sky-700 border-sky-200' },
  cancelado: { label: 'Cancelado', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rechazado: { label: 'Rechazado', clase: 'bg-rose-50 text-rose-700 border-rose-200' },
  anulado: { label: 'Anulado', clase: 'bg-gray-100 text-gray-600 border-gray-200' },
  por_confirmar: { label: 'Por confirmar', clase: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  confirmada: { label: 'Confirmada', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rechazada: { label: 'Rechazada', clase: 'bg-rose-50 text-rose-700 border-rose-200' },
  anulada: { label: 'Anulada', clase: 'bg-gray-100 text-gray-600 border-gray-200' },
}

/** Un préstamo vigente con devoluciones se muestra como "Parcial" */
export function estadoVista(p: Prestamo): EstadoVista {
  return p.estado === 'vigente' && p.devuelto > 0 ? 'parcial' : p.estado
}

export function PrestamoEstadoBadge({ estado }: { estado: EstadoVista | EstadoDevolucion }) {
  const { label, clase } = ESTILOS[estado]
  return (
    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold', clase)}>
      {label}
    </span>
  )
}
