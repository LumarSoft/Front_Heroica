import type { RhSolicitud, RhSolicitudTipo } from '@/lib/types'
import { CBU_DIGITOS } from '@/lib/schemas'

function getPrevMonthDefaults(): { mes: string; anio: string } {
  const d = new Date()
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return { mes: String(prev.getMonth() + 1), anio: String(prev.getFullYear()) }
}

const todayStr = new Date().toISOString().split('T')[0]

export interface EmpleadoNovedadData {
  personal_id: number
  personal_nombre: string
  puesto_id: number | null
  cambio_puesto: boolean
  nuevo_puesto_id: string
  fecha_alta_puesto: string
  horas_trabajadas: string
  horas_feriados: string
  horas_extras_autorizadas: boolean
  horas_extras_cantidad: string
  incentivos: Array<{ incentivo_id: number; nombre: string; aplica: boolean }>
  apercibimiento: boolean
  apercibimiento_motivo: string
  apercibimiento_archivo_url: string
  apercibimiento_archivo_nombre: string
  suspension: boolean
  suspension_motivo: string
  suspension_archivo_url: string
  suspension_archivo_nombre: string
  descuento: boolean
  descuento_monto: string
  descuento_motivo: string
  aus_just_tiene: boolean
  aus_just_cantidad: string
  aus_just_unidad: 'horas' | 'minutos'
  aus_just_motivo: string
  aus_injust_cantidad: string
  aus_injust_unidad: 'horas' | 'minutos'
  aus_injust_motivo: string
  observaciones: string
  tardanzas_tiene: boolean
  tardanzas_cantidad: string
  tardanzas_unidad: 'horas' | 'minutos'
  tardanzas_motivo: string
}

/** Misma forma que un ítem de `empleados` en novedades (payload hacia `/api/rrhh/solicitudes`). */
export function mapEmpleadoNovedadToApiPayload(emp: EmpleadoNovedadData) {
  return {
    personal_id: emp.personal_id,
    personal_nombre: emp.personal_nombre,
    cambio_puesto: emp.cambio_puesto,
    nuevo_puesto_id: emp.cambio_puesto && emp.nuevo_puesto_id ? Number(emp.nuevo_puesto_id) : null,
    fecha_alta_puesto: emp.cambio_puesto && emp.fecha_alta_puesto ? emp.fecha_alta_puesto : null,
    horas_trabajadas: emp.horas_trabajadas ? Number(emp.horas_trabajadas) : null,
    horas_feriados: emp.horas_feriados ? Number(emp.horas_feriados) : null,
    horas_extras_autorizadas: emp.horas_extras_autorizadas,
    horas_extras_cantidad:
      emp.horas_extras_autorizadas && emp.horas_extras_cantidad ? Number(emp.horas_extras_cantidad) : null,
    incentivos: emp.incentivos,
    apercibimiento: {
      tiene: emp.apercibimiento,
      motivo: emp.apercibimiento ? emp.apercibimiento_motivo.trim() || null : null,
      archivo_url: emp.apercibimiento ? emp.apercibimiento_archivo_url || null : null,
      archivo_nombre: emp.apercibimiento ? emp.apercibimiento_archivo_nombre || null : null,
    },
    suspension: {
      tiene: emp.suspension,
      motivo: emp.suspension ? emp.suspension_motivo.trim() || null : null,
      archivo_url: emp.suspension ? emp.suspension_archivo_url || null : null,
      archivo_nombre: emp.suspension ? emp.suspension_archivo_nombre || null : null,
    },
    descuento: {
      tiene: emp.descuento,
      motivo: emp.descuento ? emp.descuento_motivo.trim() || null : null,
    },
    ausencias_justificadas: {
      tiene: emp.aus_just_tiene,
      cantidad: emp.aus_just_tiene && emp.aus_just_cantidad ? Number(emp.aus_just_cantidad) : null,
      unidad: emp.aus_just_unidad,
      motivo: emp.aus_just_tiene ? emp.aus_just_motivo.trim() || null : null,
    },
    ausencias_injustificadas: {
      motivo: emp.aus_injust_motivo.trim() || null,
    },
    observaciones: emp.observaciones.trim() || null,
    tardanzas: {
      tiene: emp.tardanzas_tiene,
      cantidad: emp.tardanzas_tiene && emp.tardanzas_cantidad ? Number(emp.tardanzas_cantidad) : null,
      unidad: emp.tardanzas_unidad,
      motivo: emp.tardanzas_tiene ? emp.tardanzas_motivo.trim() || null : null,
    },
  }
}

export function validateEmpleadoNovedadForSolicitud(emp: EmpleadoNovedadData): string | null {
  if (emp.cambio_puesto && !emp.nuevo_puesto_id) return `Seleccione el nuevo puesto de ${emp.personal_nombre}`
  if (emp.apercibimiento && !emp.apercibimiento_motivo.trim())
    return `Ingrese el motivo del apercibimiento de ${emp.personal_nombre}`
  if (emp.suspension && !emp.suspension_motivo.trim())
    return `Ingrese el motivo de la suspensión de ${emp.personal_nombre}`
  if (emp.descuento && !emp.descuento_motivo.trim()) return `Ingrese el motivo del descuento de ${emp.personal_nombre}`
  if (emp.tardanzas_tiene && !emp.tardanzas_cantidad) return `Ingrese la cantidad de tardanza de ${emp.personal_nombre}`
  return null
}

export function createEmpleadoVacio(
  personalId: number,
  personalNombre: string,
  puestoId: number | null = null,
): EmpleadoNovedadData {
  return {
    personal_id: personalId,
    personal_nombre: personalNombre,
    puesto_id: puestoId,
    cambio_puesto: false,
    nuevo_puesto_id: '',
    fecha_alta_puesto: todayStr,
    horas_trabajadas: '',
    horas_feriados: '',
    horas_extras_autorizadas: false,
    horas_extras_cantidad: '',
    incentivos: [],
    apercibimiento: false,
    apercibimiento_motivo: '',
    apercibimiento_archivo_url: '',
    apercibimiento_archivo_nombre: '',
    suspension: false,
    suspension_motivo: '',
    suspension_archivo_url: '',
    suspension_archivo_nombre: '',
    descuento: false,
    descuento_monto: '',
    descuento_motivo: '',
    aus_just_tiene: false,
    aus_just_cantidad: '',
    aus_just_unidad: 'horas',
    aus_just_motivo: '',
    aus_injust_cantidad: '',
    aus_injust_unidad: 'horas',
    aus_injust_motivo: '',
    observaciones: '',
    tardanzas_tiene: false,
    tardanzas_cantidad: '',
    tardanzas_unidad: 'horas',
    tardanzas_motivo: '',
  }
}

export interface SolicitudFormState {
  personal_id: string
  tipo: RhSolicitudTipo | ''
  fecha_solicitud: string
  observaciones: string
  alta_nombre: string
  alta_dni: string
  alta_cuil: string
  alta_domicilio: string
  alta_direccion_dni: string
  alta_fecha_nacimiento: string
  alta_telefono: string
  alta_email: string
  alta_banco: string
  alta_cbu: string
  alta_puesto_id: string
  alta_fecha_incorporacion: string
  alta_fecha_inicio_cobro: string
  alta_condicion_laboral: '' | '1' | '2'
  alta_fecha_alta_temprana: string
  alta_jornada_dias_semanales: string
  alta_jornada_horas_diarias: string
  alta_propuesta_economica: string
  alta_beneficios: string
  alta_otras_observaciones: string
  alta_doc_dni_url: string
  alta_doc_dni_nombre: string
  alta_doc_ddjj_url: string
  alta_doc_ddjj_nombre: string
  alta_doc_puesto_url: string
  alta_doc_puesto_nombre: string
  alta_doc_foto_url: string
  alta_doc_foto_nombre: string
  alta_periodo_prueba: boolean
  alta_periodo_prueba_dias: string
  alta_carnet: boolean
  alta_carnet_archivo_url: string
  alta_carnet_archivo_nombre: string
  alta_carnet_vencimiento: string
  baja_fecha: string
  baja_motivo_id: string
  baja_motivo_detalle: string
  /** Liquidación igual que novedades de sueldo (un empleado) */
  baja_empleado_liquidacion: EmpleadoNovedadData | null
  baja_carta_url: string
  baja_carta_nombre: string
  vacaciones_desde: string
  vacaciones_hasta: string
  vacaciones_dias: string
  licencia_tipo: string
  licencia_desde: string
  licencia_hasta: string
  licencia_motivo: string
  apercibimiento_fecha: string
  apercibimiento_severidad: 'Leve' | 'Moderada' | 'Grave'
  apercibimiento_motivo: string
  descuento_motivo: string
  descuento_monto: string
  descuento_fecha: string
  horas_extras_cantidad: string
  horas_extras_fecha: string
  horas_extras_valor_hora: string
  horas_extras_descripcion: string
  // Novedades de sueldo
  nov_area_id: string
  nov_mes: string
  nov_anio: string
  nov_empleados: EmpleadoNovedadData[]
  // Suspensiones
  suspension_fecha_desde: string
  suspension_fecha_hasta: string
  suspension_motivo: string
  // Capacitaciones
  capacitacion_area_id: string
  capacitacion_tema: string
  capacitacion_fecha: string
  capacitacion_descripcion: string
  // Pedido de uniforme
  uniforme_talle: string
  uniforme_items: string
  // Adelantos
  adelanto_monto: string
  adelanto_fecha: string
  adelanto_motivo: string
  // Incentivos y premios
  incentivo_scope: 'colaborador' | 'area' | 'puesto'
  incentivo_area_id: string
  incentivo_puesto_id: string
  incentivo_descripcion: string
  incentivo_monto: string
  incentivo_fecha: string
}

const today = new Date().toISOString().split('T')[0]

/** Fecha local YYYY-MM-DD (para fecha de solicitud de alta al momento de guardar). */
export function fechaSolicitudLocalHoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function createInitialSolicitudFormState(): SolicitudFormState {
  const { mes, anio } = getPrevMonthDefaults()
  return {
    personal_id: 'general',
    tipo: '',
    fecha_solicitud: today,
    observaciones: '',
    alta_nombre: '',
    alta_dni: '',
    alta_cuil: '',
    alta_domicilio: '',
    alta_direccion_dni: '',
    alta_fecha_nacimiento: '',
    alta_telefono: '',
    alta_email: '',
    alta_banco: '',
    alta_cbu: '',
    alta_puesto_id: '',
    alta_fecha_incorporacion: today,
    alta_fecha_inicio_cobro: today,
    alta_condicion_laboral: '',
    alta_fecha_alta_temprana: '',
    alta_jornada_dias_semanales: '',
    alta_jornada_horas_diarias: '',
    alta_propuesta_economica: '',
    alta_beneficios: '',
    alta_otras_observaciones: '',
    alta_doc_dni_url: '',
    alta_doc_dni_nombre: '',
    alta_doc_ddjj_url: '',
    alta_doc_ddjj_nombre: '',
    alta_doc_puesto_url: '',
    alta_doc_puesto_nombre: '',
    alta_doc_foto_url: '',
    alta_doc_foto_nombre: '',
    alta_periodo_prueba: false,
    alta_periodo_prueba_dias: '90',
    alta_carnet: false,
    alta_carnet_archivo_url: '',
    alta_carnet_archivo_nombre: '',
    alta_carnet_vencimiento: '',
    baja_fecha: today,
    baja_motivo_id: '',
    baja_motivo_detalle: '',
    baja_empleado_liquidacion: null,
    baja_carta_url: '',
    baja_carta_nombre: '',
    vacaciones_desde: today,
    vacaciones_hasta: today,
    vacaciones_dias: '',
    licencia_tipo: '',
    licencia_desde: today,
    licencia_hasta: today,
    licencia_motivo: '',
    apercibimiento_fecha: today,
    apercibimiento_severidad: 'Leve',
    apercibimiento_motivo: '',
    descuento_motivo: '',
    descuento_monto: '',
    descuento_fecha: today,
    horas_extras_cantidad: '',
    horas_extras_fecha: today,
    horas_extras_valor_hora: '',
    horas_extras_descripcion: '',
    nov_area_id: '',
    nov_mes: mes,
    nov_anio: anio,
    nov_empleados: [],
    suspension_fecha_desde: today,
    suspension_fecha_hasta: today,
    suspension_motivo: '',
    capacitacion_area_id: '',
    capacitacion_tema: '',
    capacitacion_fecha: today,
    capacitacion_descripcion: '',
    uniforme_talle: '',
    uniforme_items: '',
    adelanto_monto: '',
    adelanto_fecha: today,
    adelanto_motivo: '',
    incentivo_scope: 'colaborador',
    incentivo_area_id: '',
    incentivo_puesto_id: '',
    incentivo_descripcion: '',
    incentivo_monto: '',
    incentivo_fecha: today,
  }
}

function parseEmpleadosFromDetalles(raw: unknown[]): EmpleadoNovedadData[] {
  return raw.map((e: unknown) => {
    const row = e as Record<string, unknown>
    const aperc = (row.apercibimiento ?? {}) as Record<string, unknown>
    const susp = (row.suspension ?? {}) as Record<string, unknown>
    const desc = (row.descuento ?? {}) as Record<string, unknown>
    const ausJ = (row.ausencias_justificadas ?? {}) as Record<string, unknown>
    const ausI = (row.ausencias_injustificadas ?? {}) as Record<string, unknown>
    const tard = (row.tardanzas ?? {}) as Record<string, unknown>
    return {
      personal_id: Number(row.personal_id),
      personal_nombre: String(row.personal_nombre ?? ''),
      puesto_id: row.puesto_id != null ? Number(row.puesto_id) : null,
      cambio_puesto: Boolean(row.cambio_puesto),
      nuevo_puesto_id: row.nuevo_puesto_id ? String(row.nuevo_puesto_id) : '',
      fecha_alta_puesto: String(row.fecha_alta_puesto ?? todayStr),
      horas_trabajadas: row.horas_trabajadas != null ? String(row.horas_trabajadas) : '',
      horas_feriados: row.horas_feriados != null ? String(row.horas_feriados) : '',
      horas_extras_autorizadas: Boolean(row.horas_extras_autorizadas),
      horas_extras_cantidad: row.horas_extras_cantidad != null ? String(row.horas_extras_cantidad) : '',
      incentivos: Array.isArray(row.incentivos) ? row.incentivos : [],
      apercibimiento: Boolean(aperc.tiene),
      apercibimiento_motivo: String(aperc.motivo ?? ''),
      apercibimiento_archivo_url: String(aperc.archivo_url ?? ''),
      apercibimiento_archivo_nombre: String(aperc.archivo_nombre ?? ''),
      suspension: Boolean(susp.tiene),
      suspension_motivo: String(susp.motivo ?? ''),
      suspension_archivo_url: String(susp.archivo_url ?? ''),
      suspension_archivo_nombre: String(susp.archivo_nombre ?? ''),
      descuento: Boolean(desc.tiene),
      descuento_monto: desc.monto != null ? String(desc.monto) : '',
      descuento_motivo: String(desc.motivo ?? ''),
      aus_just_tiene: Boolean(ausJ.tiene),
      aus_just_cantidad: ausJ.cantidad != null ? String(ausJ.cantidad) : '',
      aus_just_unidad: (ausJ.unidad ?? 'horas') as 'horas' | 'minutos',
      aus_just_motivo: String(ausJ.motivo ?? ''),
      aus_injust_cantidad: ausI.cantidad != null ? String(ausI.cantidad) : '',
      aus_injust_unidad: (ausI.unidad ?? 'horas') as 'horas' | 'minutos',
      aus_injust_motivo: String(ausI.motivo ?? ''),
      observaciones: String(row.observaciones ?? ''),
      tardanzas_tiene: Boolean(tard.tiene),
      tardanzas_cantidad: tard.cantidad != null ? String(tard.cantidad) : '',
      tardanzas_unidad: (tard.unidad ?? 'horas') as 'horas' | 'minutos',
      tardanzas_motivo: String(tard.motivo ?? ''),
    }
  })
}

function readAdjuntoIndividual(detalles: Record<string, unknown>, slotKey: string): { url: string; nombre: string } {
  const slot = detalles[slotKey] as Record<string, unknown> | null | undefined
  if (!slot || typeof slot !== 'object' || typeof slot.url !== 'string' || !slot.url.trim()) {
    return { url: '', nombre: '' }
  }
  const nombre_original =
    typeof slot.nombre_original === 'string' && slot.nombre_original.trim() ? slot.nombre_original.trim() : ''
  return { url: String(slot.url).trim(), nombre: nombre_original }
}

function readAltaAdjuntoSlot(detalles: Record<string, unknown>, key: string): { url: string; nombre: string } {
  const adjuntos = detalles.adjuntos as Record<string, { url?: string; nombre_original?: string } | null> | undefined
  const slot = adjuntos?.[key]
  if (!slot?.url) return { url: '', nombre: '' }
  return {
    url: String(slot.url),
    nombre: slot.nombre_original ? String(slot.nombre_original) : '',
  }
}

export function createSolicitudFormStateFromSolicitud(solicitud: RhSolicitud): SolicitudFormState {
  const form = createInitialSolicitudFormState()
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>

  const base: SolicitudFormState = {
    ...form,
    personal_id: solicitud.personal_id ? String(solicitud.personal_id) : 'general',
    tipo: solicitud.tipo,
    fecha_solicitud: solicitud.fecha_solicitud.split('T')[0],
    observaciones: solicitud.observaciones ?? '',
    alta_nombre: String(detalles.nombre ?? ''),
    alta_dni: String(detalles.dni ?? ''),
    alta_cuil: typeof detalles.cuil === 'number' ? String(detalles.cuil) : String(detalles.cuil ?? ''),
    alta_domicilio: String(detalles.domicilio ?? ''),
    alta_direccion_dni: String(detalles.domicilio_dni ?? ''),
    alta_fecha_nacimiento: String(detalles.fecha_nacimiento ?? ''),
    alta_telefono: String(detalles.telefono ?? ''),
    alta_email: String(detalles.email ?? ''),
    alta_banco: String(detalles.banco ?? ''),
    alta_cbu: String(detalles.cbu ?? ''),
    alta_puesto_id: detalles.puesto_id ? String(detalles.puesto_id) : '',
    alta_fecha_incorporacion: String(detalles.fecha_incorporacion ?? today),
    alta_fecha_inicio_cobro: String(detalles.fecha_inicio_cobro_oficina ?? today),
    alta_condicion_laboral:
      detalles.condicion_laboral === 1 || detalles.condicion_laboral === 2
        ? (String(detalles.condicion_laboral) as '1' | '2')
        : '',
    alta_fecha_alta_temprana: String(detalles.fecha_alta_temprana ?? ''),
    alta_jornada_dias_semanales: detalles.jornada_semanal_dias != null ? String(detalles.jornada_semanal_dias) : '',
    alta_jornada_horas_diarias: String(detalles.jornada_diaria_horas_texto ?? ''),
    alta_propuesta_economica: detalles.propuesta_economica != null ? String(detalles.propuesta_economica) : '',
    alta_beneficios: String(detalles.beneficios ?? ''),
    alta_otras_observaciones: String(detalles.otras_observaciones_alta ?? ''),
    alta_doc_dni_url: '',
    alta_doc_dni_nombre: '',
    alta_doc_ddjj_url: '',
    alta_doc_ddjj_nombre: '',
    alta_doc_puesto_url: '',
    alta_doc_puesto_nombre: '',
    alta_doc_foto_url: '',
    alta_doc_foto_nombre: '',
    alta_periodo_prueba: detalles.periodo_prueba === true,
    alta_periodo_prueba_dias: detalles.periodo_prueba_dias ? String(detalles.periodo_prueba_dias) : '90',
    alta_carnet: detalles.carnet_manipulacion_alimentos === true,
    alta_carnet_archivo_url: '',
    alta_carnet_archivo_nombre: '',
    alta_carnet_vencimiento: String(detalles.carnet_fecha_vencimiento ?? ''),
    baja_fecha: String(detalles.fecha_baja ?? today),
    baja_motivo_id: detalles.motivo_baja_id != null ? String(detalles.motivo_baja_id) : '',
    baja_motivo_detalle: String(detalles.motivo_baja_detalle ?? ''),
    vacaciones_desde: String(detalles.fecha_desde ?? today),
    vacaciones_hasta: String(detalles.fecha_hasta ?? today),
    vacaciones_dias: detalles.cantidad_dias ? String(detalles.cantidad_dias) : '',
    licencia_tipo: String(detalles.tipo_licencia ?? ''),
    licencia_desde: String(detalles.fecha_desde ?? today),
    licencia_hasta: String(detalles.fecha_hasta ?? today),
    licencia_motivo: String(detalles.motivo ?? ''),
    apercibimiento_fecha: String(detalles.fecha ?? today),
    apercibimiento_severidad: (detalles.severidad as 'Leve' | 'Moderada' | 'Grave') ?? 'Leve',
    apercibimiento_motivo: String(detalles.motivo ?? ''),
    descuento_motivo: String(detalles.motivo ?? ''),
    descuento_monto: detalles.monto ? String(detalles.monto) : '',
    descuento_fecha: String(detalles.fecha ?? today),
    horas_extras_cantidad: detalles.cantidad_horas ? String(detalles.cantidad_horas) : '',
    horas_extras_fecha: String(detalles.fecha ?? today),
    horas_extras_valor_hora: detalles.valor_hora ? String(detalles.valor_hora) : '',
    horas_extras_descripcion: String(detalles.descripcion ?? ''),
  }

  if (solicitud.tipo === 'Altas') {
    const archivos = solicitud.archivos ?? []
    const findArchivo = (tipoDoc: string) => archivos.find(a => a.tipo_doc === tipoDoc)
    // Fallback a adjuntos del JSON para registros anteriores a RH-60
    const fallbackAdj = (key: string) => readAltaAdjuntoSlot(detalles, key)

    const dniA = findArchivo('dni_frente_dorso')
    const ddjjA = findArchivo('ddjj_domicilio')
    const puestoA = findArchivo('descripcion_puesto_firmada')
    const fotoA = findArchivo('foto_colaborador')
    const carnetA = findArchivo('carnet_manipulacion_alimentos')

    const dniS = dniA ? { url: dniA.url, nombre: dniA.nombre_original ?? '' } : fallbackAdj('dni_frente_dorso')
    const ddjjS = ddjjA ? { url: ddjjA.url, nombre: ddjjA.nombre_original ?? '' } : fallbackAdj('ddjj_domicilio')
    const puestoS = puestoA
      ? { url: puestoA.url, nombre: puestoA.nombre_original ?? '' }
      : fallbackAdj('descripcion_puesto_firmada')
    const fotoS = fotoA ? { url: fotoA.url, nombre: fotoA.nombre_original ?? '' } : fallbackAdj('foto_colaborador')

    // carnet_adjunto legacy desde JSON
    const carnetSlotLegacy = detalles.carnet_adjunto as { url?: string; nombre_original?: string } | null | undefined
    const carnetUrl = carnetA?.url ?? (carnetSlotLegacy?.url ? String(carnetSlotLegacy.url) : '')
    const carnetNombre =
      carnetA?.nombre_original ?? (carnetSlotLegacy?.nombre_original ? String(carnetSlotLegacy.nombre_original) : '')

    return {
      ...base,
      alta_doc_dni_url: dniS.url,
      alta_doc_dni_nombre: dniS.nombre,
      alta_doc_ddjj_url: ddjjS.url,
      alta_doc_ddjj_nombre: ddjjS.nombre,
      alta_doc_puesto_url: puestoS.url,
      alta_doc_puesto_nombre: puestoS.nombre,
      alta_doc_foto_url: fotoS.url,
      alta_doc_foto_nombre: fotoS.nombre,
      alta_carnet_archivo_url: carnetUrl,
      alta_carnet_archivo_nombre: carnetNombre,
    }
  }

  if (solicitud.tipo === 'Bajas') {
    // Carta documento desde tabla archivos; fallback a JSON para registros anteriores
    const cartaA = solicitud.archivos?.find(a => a.tipo_doc === 'carta_documento')
    const cartaFallback = readAdjuntoIndividual(detalles, 'carta_documento_adjunto')
    const cartaUrl = cartaA?.url ?? cartaFallback.url
    const cartaNombre = cartaA?.nombre_original ?? cartaFallback.nombre

    // Empleado de liquidación desde tabla empleados; fallback a JSON para registros anteriores
    let liq: EmpleadoNovedadData | null = null
    const empDesdeTabla = solicitud.empleados?.[0]
    if (empDesdeTabla) {
      liq = parseEmpleadosFromDetalles([empDesdeTabla])[0] ?? null
    } else {
      const liqRaw = detalles.liquidacion_empleado
      if (liqRaw && typeof liqRaw === 'object' && !Array.isArray(liqRaw)) {
        liq = parseEmpleadosFromDetalles([liqRaw as unknown])[0] ?? null
      }
    }

    const pid = solicitud.personal_id
    const pname = solicitud.personal_nombre ?? ''
    if (!liq && pid) {
      const vacio = createEmpleadoVacio(pid, pname)
      const legacyDias =
        typeof detalles.dias_horas_trabajadas_mes === 'string' ? detalles.dias_horas_trabajadas_mes.trim() : ''
      liq = legacyDias ? { ...vacio, observaciones: `(Registro anterior) ${legacyDias}` } : vacio
    }
    const detalleDesdeDetalle = base.baja_motivo_detalle
    const textoMotivoViejo =
      typeof detalles.motivo_baja === 'string' && detalles.motivo_baja_id == null ? detalles.motivo_baja.trim() : ''
    return {
      ...base,
      baja_motivo_detalle: detalleDesdeDetalle || textoMotivoViejo,
      baja_empleado_liquidacion: liq,
      baja_carta_url: cartaUrl,
      baja_carta_nombre: cartaNombre,
    }
  }
  if (solicitud.tipo === 'Novedades de sueldo') {
    const d = detalles as Record<string, unknown>
    // Empleados desde tabla; fallback a JSON para registros anteriores
    const empSource =
      solicitud.empleados && solicitud.empleados.length > 0
        ? solicitud.empleados
        : Array.isArray(d.empleados)
          ? d.empleados
          : []
    return {
      ...base,
      nov_area_id: d.area_id ? String(d.area_id) : '',
      nov_mes: d.mes ? String(d.mes) : form.nov_mes,
      nov_anio: d.anio ? String(d.anio) : form.nov_anio,
      nov_empleados: parseEmpleadosFromDetalles(empSource as unknown[]),
    }
  }

  if (solicitud.tipo === 'Suspensiones') {
    return {
      ...base,
      suspension_fecha_desde: String(detalles.fecha_desde ?? today),
      suspension_fecha_hasta: String(detalles.fecha_hasta ?? today),
      suspension_motivo: String(detalles.motivo ?? ''),
    }
  }

  if (solicitud.tipo === 'Capacitaciones') {
    return {
      ...base,
      capacitacion_area_id: detalles.area_id ? String(detalles.area_id) : '',
      capacitacion_tema: String(detalles.tema ?? ''),
      capacitacion_fecha: String(detalles.fecha ?? today),
      capacitacion_descripcion: String(detalles.descripcion ?? ''),
    }
  }

  if (solicitud.tipo === 'Pedido de uniforme') {
    return {
      ...base,
      uniforme_talle: String(detalles.talle ?? ''),
      uniforme_items: String(detalles.items ?? ''),
    }
  }

  if (solicitud.tipo === 'Adelantos') {
    return {
      ...base,
      adelanto_monto: detalles.monto != null ? String(detalles.monto) : '',
      adelanto_fecha: String(detalles.fecha ?? today),
      adelanto_motivo: String(detalles.motivo ?? ''),
    }
  }

  if (solicitud.tipo === 'Incentivos y premios') {
    const scope = (detalles.scope as 'colaborador' | 'area' | 'puesto') ?? 'colaborador'
    return {
      ...base,
      incentivo_scope: scope,
      incentivo_area_id: detalles.area_id != null ? String(detalles.area_id) : '',
      incentivo_puesto_id: detalles.puesto_id != null ? String(detalles.puesto_id) : '',
      incentivo_descripcion: String(detalles.descripcion ?? ''),
      incentivo_fecha: String(detalles.fecha ?? today),
      incentivo_monto: detalles.monto != null ? String(detalles.monto) : '',
    }
  }

  return base
}

export function buildSolicitudDetalles(form: SolicitudFormState) {
  switch (form.tipo) {
    case 'Altas':
      return {
        nombre: form.alta_nombre.trim(),
        dni: form.alta_dni.trim(),
        cuil: form.alta_cuil.replace(/\D/g, ''),
        domicilio: form.alta_domicilio.trim(),
        domicilio_dni: form.alta_direccion_dni.trim(),
        fecha_nacimiento: form.alta_fecha_nacimiento,
        telefono: form.alta_telefono.trim(),
        email: form.alta_email.trim() || null,
        banco: form.alta_banco.trim() || null,
        cbu: form.alta_cbu.trim() || null,
        puesto_id: Number(form.alta_puesto_id),
        fecha_incorporacion: form.alta_fecha_incorporacion,
        fecha_inicio_cobro_oficina: form.alta_fecha_inicio_cobro,
        jornada_semanal_dias: Number(form.alta_jornada_dias_semanales),
        jornada_diaria_horas_texto: form.alta_jornada_horas_diarias.trim(),
        propuesta_economica: Number(form.alta_propuesta_economica),
        beneficios: form.alta_beneficios.trim(),
        otras_observaciones_alta: form.alta_otras_observaciones.trim() || null,
        condicion_laboral: Number(form.alta_condicion_laboral) as 1 | 2,
        fecha_alta_temprana: form.alta_condicion_laboral === '1' ? form.alta_fecha_alta_temprana : null,
        periodo_prueba: form.alta_periodo_prueba,
        periodo_prueba_dias: form.alta_periodo_prueba ? Number(form.alta_periodo_prueba_dias) : null,
        carnet_manipulacion_alimentos: form.alta_carnet,
        carnet_adjunto: form.alta_carnet
          ? {
              url: form.alta_carnet_archivo_url.trim(),
              nombre_original: form.alta_carnet_archivo_nombre.trim() || null,
            }
          : null,
        carnet_fecha_vencimiento: form.alta_carnet ? form.alta_carnet_vencimiento : null,
        adjuntos: {
          dni_frente_dorso: {
            url: form.alta_doc_dni_url.trim(),
            nombre_original: form.alta_doc_dni_nombre.trim() || null,
          },
          ddjj_domicilio: {
            url: form.alta_doc_ddjj_url.trim(),
            nombre_original: form.alta_doc_ddjj_nombre.trim() || null,
          },
          descripcion_puesto_firmada: {
            url: form.alta_doc_puesto_url.trim(),
            nombre_original: form.alta_doc_puesto_nombre.trim() || null,
          },
          foto_colaborador: {
            url: form.alta_doc_foto_url.trim(),
            nombre_original: form.alta_doc_foto_nombre.trim() || null,
          },
        },
      }
    case 'Bajas':
      return {
        motivo_baja_id: Number(form.baja_motivo_id),
        motivo_baja_detalle: form.baja_motivo_detalle.trim() || null,
        fecha_baja: form.baja_fecha,
        liquidacion_empleado: mapEmpleadoNovedadToApiPayload(form.baja_empleado_liquidacion!),
        carta_documento_adjunto: form.baja_carta_url.trim()
          ? { url: form.baja_carta_url.trim(), nombre_original: form.baja_carta_nombre.trim() || null }
          : null,
      }
    case 'Vacaciones':
      return {
        fecha_desde: form.vacaciones_desde,
        fecha_hasta: form.vacaciones_hasta,
        cantidad_dias: Number(form.vacaciones_dias),
      }
    case 'Licencias':
      return {
        tipo_licencia: form.licencia_tipo.trim(),
        fecha_desde: form.licencia_desde,
        fecha_hasta: form.licencia_hasta,
        motivo: form.licencia_motivo.trim(),
      }
    case 'Novedades de sueldo':
      return {
        area_id: Number(form.nov_area_id),
        mes: Number(form.nov_mes),
        anio: Number(form.nov_anio),
        empleados: form.nov_empleados.map(emp => mapEmpleadoNovedadToApiPayload(emp)),
      }
    case 'Apercibimientos':
      return {
        fecha: form.apercibimiento_fecha,
        severidad: form.apercibimiento_severidad,
        motivo: form.apercibimiento_motivo.trim(),
      }
    case 'Descuentos':
      return {
        motivo: form.descuento_motivo.trim(),
        monto: Number(form.descuento_monto),
        fecha: form.descuento_fecha,
      }
    case 'Horas extras':
      return {
        cantidad_horas: Number(form.horas_extras_cantidad),
        fecha: form.horas_extras_fecha,
        ...(form.horas_extras_valor_hora && { valor_hora: Number(form.horas_extras_valor_hora) }),
        ...(form.horas_extras_descripcion.trim() && { descripcion: form.horas_extras_descripcion.trim() }),
      }
    case 'Suspensiones':
      return {
        fecha_desde: form.suspension_fecha_desde,
        fecha_hasta: form.suspension_fecha_hasta,
        motivo: form.suspension_motivo.trim(),
      }
    case 'Capacitaciones':
      return {
        area_id: Number(form.capacitacion_area_id),
        tema: form.capacitacion_tema.trim(),
        fecha: form.capacitacion_fecha,
        ...(form.capacitacion_descripcion.trim() && { descripcion: form.capacitacion_descripcion.trim() }),
      }
    case 'Pedido de uniforme':
      return {
        talle: form.uniforme_talle.trim(),
        items: form.uniforme_items.trim(),
      }
    case 'Adelantos':
      return {
        monto: Number(form.adelanto_monto),
        fecha: form.adelanto_fecha,
        motivo: form.adelanto_motivo.trim(),
      }
    case 'Incentivos y premios':
      return {
        scope: form.incentivo_scope,
        ...(form.incentivo_scope === 'area' && form.incentivo_area_id
          ? { area_id: Number(form.incentivo_area_id) }
          : {}),
        ...(form.incentivo_scope === 'puesto' && form.incentivo_puesto_id
          ? { puesto_id: Number(form.incentivo_puesto_id) }
          : {}),
        descripcion: form.incentivo_descripcion.trim(),
        fecha: form.incentivo_fecha,
        ...(form.incentivo_monto && { monto: Number(form.incentivo_monto) }),
      }
    default:
      return null
  }
}

export function validateSolicitudForm(form: SolicitudFormState, options?: { isEditing?: boolean }): string | null {
  const isEditing = options?.isEditing === true
  if (!form.tipo) return 'Seleccione un tipo de solicitud'
  const requiereFechaManual = form.tipo !== 'Novedades de sueldo' && form.tipo !== 'Altas' && form.tipo !== 'Bajas'
  if (requiereFechaManual && !form.fecha_solicitud) return 'La fecha es obligatoria'
  if (form.tipo === 'Altas' && isEditing && !form.fecha_solicitud) return 'La fecha de la solicitud no está disponible'

  switch (form.tipo) {
    case 'Altas':
      if (!form.alta_nombre.trim()) return 'Ingrese nombres y apellidos del colaborador'
      if (!form.alta_dni.trim()) return 'Ingrese el DNI del colaborador'
      {
        const cuilDigits = form.alta_cuil.replace(/\D/g, '')
        if (cuilDigits.length < 10 || cuilDigits.length > 13) return 'Ingrese un CUIL o CUIT válido'
      }
      if (!form.alta_domicilio.trim()) return 'Ingrese la dirección real'
      if (!form.alta_direccion_dni.trim()) return 'Ingrese la dirección según consta en el DNI'
      if (!form.alta_fecha_nacimiento) return 'Ingrese la fecha de nacimiento'
      if (!form.alta_telefono.trim()) return 'Ingrese el teléfono'
      if (!form.alta_email.trim()) return 'Ingrese el correo electrónico'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.alta_email.trim())) return 'Ingrese un correo electrónico válido'
      if (form.alta_cbu.trim()) {
        const cbuDigits = form.alta_cbu.replace(/\D/g, '')
        if (cbuDigits.length !== CBU_DIGITOS) return `El CBU o CVU debe tener ${CBU_DIGITOS} dígitos`
        if (!form.alta_banco.trim()) return 'Indique la entidad bancaria si informa CBU o CVU'
      }
      if (!form.alta_puesto_id) return 'Seleccione un puesto de trabajo'
      if (form.alta_condicion_laboral !== '1' && form.alta_condicion_laboral !== '2') {
        return 'Seleccione la condición laboral (1 o 2)'
      }
      if (form.alta_condicion_laboral === '1') {
        if (!form.alta_fecha_alta_temprana) return 'Ingrese la fecha de alta temprana'
        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.alta_fecha_alta_temprana)) return 'La fecha de alta temprana no es válida'
      }
      if (!form.alta_fecha_incorporacion) return 'Ingrese la fecha de inicio de la relación laboral'
      if (!form.alta_fecha_inicio_cobro) return 'Ingrese la fecha de inicio de cobro en oficina'
      {
        const dias = Number(form.alta_jornada_dias_semanales)
        if (!Number.isFinite(dias) || dias < 1 || dias > 7) return 'La jornada semanal debe ser entre 1 y 7 días'
      }
      if (!form.alta_jornada_horas_diarias.trim()) return 'Describa la jornada diaria (ej.: 7 a 8 hs)'
      {
        const monto = Number(form.alta_propuesta_economica)
        if (!Number.isFinite(monto) || monto <= 0) return 'Ingrese la propuesta económica'
      }
      if (!form.alta_beneficios.trim()) return 'Indique los beneficios otorgados'
      if (form.alta_periodo_prueba && (!form.alta_periodo_prueba_dias || Number(form.alta_periodo_prueba_dias) <= 0)) {
        return 'Ingrese la duración del período de prueba'
      }
      if (form.alta_carnet) {
        if (!form.alta_carnet_vencimiento) return 'Indique la fecha de vencimiento del carnet de manipulación'
        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.alta_carnet_vencimiento))
          return 'La fecha de vencimiento del carnet no es válida'
        if (!isEditing && !form.alta_carnet_archivo_url.trim()) {
          return 'Adjunte el archivo del carnet de manipulación de alimentos'
        }
      }
      if (!isEditing) {
        if (!form.alta_doc_dni_url.trim()) return 'Adjunte el DNI (ambos lados)'
        if (!form.alta_doc_ddjj_url.trim()) return 'Adjunte la DDJJ de domicilio'
        if (!form.alta_doc_puesto_url.trim()) return 'Adjunte la descripción de puesto firmada'
        if (!form.alta_doc_foto_url.trim()) return 'Adjunte la foto del colaborador'
      }
      return null
    case 'Bajas':
      if (form.personal_id === 'general') return 'Seleccione el colaborador a desvincular'
      if (!Number.isFinite(Number(form.baja_motivo_id)) || Number(form.baja_motivo_id) <= 0) {
        return 'Seleccione un motivo de baja del catálogo'
      }
      if (!form.baja_fecha) return 'Ingrese la fecha de baja'
      if (!form.baja_empleado_liquidacion) return 'Complete los datos laborales (liquidación)'
      if (Number(form.personal_id) !== form.baja_empleado_liquidacion.personal_id) {
        return 'Los datos laborales deben corresponder al colaborador seleccionado'
      }
      {
        const errEmp = validateEmpleadoNovedadForSolicitud(form.baja_empleado_liquidacion)
        if (errEmp) return errEmp
      }
      if (!form.baja_carta_url.trim()) return 'Adjunte la carta documento en PDF'
      return null
    case 'Vacaciones':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para las vacaciones'
      if (!form.vacaciones_desde || !form.vacaciones_hasta || !form.vacaciones_dias)
        return 'Complete las fechas y cantidad de días de vacaciones'
      return null
    case 'Licencias':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para la licencia'
      if (!form.licencia_tipo.trim() || !form.licencia_desde || !form.licencia_hasta || !form.licencia_motivo.trim()) {
        return 'Complete tipo, fechas y motivo de la licencia'
      }
      return null
    case 'Novedades de sueldo':
      if (!form.nov_area_id) return 'Seleccione el área'
      if (!form.nov_mes || !form.nov_anio) return 'Seleccione el período (mes y año)'
      if (form.nov_empleados.length === 0) return 'Agregue al menos un empleado'
      for (const emp of form.nov_empleados) {
        const errEmp = validateEmpleadoNovedadForSolicitud(emp)
        if (errEmp) return errEmp
      }
      return null
    case 'Apercibimientos':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para el apercibimiento'
      if (!form.apercibimiento_fecha || !form.apercibimiento_motivo.trim()) {
        return 'Complete fecha y motivo del apercibimiento'
      }
      return null
    case 'Descuentos':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para el descuento'
      if (!form.descuento_motivo.trim() || !form.descuento_monto || !form.descuento_fecha) {
        return 'Complete motivo, monto y fecha del descuento'
      }
      return null
    case 'Horas extras':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para las horas extras'
      if (!form.horas_extras_cantidad || !form.horas_extras_fecha) {
        return 'Complete la cantidad de horas y la fecha'
      }
      return null
    case 'Suspensiones':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para la suspensión'
      if (!form.suspension_fecha_desde || !form.suspension_fecha_hasta) return 'Complete las fechas de la suspensión'
      if (!form.suspension_motivo.trim()) return 'Ingrese el motivo de la suspensión'
      return null
    case 'Capacitaciones':
      if (!form.capacitacion_area_id) return 'Seleccione el área para la capacitación'
      if (!form.capacitacion_tema.trim()) return 'Ingrese el tema de la capacitación'
      if (!form.capacitacion_fecha) return 'Ingrese la fecha de la capacitación'
      return null
    case 'Pedido de uniforme':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para el pedido de uniforme'
      if (!form.uniforme_talle.trim()) return 'Ingrese el talle del colaborador'
      if (!form.uniforme_items.trim()) return 'Ingrese los items solicitados'
      return null
    case 'Adelantos':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para el adelanto'
      if (!form.adelanto_monto || Number(form.adelanto_monto) <= 0) return 'Ingrese un monto válido para el adelanto'
      if (!form.adelanto_fecha) return 'Ingrese la fecha del adelanto'
      if (!form.adelanto_motivo.trim()) return 'Ingrese el motivo del adelanto'
      return null
    case 'Incentivos y premios':
      if (form.incentivo_scope === 'colaborador' && form.personal_id === 'general')
        return 'Seleccione el colaborador para el incentivo o premio'
      if (form.incentivo_scope === 'area' && !form.incentivo_area_id)
        return 'Seleccione el área para el incentivo o premio'
      if (form.incentivo_scope === 'puesto' && !form.incentivo_puesto_id)
        return 'Seleccione el puesto para el incentivo o premio'
      if (!form.incentivo_descripcion.trim()) return 'Ingrese la descripción del incentivo o premio'
      if (!form.incentivo_fecha) return 'Ingrese la fecha del incentivo o premio'
      return null
    default:
      return null
  }
}
