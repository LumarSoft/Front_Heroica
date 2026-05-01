import type { RhSolicitud, RhSolicitudTipo } from '@/lib/types'

export interface SolicitudFormState {
  personal_id: string
  tipo: RhSolicitudTipo | ''
  fecha_solicitud: string
  observaciones: string
  alta_nombre: string
  alta_dni: string
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
  sueldo_actual: string
  sueldo_nuevo: string
  sueldo_vigencia: string
  sueldo_motivo: string
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
}

const today = new Date().toISOString().split('T')[0]

export function createInitialSolicitudFormState(): SolicitudFormState {
  return {
    personal_id: 'general',
    tipo: '',
    fecha_solicitud: today,
    observaciones: '',
    alta_nombre: '',
    alta_dni: '',
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
    sueldo_actual: '',
    sueldo_nuevo: '',
    sueldo_vigencia: today,
    sueldo_motivo: '',
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
  }
}

export function createSolicitudFormStateFromSolicitud(solicitud: RhSolicitud): SolicitudFormState {
  const form = createInitialSolicitudFormState()
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>

  return {
    ...form,
    personal_id: solicitud.personal_id ? String(solicitud.personal_id) : 'general',
    tipo: solicitud.tipo,
    fecha_solicitud: solicitud.fecha_solicitud.split('T')[0],
    observaciones: solicitud.observaciones ?? '',
    alta_nombre: String(detalles.nombre ?? ''),
    alta_dni: String(detalles.dni ?? ''),
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
    sueldo_actual: detalles.sueldo_actual ? String(detalles.sueldo_actual) : '',
    sueldo_nuevo: detalles.sueldo_nuevo ? String(detalles.sueldo_nuevo) : '',
    sueldo_vigencia: String(detalles.fecha_vigencia ?? today),
    sueldo_motivo: String(detalles.motivo ?? ''),
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
}

export function buildSolicitudDetalles(form: SolicitudFormState) {
  switch (form.tipo) {
    case 'Altas':
      return {
        nombre: form.alta_nombre.trim(),
        dni: form.alta_dni.trim(),
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
        sueldo_actual: Number(form.sueldo_actual),
        sueldo_nuevo: Number(form.sueldo_nuevo),
        fecha_vigencia: form.sueldo_vigencia,
        motivo: form.sueldo_motivo.trim(),
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
      if (form.personal_id === 'general') return 'Seleccione el colaborador para la novedad de sueldo'
      if (!form.sueldo_actual || !form.sueldo_nuevo || !form.sueldo_vigencia || !form.sueldo_motivo.trim()) {
        return 'Complete importes, vigencia y motivo de la novedad de sueldo'
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
