import type { RhSolicitudTipo } from './types'

export interface SolicitudArchivoForm {
  url: string
  nombre: string
}

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
  alta_domicilio_real_provincia_codigo: string
  alta_domicilio_real_localidad: string
  alta_domicilio_real_codigo_postal: string
  alta_domicilio_dni_provincia_codigo: string
  alta_domicilio_dni_localidad: string
  alta_domicilio_dni_codigo_postal: string
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
  alta_doc_dni_archivos: SolicitudArchivoForm[]
  alta_doc_ddjj_archivos: SolicitudArchivoForm[]
  alta_doc_puesto_archivos: SolicitudArchivoForm[]
  alta_doc_foto_url: string
  alta_doc_foto_nombre: string
  alta_doc_normas_archivos: SolicitudArchivoForm[]
  alta_doc_uniforme_archivos: SolicitudArchivoForm[]
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
  licencia_constancia_url: string
  licencia_constancia_nombre: string
  apercibimiento_fecha: string
  apercibimiento_severidad: 'Leve' | 'Moderada' | 'Grave'
  apercibimiento_motivo: string
  apercibimiento_archivo_url: string
  apercibimiento_archivo_nombre: string
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
  suspension_archivo_url: string
  suspension_archivo_nombre: string
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
  incentivo_archivo_url: string
  incentivo_archivo_nombre: string
  // Cambio de puesto/sucursal
  cambio_nuevo_puesto_id: string
  cambio_nueva_sucursal_id: string
  cambio_fecha_efectiva: string
  cambio_motivo: string
}
