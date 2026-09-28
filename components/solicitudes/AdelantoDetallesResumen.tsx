'use client'

import type { RhSolicitud } from '@/lib/types'
import { formatCurrency } from '@/lib/solicitud-resumen'
import { getEstadoSolicitudLabel } from '@/lib/solicitud-adelantos'
import { SolicitudResumenFilas } from './SolicitudResumenFilas'

interface AdelantoDetallesResumenProps {
  solicitud: RhSolicitud
}

export function AdelantoDetallesResumen({ solicitud }: AdelantoDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>
  const pago = solicitud.pago_tesoreria
  const completado = pago?.estado === 'completado' && !pago.eliminado

  return (
    <div className="space-y-3">
      <SolicitudResumenFilas
        rows={[
          { label: 'Fecha solicitada', value: String(detalles.fecha ?? '-') },
          { label: 'Monto', value: formatCurrency(detalles.monto) },
          { label: 'Motivo', value: String(detalles.motivo ?? '-') },
          { label: 'Estado', value: getEstadoSolicitudLabel(solicitud) },
          ...(completado
            ? [
                { label: 'Monto pagado', value: formatCurrency(pago.monto) },
                { label: 'Fecha del pago', value: pago.fecha ?? '-' },
              ]
            : []),
        ]}
      />
      {pago && (
        <p className="text-xs text-[#5A6070]">
          {completado
            ? 'El pago está completado y el adelanto ya se incorpora al legajo.'
            : 'El adelanto se incorpora al legajo cuando Tesorería completa el pago. Si queda proyectado, todavía no se registra como adelanto pagado.'}
        </p>
      )}
    </div>
  )
}
