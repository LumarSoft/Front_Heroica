'use client'

import { useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { toast } from 'sonner'
import { ArrowLeftRight } from 'lucide-react'
import type { Transaction } from '@/lib/types'
import { TransactionTable, type ColumnDef } from '@/components/caja/TransactionTable'
import { computeReorderOrden } from '@/lib/caja-reorder'
import { formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { InlineEditContext } from '@/lib/caja-inline-edit'

type PaneKey = 'real' | 'necesario'

interface DualSaldoBoardProps {
  real: Transaction[]
  necesario: Transaction[]
  columns: ColumnDef[]
  realTotal: number
  necesarioTotal: number
  onViewDetails: (t: Transaction) => void
  onChangeState?: (t: Transaction) => void
  onDelete?: (t: Transaction) => void
  onToggleDeuda?: (t: Transaction) => void
  onMove?: (t: Transaction) => void
  onBulkDelete?: (ids: number[]) => void
  onBulkMove?: (ids: number[]) => void
  isReadOnly?: boolean
  inlineEdit?: {
    context: InlineEditContext
    onSave: (id: number, patch: Partial<Transaction>) => Promise<boolean>
  }
  onReorder?: (id: number, nuevoOrden: number) => void
  /** Cambia el estado del movimiento al soltarlo en el otro panel */
  onChangeEstado: (id: number, nuevoEstado: 'completado' | 'aprobado') => void
  canInlineCreate?: boolean
  renderInlineCreateFormReal?: (args: { defaultFecha: string; orden: number; onClose: () => void }) => React.ReactNode
  renderInlineCreateFormNecesario?: (args: {
    defaultFecha: string
    orden: number
    onClose: () => void
  }) => React.ReactNode
  highlightId?: number | null
}

const PANE_ID: Record<PaneKey, string> = { real: 'pane-real', necesario: 'pane-necesario' }

/** Alto fijo compartido por ambos paneles (con scroll interno propio) para que se vean parejos */
const PANEL_HEIGHT_CLASS = 'h-[65vh] min-h-[420px]'

const ACCENT = {
  real: {
    ring: 'ring-emerald-400',
    rowIndicator: 'bg-emerald-100 ring-2 ring-inset ring-emerald-500',
  },
  necesario: {
    ring: 'ring-amber-400',
    rowIndicator: 'bg-amber-100 ring-2 ring-inset ring-amber-500',
  },
} as const

/** Zona soltable que envuelve cada panel; un aro sutil marca cuándo es un destino válido (sin overlays). */
function DroppablePane({
  id,
  accent,
  isForeignTarget,
  children,
}: {
  id: string
  accent: PaneKey
  isForeignTarget: boolean
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn('rounded-2xl transition-all', isForeignTarget && `ring-2 ring-offset-2 ${ACCENT[accent].ring}`)}
    >
      {children}
    </div>
  )
}

export function DualSaldoBoard({
  real,
  necesario,
  columns,
  realTotal,
  necesarioTotal,
  onViewDetails,
  onChangeState,
  onDelete,
  onToggleDeuda,
  onMove,
  onBulkDelete,
  onBulkMove,
  isReadOnly,
  inlineEdit,
  onReorder,
  onChangeEstado,
  canInlineCreate,
  renderInlineCreateFormReal,
  renderInlineCreateFormNecesario,
  highlightId,
}: DualSaldoBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null)
  // Panel + fila sobre la que está el cursor mientras se arrastra (vista previa de dónde caerá)
  const [dropIndicator, setDropIndicator] = useState<{ pane: PaneKey; rowId: number | null } | null>(null)
  // Id recién movido de panel: dispara el destello + scroll animado hacia su posición final
  const [justMovedId, setJustMovedId] = useState<number | null>(null)
  const justMovedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Resuelve a qué panel pertenece un id (de fila o de zona soltable)
  const containerOf = (id: UniqueIdentifier): PaneKey | null => {
    if (id === PANE_ID.real) return 'real'
    if (id === PANE_ID.necesario) return 'necesario'
    const numId = Number(id)
    if (real.some(t => t.id === numId)) return 'real'
    if (necesario.some(t => t.id === numId)) return 'necesario'
    return null
  }

  const activeTx =
    activeId != null ? (real.find(t => t.id === activeId) ?? necesario.find(t => t.id === activeId)) : null
  const sourcePane = activeId != null ? containerOf(activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (!over) {
      setDropIndicator(null)
      return
    }
    const pane = containerOf(over.id)
    if (!pane) {
      setDropIndicator(null)
      return
    }
    const isRow = over.id !== PANE_ID.real && over.id !== PANE_ID.necesario
    setDropIndicator({ pane, rowId: isRow ? Number(over.id) : null })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    setDropIndicator(null)
    const { active, over } = event
    if (!over) return

    const from = containerOf(active.id)
    const to = containerOf(over.id)
    if (!from || !to) return

    if (from === to) {
      // Reordenar dentro del mismo panel (sólo si se soltó sobre otra fila)
      if (active.id === over.id || typeof over.id !== 'number') return
      const list = from === 'real' ? real : necesario
      const result = computeReorderOrden(list, Number(active.id), Number(over.id))
      if (result === 'different-date') {
        toast.error('Solo se puede reordenar dentro de la misma fecha')
        return
      }
      if (result === null) return
      onReorder?.(Number(active.id), result)
      return
    }

    // Cruzó de panel → cambiar estado automáticamente y, cuando se reacomode, resaltarlo + scrollear hasta él
    const nuevoEstado = to === 'real' ? 'completado' : 'aprobado'
    onChangeEstado(Number(active.id), nuevoEstado)

    if (justMovedTimerRef.current) clearTimeout(justMovedTimerRef.current)
    setJustMovedId(Number(active.id))
    justMovedTimerRef.current = setTimeout(() => setJustMovedId(null), 3000)
  }

  const hint = isReadOnly ? undefined : 'Arrastrá una fila al otro panel para marcarla como pagada o pendiente.'
  const effectiveHighlightId = justMovedId ?? highlightId ?? null

  return (
    <div>
      {hint && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-[#002868]/10 bg-[#F0F4FF] px-4 py-2.5 text-xs font-medium text-[#002868]">
          <ArrowLeftRight className="h-4 w-4" />
          {hint}
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null)
          setDropIndicator(null)
        }}
      >
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2 2xl:gap-5">
          {/* Panel Saldo Real (pago / verde) */}
          <DroppablePane
            id={PANE_ID.real}
            accent="real"
            isForeignTarget={sourcePane === 'necesario' && dropIndicator?.pane === 'real'}
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pagado</span>
            </div>
            <TransactionTable
              title="Saldo Real"
              description="Movimientos confirmados."
              transactions={real}
              customTotal={realTotal}
              columns={columns}
              onViewDetails={onViewDetails}
              onChangeState={onChangeState}
              onDelete={onDelete}
              onToggleDeuda={onToggleDeuda}
              onMove={onMove}
              onBulkDelete={onBulkDelete}
              onBulkMove={onBulkMove}
              isReadOnly={isReadOnly}
              inlineEdit={inlineEdit}
              onReorder={onReorder}
              dndMode="external"
              canInlineCreate={canInlineCreate}
              renderInlineCreateForm={renderInlineCreateFormReal}
              highlightId={effectiveHighlightId}
              rowTint={() => 'green'}
              fixedHeightClass={PANEL_HEIGHT_CLASS}
              dropTargetRowId={
                sourcePane === 'necesario' && dropIndicator?.pane === 'real' ? dropIndicator.rowId : null
              }
              dropIndicatorClassName={ACCENT.real.rowIndicator}
            />
          </DroppablePane>

          {/* Panel Saldo Necesario (impago / amarillo) */}
          <DroppablePane
            id={PANE_ID.necesario}
            accent="necesario"
            isForeignTarget={sourcePane === 'real' && dropIndicator?.pane === 'necesario'}
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Por pagar</span>
            </div>
            <TransactionTable
              title="Saldo Necesario"
              description="Compromisos pendientes de pago."
              transactions={necesario}
              customTotal={necesarioTotal}
              columns={columns}
              onViewDetails={onViewDetails}
              onChangeState={onChangeState}
              onDelete={onDelete}
              onToggleDeuda={onToggleDeuda}
              onMove={onMove}
              onBulkDelete={onBulkDelete}
              onBulkMove={onBulkMove}
              isReadOnly={isReadOnly}
              inlineEdit={inlineEdit}
              onReorder={onReorder}
              dndMode="external"
              canInlineCreate={canInlineCreate}
              renderInlineCreateForm={renderInlineCreateFormNecesario}
              highlightId={effectiveHighlightId}
              rowTint={() => 'yellow'}
              fixedHeightClass={PANEL_HEIGHT_CLASS}
              dropTargetRowId={
                sourcePane === 'real' && dropIndicator?.pane === 'necesario' ? dropIndicator.rowId : null
              }
              dropIndicatorClassName={ACCENT.necesario.rowIndicator}
            />
          </DroppablePane>
        </div>

        {/* Fantasma que sigue el cursor al arrastrar */}
        <DragOverlay>
          {activeTx ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#002868]/30 bg-white px-3 py-2 shadow-xl">
              <ArrowLeftRight className="h-4 w-4 text-[#002868]" />
              <span className="max-w-[220px] truncate text-sm font-medium text-[#1A1A1A]">
                {activeTx.descripcion_nombre || activeTx.concepto || 'Movimiento'}
              </span>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  Number(activeTx.monto) >= 0 ? 'text-emerald-700' : 'text-rose-700',
                )}
              >
                {formatMonto(activeTx.monto)}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
