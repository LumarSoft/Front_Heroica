import type { FiltroCheques, Transaction } from './types'

/** Detecta medios tipo cheque / eCheq según el nombre del catálogo */
export function isMedioPagoChequeLike(nombre: string | null | undefined): boolean {
  if (!nombre) return false
  return /cheque|echeq/i.test(nombre)
}

export function tieneNumeroChequeCargado(numero: string | null | undefined): boolean {
  return Boolean(numero?.trim())
}

export type EstadoCheque = 'pendiente' | 'cargado' | 'rechazado'

type DatosCheque = Pick<Transaction, 'medio_pago_nombre' | 'numero_cheque' | 'cheque_rechazado'>

/** Estado del cheque / eCheq del movimiento, o null si no se pagó con cheque. El rechazo tiene prioridad. */
export function estadoCheque(m: DatosCheque): EstadoCheque | null {
  if (!isMedioPagoChequeLike(m.medio_pago_nombre)) return null
  if (m.cheque_rechazado) return 'rechazado'
  return tieneNumeroChequeCargado(m.numero_cheque) ? 'cargado' : 'pendiente'
}

const ESTADO_POR_FILTRO: Record<Exclude<FiltroCheques, 'todos'>, EstadoCheque> = {
  pendientes: 'pendiente',
  cargados: 'cargado',
  rechazados: 'rechazado',
}

export function coincideFiltroCheques(m: DatosCheque, filtro: FiltroCheques): boolean {
  return filtro === 'todos' || estadoCheque(m) === ESTADO_POR_FILTRO[filtro]
}
