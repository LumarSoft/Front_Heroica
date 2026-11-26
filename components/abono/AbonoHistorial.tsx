import { History } from 'lucide-react'
import { formatFechaHora } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { AccionHistorialAbono, HistorialAbono } from '@/lib/types'

const ACCIONES: Record<AccionHistorialAbono, { label: string; clase: string }> = {
  subida: { label: 'Subida', clase: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  abonada: { label: 'Abonada', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pendiente: { label: 'Vuelta a pendiente', clase: 'bg-amber-50 text-amber-800 border-amber-200' },
  eliminada: { label: 'Eliminada', clase: 'bg-rose-50 text-rose-700 border-rose-200' },
}

/** Quién subió, marcó o eliminó cada factura y cuándo, incluidas las eliminadas */
export function AbonoHistorial({ items }: { items: HistorialAbono[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-5 py-4">
        <History className="h-5 w-5 text-[#002868]" />
        <h2 className="text-lg font-bold text-[#1A1A1A]">Historial</h2>
        <span className="text-sm text-[#8A8F9C]">· últimos {items.length} movimientos</span>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-[#8A8F9C]">Todavía no hay movimientos.</p>
      ) : (
        <ul className="divide-y divide-[#F0F0F0]">
          {items.map(h => (
            <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 text-sm">
              <span className="w-36 shrink-0 text-xs text-[#8A8F9C]">{formatFechaHora(h.created_at)}</span>
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
                  ACCIONES[h.accion].clase,
                )}
              >
                {ACCIONES[h.accion].label}
              </span>
              <span className="flex-1 min-w-[200px] text-[#1A1A1A]">{h.detalle}</span>
              <span className="text-xs text-[#5A6070]">{h.usuario_nombre ?? 'Usuario desconocido'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
