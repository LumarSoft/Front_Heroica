import type { SolicitudFormState } from '@/lib/types'
import { CBU_DIGITOS } from '@/lib/schemas'
import { isValidCuit, isValidDni } from '@/lib/validators'
import { validateEmpleadoNovedadForSolicitud } from './solicitudEmpleadosUtils'
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
      if (!isValidDni(form.alta_dni)) return 'El DNI debe tener exactamente 8 dígitos'
      if (!form.alta_cuil.trim()) return 'Ingrese el CUIL/CUIT del colaborador'
      if (!isValidCuit(form.alta_cuil)) return 'El CUIL/CUIT debe tener exactamente 11 dígitos'
      if (!form.alta_domicilio.trim()) return 'Ingrese la dirección real'
      if (!form.alta_direccion_dni.trim()) return 'Ingrese la dirección según consta en el DNI'
      if (!form.alta_domicilio_real_provincia_codigo) return 'Seleccione la provincia de la dirección real'
      if (!form.alta_domicilio_real_localidad.trim()) return 'Seleccione o ingrese la localidad de la dirección real'
      if (!/^\d{4}$/.test(form.alta_domicilio_real_codigo_postal)) {
        return 'El código postal de la dirección real debe tener exactamente 4 dígitos'
      }
      if (!form.alta_domicilio_dni_provincia_codigo) return 'Seleccione la provincia del domicilio según DNI'
      if (!form.alta_domicilio_dni_localidad.trim()) return 'Seleccione o ingrese la localidad del domicilio según DNI'
      if (!/^\d{4}$/.test(form.alta_domicilio_dni_codigo_postal)) {
        return 'El código postal del domicilio según DNI debe tener exactamente 4 dígitos'
      }
      if (!form.alta_fecha_nacimiento) return 'Ingrese la fecha de nacimiento'
      {
        const añoNac = new Date(form.alta_fecha_nacimiento).getFullYear()
        const hoy = new Date().toISOString().split('T')[0]
        if (añoNac < 1900 || form.alta_fecha_nacimiento > hoy) return 'La fecha de nacimiento no es válida'
      }
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
      if (form.alta_condicion_laboral === '1' && form.alta_fecha_alta_temprana) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.alta_fecha_alta_temprana)) return 'La fecha de alta temprana no es válida'
      }
      if (!form.alta_fecha_incorporacion) return 'Ingrese la fecha de inicio de la relación laboral'
      {
        const añoInc = new Date(form.alta_fecha_incorporacion).getFullYear()
        const hoy = new Date().toISOString().split('T')[0]
        if (añoInc < 1900 || form.alta_fecha_incorporacion > hoy)
          return 'La fecha de inicio de la relación laboral no es válida'
      }
      if (!form.alta_fecha_inicio_cobro) return 'Ingrese la fecha de inicio de cobro en oficina'
      {
        const añoCobro = new Date(form.alta_fecha_inicio_cobro).getFullYear()
        const hoy = new Date().toISOString().split('T')[0]
        if (añoCobro < 1900 || form.alta_fecha_inicio_cobro > hoy)
          return 'La fecha de inicio de cobro en oficina no es válida'
      }
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
      // Documentación adjunta opcional: se permite la carga inicial sin adjuntos y completarla luego editando.
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
    case 'Cambio de puesto/sucursal':
      if (form.personal_id === 'general') return 'Seleccione el colaborador para el cambio'
      if (!form.cambio_nuevo_puesto_id && !form.cambio_nueva_sucursal_id) {
        return 'Seleccione el nuevo puesto o la nueva sucursal'
      }
      if (!form.cambio_fecha_efectiva) return 'Ingrese la fecha efectiva del cambio'
      return null
    default:
      return null
  }
}
