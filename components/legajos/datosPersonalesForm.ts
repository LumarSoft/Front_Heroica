import type { Personal } from '@/lib/types'

export interface DatosPersonalesFormState {
  nombre: string
  dni: string
  email: string
  domicilio_real: string
  domicilio_real_provincia_codigo: string
  domicilio_real_localidad: string
  domicilio_real_codigo_postal: string
  domicilio_dni: string
  domicilio_dni_provincia_codigo: string
  domicilio_dni_localidad: string
  domicilio_dni_codigo_postal: string
  puesto_id: number
  fecha_incorporacion: string
  carnet_manipulacion_alimentos: boolean
  carnet_archivo: File | null
  carnet_archivo_nombre: string
  carnet_vencimiento: string
  activo: boolean
  condicion_laboral: '' | '1' | '2'
  fecha_alta_temprana: string
}

export function normalizeFecha(fecha: string): string {
  return fecha.split('T')[0]
}

export function formatFechaDisplay(fecha: string): string {
  const [year, month, day] = normalizeFecha(fecha).split('-')
  return `${day}/${month}/${year}`
}

export function buildInitialForm(personal: Personal): DatosPersonalesFormState {
  return {
    nombre: personal.nombre,
    dni: personal.dni,
    email: personal.email ?? '',
    domicilio_real: personal.domicilio_real ?? '',
    domicilio_real_provincia_codigo: personal.domicilio_real_provincia_codigo ?? '',
    domicilio_real_localidad: personal.domicilio_real_localidad ?? '',
    domicilio_real_codigo_postal: personal.domicilio_real_codigo_postal ?? '',
    domicilio_dni: personal.domicilio_dni ?? '',
    domicilio_dni_provincia_codigo: personal.domicilio_dni_provincia_codigo ?? '',
    domicilio_dni_localidad: personal.domicilio_dni_localidad ?? '',
    domicilio_dni_codigo_postal: personal.domicilio_dni_codigo_postal ?? '',
    puesto_id: personal.puesto_id,
    fecha_incorporacion: normalizeFecha(personal.fecha_incorporacion),
    carnet_manipulacion_alimentos: Boolean(personal.carnet_manipulacion_alimentos),
    carnet_archivo: null,
    carnet_archivo_nombre: personal.carnet_manipulacion_alimentos ? (personal.carnet_archivo_nombre ?? '') : '',
    carnet_vencimiento:
      personal.carnet_manipulacion_alimentos && personal.carnet_vencimiento
        ? normalizeFecha(personal.carnet_vencimiento)
        : '',
    activo: Boolean(personal.activo),
    condicion_laboral: personal.condicion_laboral === 1 ? '1' : personal.condicion_laboral === 2 ? '2' : '',
    fecha_alta_temprana: personal.fecha_alta_temprana ? normalizeFecha(personal.fecha_alta_temprana) : '',
  }
}
