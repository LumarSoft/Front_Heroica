'use client'

import type { RhEmpleadoNovedad, RhSolicitud } from '@/lib/types'

interface SolicitudDetallesResumenProps {
  solicitud: RhSolicitud
}

function formatCurrency(value: unknown): string {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(
    numberValue,
  )
}

function renderRows(rows: Array<{ label: string; value: string }>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map(row => (
        <div key={row.label} className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">{row.label}</p>
          <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap break-words">{row.value}</p>
        </div>
      ))}
    </div>
  )
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

export function SolicitudDetallesResumen({ solicitud }: SolicitudDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>

  if (solicitud.tipo === 'Altas') {
    // Archivos desde tabla; fallback a JSON para registros anteriores a RH-60
    const archivosTabla = solicitud.archivos ?? []
    const adjLegacy = detalles.adjuntos as Record<string, { url?: string; nombre_original?: string } | null> | undefined
    const carnetAdjLegacy = detalles.carnet_adjunto as { url?: string } | undefined
    const tieneAdj = (k: string) => archivosTabla.some(a => a.tipo_doc === k) || Boolean(adjLegacy?.[k]?.url)
    const tieneCarnetArchivo =
      archivosTabla.some(a => a.tipo_doc === 'carnet_manipulacion_alimentos') || Boolean(carnetAdjLegacy?.url)
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos personales</p>
          {renderRows([
            { label: 'Nombres y apellidos', value: String(detalles.nombre ?? '-') },
            { label: 'DNI', value: String(detalles.dni ?? '-') },
            { label: 'CUIL / CUIT', value: String(detalles.cuil ?? '-') },
            { label: 'Domicilio real', value: String(detalles.domicilio ?? '-') },
            { label: 'Domicilio en DNI', value: detalles.domicilio_dni ? String(detalles.domicilio_dni) : '-' },
            { label: 'Fecha de nacimiento', value: String(detalles.fecha_nacimiento ?? '-') },
            { label: 'Teléfono', value: String(detalles.telefono ?? '-') },
            { label: 'Correo electrónico', value: String(detalles.email ?? '-') },
          ])}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos bancarios</p>
          {renderRows([
            { label: 'Entidad', value: detalles.banco ? String(detalles.banco) : '-' },
            { label: 'CBU / CVU', value: detalles.cbu ? String(detalles.cbu) : '-' },
          ])}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos laborales</p>
          {renderRows([
            { label: 'Puesto (ID)', value: String(detalles.puesto_id ?? '-') },
            {
              label: 'Condición laboral',
              value:
                detalles.condicion_laboral === 1 || detalles.condicion_laboral === 2
                  ? String(detalles.condicion_laboral)
                  : '-',
            },
            ...(detalles.condicion_laboral === 1 && detalles.fecha_alta_temprana
              ? [{ label: 'Alta temprana', value: String(detalles.fecha_alta_temprana) }]
              : []),
            { label: 'Inicio relación laboral', value: String(detalles.fecha_incorporacion ?? '-') },
            { label: 'Inicio cobro en oficina', value: String(detalles.fecha_inicio_cobro_oficina ?? '-') },
            {
              label: 'Jornada',
              value:
                detalles.jornada_semanal_dias != null && detalles.jornada_diaria_horas_texto
                  ? `${detalles.jornada_semanal_dias} días/semana · ${detalles.jornada_diaria_horas_texto}`
                  : '-',
            },
            {
              label: 'Propuesta económica',
              value: formatCurrency(detalles.propuesta_economica),
            },
            { label: 'Beneficios', value: detalles.beneficios ? String(detalles.beneficios) : '-' },
            {
              label: 'Período de prueba',
              value: detalles.periodo_prueba === true ? `${String(detalles.periodo_prueba_dias ?? '')} días` : 'No',
            },
            {
              label: 'Carnet manip.',
              value:
                detalles.carnet_manipulacion_alimentos === true
                  ? `Sí · vence ${String(detalles.carnet_fecha_vencimiento ?? '—')}`
                  : 'No',
            },
          ])}
        </div>
        {detalles.otras_observaciones_alta ? (
          <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Otras observaciones</p>
            <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{String(detalles.otras_observaciones_alta)}</p>
          </div>
        ) : null}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Documentación</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['dni_frente_dorso', 'DNI'],
              ['ddjj_domicilio', 'DDJJ dom.'],
              ['descripcion_puesto_firmada', 'Desc. puesto'],
              ['foto_colaborador', 'Foto'],
              ['normas_convivencia', 'Normas conv.'],
              ['constancia_uniforme', 'Constancia uniforme'],
            ].map(([key, short]) => (
              <span
                key={key}
                className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
                  tieneAdj(key)
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-[#F8F9FA] text-[#9AA0AC] border-[#E0E0E0]'
                }`}
              >
                {short}
              </span>
            ))}
            {detalles.carnet_manipulacion_alimentos === true ? (
              <span
                className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
                  tieneCarnetArchivo
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-[#F8F9FA] text-[#9AA0AC] border-[#E0E0E0]'
                }`}
              >
                Carnet
              </span>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (solicitud.tipo === 'Bajas') {
    const dash = (v: unknown): string => {
      if (v == null) return '—'
      const s = String(v).trim()
      return s.length > 0 ? s : '—'
    }
    // Carta desde tabla; fallback a JSON para registros anteriores a RH-60
    const cartaArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'carta_documento')
    const cartaLegacy = detalles.carta_documento_adjunto as
      | { url?: string; nombre_original?: string | null }
      | undefined
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
          {renderRows(filasBasicas)}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">
            {liqFmt ? 'Datos laborales (mismo formato que novedades de sueldo)' : 'Datos laborales (formato anterior)'}
          </p>
          {renderRows(filasLaborales)}
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

  if (solicitud.tipo === 'Apercibimientos') {
    const adjArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'apercibimiento_adjunto')
    const adjLegacy = detalles.archivo_adjunto as { url?: string } | undefined
    const adjUrl = adjArchivo?.url ?? adjLegacy?.url
    return (
      <div className="space-y-3">
        {renderRows([
          { label: 'Fecha', value: String(detalles.fecha ?? '-') },
          { label: 'Severidad', value: String(detalles.severidad ?? '-') },
          { label: 'Motivo', value: String(detalles.motivo ?? '-') },
        ])}
        {adjUrl ? (
          <a
            href={adjUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#002868] underline font-medium"
          >
            Abrir archivo adjunto
          </a>
        ) : null}
      </div>
    )
  }

  if (solicitud.tipo === 'Suspensiones') {
    const adjArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'suspension_adjunto')
    const adjLegacy = detalles.archivo_adjunto as { url?: string } | undefined
    const adjUrl = adjArchivo?.url ?? adjLegacy?.url
    return (
      <div className="space-y-3">
        {renderRows([
          { label: 'Desde', value: String(detalles.fecha_desde ?? '-') },
          { label: 'Hasta', value: String(detalles.fecha_hasta ?? '-') },
          { label: 'Motivo', value: String(detalles.motivo ?? '-') },
        ])}
        {adjUrl ? (
          <a
            href={adjUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#002868] underline font-medium"
          >
            Abrir archivo adjunto
          </a>
        ) : null}
      </div>
    )
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

  if (solicitud.tipo === 'Incentivos y premios') {
    const adjArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'incentivo_adjunto')
    const adjLegacy = detalles.archivo_adjunto as { url?: string } | undefined
    const adjUrl = adjArchivo?.url ?? adjLegacy?.url
    return (
      <div className="space-y-3">
        {renderRows([
          { label: 'Fecha', value: String(detalles.fecha ?? '-') },
          { label: 'Descripción', value: String(detalles.descripcion ?? '-') },
          ...(detalles.monto != null ? [{ label: 'Monto', value: formatCurrency(detalles.monto) }] : []),
        ])}
        {adjUrl ? (
          <a
            href={adjUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#002868] underline font-medium"
          >
            Abrir archivo adjunto
          </a>
        ) : null}
      </div>
    )
  }

  if (solicitud.tipo === 'Cambio de puesto/sucursal') {
    const dash = (value: unknown): string => {
      if (value == null) return '—'
      const text = String(value).trim()
      return text.length > 0 ? text : '—'
    }
    return renderRows([
      { label: 'Fecha efectiva', value: dash(detalles.fecha_efectiva) },
      { label: 'Nuevo puesto (ID)', value: dash(detalles.puesto_id_nuevo) },
      { label: 'Nueva sucursal (ID)', value: dash(detalles.sucursal_id_nueva) },
      { label: 'Motivo', value: dash(detalles.motivo) },
    ])
  }

  if (!solicitud.detalles) return null

  return (
    <pre className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-xs text-[#444] whitespace-pre-wrap">
      {JSON.stringify(solicitud.detalles, null, 2)}
    </pre>
  )
}
