import { Clock3 } from 'lucide-react'
import { differenceInCalendarDays } from 'date-fns'
import { formatFechaHora } from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

interface SeguimientoEstadoDetalleProps {
  solicitud: PagoPendiente
}

export function SeguimientoEstadoDetalle({ solicitud }: SeguimientoEstadoDetalleProps) {
  if (solicitud.estado === 'pendiente') {
    const creada = solicitud.created_at ? new Date(solicitud.created_at) : null
    const dias =
      creada && !Number.isNaN(creada.getTime()) ? Math.max(0, differenceInCalendarDays(new Date(), creada)) : 0

    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-700">
        <Clock3 className="size-3.5" />
        <span>{dias === 0 ? 'Cargada hoy' : `Esperando hace ${dias} día${dias === 1 ? '' : 's'}`}</span>
      </div>
    )
  }

  if (solicitud.estado === 'rechazado') {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-rose-700">
          Rechazado por {solicitud.usuario_revisor_nombre || 'Administración'}
        </p>
        {solicitud.fecha_revision && (
          <p className="text-[11px] text-[#8A8F9C]">{formatFechaHora(solicitud.fecha_revision)}</p>
        )}
        <p className="max-w-sm text-xs italic leading-relaxed text-[#666666]">
          “{solicitud.motivo_rechazo || 'Sin motivo especificado'}”
        </p>
      </div>
    )
  }

  const etiqueta = solicitud.estado === 'completado' ? 'Pagado' : 'Aprobado'
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold text-emerald-700">
        {etiqueta} · autorizó {solicitud.usuario_revisor_nombre || 'Administración'}
      </p>
      {solicitud.fecha_revision && (
        <p className="text-[11px] text-[#8A8F9C]">{formatFechaHora(solicitud.fecha_revision)}</p>
      )}
    </div>
  )
}
