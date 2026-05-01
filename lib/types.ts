// =============================================
// Tipos compartidos del módulo Sucursales
// =============================================

export type TransactionEstado = 'pendiente' | 'aprobado' | 'rechazado' | 'completado'

export interface Transaction {
  id: number
  sucursal_id: number
  fecha: string
  concepto: string
  monto: number
  comentarios?: string
  descripcion_id?: number
  proveedor_id?: number
  descripcion_nombre?: string
  proveedor_nombre?: string
  prioridad: 'baja' | 'media' | 'alta'
  tipo: 'ingreso' | 'egreso'
  tipo_movimiento: string
  estado: TransactionEstado
  categoria_id?: number
  subcategoria_id?: number
  categoria_nombre?: string
  subcategoria_nombre?: string
  comprobante?: string
  banco_id?: number
  medio_pago_id?: number
  banco_nombre?: string
  medio_pago_nombre?: string
  es_deuda?: boolean
  fecha_original_vencimiento?: string
  numero_cheque?: string
  banco?: string
  cuenta?: string
  cbu?: string
  tipo_operacion?: string
  moneda?: 'ARS' | 'USD'
  tipo_cambio?: number
}

export interface BancoParcial {
  banco_id: number
  banco_nombre: string
  total_real: number
  total_necesario: number
}

export interface PagoPendiente {
  id: number
  fecha: string
  concepto: string
  monto: number
  comentarios?: string
  descripcion_id?: number
  proveedor_id?: number
  descripcion_nombre?: string
  proveedor_nombre?: string
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'completado'
  prioridad: 'baja' | 'media' | 'alta'
  tipo?: string
  motivo_rechazo?: string
  usuario_creador_nombre?: string
  usuario_revisor_nombre?: string
  created_at?: string
}

export interface Categoria {
  id: number
  nombre: string
  tipo?: 'ingreso' | 'egreso'
}

export interface Subcategoria {
  id: number
  categoria_id: number
  nombre: string
}

export interface Sucursal {
  id: number
  nombre: string
  razon_social: string
  cuit: string
  direccion: string
  email_correspondencia?: string
  activo: boolean
}

export interface Documento {
  id: number
  sucursal_id: number
  nombre_archivo: string
  ruta_archivo: string
  tipo_archivo: string
  tamano_bytes: number
  fecha_subida: string
  tipo_documento?: string // Nuevo
  fecha_vencimiento?: string // Nuevo
}

export interface CuentaBancaria {
  id: number
  sucursal_id: number
  cbu: string
  alias?: string
  tipo_cuenta?: string
  banco?: string
}

export interface EscalaSalarial {
  id: number
  puesto_id: number
  puesto_nombre: string
  sueldo_base: number
  mes: number
  anio: number
  valor_hora: number | null
}

export interface Puesto {
  id: number
  nombre: string
  sucursal_id: number
  created_at: string
  updated_at: string
}

export interface SelectOption {
  id: number
  nombre: string
}

export type RhCalendarioEventoTipo = 'Capacitación' | 'Reunión' | 'Comunicado' | 'Vencimiento' | 'Evento interno' | 'Otro'
export type RhCalendarioTipoNotion = 'General' | 'Invitación' | 'Comunicado' | 'Recordatorio'

export interface RhCalendarioEvento {
  id: number
  evento: RhCalendarioEventoTipo
  fecha: string
  hora: string | null
  direccion: string | null
  participantes: string | null
  comentarios: string | null
  tipo_notion: RhCalendarioTipoNotion
  creado_por: number | null
  creado_por_nombre: string | null
  created_at: string
  updated_at: string
}

export interface Personal {
  id: number
  legajo: string
  nombre: string
  dni: string
  puesto_id: number
  puesto_nombre: string
  sucursal_id: number
  fecha_incorporacion: string
  periodo_prueba?: boolean
  periodo_prueba_dias?: number | null
  carnet_manipulacion_alimentos: boolean
  activo: boolean
  created_at: string
  updated_at: string
}

export type RhIncentivoTipo = 'Incentivo' | 'Premio'
export type RhIncentivoMetodoCalculo = 'porcentaje_escala' | 'monto_fijo' | 'multiplicador_valor_hora'

export interface RhIncentivoPremio {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  escala_salarial_id: number | null
  escala_puesto: string | null
  escala_sueldo_base: number | null
  escala_valor_hora: number | null
  nombre: string
  tipo: RhIncentivoTipo
  descripcion: string | null
  mes: number
  anio: number
  metodo_calculo: RhIncentivoMetodoCalculo
  valor: number
  activo: boolean | number
  monto_calculado: number
  fecha_ultima_actualizacion: string
  created_at: string
  updated_at: string
}

export interface DescripcionOption {
  id: number
  nombre: string
  tipo?: 'ingreso' | 'egreso'
  categoria_id?: number | null
  subcategoria_id?: number | null
  categoria_nombre?: string | null
  subcategoria_nombre?: string | null
  activo?: boolean
}

export type RhSolicitudTipo = 'Altas' | 'Bajas' | 'Novedades de sueldo' | 'Incentivos y premios' | 'Licencias' | 'Vacaciones' | 'Suspensiones' | 'Apercibimientos' | 'Capacitaciones' | 'Pedido de uniforme' | 'Adelantos'
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

export interface RhSolicitudAltaDetalles {
  nombre: string
  dni: string
  puesto_id: number
  fecha_incorporacion: string
  periodo_prueba: boolean
  periodo_prueba_dias: number | null
  carnet_manipulacion_alimentos: boolean
}

export interface RhSolicitudBajaDetalles {
  motivo_baja: string
  fecha_baja: string
}

export interface RhSolicitudVacacionesDetalles {
  fecha_desde: string
  fecha_hasta: string
  cantidad_dias: number
}

export interface RhSolicitudLicenciaDetalles {
  tipo_licencia: string
  fecha_desde: string
  fecha_hasta: string
  motivo: string
}

export interface RhSolicitudNovedadSueldoDetalles {
  sueldo_actual: number
  sueldo_nuevo: number
  fecha_vigencia: string
  motivo: string
}

export interface RhSolicitudApercibimientoDetalles {
  fecha: string
  severidad: 'Leve' | 'Moderada' | 'Grave'
  motivo: string
}

export type RhSolicitudDetalles =
  | Record<string, unknown>
  | RhSolicitudAltaDetalles
  | RhSolicitudBajaDetalles
  | RhSolicitudVacacionesDetalles
  | RhSolicitudLicenciaDetalles
  | RhSolicitudNovedadSueldoDetalles
  | RhSolicitudApercibimientoDetalles
  | null

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
  historial?: RhSolicitudHistorialItem[]
  created_at: string
  updated_at: string
}
