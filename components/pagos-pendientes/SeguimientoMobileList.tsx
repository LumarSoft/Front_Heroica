import { StatusBadge } from '@/components/caja/StatusBadge'
import { SeguimientoEstadoDetalle } from '@/components/pagos-pendientes/SeguimientoEstadoDetalle'
import { ESTADO_COLOR_MAP, formatFecha, formatMonto, truncarTexto } from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

interface SeguimientoMobileListProps {
  solicitudes: PagoPendiente[]
}

export function SeguimientoMobileList({ solicitudes }: SeguimientoMobileListProps) {
  return (
    <div className="divide-y divide-[#E0E0E0] md:hidden">
      {solicitudes.map(solicitud => (
        <article key={solicitud.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#1A1A1A]">{solicitud.concepto || 'Sin concepto'}</p>
              <p className="mt-0.5 text-xs text-[#8A8F9C]">Fecha del pago: {formatFecha(solicitud.fecha)}</p>
            </div>
            <StatusBadge value={solicitud.estado} colorMap={ESTADO_COLOR_MAP} />
          </div>

          {solicitud.comentarios && (
            <p className="text-sm leading-relaxed text-[#666666]">{truncarTexto(solicitud.comentarios, 110)}</p>
          )}

          <div className="flex items-end justify-between gap-3 border-t border-[#E0E0E0]/70 pt-3">
            <SeguimientoEstadoDetalle solicitud={solicitud} />
            <p className="shrink-0 text-sm font-black text-rose-700">
              {formatMonto(Math.abs(solicitud.monto), solicitud.moneda)}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
