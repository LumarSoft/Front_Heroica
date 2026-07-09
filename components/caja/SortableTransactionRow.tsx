'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TableRow } from '@/components/ui/table'

type Sortable = ReturnType<typeof useSortable>

export interface DragHandleProps {
  attributes: Sortable['attributes']
  listeners: Sortable['listeners']
  setActivatorNodeRef: Sortable['setActivatorNodeRef']
  isDragging: boolean
}

interface SortableTransactionRowProps {
  id: number
  disabled?: boolean
  className?: string
  /** Ref extra (además del de dnd-kit) para hacer scroll al resaltar una fila */
  rowRef?: (el: HTMLTableRowElement | null) => void
  children: (handle: DragHandleProps) => ReactNode
}

/**
 * Fila de tabla arrastrable (dnd-kit). El arrastre se activa desde un handle
 * (grip) que se provee a `children` vía render-prop, para no interferir con los
 * clicks de los botones de acción de la fila.
 */
export function SortableTransactionRow({ id, disabled, className, rowRef, children }: SortableTransactionRowProps) {
  const { setNodeRef, setActivatorNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id,
    disabled,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 20 } : {}),
  }

  const mergedRef = (el: HTMLTableRowElement | null) => {
    setNodeRef(el)
    rowRef?.(el)
  }

  return (
    <TableRow
      ref={mergedRef}
      style={style}
      className={`${className ?? ''} ${isDragging ? 'shadow-lg ring-1 ring-[#002868]/20' : ''}`}
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </TableRow>
  )
}
