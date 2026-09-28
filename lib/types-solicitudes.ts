export type RhSolicitudTipo =
  | 'Altas'
  | 'Bajas'
  | 'Novedades de sueldo'
  | 'Incentivos y premios'
  | 'Licencias'
  | 'Vacaciones'
  | 'Suspensiones'
  | 'Apercibimientos'
  | 'Capacitaciones'
  | 'Pedido de uniforme'
  | 'Adelantos'
  | 'Descuentos'
  | 'Horas extras'
  | 'Cambio de puesto/sucursal'
export type RhSolicitudEstado = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada'
export type RhSolicitudHistorialEvento =
  | 'Creada'
  | 'Editada'
  | 'Aprobada'
  | 'Rechazada'
  | 'Cancelada'
  | 'Legajo creado'
  | 'Legajo desactivado'
  | 'Liquidacion final generada'
  | 'Error de liquidacion final'

export interface RhSolicitudHistorialItem {
  id: number
  solicitud_id: number
  personal_id: number | null
  usuario_id: number | null
  usuario_nombre: string | null
  evento: RhSolicitudHistorialEvento
  detalle: string | null
  created_at: string
}

export interface RhSolicitudArchivo {
  tipo_doc: string
  url: string
  nombre_original: string | null
}

export interface RhSolicitudAltaAdjuntoSlot {
  url: string
  nombre_original?: string | null
}

export interface RhSolicitudAltaDetalles {
  nombre: string
  dni: string
  cuil?: string
  domicilio?: string
  /** Domicilio según consta en el DNI */
  domicilio_dni?: string
  fecha_nacimiento?: string
  telefono?: string
  email?: string | null
  banco?: string | null
  cbu?: string | null
  puesto_id: number
  puesto_nombre?: string
  fecha_incorporacion: string
  fecha_inicio_cobro_oficina?: string
  jornada_semanal_dias?: number | null
  jornada_diaria_horas_texto?: string | null
  propuesta_economica?: number | null
  beneficios?: string | null
  otras_observaciones_alta?: string | null
  /** 1 o 2 según condición contractual interna */
  condicion_laboral?: 1 | 2
  /** Obligatoria si condicion_laboral === 1 */
  fecha_alta_temprana?: string | null
  periodo_prueba?: boolean
  periodo_prueba_dias?: number | null
  carnet_manipulacion_alimentos?: boolean
  carnet_fecha_vencimiento?: string | null
}

export interface RhSolicitudVacacionesDetalles {
  fecha_desde: string
  fecha_hasta: string
  cantidad_dias: number
}

export interface RhSolicitudLicenciaDetalles {
  constancia_adjunto?: RhSolicitudAltaAdjuntoSlot | null
  tipo_licencia: string
  fecha_desde: string
  fecha_hasta: string
  motivo: string
}

export interface RhEmpleadoNovedad {
  personal_id: number
  personal_nombre: string
  cambio_puesto: boolean
  nuevo_puesto_id: number | null
  fecha_alta_puesto: string | null
  horas_trabajadas: number | null
  horas_feriados: number | null
  horas_extras_autorizadas: boolean
  horas_extras_cantidad: number | null
  incentivos: Array<{ incentivo_id: number; nombre: string; aplica: boolean }>
  apercibimiento: { tiene: boolean; motivo: string | null; archivo_url: string | null; archivo_nombre: string | null }
  suspension: { tiene: boolean; motivo: string | null; archivo_url: string | null; archivo_nombre: string | null }
  descuento: { tiene: boolean; monto: number | null; motivo: string | null }
  ausencias_justificadas: {
    tiene: boolean
    cantidad: number | null
    unidad: 'horas' | 'minutos'
    motivo: string | null
  }
  ausencias_injustificadas: { cantidad: number | null; unidad: 'horas' | 'minutos'; motivo: string | null }
  tardanzas: { tiene: boolean; cantidad: number | null; unidad: 'horas' | 'minutos'; motivo: string | null }
  observaciones: string | null
}

export interface RhMotivoBajaCatalogoItem {
  id: number
  sucursal_id: number
  nombre: string
  orden?: number
}

export interface RhSolicitudBajaDetalles {
  motivo_baja_id?: number | null
  motivo_baja_nombre?: string | null
  motivo_baja_detalle?: string | null
  fecha_baja: string
  /** Histórico (antes de liquidación tipo novedad) */
  motivo_baja?: string
  dias_horas_trabajadas_mes?: string
  feriados_trabajados_mes?: string | null
  horas_extras_mes?: string | null
}

export interface RhSolicitudNovedadSueldoDetalles {
  area_id: number
  mes: number
  anio: number
}

export interface RhSolicitudApercibimientoDetalles {
  fecha: string
  severidad: 'Leve' | 'Moderada' | 'Grave'
  motivo: string
}

export interface RhSolicitudCambioPuestoSucursalDetalles {
  puesto_id_nuevo: number | null
  sucursal_id_nueva: number | null
  fecha_efectiva: string
  motivo: string | null
}

export type RhSolicitudDetalles =
  | Record<string, unknown>
  | RhSolicitudAltaDetalles
  | RhSolicitudBajaDetalles
  | RhSolicitudVacacionesDetalles
  | RhSolicitudLicenciaDetalles
  | RhSolicitudNovedadSueldoDetalles
  | RhSolicitudApercibimientoDetalles
  | RhSolicitudCambioPuestoSucursalDetalles
  | null

export interface RhAdelantoPagoTesoreria {
  movimiento_id: number | null
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'completado' | null
  saldo: 'saldo_real' | 'saldo_necesario' | null
  fecha: string | null
  monto: number | null
  eliminado: boolean
}

export interface RhSolicitud {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  personal_id: number | null
  personal_creado_id: number | null
  personal_nombre: string | null
  legajo: string | null
  dni: string | null
  usuario_id: number
  usuario_nombre: string
  resuelto_por_usuario_id: number | null
  resuelto_por_nombre: string | null
  tipo: RhSolicitudTipo
  estado: RhSolicitudEstado
  fecha_solicitud: string
  fecha_resolucion: string | null
  detalles: RhSolicitudDetalles
  observaciones: string | null
  motivo_resolucion: string | null
  liquidacion_final_estado: 'Pendiente' | 'Generada' | 'No aplica' | 'Error'
  pago_tesoreria?: RhAdelantoPagoTesoreria | null
  archivos?: RhSolicitudArchivo[]
  empleados?: RhEmpleadoNovedad[]
  historial?: RhSolicitudHistorialItem[]
  created_at: string
  updated_at: string
}
