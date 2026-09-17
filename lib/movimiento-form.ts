import type { MovimientoFormData, MovimientoTransferenciaData } from './types'
export function fechaHoyMovimiento(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function initialMovimientoForm(cajaTipo: 'efectivo' | 'banco', isPagoPendiente: boolean): MovimientoFormData {
  return {
    fecha: fechaHoyMovimiento(),
    concepto: '',
    monto: '',
    comentarios: '',
    prioridad: 'media',
    estado: isPagoPendiente ? 'pendiente' : 'aprobado',
    tipo: isPagoPendiente ? 'egreso' : 'ingreso',
    tipo_movimiento: cajaTipo,
    categoria_id: '',
    subcategoria_id: '',
    descripcion_id: '',
    descripcion_nombre: '',
    proveedor_id: '',
    comprobante: '',
    banco_id: '',
    medio_pago_id: '',
    numero_cheque: '',
    tipo_cambio: '',
  }
}
export function initialTransferenciaForm(): MovimientoTransferenciaData {
  return {
    fecha: fechaHoyMovimiento(),
    concepto: '',
    descripcion: '',
    monto: '',
    banco_origen_id: '',
    banco_destino_id: '',
  }
}
