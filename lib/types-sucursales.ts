// =============================================
// Tipos compartidos del módulo Sucursales
// =============================================

export type TransactionEstado = 'pendiente' | 'aprobado' | 'rechazado' | 'completado'

export type ExportTipoMovimiento = 'todos' | 'ingresos' | 'egresos'
export type ExportTipoSaldo = 'todos' | 'saldo_real' | 'saldo_necesario'
/** 'actual' exporta solo la caja de la pantalla; 'ambas' incluye efectivo y banco */
export type ExportAlcanceCaja = 'actual' | 'ambas'

export interface ExportExcelOpciones {
  tipo: ExportTipoMovimiento
  saldo: ExportTipoSaldo
  caja: ExportAlcanceCaja
}

export interface Transaction {
  id: number
  sucursal_id: number
  fecha: string
  /** Posición manual dentro de su fecha (para inserción arriba/abajo). Fallback: id */
  orden?: number | null
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
  user_id?: number
  fecha: string
  concepto: string
  monto: number
  comentarios?: string
  descripcion_id?: number
  proveedor_id?: number
  categoria_id?: number
  subcategoria_id?: number
  descripcion_nombre?: string
  proveedor_nombre?: string
  sucursal_id?: number
  sucursal_nombre?: string
  moneda?: 'ARS' | 'USD'
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'completado'
  prioridad: 'baja' | 'media' | 'alta'
  tipo?: string
  motivo_rechazo?: string
  usuario_creador_nombre?: string
  usuario_revisor_nombre?: string
  fecha_revision?: string
  created_at?: string
  updated_at?: string
}

export type SeguimientoEstadoFiltro = 'todos' | 'pendiente' | 'aprobado' | 'rechazado'
export type PagosPendientesTab = 'pendientes' | 'seguimiento' | 'historial'

export interface SeguimientoPagosResumen {
  todos: number
  pendiente: number
  aprobado: number
  rechazado: number
}

export interface MisSolicitudesPagoResponse {
  success: boolean
  data: PagoPendiente[]
  message?: string
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
