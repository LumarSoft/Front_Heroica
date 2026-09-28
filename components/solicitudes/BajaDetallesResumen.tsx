'use client'

import type { RhEmpleadoNovedad, RhSolicitud } from '@/lib/types'
import { SolicitudResumenFilas } from './SolicitudResumenFilas'

interface BajaDetallesResumenProps {
  solicitud: RhSolicitud
}

function isLiquidacionNovedadEmp(v: unknown): v is RhEmpleadoNovedad {
  return typeof v === 'object' && v !== null && typeof (v as RhEmpleadoNovedad).personal_id === 'number'
}

function formatoNumOGuion(value: number | null | undefined): string {
  if (value != null && Number.isFinite(value)) return String(value)
  return '—'
}

function filasLiquidaResumen(liq: RhEmpleadoNovedad): Array<{ label: string; value: string }> {
  const text = (t: string | null | undefined) => (typeof t === 'string' && t.trim().length > 0 ? t : '—')
  const inc =
    Array.isArray(liq.incentivos) && liq.incentivos.length > 0
      ? liq.incentivos
          .filter(i => i.aplica)
          .map(i => i.nombre)
          .join(', ') || '(ninguno marcado)'
      : '—'
  return [
    {
      label: 'Cambio de puesto',
      value: liq.cambio_puesto ? `Sí (#${liq.nuevo_puesto_id ?? '—'}) · ${text(liq.fecha_alta_puesto)}` : 'No',
    },
    { label: 'Horas trabajadas', value: formatoNumOGuion(liq.horas_trabajadas) },
    { label: 'Horas en feriados', value: formatoNumOGuion(liq.horas_feriados) },
    {
      label: 'Horas extras autorizadas',
      value: liq.horas_extras_autorizadas ? `${formatoNumOGuion(liq.horas_extras_cantidad)} hs` : 'No',
    },
    { label: 'Incentivos aplicados', value: inc },
    { label: 'Apercibimiento', value: liq.apercibimiento.tiene ? text(liq.apercibimiento.motivo) : 'No' },
    { label: 'Suspensión', value: liq.suspension.tiene ? text(liq.suspension.motivo) : 'No' },
    { label: 'Descuento', value: liq.descuento.tiene ? text(liq.descuento.motivo) : 'No' },
    {
      label: 'Ausencias justificadas',
      value: liq.ausencias_justificadas.tiene
        ? `${formatoNumOGuion(liq.ausencias_justificadas.cantidad)} ${liq.ausencias_justificadas.unidad}`
        : 'No',
    },
    { label: 'Motivo aus. injustificadas', value: text(liq.ausencias_injustificadas.motivo) },
    {
      label: 'Tardanzas',
      value: liq.tardanzas.tiene ? `${formatoNumOGuion(liq.tardanzas.cantidad)} ${liq.tardanzas.unidad}` : 'No',
    },
    { label: 'Observaciones liquidación', value: text(liq.observaciones) },
  ]
}

export function BajaDetallesResumen({ solicitud }: BajaDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>
  const dash = (v: unknown): string => {
    if (v == null) return '—'
    const s = String(v).trim()
    return s.length > 0 ? s : '—'
  }
  // Carta desde tabla; fallback a JSON para registros anteriores a RH-60
  const cartaArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'carta_documento')
  const cartaLegacy = detalles.carta_documento_adjunto as { url?: string; nombre_original?: string | null } | undefined
  const cartaUrl = cartaArchivo?.url ?? cartaLegacy?.url
  const tieneCartaDoc = Boolean(cartaUrl?.trim())
  const nombreMotivoCatalogo = dash(detalles.motivo_baja_nombre)
  const motivoMostrar = nombreMotivoCatalogo !== '—' ? nombreMotivoCatalogo : dash(detalles.motivo_baja)

  // Empleado de liquidación desde tabla; fallback a JSON para registros anteriores a RH-61
  const liqRaw = solicitud.empleados?.[0] ?? detalles.liquidacion_empleado
  const liqFmt = isLiquidacionNovedadEmp(liqRaw)

  const filasLaborales = liqFmt
    ? filasLiquidaResumen(liqRaw)
    : [
        { label: 'Días u horas trabajadas', value: dash(detalles.dias_horas_trabajadas_mes) },
        { label: 'Feriados trabajados', value: dash(detalles.feriados_trabajados_mes) },
        { label: 'Horas extras', value: dash(detalles.horas_extras_mes) },
        { label: 'Incentivos', value: dash(detalles.incentivos) },
        { label: 'Descuentos aplicados', value: dash(detalles.descuentos_aplicados) },
        { label: 'Ausencias justificadas', value: dash(detalles.ausencias_justificadas) },
        { label: 'Ausencias injustificadas', value: dash(detalles.ausencias_injustificadas) },
      ]

  const filasBasicas: Array<{ label: string; value: string }> = [
    { label: 'Nombre y apellido', value: solicitud.personal_nombre ?? '—' },
    { label: 'Legajo', value: solicitud.legajo ?? '—' },
    { label: 'DNI', value: solicitud.dni ?? '—' },
    { label: 'Sucursal', value: solicitud.sucursal_nombre ?? '—' },
    { label: 'Fecha de baja', value: dash(detalles.fecha_baja) },
    { label: 'Motivo de baja', value: motivoMostrar },
  ]
  if (dash(detalles.motivo_baja_detalle) !== '—') {
    filasBasicas.push({ label: 'Detalle del motivo', value: dash(detalles.motivo_baja_detalle) })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos básicos</p>
        {<SolicitudResumenFilas rows={filasBasicas} />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">
          {liqFmt ? 'Datos laborales (mismo formato que novedades de sueldo)' : 'Datos laborales (formato anterior)'}
        </p>
        {<SolicitudResumenFilas rows={filasLaborales} />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Documentación</p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
              tieneCartaDoc
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-[#F8F9FA] text-[#9AA0AC] border-[#E0E0E0]'
            }`}
          >
            Carta documento
          </span>
          {tieneCartaDoc && cartaUrl ? (
            <a
              href={cartaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#002868] underline font-medium truncate max-w-[240px]"
            >
              Abrir PDF
            </a>
          ) : null}
        </div>
      </div>
      {solicitud.observaciones ? (
        <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Observaciones</p>
          <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap break-words">{solicitud.observaciones}</p>
        </div>
      ) : null}
    </div>
  )
}
