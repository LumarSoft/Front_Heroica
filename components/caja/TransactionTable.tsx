'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatFecha, formatMonto, calcularTotal, truncarTexto } from '@/lib/formatters'
import { isMedioPagoChequeLike, tieneNumeroChequeCargado } from '@/lib/cheque'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Trash2, ArrowRightLeft, Plus, ArrowUp, ArrowDown, GripVertical, AlertTriangle, Hash } from 'lucide-react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SortableTransactionRow, type DragHandleProps } from './SortableTransactionRow'
import { RowActions } from './RowActions'
import { EditableCell } from './EditableCell'
import { useGridEdit } from '@/hooks/use-grid-edit'
import { EDIT_FIELD_SPECS, type EditFieldKey, type InlineEditContext } from '@/lib/caja-inline-edit'

// =============================================
// Definición de columnas
// =============================================

export interface ColumnDef {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  hideBelow?: 'md' | 'lg' // responsive breakpoint
  widthClass?: string
  render: (t: Transaction) => React.ReactNode
  /** Si se define, la celda se puede editar en línea (estilo Excel) para ese campo */
  editField?: EditFieldKey
}

/** Columnas base compartidas */
const BASE_COLUMNS: ColumnDef[] = [
  {
    key: 'fecha',
    label: 'Fecha',
    widthClass: 'w-[100px]',
    editField: 'fecha',
    render: t => <span className="font-medium text-[#1A1A1A] whitespace-nowrap">{formatFecha(t.fecha)}</span>,
  },
  {
    key: 'categoria',
    label: 'Categoria',
    widthClass: 'w-[140px]',
    editField: 'categoria',
    render: t => (
      <div className="w-full">
        <span className="block text-[#1A1A1A] font-medium truncate" title={t.categoria_nombre || ''}>
          {t.categoria_nombre || '-'}
        </span>
      </div>
    ),
  },
]

/** Columna de descripcion compartida — cae a concepto cuando no hay descripcion configurada */
const DESCRIPCION_COLUMN: ColumnDef = {
  key: 'descripcion',
  label: 'Descripcion',
  widthClass: 'w-[150px]',
  editField: 'descripcion',
  render: t => {
    const text = t.descripcion_nombre || t.concepto || null
    const chequePendiente = isMedioPagoChequeLike(t.medio_pago_nombre) && !tieneNumeroChequeCargado(t.numero_cheque)
    const chequeCargado = tieneNumeroChequeCargado(t.numero_cheque)
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="min-w-0 flex-1 truncate text-[#666666]" title={text || ''}>
          {truncarTexto(text)}
        </span>
        {chequePendiente && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex h-4 w-4 shrink-0 cursor-help items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-amber-700"
                aria-label="Cheque sin número"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Cheque / eCheq: falta cargar el N° en el banco</TooltipContent>
          </Tooltip>
        )}
        {chequeCargado && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex shrink-0 cursor-help items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Hash className="h-2.5 w-2.5" />
                {t.numero_cheque}
              </span>
            </TooltipTrigger>
            <TooltipContent>Cheque N° {t.numero_cheque} cargado</TooltipContent>
          </Tooltip>
        )}
      </div>
    )
  },
}

/** Columnas extra para caja banco */
const BANCO_COLUMNS: ColumnDef[] = [
  {
    key: 'medio_pago',
    label: 'Medio Pago',
    widthClass: 'w-[120px]',
    editField: 'medio_pago',
    render: t => {
      const nombre = t.medio_pago_nombre || ''
      const chequeLike = isMedioPagoChequeLike(nombre)
      const conNumero = tieneNumeroChequeCargado(t.numero_cheque)
      if (!nombre) {
        return <span className="block w-full text-[#666666]">-</span>
      }
      if (!chequeLike) {
        return (
          <span className="block w-full text-[#666666] truncate" title={nombre}>
            {nombre}
          </span>
        )
      }
      return (
        <span
          className={cn(
            'inline-flex max-w-full items-center px-1.5 py-0.5 rounded-md border text-[11px] font-semibold truncate',
            conNumero
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-200 text-amber-900',
          )}
          title={conNumero ? `${nombre} — N° ${t.numero_cheque}` : `${nombre} — sin N° aún (pendiente en banco)`}
        >
          <span className="truncate">{nombre}</span>
        </span>
      )
    },
  },
  {
    key: 'banco',
    label: 'Banco',
    align: 'center',
    widthClass: 'w-[110px]',
    editField: 'banco',
    render: t => (
      <span className="block w-full font-medium text-[#002868] truncate" title={t.banco_nombre || ''}>
        {t.banco_nombre || '-'}
      </span>
    ),
  },
]

/** Columnas extra para caja efectivo */
const EFECTIVO_COLUMNS: ColumnDef[] = []

/** Columna de monto (siempre al final antes de acciones) */
const MONTO_COLUMN: ColumnDef = {
  key: 'monto',
  label: 'Monto',
  align: 'right',
  widthClass: 'w-[125px]',
  editField: 'monto',
  render: t => (
    <span
      className={`font-bold text-sm whitespace-nowrap ${Number(t.monto) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
    >
      {formatMonto(t.monto)}
    </span>
  ),
}

/** Columna de DEUDA (opcional, solo para caja efectivo y banco) */
const DEUDA_COLUMN: ColumnDef = {
  key: 'deuda',
  label: 'Deuda',
  align: 'center',
  widthClass: 'w-[95px]',
  render: t =>
    t.es_deuda ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 border border-orange-300 text-orange-700 text-xs font-bold">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-3 h-3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        DEUDA
      </span>
    ) : (
      <span className="text-[#B0B0B0] text-sm">—</span>
    ),
}

// =============================================
// Helpers para presets de columnas
// =============================================

export function getBancoColumns(): ColumnDef[] {
  return [...BASE_COLUMNS, DESCRIPCION_COLUMN, MONTO_COLUMN, ...BANCO_COLUMNS, DEUDA_COLUMN]
}

export function getEfectivoColumns(): ColumnDef[] {
  return [...BASE_COLUMNS, DESCRIPCION_COLUMN, MONTO_COLUMN, ...EFECTIVO_COLUMNS, DEUDA_COLUMN]
}

// =============================================
// Virtualización
// =============================================

/** A partir de esta cantidad de filas se activa la virtualización (windowing) */
const VIRTUALIZE_THRESHOLD = 60
/** Altura estimada de fila (px) — el virtualizador la corrige midiendo cada fila */
const ESTIMATED_ROW_HEIGHT = 48
/** Alto máximo del panel scrolleable cuando se virtualiza */
const VIRTUAL_SCROLL_MAX_H = 'max-h-[70vh]'

// =============================================
// Componente TransactionTable
// =============================================

interface TransactionTableProps {
  title: string
  description: string
  transactions: Transaction[]
  customTotal?: number
  columns: ColumnDef[]
  onViewDetails: (t: Transaction) => void
  onChangeState?: (t: Transaction) => void
  onDelete?: (t: Transaction) => void
  onToggleDeuda?: (t: Transaction) => void
  onMove?: (t: Transaction) => void
  onBulkDelete?: (ids: number[]) => void
  onBulkMove?: (ids: number[]) => void
  isReadOnly?: boolean
  /** Habilita la creación de movimientos "en línea" entre filas */
  canInlineCreate?: boolean
  /** Render del formulario inline. defaultFecha = fecha de la fila de referencia; orden = posición calculada */
  renderInlineCreateForm?: (args: { defaultFecha: string; orden: number; onClose: () => void }) => React.ReactNode
  /** Id de un movimiento recién creado: se resalta (titila) y se hace scroll hacia él */
  highlightId?: number | null
  /** Persiste el nuevo `orden` al reordenar por drag & drop (solo dentro de la misma fecha) */
  onReorder?: (id: number, nuevoOrden: number) => void
  /** Habilita la edición de celdas en línea (estilo Excel) sobre las columnas con `editField` */
  inlineEdit?: {
    context: InlineEditContext
    onSave: (id: number, patch: Partial<Transaction>) => Promise<boolean>
  }
}

export function TransactionTable({
  title,
  description,
  transactions,
  customTotal,
  columns,
  onViewDetails,
  onChangeState,
  onDelete,
  onToggleDeuda,
  onMove,
  onBulkDelete,
  onBulkMove,
  isReadOnly = false,
  canInlineCreate = false,
  renderInlineCreateForm,
  highlightId = null,
  onReorder,
  inlineEdit,
}: TransactionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  // Gap donde se crea un movimiento en línea: gapKey -1 = arriba de todo; i = debajo de la fila i
  const [activeInsert, setActiveInsert] = useState<{ gapKey: number; defaultFecha: string; orden: number } | null>(null)
  // Id de la fila cuyo menú "+" (agregar arriba / debajo) está abierto
  const [menuRowId, setMenuRowId] = useState<number | null>(null)
  // Id que titila tras crearse un movimiento
  const [flashId, setFlashId] = useState<number | null>(null)
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null)

  // Al recibir un highlightId nuevo: titilar y hacer scroll hacia la fila creada
  useEffect(() => {
    if (highlightId == null) return
    setFlashId(highlightId)
    const raf = requestAnimationFrame(() => {
      highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    const timer = setTimeout(() => setFlashId(null), 2800)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [highlightId])

  const toggleAll = () => {
    if (selectedIds.size === transactions.length && transactions.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < transactions.length

  // --- Edición de celdas en línea (estilo Excel) ---
  const editEnabled = !!inlineEdit && !isReadOnly
  const editableColKeys = useMemo(() => columns.filter(c => c.editField).map(c => c.key), [columns])
  const rowIds = useMemo(() => transactions.map(t => t.id), [transactions])

  const handleInlineCommit = useCallback(
    async (rowId: number, colKey: string, value: string): Promise<boolean> => {
      if (!inlineEdit) return false
      const col = columns.find(c => c.key === colKey)
      const t = transactions.find(tx => tx.id === rowId)
      if (!col?.editField || !t) return false
      const patch = EDIT_FIELD_SPECS[col.editField].buildPatch(value, t, inlineEdit.context)
      return inlineEdit.onSave(rowId, patch)
    },
    [inlineEdit, columns, transactions],
  )

  const grid = useGridEdit({ rowIds, colKeys: editableColKeys, onCommit: handleInlineCommit })

  // --- Virtualización (solo listas grandes) ---
  const virtualize = transactions.length > VIRTUALIZE_THRESHOLD
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 14,
    getItemKey: index => transactions[index]?.id ?? index,
  })

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete([...selectedIds])
      setSelectedIds(new Set())
    }
  }

  const handleBulkMove = () => {
    if (onBulkMove) {
      onBulkMove([...selectedIds])
    }
  }

  const total = customTotal !== undefined ? customTotal : calcularTotal(transactions)
  const showBulkActions = (onBulkDelete || onBulkMove) && !isReadOnly
  const showInsert = canInlineCreate && !isReadOnly && !!renderInlineCreateForm
  const dndEnabled = !!onReorder && !isReadOnly && transactions.length > 1
  // Columna izquierda (gutter) con el handle de arrastre y/o el botón "+"
  const showGutter = showInsert || dndEnabled
  const totalColSpan = columns.length + 1 + (showBulkActions ? 1 : 0) + (showGutter ? 1 : 0)

  // Orden efectivo (posición manual, fallback: id). La lista se ordena por
  // (fecha, orden ?? id) ascendente, así que el orden solo importa entre filas de igual fecha.
  const effOrden = (t: Transaction) => t.orden ?? t.id

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = transactions.findIndex(t => t.id === active.id)
    const newIndex = transactions.findIndex(t => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const activeTx = transactions[oldIndex]
    const overTx = transactions[newIndex]
    // Solo se permite reordenar dentro de la misma fecha
    if (activeTx.fecha !== overTx.fecha) {
      toast.error('Solo se puede reordenar dentro de la misma fecha')
      return
    }

    // Nueva posición: punto medio entre los vecinos (misma fecha) en el orden resultante
    const reordered = arrayMove(transactions, oldIndex, newIndex)
    const pos = reordered.findIndex(t => t.id === active.id)
    const prev = reordered[pos - 1]
    const next = reordered[pos + 1]
    const prevOrden = prev && prev.fecha === activeTx.fecha ? effOrden(prev) : null
    const nextOrden = next && next.fecha === activeTx.fecha ? effOrden(next) : null

    let nuevoOrden: number
    if (prevOrden !== null && nextOrden !== null) nuevoOrden = (prevOrden + nextOrden) / 2
    else if (prevOrden !== null) nuevoOrden = prevOrden + 1
    else if (nextOrden !== null) nuevoOrden = nextOrden - 1
    else return // único en su fecha, nada que reordenar

    onReorder?.(Number(active.id), nuevoOrden)
  }

  const openInsert = (gapKey: number, defaultFecha: string, orden: number) => {
    setActiveInsert({ gapKey, defaultFecha, orden })
    setMenuRowId(null)
  }

  // Posición manual (fraccional) para insertar respecto de una fila.
  const ordenArriba = (i: number) => {
    const ref = transactions[i]
    const above = transactions[i - 1]
    if (i === 0 || !above || above.fecha !== ref.fecha) return effOrden(ref) - 1
    return (effOrden(above) + effOrden(ref)) / 2
  }
  const ordenAbajo = (i: number) => {
    const ref = transactions[i]
    const below = transactions[i + 1]
    if (!below || below.fecha !== ref.fecha) return effOrden(ref) + 1
    return (effOrden(ref) + effOrden(below)) / 2
  }

  // Renderiza la fila borrador en el gap indicado (si está activo ahí)
  const renderDraftRow = (gapKey: number) => {
    if (!showInsert || activeInsert?.gapKey !== gapKey) return null
    return (
      <TableRow key={`draft-${gapKey}`} className="bg-amber-50/60 hover:bg-amber-50/60">
        <TableCell colSpan={totalColSpan} className="border-l-4 border-amber-400 p-0">
          {renderInlineCreateForm?.({
            defaultFecha: activeInsert.defaultFecha,
            orden: activeInsert.orden,
            onClose: () => setActiveInsert(null),
          })}
        </TableCell>
      </TableRow>
    )
  }

  // Celda gutter (izquierda): handle de arrastre + botón "+" con menú Agregar arriba / Agregar debajo
  const renderGutterCell = (transaction: Transaction, index: number, handle: DragHandleProps) => {
    if (!showGutter) return null
    const fecha = transaction.fecha ? transaction.fecha.split('T')[0] : ''
    return (
      <TableCell className="w-14 px-1 align-middle">
        <div className="flex items-center gap-0.5">
          {dndEnabled && (
            <button
              type="button"
              ref={handle.setActivatorNodeRef}
              {...handle.attributes}
              {...handle.listeners}
              title="Arrastrar para reordenar (misma fecha)"
              className={`flex h-6 w-5 items-center justify-center rounded text-[#8A8F9C] transition-all hover:text-[#002868] touch-none cursor-grab active:cursor-grabbing ${
                handle.isDragging ? 'opacity-100' : 'opacity-40 group-hover/row:opacity-100'
              }`}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          {showInsert && (
            <Popover
              open={menuRowId === transaction.id}
              onOpenChange={open => setMenuRowId(open ? transaction.id : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Agregar movimiento"
                  className={`flex h-6 w-6 items-center justify-center rounded-full border border-[#002868]/30 bg-white text-[#002868] shadow-sm transition-all hover:bg-[#002868] hover:text-white cursor-pointer ${
                    menuRowId === transaction.id ? 'opacity-100' : 'opacity-40 group-hover/row:opacity-100'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" side="right" className="w-44 p-1">
                <button
                  type="button"
                  onClick={() => openInsert(index - 1, fecha, ordenArriba(index))}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-[#1A1A1A] transition-colors hover:bg-[#EEF3FF] hover:text-[#002868] cursor-pointer"
                >
                  <ArrowUp className="h-4 w-4" />
                  Agregar arriba
                </button>
                <button
                  type="button"
                  onClick={() => openInsert(index, fecha, ordenAbajo(index))}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left text-[#1A1A1A] transition-colors hover:bg-[#EEF3FF] hover:text-[#002868] cursor-pointer"
                >
                  <ArrowDown className="h-4 w-4" />
                  Agregar debajo
                </button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </TableCell>
    )
  }

  // Render de una fila de movimiento. `measureRef` lo usa el virtualizador para medir la altura.
  const renderRow = (transaction: Transaction, index: number, measureRef?: (el: Element | null) => void) => (
    <SortableTransactionRow
      id={transaction.id}
      dataIndex={index}
      disabled={!dndEnabled}
      rowRef={el => {
        if (transaction.id === highlightId) highlightRowRef.current = el
        measureRef?.(el)
      }}
      className={`group/row hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50 ${
        flashId === transaction.id
          ? 'bg-emerald-50 ring-2 ring-inset ring-emerald-500 animate-pulse'
          : selectedIds.has(transaction.id)
            ? 'bg-indigo-50/60'
            : ''
      }`}
    >
      {handle => (
        <>
          {renderGutterCell(transaction, index, handle)}
          {showBulkActions && (
            <TableCell className="text-center w-10">
              <input
                type="checkbox"
                checked={selectedIds.has(transaction.id)}
                onChange={() => toggleOne(transaction.id)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
              />
            </TableCell>
          )}
          {columns.map(col => {
            const spec = editEnabled && col.editField ? EDIT_FIELD_SPECS[col.editField] : null
            const editingThis = !!spec && grid.isActive(transaction.id, col.key)
            return (
              <TableCell
                key={col.key}
                className={`${spec ? 'px-1' : 'px-2'} ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                } ${col.widthClass || ''} ${
                  col.hideBelow === 'md' ? 'hidden md:table-cell' : col.hideBelow === 'lg' ? 'hidden lg:table-cell' : ''
                }`}
              >
                {spec && inlineEdit ? (
                  <EditableCell
                    editing={editingThis}
                    saving={grid.isSaving(transaction.id)}
                    type={spec.type}
                    display={col.render(transaction)}
                    raw={editingThis ? spec.getRaw(transaction) : ''}
                    // Las opciones (filtrado de catálogos) sólo se calculan para la celda
                    // en edición → evita recalcular en todas las filas en cada render.
                    options={editingThis ? spec.getOptions?.(transaction, inlineEdit.context) : undefined}
                    align={col.align}
                    placeholder={spec.placeholder}
                    onStart={() => grid.start(transaction.id, col.key)}
                    onCommit={(value, dir) => grid.commit(value, dir)}
                    onCancel={grid.cancel}
                  />
                ) : (
                  col.render(transaction)
                )}
              </TableCell>
            )
          })}
          <TableCell
            className={`w-[172px] min-w-[172px] max-w-[172px] px-2 text-center ${
              flashId === transaction.id
                ? 'bg-emerald-50'
                : selectedIds.has(transaction.id)
                  ? 'bg-indigo-50/60'
                  : 'bg-white'
            }`}
          >
            <RowActions
              transaction={transaction}
              isReadOnly={isReadOnly}
              onViewDetails={onViewDetails}
              onChangeState={onChangeState}
              onToggleDeuda={onToggleDeuda}
              onMove={onMove}
              onDelete={onDelete}
            />
          </TableCell>
        </>
      )}
    </SortableTransactionRow>
  )

  // Filas visibles cuando se virtualiza: sólo la ventana + espaciadores arriba/abajo
  const virtualItems = virtualize ? virtualizer.getVirtualItems() : []
  const virtualPaddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
  const virtualPaddingBottom =
    virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0

  return (
    <Card className="border-[#E0E0E0] bg-white shadow-lg">
      <CardHeader className="border-b border-[#E0E0E0] px-3 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-2xl font-bold text-[#002868] leading-tight">{title}</CardTitle>
            <CardDescription className="text-[#666666] text-xs sm:text-sm mt-0.5 leading-snug">
              {description}
            </CardDescription>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[#666666] font-medium mb-1">Total</p>
            <div
              className={`inline-flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg ${total >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}
            >
              <p
                className={`text-lg sm:text-2xl font-bold tabular-nums ${total >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
              >
                {formatMonto(total)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 py-3 sm:px-2">
        {/* Barra de acciones masivas */}
        {showBulkActions && selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 mb-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <span className="text-sm font-semibold text-indigo-700">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 px-3 text-xs border-indigo-300 text-indigo-600 hover:bg-indigo-100"
            >
              Deseleccionar
            </Button>
            {onBulkMove && (
              <Button
                size="sm"
                onClick={handleBulkMove}
                className="h-7 px-3 text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                <ArrowRightLeft className="w-3 h-3 mr-1" />
                Mover seleccionados
              </Button>
            )}
            {onBulkDelete && (
              <Button
                size="sm"
                onClick={handleBulkDelete}
                className="h-7 px-3 text-xs bg-rose-500 hover:bg-rose-600 text-white"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Eliminar {selectedIds.size}
              </Button>
            )}
          </div>
        )}
        <div
          ref={scrollRef}
          className={`rounded-md border border-[#E0E0E0] overflow-x-auto ${
            virtualize ? `${VIRTUAL_SCROLL_MAX_H} overflow-y-auto` : ''
          }`}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={transactions.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <Table className="w-full table-fixed">
                <TableHeader className={virtualize ? 'sticky top-0 z-20' : undefined}>
                  <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
                    {showGutter && <TableHead className="w-14 px-1" />}
                    {showBulkActions && (
                      <TableHead className="w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={el => {
                            if (el) el.indeterminate = someSelected
                          }}
                          onChange={toggleAll}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                          title="Seleccionar todos"
                        />
                      </TableHead>
                    )}
                    {columns.map(col => (
                      <TableHead
                        key={col.key}
                        className={`px-2 font-bold text-[#002868] text-sm ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                        } ${col.widthClass || ''} ${
                          col.hideBelow === 'md'
                            ? 'hidden md:table-cell'
                            : col.hideBelow === 'lg'
                              ? 'hidden lg:table-cell'
                              : ''
                        }`}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="w-[172px] min-w-[172px] max-w-[172px] px-2 font-bold text-[#002868] text-sm text-center">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={totalColSpan} className="text-center text-[#666666] py-12">
                        <div className="flex flex-col items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-12 h-12 text-[#666666]/50"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                            />
                          </svg>
                          <p className="font-medium">No hay movimientos registrados</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {/* Camino normal (listas chicas): render completo */}
                  {transactions.length > 0 && !virtualize && (
                    <>
                      {renderDraftRow(-1)}
                      {transactions.map((transaction, index) => (
                        <Fragment key={transaction.id}>
                          {renderRow(transaction, index)}
                          {renderDraftRow(index)}
                        </Fragment>
                      ))}
                    </>
                  )}

                  {/* Camino virtualizado (listas grandes): sólo la ventana visible + espaciadores */}
                  {transactions.length > 0 && virtualize && (
                    <>
                      {virtualPaddingTop > 0 && (
                        <tr aria-hidden>
                          <td colSpan={totalColSpan} style={{ height: virtualPaddingTop, padding: 0, border: 0 }} />
                        </tr>
                      )}
                      {virtualItems.map(vi => {
                        const transaction = transactions[vi.index]
                        if (!transaction) return null
                        return (
                          <Fragment key={transaction.id}>
                            {vi.index === 0 && renderDraftRow(-1)}
                            {renderRow(transaction, vi.index, virtualizer.measureElement)}
                            {renderDraftRow(vi.index)}
                          </Fragment>
                        )
                      })}
                      {virtualPaddingBottom > 0 && (
                        <tr aria-hidden>
                          <td colSpan={totalColSpan} style={{ height: virtualPaddingBottom, padding: 0, border: 0 }} />
                        </tr>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </SortableContext>
          </DndContext>
        </div>
      </CardContent>
    </Card>
  )
}
