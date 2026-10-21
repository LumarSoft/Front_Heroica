// =============================================
// Préstamos entre sucursales
// =============================================

export type CajaPrestamo = 'efectivo' | 'banco'
export type EstadoPrestamo = 'solicitado' | 'vigente' | 'cancelado' | 'rechazado' | 'anulado'
export type EstadoDevolucion = 'por_confirmar' | 'confirmada' | 'rechazada' | 'anulada'
export type ModoPrestamo = 'pedir' | 'devolver'

export interface SucursalPrestamo {
  id: number
  nombre: string
}

export interface DevolucionPrestamo {
  id: number
  prestamo_id: number
  monto: number
  estado: EstadoDevolucion
  fecha: string | null
  caja_salida: CajaPrestamo
  banco_salida_id: number | null
  caja_entrada: CajaPrestamo
  banco_entrada_id: number | null
  motivo_rechazo: string | null
  usuario_solicita_nombre?: string | null
  usuario_resuelve_nombre?: string | null
  created_at: string
}

export interface Prestamo {
  id: number
  sucursal_presta_id: number
  sucursal_recibe_id: number
  sucursal_presta_nombre: string
  sucursal_recibe_nombre: string
  monto: number
  moneda: 'ARS' | 'USD'
  descripcion: string | null
  estado: EstadoPrestamo
  es_apertura: boolean
  fecha_solicitud: string
  fecha: string | null
  caja_salida: CajaPrestamo
  banco_salida_id: number | null
  banco_salida_nombre: string | null
  caja_entrada: CajaPrestamo
  banco_entrada_id: number | null
  banco_entrada_nombre: string | null
  user_solicita_id: number
  usuario_solicita_nombre: string | null
  usuario_resuelve_nombre: string | null
  motivo_rechazo: string | null
  devuelto: number
  por_confirmar: number
  pendiente: number
  /** Solo en "pendientes de devolver": pendiente menos lo que espera confirmación */
  disponible?: number
  devoluciones?: DevolucionPrestamo[]
}

export interface DevolucionPorConfirmar extends DevolucionPrestamo {
  sucursal_recibe_id: number
  sucursal_recibe_nombre: string
  prestamo_descripcion: string | null
  prestamo_monto: number
  banco_entrada_nombre: string | null
}

export interface PrestamosPorConfirmar {
  pedidos: Prestamo[]
  devoluciones: DevolucionPorConfirmar[]
}

export interface PedirPrestamoForm {
  fecha: string
  monto: string
  descripcion: string
  sucursal_presta_id: string
  caja_salida: CajaPrestamo
  banco_salida_id: string
  banco_entrada_id: string
}

export interface DevolverPrestamoForm {
  prestamo_id: string
  total: boolean
  monto: string
  fecha: string
  banco_salida_id: string
  caja_entrada: CajaPrestamo
  banco_entrada_id: string
}

export interface ApiRespuesta<T> {
  success: boolean
  message?: string
  data?: T
}
