import type { EmpleadoNovedadData } from '@/lib/types'

const todayStr = new Date().toISOString().split('T')[0]
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
