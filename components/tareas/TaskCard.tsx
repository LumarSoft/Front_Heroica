'use client'

import { useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIPO_CONFIG, PRIORIDAD_CONFIG, ESTADO_SIGUIENTE, ESTADO_ANTERIOR } from './constants'
import { formatDate, highlightText } from './utils'
import { Avatar } from './Avatar'
import type { Tarea } from './types'

export interface TaskCardProps {
  tarea: Tarea
  onViewDetail: (t: Tarea) => void
  onEdit: (t: Tarea) => void
  onDelete: (t: Tarea) => void
  onMoveForward: (t: Tarea) => void
  onMoveBack: (t: Tarea) => void
  moving: boolean
  searchQuery: string
  highlighted?: boolean
}

export function TaskCard({
  tarea,
  onViewDetail,
  onEdit,
  onDelete,
  onMoveForward,
  onMoveBack,
  moving,
  searchQuery,
  highlighted,
}: TaskCardProps) {
  const tipo = TIPO_CONFIG[tarea.tipo]
  const prio = PRIORIDAD_CONFIG[tarea.prioridad]
  const canGoForward = !!ESTADO_SIGUIENTE[tarea.estado]
  const canGoBack = !!ESTADO_ANTERIOR[tarea.estado]
  const isDone = tarea.estado === 'completado'
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (highlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  return (
    <div
      ref={cardRef}
      onClick={() => onViewDetail(tarea)}
      className={cn(
        'group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md',
        'border-l-[3px] cursor-pointer transition-all duration-300 flex flex-col',
        prio.border,
        isDone && 'opacity-60',
        highlighted &&
          'ring-[3px] ring-[#002868] ring-offset-2 shadow-xl shadow-[#002868]/30 bg-[#002868]/[0.03] scale-[1.03]',
      )}
    >
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold bg-[#002868] text-white px-2 py-0.5 rounded-full">{tarea.codigo}</span>
          {tarea.version && (
            <span className="text-[10px] font-semibold text-[#002868] border border-[#002868]/30 px-2 py-0.5 rounded-full">
              v{tarea.version}
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
              tipo.bg,
              tipo.color,
            )}
          >
            {tipo.icon} {tipo.label}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-auto',
              prio.badge,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', prio.dot)} />
            {prio.label}
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-[#002868] transition-colors line-clamp-2">
          {highlightText(tarea.titulo, searchQuery)}
        </p>

        {tarea.descripcion && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {highlightText(tarea.descripcion, searchQuery)}
          </p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            {tarea.asignado_a_nombre ? (
              <>
                <Avatar name={tarea.asignado_a_nombre} size="sm" />
                <span className="text-[10px] font-medium text-slate-600 truncate max-w-[72px]">
                  {tarea.asignado_a_nombre.split(' ')[0]}
                </span>
              </>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 shrink-0" />
            )}
            <span className="text-[10px] text-slate-400 shrink-0 ml-auto">{formatDate(tarea.created_at)}</span>
          </div>
          {tarea.comentarios_count > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <MessageCircle className="w-3 h-3" />
              {tarea.comentarios_count}
            </span>
          )}
        </div>
      </div>

      <div className="px-3.5 pb-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 -mt-1">
        {canGoBack && (
          <button
            onClick={e => {
              e.stopPropagation()
              onMoveBack(tarea)
            }}
            disabled={moving}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" /> Atrás
          </button>
        )}
        {canGoForward && (
          <button
            onClick={e => {
              e.stopPropagation()
              onMoveForward(tarea)
            }}
            disabled={moving}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold text-white bg-[#002868] hover:bg-[#003d8f] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Avanzar <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {!isDone && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation()
                onEdit(tarea)
              }}
              className="p-1.5 rounded-md text-[#002868] hover:bg-[#002868]/8 transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                onDelete(tarea)
              }}
              className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
