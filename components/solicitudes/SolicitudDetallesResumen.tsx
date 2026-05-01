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
    return renderRows([
      { label: 'Sueldo actual', value: formatCurrency(detalles.sueldo_actual) },
      { label: 'Sueldo nuevo', value: formatCurrency(detalles.sueldo_nuevo) },
      { label: 'Vigencia', value: String(detalles.fecha_vigencia ?? '-') },
      { label: 'Motivo', value: String(detalles.motivo ?? '-') },
    ])
  }

  if (solicitud.tipo === 'Apercibimientos') {
    return renderRows([
      { label: 'Fecha', value: String(detalles.fecha ?? '-') },
      { label: 'Severidad', value: String(detalles.severidad ?? '-') },
      { label: 'Motivo', value: String(detalles.motivo ?? '-') },
    ])
  }

  if (!solicitud.detalles) return null

  return (
    <pre className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-xs text-[#444] whitespace-pre-wrap">
      {JSON.stringify(solicitud.detalles, null, 2)}
    </pre>
  )
}
