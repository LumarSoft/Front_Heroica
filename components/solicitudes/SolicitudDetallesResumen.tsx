'use client'

import type { RhSolicitud } from '@/lib/types'

interface SolicitudDetallesResumenProps {
  solicitud: RhSolicitud
}

function formatCurrency(value: unknown): string {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(numberValue)
}

function renderRows(rows: Array<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map(row => (
        <div key={row.label} className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">{row.label}</p>
          <p className="text-sm text-[#1A1A1A]">{row.value}</p>
        </div>
      ))}
    </div>
  )
}

export function SolicitudDetallesResumen({ solicitud }: SolicitudDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>

  if (solicitud.tipo === 'Altas') {
    return renderRows([
      { label: 'Nombre', value: String(detalles.nombre ?? '-') },
      { label: 'DNI', value: String(detalles.dni ?? '-') },
      { label: 'Email', value: String(detalles.email ?? '-') },
      { label: 'Puesto ID', value: String(detalles.puesto_id ?? '-') },
      { label: 'Incorporación', value: String(detalles.fecha_incorporacion ?? '-') },
      { label: 'Período de prueba', value: detalles.periodo_prueba === true ? `${String(detalles.periodo_prueba_dias ?? 90)} días` : 'No' },
    ])
  }

  if (solicitud.tipo === 'Bajas') {
    return renderRows([
      { label: 'Motivo', value: String(detalles.motivo_baja ?? '-') },
      { label: 'Fecha de baja', value: String(detalles.fecha_baja ?? '-') },
    ])
  }

  if (solicitud.tipo === 'Vacaciones') {
    return renderRows([
      { label: 'Desde', value: String(detalles.fecha_desde ?? '-') },
      { label: 'Hasta', value: String(detalles.fecha_hasta ?? '-') },
      { label: 'Días', value: String(detalles.cantidad_dias ?? '-') },
    ])
  }

  if (solicitud.tipo === 'Licencias') {
    return renderRows([
      { label: 'Tipo', value: String(detalles.tipo_licencia ?? '-') },
      { label: 'Desde', value: String(detalles.fecha_desde ?? '-') },
      { label: 'Hasta', value: String(detalles.fecha_hasta ?? '-') },
      { label: 'Motivo', value: String(detalles.motivo ?? '-') },
    ])
  }

  if (solicitud.tipo === 'Novedades de sueldo') {
    const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const mes = Number(detalles.mes)
    const periodo = detalles.mes && detalles.anio ? `${MESES[mes] ?? mes} ${detalles.anio}` : '-'
    const empleados = Array.isArray(detalles.empleados) ? detalles.empleados as Record<string, unknown>[] : []
    return (
      <div className="space-y-3">
        {renderRows([
          { label: 'Período', value: periodo },
          { label: 'Área ID', value: String(detalles.area_id ?? '-') },
          { label: 'Empleados', value: `${empleados.length}` },
        ])}
        {empleados.map((emp, idx) => {
          const aperc = emp.apercibimiento as Record<string, unknown> | undefined
          const susp = emp.suspension as Record<string, unknown> | undefined
          const desc = emp.descuento as Record<string, unknown> | undefined
          const tard = emp.tardanzas as Record<string, unknown> | undefined
          const ausI = emp.ausencias_injustificadas as Record<string, unknown> | undefined
          const ausJ = emp.ausencias_justificadas as Record<string, unknown> | undefined
          return (
            <div key={idx} className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-1.5">{String(emp.personal_nombre ?? `Empleado ${idx + 1}`)}</p>
              <div className="flex flex-wrap gap-1">
                {emp.horas_trabajadas != null && <span className="text-[10px] px-1.5 py-0.5 rounded border border-[#E0E0E0] bg-white text-[#5A6070]">{String(emp.horas_trabajadas)} hs</span>}
                {Boolean(aperc?.tiene) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Aperc.</span>}
                {Boolean(susp?.tiene) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Susp.</span>}
                {Boolean(desc?.tiene) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Desc.</span>}
                {Boolean(tard?.tiene) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Tard. {String(tard?.cantidad ?? '')} {String(tard?.unidad ?? '')}</span>}
                {Boolean(ausJ?.comentarios) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Aus. just.</span>}
                {Boolean(ausI?.motivo) && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Aus. injust.</span>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (solicitud.tipo === 'Apercibimientos') {
    return renderRows([
      { label: 'Fecha', value: String(detalles.fecha ?? '-') },
      { label: 'Severidad', value: String(detalles.severidad ?? '-') },
      { label: 'Motivo', value: String(detalles.motivo ?? '-') },
    ])
  }

  if (solicitud.tipo === 'Descuentos') {
    return renderRows([
      { label: 'Fecha', value: String(detalles.fecha ?? '-') },
      { label: 'Monto', value: formatCurrency(detalles.monto) },
      { label: 'Motivo', value: String(detalles.motivo ?? '-') },
    ])
  }

  if (solicitud.tipo === 'Horas extras') {
    return renderRows([
      { label: 'Fecha', value: String(detalles.fecha ?? '-') },
      { label: 'Horas', value: String(detalles.cantidad_horas ?? '-') },
      ...(detalles.valor_hora != null ? [{ label: 'Valor hora', value: formatCurrency(detalles.valor_hora) }] : []),
      ...(detalles.descripcion ? [{ label: 'Descripción', value: String(detalles.descripcion) }] : []),
    ])
  }

  if (!solicitud.detalles) return null

  return (
    <pre className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-xs text-[#444] whitespace-pre-wrap">
      {JSON.stringify(solicitud.detalles, null, 2)}
    </pre>
  )
}
