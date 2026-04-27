'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, X, MessageCircle, Send, Bell, CalendarDays, RefreshCw, User, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { TIPO_CONFIG, PRIORIDAD_CONFIG, ESTADO_CONFIG, ESTADO_SIGUIENTE, ESTADO_ANTERIOR, MODULO_CONFIG } from './constants'
import { formatDate, timeAgo } from './utils'
import { Avatar } from './Avatar'
import { MetaItem } from './MetaItem'
import type { Tarea, Comentario, UsuarioBasico } from './types'

interface DetailDialogProps {
  tarea: Tarea | null
  onClose: () => void
  onEdit: (t: Tarea) => void
  onMoveForward: (t: Tarea) => void
  onMoveBack: (t: Tarea) => void
  moving: boolean
  currentUserId: number | null
  usuarios: UsuarioBasico[]
  onCommentAdded: (tareaId: number) => void
  onCommentDeleted: (tareaId: number) => void
  onCommentSent: (descripcion: string, tareaId: number) => void
  onAssign: (tareaId: number, usuarioId: number) => Promise<void>
}

export function DetailDialog({
  tarea,
  onClose,
  onEdit,
  onMoveForward,
  onMoveBack,
  moving,
  currentUserId,
  usuarios,
  onCommentAdded,
  onCommentDeleted,
  onCommentSent,
  onAssign,
}: DetailDialogProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [pendingNotifyDesc, setPendingNotifyDesc] = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tarea) return
    setComentarios([])
    setNewComment('')
    setPendingNotifyDesc(null)
    fetchComentarios(tarea.id)
  }, [tarea?.id])

  async function fetchComentarios(tareaId: number) {
    setLoadingComments(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.GET_COMENTARIOS(tareaId))
      const data = await res.json()
      if (res.ok) setComentarios(data.data)
    } catch {
      /* silent */
    } finally {
      setLoadingComments(false)
    }
  }

  async function handleAddComment() {
    if (!tarea || !newComment.trim() || !currentUserId) return
    setSendingComment(true)
    const commentText = newComment.trim()
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.CREATE_COMENTARIO(tarea.id), {
        method: 'POST',
        body: JSON.stringify({ contenido: commentText, usuario_id: currentUserId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setComentarios(prev => [...prev, data.data])
      setNewComment('')
      onCommentAdded(tarea.id)
      const preview = commentText.length > 80 ? commentText.substring(0, 80) + '...' : commentText
      setPendingNotifyDesc(`Nuevo comentario en ${tarea.codigo}: "${preview}"`)
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    } catch {
      toast.error('Error al agregar comentario')
    } finally {
      setSendingComment(false)
    }
  }

  async function handleDeleteComment(comentarioId: number) {
    if (!tarea) return
    try {
      await apiFetch(API_ENDPOINTS.TAREAS.DELETE_COMENTARIO(tarea.id, comentarioId), { method: 'DELETE' })
      setComentarios(prev => prev.filter(c => c.id !== comentarioId))
      onCommentDeleted(tarea.id)
      setPendingNotifyDesc(null)
    } catch {
      toast.error('Error al eliminar comentario')
    }
  }

  async function handleAssignInline(usuarioId: number) {
    if (!tarea) return
    setAssigning(true)
    await onAssign(tarea.id, usuarioId)
    setAssigning(false)
  }

  if (!tarea) return null

  const tipo = TIPO_CONFIG[tarea.tipo]
  const prio = PRIORIDAD_CONFIG[tarea.prioridad]
  const modulo = MODULO_CONFIG[tarea.modulo] ?? MODULO_CONFIG.tesoreria
  const estado = ESTADO_CONFIG[tarea.estado]
  const canGoForward = !!ESTADO_SIGUIENTE[tarea.estado]
  const canGoBack = !!ESTADO_ANTERIOR[tarea.estado]
  const isDone = tarea.estado === 'completado'

  return (
    <Dialog open={!!tarea} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[880px] p-0 h-[85vh] overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">{tarea.titulo}</DialogTitle>

        <div className={cn('h-1 w-full shrink-0', prio.bar)} />

        <div className="flex flex-1 min-h-0 flex-col sm:flex-row overflow-hidden">
          {/* Left: details */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <span className="text-[10px] font-bold bg-[#002868] text-white px-2 py-0.5 rounded-full">
                  {tarea.codigo}
                </span>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', modulo.badge)}>
                  {modulo.label}
                </span>
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
                    'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    prio.badge,
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', prio.dot)} />
                  {prio.label}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                    estado.badge,
                  )}
                >
                  {estado.icon} {estado.label}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug mb-4">{tarea.titulo}</h2>

              {tarea.descripcion ? (
                <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{tarea.descripcion}</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 italic">Sin descripción.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <MetaItem icon={<CalendarDays className="w-3.5 h-3.5" />} label="Creada">
                  <p className="text-xs text-slate-700 font-medium">{formatDate(tarea.created_at)}</p>
                </MetaItem>
                <MetaItem icon={<RefreshCw className="w-3.5 h-3.5" />} label="Actualizada">
                  <p className="text-xs text-slate-700 font-medium">{formatDate(tarea.updated_at)}</p>
                </MetaItem>
                {tarea.creado_por_nombre && (
                  <MetaItem icon={<User className="w-3.5 h-3.5" />} label="Reportada por">
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Avatar name={tarea.creado_por_nombre} size="sm" />
                      <p className="text-xs text-slate-700 font-medium">{tarea.creado_por_nombre}</p>
                    </div>
                  </MetaItem>
                )}

                <MetaItem icon={<User className="w-3.5 h-3.5 text-[#002868]" />} label="Asignada a">
                  {tarea.asignado_a_nombre ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Avatar name={tarea.asignado_a_nombre} size="sm" />
                      <p className="text-xs text-slate-700 font-medium">{tarea.asignado_a_nombre}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Select
                        value="sin_asignar"
                        onValueChange={v => {
                          if (v !== 'sin_asignar') handleAssignInline(Number(v))
                        }}
                        disabled={assigning || isDone}
                      >
                        <SelectTrigger className="h-7 text-xs border-dashed border-slate-300 text-slate-500 w-[155px] focus:border-[#002868]">
                          <SelectValue placeholder="Asignar a alguien..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sin_asignar" disabled>
                            Asignar a alguien...
                          </SelectItem>
                          {usuarios.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assigning && (
                        <div className="w-3.5 h-3.5 border-2 border-[#002868]/20 border-t-[#002868] rounded-full animate-spin" />
                      )}
                    </div>
                  )}
                </MetaItem>

                {tarea.completed_at && (
                  <MetaItem icon={<CheckCheck className="w-3.5 h-3.5 text-emerald-500" />} label="Completada">
                    <p className="text-xs text-slate-700 font-medium">{formatDate(tarea.completed_at)}</p>
                  </MetaItem>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 px-6 py-4 flex items-center gap-2 bg-slate-50">
              {canGoBack && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={moving}
                  onClick={() => {
                    onMoveBack(tarea)
                    onClose()
                  }}
                  className="border-slate-200 text-slate-600 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Mover atrás
                </Button>
              )}
              {canGoForward && (
                <Button
                  size="sm"
                  disabled={moving}
                  onClick={() => {
                    onMoveForward(tarea)
                    onClose()
                  }}
                  className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
                >
                  Avanzar <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isDone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose()
                    onEdit(tarea)
                  }}
                  className="border-[#002868]/20 text-[#002868] hover:bg-[#002868]/5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              )}
            </div>
          </div>

          <div className="hidden sm:block w-px bg-slate-200 shrink-0" />
          <div className="sm:hidden h-px bg-slate-200 shrink-0" />

          {/* Right: comments */}
          <div className="flex flex-col sm:w-[300px] shrink-0 min-h-0 overflow-hidden">
            <div className="shrink-0 px-4 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#002868]" />
                <h3 className="text-sm font-bold text-slate-700">
                  Comentarios
                  {comentarios.length > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">({comentarios.length})</span>
                  )}
                </h3>
                {pendingNotifyDesc && (
                  <button
                    onClick={() => {
                      onCommentSent(pendingNotifyDesc, tarea.id)
                      setPendingNotifyDesc(null)
                    }}
                    className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-[#002868] bg-[#002868]/8 hover:bg-[#002868]/14 px-2.5 py-1 rounded-lg transition-colors cursor-pointer animate-pulse"
                  >
                    <Bell className="w-3 h-3" />
                    Notificar
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
              {loadingComments ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#002868]/20 border-t-[#002868] rounded-full animate-spin" />
                </div>
              ) : comentarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageCircle className="w-9 h-9 text-slate-200 mb-2.5" />
                  <p className="text-xs text-slate-400 font-medium">Sin comentarios aún</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Sé el primero en comentar</p>
                </div>
              ) : (
                <>
                  {comentarios.map(c => (
                    <div key={c.id} className="flex gap-2.5 group/comment">
                      <Avatar name={c.usuario_nombre} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-bold text-slate-700 truncate">
                            {c.usuario_nombre.split(' ')[0]}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.created_at)}</span>
                          {currentUserId === c.usuario_id && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="ml-auto opacity-0 group-hover/comment:opacity-100 p-0.5 rounded text-slate-300 hover:text-rose-400 transition-all cursor-pointer shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed break-words">{c.contenido}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 p-3 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                  placeholder="Agregar comentario..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-slate-400"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="p-2.5 rounded-lg bg-[#002868] text-white hover:bg-[#003d8f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer self-end shrink-0"
                >
                  {sendingComment ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-slate-300 mt-1.5">Enter para enviar · Shift+Enter nueva línea</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
