import type { RhSolicitud, RhSolicitudTipo } from '@/lib/types'

function getPrevMonthDefaults(): { mes: string; anio: string } {
  const d = new Date()
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return { mes: String(prev.getMonth() + 1), anio: String(prev.getFullYear()) }
}

const todayStr = new Date().toISOString().split('T')[0]

export interface EmpleadoNovedadData {
  personal_id: number
  personal_nombre: string
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
  descuento_motivo: string
  aus_just_tiene: boolean
  aus_just_cantidad: string
  aus_just_unidad: 'horas' | 'minutos'
  aus_just_motivo: string
  aus_injust_motivo: string
  observaciones: string
  tardanzas_tiene: boolean
  tardanzas_cantidad: string
  tardanzas_unidad: 'horas' | 'minutos'
  tardanzas_motivo: string
}

export function createEmpleadoVacio(personalId: number, personalNombre: string): EmpleadoNovedadData {
  return {
    personal_id: personalId,
    personal_nombre: personalNombre,
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
    descuento_motivo: '',
    aus_just_tiene: false,
    aus_just_cantidad: '',
    aus_just_unidad: 'horas',
    aus_just_motivo: '',
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
  alta_email: string
  alta_puesto_id: string
  alta_fecha_incorporacion: string
  alta_periodo_prueba: boolean
  alta_periodo_prueba_dias: string
  alta_carnet: boolean
  baja_motivo: string
  baja_fecha: string
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
}

const today = new Date().toISOString().split('T')[0]

export function createInitialSolicitudFormState(): SolicitudFormState {
  const { mes, anio } = getPrevMonthDefaults()
  return {
    personal_id: 'general',
    tipo: '',
    fecha_solicitud: today,
    observaciones: '',
    alta_nombre: '',
    alta_dni: '',
    alta_email: '',
    alta_puesto_id: '',
    alta_fecha_incorporacion: today,
    alta_periodo_prueba: false,
    alta_periodo_prueba_dias: '90',
    alta_carnet: false,
    baja_motivo: '',
    baja_fecha: today,
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
  }
}

function parseEmpleadosFromDetalles(raw: unknown[]): EmpleadoNovedadData[] {
  return raw.map((e: any) => {
    const aperc = e.apercibimiento ?? {}
    const susp = e.suspension ?? {}
    const desc = e.descuento ?? {}
    const ausJ = e.ausencias_justificadas ?? {}
    const ausI = e.ausencias_injustificadas ?? {}
    const tard = e.tardanzas ?? {}
    return {
      personal_id: Number(e.personal_id),
      personal_nombre: String(e.personal_nombre ?? ''),
      cambio_puesto: Boolean(e.cambio_puesto),
      nuevo_puesto_id: e.nuevo_puesto_id ? String(e.nuevo_puesto_id) : '',
      fecha_alta_puesto: String(e.fecha_alta_puesto ?? todayStr),
      horas_trabajadas: e.horas_trabajadas != null ? String(e.horas_trabajadas) : '',
      horas_feriados: e.horas_feriados != null ? String(e.horas_feriados) : '',
      horas_extras_autorizadas: Boolean(e.horas_extras_autorizadas),
      horas_extras_cantidad: e.horas_extras_cantidad != null ? String(e.horas_extras_cantidad) : '',
      incentivos: Array.isArray(e.incentivos) ? e.incentivos : [],
      apercibimiento: Boolean(aperc.tiene),
      apercibimiento_motivo: String(aperc.motivo ?? ''),
      apercibimiento_archivo_url: String(aperc.archivo_url ?? ''),
      apercibimiento_archivo_nombre: String(aperc.archivo_nombre ?? ''),
      suspension: Boolean(susp.tiene),
      suspension_motivo: String(susp.motivo ?? ''),
      suspension_archivo_url: String(susp.archivo_url ?? ''),
      suspension_archivo_nombre: String(susp.archivo_nombre ?? ''),
      descuento: Boolean(desc.tiene),
      descuento_motivo: String(desc.motivo ?? ''),
      aus_just_tiene: Boolean(ausJ.tiene),
      aus_just_cantidad: ausJ.cantidad != null ? String(ausJ.cantidad) : '',
      aus_just_unidad: (ausJ.unidad ?? 'horas') as 'horas' | 'minutos',
      aus_just_motivo: String(ausJ.motivo ?? ''),
      aus_injust_motivo: String(ausI.motivo ?? ''),
      observaciones: String(e.observaciones ?? ''),
      tardanzas_tiene: Boolean(tard.tiene),
      tardanzas_cantidad: tard.cantidad != null ? String(tard.cantidad) : '',
      tardanzas_unidad: (tard.unidad ?? 'horas') as 'horas' | 'minutos',
      tardanzas_motivo: String(tard.motivo ?? ''),
    }
  })
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
    alta_email: String(detalles.email ?? ''),
    alta_puesto_id: detalles.puesto_id ? String(detalles.puesto_id) : '',
    alta_fecha_incorporacion: String(detalles.fecha_incorporacion ?? today),
    alta_periodo_prueba: detalles.periodo_prueba === true,
    alta_periodo_prueba_dias: detalles.periodo_prueba_dias ? String(detalles.periodo_prueba_dias) : '90',
    alta_carnet: detalles.carnet_manipulacion_alimentos === true,
    baja_motivo: String(detalles.motivo_baja ?? ''),
    baja_fecha: String(detalles.fecha_baja ?? today),
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

  if (solicitud.tipo === 'Novedades de sueldo') {
    const d = detalles as any
    return {
      ...base,
      nov_area_id: d.area_id ? String(d.area_id) : '',
      nov_mes: d.mes ? String(d.mes) : form.nov_mes,
      nov_anio: d.anio ? String(d.anio) : form.nov_anio,
      nov_empleados: Array.isArray(d.empleados) ? parseEmpleadosFromDetalles(d.empleados) : [],
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
        email: form.alta_email.trim() || null,
        puesto_id: Number(form.alta_puesto_id),
        fecha_incorporacion: form.alta_fecha_incorporacion,
        periodo_prueba: form.alta_periodo_prueba,
        periodo_prueba_dias: form.alta_periodo_prueba ? Number(form.alta_periodo_prueba_dias) : null,
        carnet_manipulacion_alimentos: form.alta_carnet,
      }
    case 'Bajas':
      return {
        motivo_baja: form.baja_motivo.trim(),
        fecha_baja: form.baja_fecha,
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
        empleados: form.nov_empleados.map(emp => ({
          personal_id: emp.personal_id,
          personal_nombre: emp.personal_nombre,
          cambio_puesto: emp.cambio_puesto,
          nuevo_puesto_id: emp.cambio_puesto && emp.nuevo_puesto_id ? Number(emp.nuevo_puesto_id) : null,
          fecha_alta_puesto: emp.cambio_puesto && emp.fecha_alta_puesto ? emp.fecha_alta_puesto : null,
          horas_trabajadas: emp.horas_trabajadas ? Number(emp.horas_trabajadas) : null,
          horas_feriados: emp.horas_feriados ? Number(emp.horas_feriados) : null,
          horas_extras_autorizadas: emp.horas_extras_autorizadas,
          horas_extras_cantidad: emp.horas_extras_autorizadas && emp.horas_extras_cantidad ? Number(emp.horas_extras_cantidad) : null,
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
        })),
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
    default:
      return null
  }
}

export function validateSolicitudForm(form: SolicitudFormState): string | null {
  if (!form.tipo) return 'Seleccione un tipo de solicitud'
  if (!form.fecha_solicitud) return 'La fecha es obligatoria'

  switch (form.tipo) {
    case 'Altas':
      if (!form.alta_nombre.trim()) return 'Ingrese el nombre del colaborador'
      if (!form.alta_dni.trim()) return 'Ingrese el DNI del colaborador'
      if (form.alta_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.alta_email.trim())) return 'Ingrese un email válido'
      if (!form.alta_puesto_id) return 'Seleccione un puesto'
      if (!form.alta_fecha_incorporacion) return 'Ingrese la fecha de incorporación'
      if (form.alta_periodo_prueba && (!form.alta_periodo_prueba_dias || Number(form.alta_periodo_prueba_dias) <= 0)) {
        return 'Ingrese la duración del período de prueba'
      }
      return null
    case 'Bajas':
      if (form.personal_id === 'general') return 'Seleccione el colaborador a desvincular'
      if (!form.baja_motivo.trim()) return 'Ingrese el motivo de la baja'
      if (!form.baja_fecha) return 'Ingrese la fecha de baja'
      return null
    case 'Vacaciones':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para las vacaciones'
      if (!form.vacaciones_desde || !form.vacaciones_hasta || !form.vacaciones_dias) return 'Complete las fechas y cantidad de días de vacaciones'
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
        if (emp.cambio_puesto && !emp.nuevo_puesto_id) return `Seleccione el nuevo puesto de ${emp.personal_nombre}`
        if (emp.apercibimiento && !emp.apercibimiento_motivo.trim()) return `Ingrese el motivo del apercibimiento de ${emp.personal_nombre}`
        if (emp.suspension && !emp.suspension_motivo.trim()) return `Ingrese el motivo de la suspensión de ${emp.personal_nombre}`
        if (emp.descuento && !emp.descuento_motivo.trim()) return `Ingrese el motivo del descuento de ${emp.personal_nombre}`
        if (emp.tardanzas_tiene && !emp.tardanzas_cantidad) return `Ingrese la cantidad de tardanza de ${emp.personal_nombre}`
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
    default:
      return null
  }
}
