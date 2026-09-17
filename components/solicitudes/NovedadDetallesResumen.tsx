'use client'

import type { RhSolicitud } from '@/lib/types'
import { SolicitudResumenFilas } from './SolicitudResumenFilas'
import { formatCurrency } from '@/lib/solicitud-resumen'

interface NovedadDetallesResumenProps {
  solicitud: RhSolicitud
}

export function NovedadDetallesResumen({ solicitud }: NovedadDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>
  const MESES = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  const mes = Number(detalles.mes)
  const periodo = detalles.mes && detalles.anio ? `${MESES[mes] ?? mes} ${detalles.anio}` : '-'
  // Empleados desde tabla; fallback a JSON para registros anteriores a RH-61
  const empleados: Record<string, unknown>[] =
    solicitud.empleados && solicitud.empleados.length > 0
      ? (solicitud.empleados as unknown as Record<string, unknown>[])
      : Array.isArray(detalles.empleados)
        ? (detalles.empleados as Record<string, unknown>[])
        : []
  return (
    <div className="space-y-3">
      {
        <SolicitudResumenFilas
          rows={[
            { label: 'Período', value: periodo },
            { label: 'Área ID', value: String(detalles.area_id ?? '-') },
            { label: 'Empleados', value: `${empleados.length}` },
          ]}
        />
      }
      {empleados.map((emp, idx) => {
        const aperc = emp.apercibimiento as Record<string, unknown> | undefined
        const susp = emp.suspension as Record<string, unknown> | undefined
        const desc = emp.descuento as Record<string, unknown> | undefined
        const tard = emp.tardanzas as Record<string, unknown> | undefined
        const ausI = emp.ausencias_injustificadas as Record<string, unknown> | undefined
        const ausJ = emp.ausencias_justificadas as Record<string, unknown> | undefined
        return (
          <div key={idx} className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1.5">
              {String(emp.personal_nombre ?? `Empleado ${idx + 1}`)}
            </p>
            <div className="flex flex-wrap gap-1">
              {emp.horas_trabajadas != null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#E0E0E0] bg-white text-[#5A6070]">
                  {String(emp.horas_trabajadas)} hs
                </span>
              )}
              {Boolean(aperc?.tiene) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Aperc.</span>
              )}
              {Boolean(susp?.tiene) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Susp.</span>
              )}
              {Boolean(desc?.tiene) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Desc. {formatCurrency(desc?.monto)}
                </span>
              )}
              {Boolean(tard?.tiene) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Tard. {String(tard?.cantidad ?? '')} {String(tard?.unidad ?? '')}
                </span>
              )}
              {Boolean(ausJ?.tiene) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  Aus. just. {String(ausJ?.cantidad ?? '')} {String(ausJ?.unidad ?? '')}
                </span>
              )}
              {Boolean(ausI?.cantidad || ausI?.motivo) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  Aus. injust. {String(ausI?.cantidad ?? '')} {String(ausI?.unidad ?? '')}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
