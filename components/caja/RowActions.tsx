'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, ArrowRightLeft, Trash2 } from 'lucide-react'
import type { Transaction } from '@/lib/types'

interface RowActionsProps {
  transaction: Transaction
  isReadOnly: boolean
  onViewDetails: (t: Transaction) => void
  onChangeState?: (t: Transaction) => void
  onToggleDeuda?: (t: Transaction) => void
  onMove?: (t: Transaction) => void
  onDelete?: (t: Transaction) => void
}

/** Botón de acción con tooltip Radix reutilizable */
function ActionButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  className: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="sm" onClick={onClick} disabled={disabled} className={className}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Grupo de acciones por fila (ver, estado, deuda, mover, eliminar). Está memoizado para
 * que las re-renderizaciones de la tabla durante la edición en línea no lo vuelvan a
 * renderizar: sus props sólo cambian cuando cambian los datos de la fila.
 */
function RowActionsBase({
  transaction,
  isReadOnly,
  onViewDetails,
  onChangeState,
  onToggleDeuda,
  onMove,
  onDelete,
}: RowActionsProps) {
  const iconBtn =
    'h-7 w-7 p-0 border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none'

  return (
    <div className="flex flex-nowrap items-center justify-center gap-1">
      {/* Ver detalles */}
      <ActionButton
        label={isReadOnly ? 'Ver detalles (solo lectura)' : 'Ver detalles'}
        onClick={() => onViewDetails(transaction)}
        className={`${iconBtn} cursor-pointer text-white ${
          isReadOnly ? 'bg-gray-400 hover:bg-gray-500' : 'bg-[#002868] hover:bg-[#003d8f]'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </ActionButton>

      {/* Cambiar estado */}
      {onChangeState && (
        <ActionButton
          label={isReadOnly ? 'Sucursal inactiva' : 'Cambiar estado'}
          onClick={() => !isReadOnly && onChangeState(transaction)}
          disabled={isReadOnly}
          className={`${iconBtn} bg-[#002868] hover:bg-[#003d8f] text-white`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </ActionButton>
      )}

      {/* Deuda */}
      {onToggleDeuda && (
        <ActionButton
          label={isReadOnly ? 'Sucursal inactiva' : transaction.es_deuda ? 'Quitar deuda' : 'Marcar como deuda'}
          onClick={() => !isReadOnly && onToggleDeuda(transaction)}
          disabled={isReadOnly}
          className={`${iconBtn} ${
            transaction.es_deuda
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
          }`}
        >
          <Clock className="w-4 h-4" />
        </ActionButton>
      )}

      {/* Mover */}
      {onMove && (
        <ActionButton
          label={isReadOnly ? 'Sucursal inactiva' : 'Mover transacción'}
          onClick={() => !isReadOnly && onMove(transaction)}
          disabled={isReadOnly}
          className={`${iconBtn} bg-indigo-500 hover:bg-indigo-600 text-white`}
        >
          <ArrowRightLeft className="w-4 h-4" />
        </ActionButton>
      )}

      {/* Eliminar */}
      {onDelete && (
        <ActionButton
          label={isReadOnly ? 'Sucursal inactiva' : 'Eliminar movimiento'}
          onClick={() => !isReadOnly && onDelete(transaction)}
          disabled={isReadOnly}
          className={`${iconBtn} bg-rose-500 hover:bg-rose-600 text-white`}
        >
          <Trash2 className="w-4 h-4" />
        </ActionButton>
      )}
    </div>
  )
}

export const RowActions = memo(RowActionsBase)
