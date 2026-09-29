import { formatFecha } from '@/lib/formatters'
import type { SincronizacionVentas } from '@/lib/types'
import { SincronizacionEstadoBadge } from './SincronizacionEstadoBadge'

/** Avance de una importación en curso: "Día 12 de 28 · importando el 12/09/2026". */
export function SincronizacionProgreso({ sincronizacion: s }: { sincronizacion: SincronizacionVentas }) {
  const hechos = s.diasProcesados ?? 0
  const porcentaje = s.diasTotales > 0 ? Math.round((hechos / s.diasTotales) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <SincronizacionEstadoBadge estado="en_curso" />
        <span className="text-xs font-semibold text-[#002868] tabular-nums">{porcentaje}%</span>
      </div>
      <div
        className="h-1.5 w-full max-w-[260px] rounded-full bg-[#EEF2FB] overflow-hidden"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-[#2F5BBD] transition-all" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-xs text-[#5A6B8C]">
        {hechos} de {s.diasTotales} días
        {s.proximoDia ? ` · importando el ${formatFecha(s.proximoDia)}` : ''}
      </p>
      {s.mensaje && <p className="text-xs text-amber-700">{s.mensaje}</p>}
    </div>
  )
}
