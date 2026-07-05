'use client'

import { useEffect } from 'react'
import { X, Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversacionResumen } from '@/hooks/use-heroicai-conversaciones'

interface ConversationsDrawerProps {
  open: boolean
  onClose: () => void
  conversaciones: ConversacionResumen[]
  loading: boolean
  activeId: number | null
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  onNueva: () => void
}

function fechaCorta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

export function ConversationsDrawer({
  open,
  onClose,
  conversaciones,
  loading,
  activeId,
  onSelect,
  onDelete,
  onNueva,
}: ConversationsDrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[150] bg-black/25 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-[200] flex w-full flex-col bg-white shadow-2xl sm:w-[340px]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-bold text-slate-800">Historial</p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nueva consulta */}
        <div className="px-3 pt-3">
          <button
            onClick={onNueva}
            className="flex w-full items-center gap-2.5 rounded-xl bg-gradient-to-br from-[#002868] to-[#2563eb] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva consulta
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : conversaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">Sin conversaciones</p>
              <p className="mt-1 text-xs text-slate-400">Tus consultas anteriores aparecerán acá.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversaciones.map(c => {
                const activa = c.id === activeId
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors',
                      activa ? 'bg-[#EAF0FF]' : 'hover:bg-slate-50',
                    )}
                  >
                    <button
                      onClick={() => onSelect(c.id)}
                      className="flex flex-1 items-center gap-2.5 text-left cursor-pointer"
                    >
                      <MessageSquare
                        className={cn('h-4 w-4 flex-shrink-0', activa ? 'text-[#002868]' : 'text-slate-400')}
                      />
                      <span
                        className={cn(
                          'flex-1 truncate text-[13px] font-medium',
                          activa ? 'text-[#002868]' : 'text-slate-600',
                        )}
                      >
                        {c.titulo}
                      </span>
                    </button>
                    <span className="text-[10px] text-slate-400">{fechaCorta(c.updated_at)}</span>
                    <button
                      onClick={() => onDelete(c.id)}
                      title="Eliminar"
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
