import type { Transaction } from './types'

/**
 * Una de las dos mitades de una "Transferencia entre bancos" (Nuevo movimiento). La API la guarda
 * como dos movimientos de banco sin categoría y con " (Egreso)" / " (Ingreso)" al final del concepto
 * (así desde que existe la función, 04/2026). Es plata que pasa de un banco a otro de la misma
 * sucursal: no entra ni sale, así que el calendario no la cuenta (los reportes tampoco).
 */
export function esTransferenciaEntreBancos(
  t: Pick<Transaction, 'tipo_movimiento' | 'categoria_id' | 'origen' | 'concepto'>,
): boolean {
  return (
    t.tipo_movimiento === 'banco' &&
    !t.categoria_id &&
    (t.origen ?? 'manual') === 'manual' &&
    / \((Egreso|Ingreso)\)$/.test(t.concepto ?? '')
  )
}
