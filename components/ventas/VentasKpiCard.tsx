import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'
import { cn } from '@/lib/utils'

interface VentasKpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  /** Variación % contra el período comparado; null = sin base de comparación. */
  variacion?: number | null
  /** Texto del valor comparado, ej. "$ 1.200.000 período anterior". */
  detalle?: string
  /** true cuando subir es malo (ej. anulaciones). */
  invertir?: boolean
}

export function VentasKpiCard({ label, value, icon, variacion, detalle, invertir = false }: VentasKpiCardProps) {
  const tieneVariacion = variacion !== undefined && variacion !== null
  const neutra = tieneVariacion && Math.abs(variacion) < 0.05
  const buena = tieneVariacion && !neutra && variacion > 0 !== invertir
  const Icono = !tieneVariacion || neutra ? Minus : variacion > 0 ? TrendingUp : TrendingDown

  return (
    <div className={`${VENTAS_CARD_CLASS} p-5 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] leading-tight">{label}</p>
        <span className="w-9 h-9 rounded-xl bg-[#EEF3FF] text-[#002868] flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
      </div>
      <p className="text-2xl sm:text-[1.7rem] font-bold text-[#002868] tabular-nums leading-none">{value}</p>
      <div className="flex flex-wrap items-center gap-2 min-h-[22px]">
        {tieneVariacion ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
              neutra
                ? 'bg-slate-100 text-slate-600'
                : buena
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700',
            )}
          >
            <Icono className="w-3 h-3" />
            {variacion > 0 ? '+' : ''}
            {variacion.toFixed(1)}%
          </span>
        ) : (
          <span className="text-xs text-[#9AAACC]">Sin comparación</span>
        )}
        {detalle && <span className="text-xs text-[#7A93BB]">{detalle}</span>}
      </div>
    </div>
  )
}
