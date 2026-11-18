import type { Impuesto } from './impuestos'

export type EstadoBaseImpositiva = 'todos' | 'pendiente' | 'pagado'

/** Un egreso marcado con impuesto, como lo devuelve GET /api/base-impositiva */
export interface MovimientoImpositivo {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  /** Vencimiento: la fecha del movimiento */
  fecha: string | null
  /** Período efectivo 'YYYY-MM' */
  periodo: string
  impuesto: Impuesto
  monto: number
  moneda: 'ARS' | 'USD'
  estado: 'pendiente' | 'aprobado' | 'completado'
  tipo_movimiento: 'efectivo' | 'banco'
  banco_nombre: string | null
  descripcion_nombre: string | null
  concepto: string
  /** pendiente = Saldo necesario o pago pendiente; pagado = Saldo real */
  situacion: 'pendiente' | 'pagado'
}

export interface FiltrosBaseImpositiva {
  /** '' = todas */
  sucursalId: string
  /** 'YYYY-MM' o '' */
  desde: string
  hasta: string
  impuesto: Impuesto | ''
  estado: EstadoBaseImpositiva
}

export interface TotalImpositivo {
  clave: string
  etiqueta: string
  moneda: 'ARS' | 'USD'
  pendiente: number
  pagado: number
}
