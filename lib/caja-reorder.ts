import { arrayMove } from '@dnd-kit/sortable'
import type { Transaction } from '@/lib/types'

// =============================================
// Modos de vista de las cajas (efectivo / banco)
// =============================================

export type CajaViewMode = 'tabla' | 'combinada' | 'dual' | 'calendario'

// =============================================
// Orden efectivo de una fila: posición manual (fallback al id)
// =============================================

export function effOrden(t: Transaction): number {
  return t.orden ?? t.id
}

/**
 * Calcula el nuevo `orden` (fraccional) al mover la fila `activeId` a la posición de
 * `overId` dentro de la misma lista. El reordenamiento sólo es válido entre filas de la
 * misma fecha; devuelve:
 *  - un `number` con el nuevo orden a persistir,
 *  - `'different-date'` si las filas no comparten fecha (el llamador avisa al usuario),
 *  - `null` si no hay nada que reordenar (única fila en su fecha o índices inválidos).
 */
export function computeReorderOrden(
  transactions: Transaction[],
  activeId: number,
  overId: number,
): number | 'different-date' | null {
  const oldIndex = transactions.findIndex(t => t.id === activeId)
  const newIndex = transactions.findIndex(t => t.id === overId)
  if (oldIndex < 0 || newIndex < 0) return null

  const activeTx = transactions[oldIndex]
  const overTx = transactions[newIndex]
  if (activeTx.fecha !== overTx.fecha) return 'different-date'

  const reordered = arrayMove(transactions, oldIndex, newIndex)
  const pos = reordered.findIndex(t => t.id === activeId)
  const prev = reordered[pos - 1]
  const next = reordered[pos + 1]
  const prevOrden = prev && prev.fecha === activeTx.fecha ? effOrden(prev) : null
  const nextOrden = next && next.fecha === activeTx.fecha ? effOrden(next) : null

  if (prevOrden !== null && nextOrden !== null) return (prevOrden + nextOrden) / 2
  if (prevOrden !== null) return prevOrden + 1
  if (nextOrden !== null) return nextOrden - 1
  return null // única fila en su fecha, nada que reordenar
}
