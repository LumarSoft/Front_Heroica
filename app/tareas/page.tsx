'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Bug,
  Sparkles,
  Rocket,
  Circle,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCheck,
  Clock,
  Loader2,
  LayoutList,
  Search,
  X,
  CalendarDays,
  User,
  RefreshCw,
  FlaskConical,
  MessageCircle,
  Send,
  Bell,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/Navbar'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tipo = 'bug' | 'mejora' | 'implementacion' | 'otro'
type Prioridad = 'alta' | 'media' | 'baja'
type Estado = 'pendiente' | 'en_progreso' | 'en_pruebas' | 'completado'

interface Tarea {
  id: number
  codigo: string
  version: string | null
  titulo: string
  descripcion: string | null
  tipo: Tipo
  prioridad: Prioridad
  estado: Estado
  creado_por: number | null
  creado_por_nombre: string | null
  asignado_a: number | null
  asignado_a_nombre: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  comentarios_count: number
}

interface Comentario {
  id: number
  contenido: string
  created_at: string
  usuario_id: number
  usuario_nombre: string
}

interface UsuarioBasico {
  id: number
  nombre: string
}

interface NotificarData {
  tipo: 'movimiento' | 'comentario'
  descripcion: string
  tareaId: number
}

// ─── Static maps ──────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<Tipo, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  bug: { label: 'Bug', icon: <Bug className="w-3 h-3" />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  mejora: { label: 'Mejora', icon: <Sparkles className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  implementacion: { label: 'Implementación', icon: <Rocket className="w-3 h-3" />, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  otro: { label: 'Otro', icon: <Circle className="w-3 h-3" />, color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
}

const PRIORIDAD_CONFIG: Record<Prioridad, { label: string; border: string; dot: string; badge: string; bar: string }> = {
  alta: { label: 'Alta', border: 'border-l-rose-500', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200', bar: 'bg-rose-500' },
  media: { label: 'Media', border: 'border-l-amber-400', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-400' },
  baja: { label: 'Baja', border: 'border-l-emerald-500', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
}

const ESTADO_CONFIG: Record<Estado, { label: string; columnBg: string; icon: React.ReactNode; count_bg: string; badge: string }> = {
  pendiente: {
    label: 'Pendiente',
    columnBg: 'bg-slate-50',
    icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    count_bg: 'bg-slate-200 text-slate-700',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  en_progreso: {
    label: 'En Progreso',
    columnBg: 'bg-blue-50/50',
    icon: <Loader2 className="w-3.5 h-3.5 text-blue-500" />,
    count_bg: 'bg-blue-100 text-blue-700',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  en_pruebas: {
    label: 'En Pruebas',
    columnBg: 'bg-violet-50/50',
    icon: <FlaskConical className="w-3.5 h-3.5 text-violet-500" />,
    count_bg: 'bg-violet-100 text-violet-700',
    badge: 'bg-violet-50 text-violet-600 border-violet-200',
  },
  completado: {
    label: 'Completado',
    columnBg: 'bg-emerald-50/50',
    icon: <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />,
    count_bg: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
}

const COLUMNAS: Estado[] = ['pendiente', 'en_progreso', 'en_pruebas', 'completado']

const ESTADO_SIGUIENTE: Partial<Record<Estado, Estado>> = {
  pendiente: 'en_progreso',
  en_progreso: 'en_pruebas',
  en_pruebas: 'completado',
}

const ESTADO_ANTERIOR: Partial<Record<Estado, Estado>> = {
  en_progreso: 'pendiente',
  en_pruebas: 'en_progreso',
  completado: 'en_pruebas',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days}d`
  return formatDate(iso)
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{part}</mark>
        ) : part,
      )}
    </>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(hash)]
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = getAvatarColor(name)
  const sizeClass = size === 'sm' ? 'w-5 h-5 text-[9px]' : size === 'md' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', color, sizeClass)}>
      {getInitials(name)}
    </div>
  )
}

// ─── MetaItem ─────────────────────────────────────────────────────────────────

function MetaItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-slate-400 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
        active
          ? 'bg-[#002868] text-white border-[#002868]'
          : 'bg-white text-slate-500 border-slate-200 hover:border-[#002868] hover:text-[#002868]',
      )}
    >
      {children}
    </button>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
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

function TaskCard({ tarea, onViewDetail, onEdit, onDelete, onMoveForward, onMoveBack, moving, searchQuery, highlighted }: TaskCardProps) {
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
        highlighted && 'ring-[3px] ring-[#002868] ring-offset-2 shadow-xl shadow-[#002868]/30 bg-[#002868]/[0.03] scale-[1.03]',
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
          <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', tipo.bg, tipo.color)}>
            {tipo.icon} {tipo.label}
          </span>
          <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-auto', prio.badge)}>
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
          <div className="flex items-center gap-1.5">
            {tarea.asignado_a_nombre ? (
              <Avatar name={tarea.asignado_a_nombre} size="sm" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 shrink-0" />
            )}
            <span className="text-[10px] text-slate-400">{formatDate(tarea.created_at)}</span>
          </div>
          {tarea.comentarios_count > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <MessageCircle className="w-3 h-3" />
              {tarea.comentarios_count}
            </span>
          )}
        </div>
      </div>

      {/* Actions — on hover */}
      <div className="px-3.5 pb-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 -mt-1">
        {canGoBack && (
          <button
            onClick={e => { e.stopPropagation(); onMoveBack(tarea) }}
            disabled={moving}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" /> Atrás
          </button>
        )}
        {canGoForward && (
          <button
            onClick={e => { e.stopPropagation(); onMoveForward(tarea) }}
            disabled={moving}
            className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold text-white bg-[#002868] hover:bg-[#003d8f] disabled:opacity-40 transition-colors cursor-pointer"
          >
            Avanzar <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {!isDone && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); onEdit(tarea) }}
              className="p-1.5 rounded-md text-[#002868] hover:bg-[#002868]/8 transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(tarea) }}
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

// ─── Empty Column ─────────────────────────────────────────────────────────────

function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-slate-200 rounded-xl">
      <LayoutList className="w-7 h-7 text-slate-300 mb-2" />
      <p className="text-xs text-slate-400 font-medium">Sin tareas</p>
    </div>
  )
}

// ─── Notificar Dialog ─────────────────────────────────────────────────────────

interface NotificarDialogProps {
  data: NotificarData | null
  usuarios: UsuarioBasico[]
  currentUserId: number | null
  onSend: (usuariosIds: number[], descripcion: string, tareaId: number, tipo: string) => Promise<void>
  onClose: () => void
}

function NotificarDialog({ data, usuarios, currentUserId, onSend, onClose }: NotificarDialogProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [extra, setExtra] = useState('')
  const [sending, setSending] = useState(false)

  const otros = usuarios.filter(u => u.id !== currentUserId)

  useEffect(() => {
    if (data) { setSelected(new Set()); setExtra('') }
  }, [data])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSend() {
    if (!data || selected.size === 0) return
    setSending(true)
    const finalDesc = extra.trim() ? `${data.descripcion}\n\n${extra.trim()}` : data.descripcion
    await onSend(Array.from(selected), finalDesc, data.tareaId, data.tipo)
    setSending(false)
    onClose()
  }

  if (!data) return null

  return (
    <Dialog open={!!data} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#002868] flex items-center gap-2">
            <Bell className="w-4.5 h-4.5" />
            Notificar cambio
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Elegí quién debería saber sobre esto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* What happened */}
          <div className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl border',
            data.tipo === 'movimiento' ? 'bg-blue-50 border-blue-200' : 'bg-violet-50 border-violet-200',
          )}>
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              data.tipo === 'movimiento' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600',
            )}>
              {data.tipo === 'movimiento' ? <ArrowRight className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
            </div>
            <p className="text-sm font-medium text-slate-700 leading-snug">{data.descripcion}</p>
          </div>

          {/* User selection */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2.5">¿A quién querés notificar?</p>
            {otros.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No hay otros usuarios disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {otros.map(u => {
                  const isSelected = selected.has(u.id)
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggle(u.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer text-sm font-medium',
                        isSelected
                          ? 'bg-[#002868] text-white border-[#002868]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#002868]/40 hover:text-[#002868]',
                      )}
                    >
                      <Avatar name={u.nombre} size="sm" />
                      {u.nombre.split(' ')[0]}
                      {isSelected && <CheckCheck className="w-3.5 h-3.5 opacity-80" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Extra note */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">
              Nota adicional{' '}
              <span className="font-normal text-slate-400">(opcional)</span>
            </Label>
            <textarea
              value={extra}
              onChange={e => setExtra(e.target.value)}
              placeholder="Agregá información extra si querés..."
              rows={3}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending} className="cursor-pointer">
            Omitir
          </Button>
          <Button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Enviando...
              </span>
            ) : (
              `Notificar${selected.size > 0 ? ` (${selected.size})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tarea Dialog ─────────────────────────────────────────────────────────────

interface TareaDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: { titulo: string; descripcion: string; tipo: Tipo; prioridad: Prioridad; version: string; asignado_a: number | null }) => Promise<void>
  saving: boolean
  initial?: Tarea | null
  usuarios: UsuarioBasico[]
}

function TareaDialog({ open, onClose, onSave, saving, initial, usuarios }: TareaDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [version, setVersion] = useState('')
  const [tipo, setTipo] = useState<Tipo>('otro')
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [asignadoA, setAsignadoA] = useState<number | null>(null)
  const [isImproving, setIsImproving] = useState(false)
  const [originalDescripcion, setOriginalDescripcion] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitulo(initial?.titulo ?? '')
      setDescripcion(initial?.descripcion ?? '')
      setVersion(initial?.version ?? '')
      setTipo(initial?.tipo ?? 'otro')
      setPrioridad(initial?.prioridad ?? 'media')
      setAsignadoA(initial?.asignado_a ?? null)
      setOriginalDescripcion(null)
    }
  }, [open, initial])

  async function handleMejorarConIA() {
    if (!descripcion.trim()) {
      toast.error('Escribí una descripción primero para poder mejorarla')
      return
    }
    setIsImproving(true)
    try {
      const res = await fetch('/api/ai/mejorar-descripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion, titulo: titulo || 'Sin título', tipo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOriginalDescripcion(descripcion)
      setDescripcion(data.descripcion)
      toast.success('Descripción mejorada con IA')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al mejorar la descripción')
    } finally {
      setIsImproving(false)
    }
  }

  function handleRevertir() {
    if (originalDescripcion !== null) {
      setDescripcion(originalDescripcion)
      setOriginalDescripcion(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    await onSave({ titulo: titulo.trim(), descripcion: descripcion.trim(), version: version.trim(), tipo, prioridad, asignado_a: asignadoA })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">
            {initial ? 'Editar Tarea' : 'Nueva Tarea'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {initial ? 'Modificá los datos de la tarea.' : 'Describí la mejora, bug o implementación.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="titulo" className="text-slate-700 font-semibold text-sm">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Botón de guardar no responde"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                  className="border-slate-200 focus:border-[#002868] focus:ring-[#002868] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="version" className="text-slate-700 font-semibold text-sm">Versión</Label>
                <Input
                  id="version"
                  placeholder="Ej: 2604"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  className="border-slate-200 focus:border-[#002868] focus:ring-[#002868] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Tipo *</Label>
                <Select value={tipo} onValueChange={v => setTipo(v as Tipo)}>
                  <SelectTrigger className="border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">🐛 Bug</SelectItem>
                    <SelectItem value="mejora">✨ Mejora</SelectItem>
                    <SelectItem value="implementacion">🚀 Implementación</SelectItem>
                    <SelectItem value="otro">○ Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 font-semibold text-sm">Prioridad *</Label>
                <Select value={prioridad} onValueChange={v => setPrioridad(v as Prioridad)}>
                  <SelectTrigger className="border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">🔴 Alta</SelectItem>
                    <SelectItem value="media">🟡 Media</SelectItem>
                    <SelectItem value="baja">🟢 Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-700 font-semibold text-sm">Asignar a</Label>
              <Select
                value={asignadoA !== null ? String(asignadoA) : 'sin_asignar'}
                onValueChange={v => setAsignadoA(v === 'sin_asignar' ? null : Number(v))}
              >
                <SelectTrigger className="border-slate-200 text-sm">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {usuarios.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="descripcion" className="text-slate-700 font-semibold text-sm">Descripción</Label>
                <button
                  type="button"
                  onClick={handleMejorarConIA}
                  disabled={isImproving || !descripcion.trim()}
                  className={cn(
                    'flex items-center gap-1.5 text-[11px] font-semibold rounded-md px-2.5 py-1 border transition-all cursor-pointer',
                    'text-[#002868] border-[#002868]/25 bg-[#002868]/5',
                    'hover:bg-[#002868]/10 hover:border-[#002868]/40',
                    'disabled:opacity-35 disabled:cursor-not-allowed',
                  )}
                >
                  {isImproving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
                      Mejorando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Mejorar con IA
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="descripcion"
                placeholder="Describí con más detalle el problema o la mejora..."
                value={descripcion}
                onChange={e => { setDescripcion(e.target.value); setOriginalDescripcion(null) }}
                rows={4}
                disabled={isImproving}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md focus:outline-none resize-none placeholder:text-slate-400 transition-all',
                  isImproving
                    ? 'bg-slate-50 text-slate-400 border-slate-200'
                    : 'border-slate-200 focus:border-[#002868] focus:ring-1 focus:ring-[#002868]',
                )}
              />
              <div className="flex items-center justify-between min-h-[16px]">
                {originalDescripcion !== null && (
                  <button
                    type="button"
                    onClick={handleRevertir}
                    className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Revertir
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="cursor-pointer">Cancelar</Button>
            <Button type="submit" disabled={saving || !titulo.trim()} className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer">
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : initial ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  tarea, onClose, onConfirm, deleting,
}: {
  tarea: Tarea | null; onClose: () => void; onConfirm: () => Promise<void>; deleting: boolean
}) {
  return (
    <Dialog open={!!tarea} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-rose-600">Eliminar Tarea</DialogTitle>
          <DialogDescription className="text-slate-500">Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        {tarea && (
          <div className="py-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-800 text-sm">{tarea.titulo}</p>
              {tarea.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tarea.descripcion}</p>}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting} className="cursor-pointer">Cancelar</Button>
          <Button onClick={onConfirm} disabled={deleting} className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">
            {deleting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando...
              </span>
            ) : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail + Comments Dialog ─────────────────────────────────────────────────

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

function DetailDialog({
  tarea, onClose, onEdit, onMoveForward, onMoveBack,
  moving, currentUserId, usuarios,
  onCommentAdded, onCommentDeleted, onCommentSent, onAssign,
}: DetailDialogProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tarea) return
    setComentarios([])
    setNewComment('')
    fetchComentarios(tarea.id)
  }, [tarea?.id])

  async function fetchComentarios(tareaId: number) {
    setLoadingComments(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.GET_COMENTARIOS(tareaId))
      const data = await res.json()
      if (res.ok) setComentarios(data.data)
    } catch { /* silent */ } finally {
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
      onCommentSent(`Nuevo comentario en ${tarea.codigo}: "${preview}"`, tarea.id)
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

          {/* ── Left: details ─────────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <span className="text-[10px] font-bold bg-[#002868] text-white px-2 py-0.5 rounded-full">{tarea.codigo}</span>
                {tarea.version && (
                  <span className="text-[10px] font-semibold text-[#002868] border border-[#002868]/30 px-2 py-0.5 rounded-full">
                    v{tarea.version}
                  </span>
                )}
                <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', tipo.bg, tipo.color)}>
                  {tipo.icon} {tipo.label}
                </span>
                <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border', prio.badge)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', prio.dot)} />
                  {prio.label}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border', estado.badge)}>
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

              {/* Metadata */}
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

                {/* Assignee — inline assign if empty */}
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
                        onValueChange={v => { if (v !== 'sin_asignar') handleAssignInline(Number(v)) }}
                        disabled={assigning || isDone}
                      >
                        <SelectTrigger className="h-7 text-xs border-dashed border-slate-300 text-slate-500 w-[155px] focus:border-[#002868]">
                          <SelectValue placeholder="Asignar a alguien..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sin_asignar" disabled>Asignar a alguien...</SelectItem>
                          {usuarios.map(u => (
                            <SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>
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

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200 px-6 py-4 flex items-center gap-2 bg-slate-50">
              {canGoBack && (
                <Button variant="outline" size="sm" disabled={moving}
                  onClick={() => { onMoveBack(tarea); onClose() }}
                  className="border-slate-200 text-slate-600 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5" /> Mover atrás
                </Button>
              )}
              {canGoForward && (
                <Button size="sm" disabled={moving}
                  onClick={() => { onMoveForward(tarea); onClose() }}
                  className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer">
                  Avanzar <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isDone && (
                <Button variant="outline" size="sm"
                  onClick={() => { onClose(); onEdit(tarea) }}
                  className="border-[#002868]/20 text-[#002868] hover:bg-[#002868]/5 cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              )}
            </div>
          </div>

          <div className="hidden sm:block w-px bg-slate-200 shrink-0" />
          <div className="sm:hidden h-px bg-slate-200 shrink-0" />

          {/* ── Right: comments ───────────────────────────────────────────── */}
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
                          <span className="text-[11px] font-bold text-slate-700 truncate">{c.usuario_nombre.split(' ')[0]}</span>
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
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                  placeholder="Agregar comentario..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-slate-400"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="p-2.5 rounded-lg bg-[#002868] text-white hover:bg-[#003d8f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer self-end shrink-0"
                >
                  {sendingComment
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TareasPage() {
  const { user, isGuardLoading, handleLogout } = useAuthGuard()

  const [tareas, setTareas] = useState<Tarea[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTipo, setFilterTipo] = useState<'all' | Tipo>('all')
  const [filterPrioridad, setFilterPrioridad] = useState<'all' | Prioridad>('all')
  const [filterVersion, setFilterVersion] = useState<string>('all')

  const [pendingOpenId, setPendingOpenId] = useState<number | null>(null)
  const [pendingHighlightId, setPendingHighlightId] = useState<number | null>(null)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)

  const [detailTarget, setDetailTarget] = useState<Tarea | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tarea | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tarea | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [movingId, setMovingId] = useState<number | null>(null)
  const [notificarData, setNotificarData] = useState<NotificarData | null>(null)

  // ─── Fetch & Poll ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (isGuardLoading || !user) return
    fetchTareas()
    fetchUsuarios()
  }, [isGuardLoading, user])

  async function fetchTareas() {
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.GET_ALL)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTareas(data.data)
    } catch {
      toast.error('Error al cargar las tareas')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUsuarios() {
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.GET_USUARIOS)
      const data = await res.json()
      if (res.ok) setUsuarios(data.data)
    } catch { /* silent */ }
  }

  // Capture ?open=ID from URL on mount and clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const openId = params.get('open')
    if (openId) {
      setPendingOpenId(Number(openId))
      const url = new URL(window.location.href)
      url.searchParams.delete('open')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // Auto-open modal + highlight once tareas are loaded
  useEffect(() => {
    if (!pendingOpenId || tareas.length === 0) return
    const tarea = tareas.find(t => t.id === pendingOpenId)
    if (!tarea) return
    setPendingOpenId(null)
    setPendingHighlightId(tarea.id)
    setDetailTarget(tarea)
  }, [tareas, pendingOpenId])

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  async function handleSave(formData: {
    titulo: string; descripcion: string; tipo: Tipo; prioridad: Prioridad; version: string; asignado_a: number | null
  }) {
    setSaving(true)
    try {
      if (editTarget) {
        const res = await apiFetch(API_ENDPOINTS.TAREAS.UPDATE(editTarget.id), {
          method: 'PUT', body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setTareas(prev => prev.map(t => t.id === editTarget.id ? data.data : t))
        toast.success('Tarea actualizada')
      } else {
        const res = await apiFetch(API_ENDPOINTS.TAREAS.CREATE, {
          method: 'POST', body: JSON.stringify({ ...formData, creado_por: user?.id ?? null }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setTareas(prev => [data.data, ...prev])
        toast.success('Tarea creada')
      }
      setDialogOpen(false)
      setEditTarget(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.DELETE(deleteTarget.id), { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTareas(prev => prev.filter(t => t.id !== deleteTarget.id))
      toast.success('Tarea eliminada')
      setDeleteTarget(null)
    } catch {
      toast.error('Error al eliminar la tarea')
    } finally {
      setDeleting(false)
    }
  }

  async function handleMoveEstado(tarea: Tarea, nuevoEstado: Estado) {
    setMovingId(tarea.id)
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.UPDATE_ESTADO(tarea.id), {
        method: 'PATCH', body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTareas(prev => prev.map(t => t.id === tarea.id ? data.data : t))
      toast.success(`Movida a "${ESTADO_CONFIG[nuevoEstado].label}"`)
      setNotificarData({
        tipo: 'movimiento',
        descripcion: `${tarea.codigo} fue movida de "${ESTADO_CONFIG[tarea.estado].label}" a "${ESTADO_CONFIG[nuevoEstado].label}"`,
        tareaId: tarea.id,
      })
    } catch {
      toast.error('Error al cambiar el estado')
    } finally {
      setMovingId(null)
    }
  }

  async function handleAssign(tareaId: number, usuarioId: number) {
    try {
      const res = await apiFetch(API_ENDPOINTS.TAREAS.ASIGNAR(tareaId), {
        method: 'PATCH', body: JSON.stringify({ asignado_a: usuarioId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTareas(prev => prev.map(t => t.id === tareaId ? data.data : t))
      setDetailTarget(data.data)
      toast.success('Tarea asignada')
    } catch {
      toast.error('Error al asignar la tarea')
    }
  }

  // ─── Comment count sync ─────────────────────────────────────────────────────

  function handleCommentAdded(tareaId: number) {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, comentarios_count: t.comentarios_count + 1 } : t))
  }

  function handleCommentDeleted(tareaId: number) {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, comentarios_count: Math.max(0, t.comentarios_count - 1) } : t))
  }

  function handleCommentSent(descripcion: string, tareaId: number) {
    setNotificarData({ tipo: 'comentario', descripcion, tareaId })
  }

  // ─── Notifications ──────────────────────────────────────────────────────────

  async function handleEnviarNotificacion(usuariosIds: number[], descripcion: string, tareaId: number, tipo: string) {
    try {
      await apiFetch(API_ENDPOINTS.NOTIFICACIONES.CREATE, {
        method: 'POST',
        body: JSON.stringify({ tarea_id: tareaId, para_usuarios_ids: usuariosIds, tipo, descripcion }),
      })
    } catch {
      toast.error('Error al enviar notificaciones')
    }
  }

  // ─── Filters & grouping ─────────────────────────────────────────────────────

  const versionesDisponibles = useMemo(() => {
    const set = new Set<string>()
    for (const t of tareas) if (t.version) set.add(t.version)
    return Array.from(set).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
  }, [tareas])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return tareas.filter(t => {
      if (filterTipo !== 'all' && t.tipo !== filterTipo) return false
      if (filterPrioridad !== 'all' && t.prioridad !== filterPrioridad) return false
      if (filterVersion !== 'all') {
        if (filterVersion === 'sin_version') { if (t.version) return false }
        else { if (t.version !== filterVersion) return false }
      }
      if (q) {
        const inTitle = t.titulo.toLowerCase().includes(q)
        const inDesc = t.descripcion?.toLowerCase().includes(q) ?? false
        if (!inTitle && !inDesc) return false
      }
      return true
    })
  }, [tareas, filterTipo, filterPrioridad, filterVersion, searchQuery])

  const grouped = useMemo(() => {
    const map: Record<Estado, Tarea[]> = { pendiente: [], en_progreso: [], en_pruebas: [], completado: [] }
    for (const t of filtered) map[t.estado].push(t)
    return map
  }, [filtered])

  const stats = useMemo(() => ({
    total: tareas.length,
    pendientes: tareas.filter(t => t.estado === 'pendiente').length,
    enProgreso: tareas.filter(t => t.estado === 'en_progreso').length,
    enPruebas: tareas.filter(t => t.estado === 'en_pruebas').length,
    completados: tareas.filter(t => t.estado === 'completado').length,
  }), [tareas])

  const hasActiveFilters = filterTipo !== 'all' || filterPrioridad !== 'all' || filterVersion !== 'all' || !!searchQuery

  if (isGuardLoading) return <PageLoadingSpinner />

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar userName={user?.nombre} userRole={user?.rol} onLogout={handleLogout} showBackButton backUrl="/sucursales" />

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#002868] tracking-tight">Tablero de Tareas</h1>
              <p className="text-slate-500 text-sm mt-0.5">Reportá bugs, mejoras e implementaciones para el equipo.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                onClick={() => { setEditTarget(null); setDialogOpen(true) }}
                className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: 'Total', value: stats.total, color: 'text-[#002868]', bg: 'bg-[#002868]/8 border-[#002868]/20' },
              { label: 'Pendientes', value: stats.pendientes, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: <Clock className="w-3 h-3" /> },
              { label: 'En Progreso', value: stats.enProgreso, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: <Loader2 className="w-3 h-3" /> },
              { label: 'En Pruebas', value: stats.enPruebas, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', icon: <FlaskConical className="w-3 h-3" /> },
              { label: 'Completadas', value: stats.completados, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCheck className="w-3 h-3" /> },
            ].map(s => (
              <div key={s.label} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold', s.bg, s.color)}>
                {(s as any).icon}
                <span className="font-bold">{s.value}</span>
                <span className="font-medium opacity-70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-6 flex-1">

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-5 flex flex-col gap-3.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] placeholder:text-slate-400 bg-slate-50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:divide-x sm:divide-slate-200">
            <div className="flex flex-col gap-1.5 sm:pr-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipo</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'bug', 'mejora', 'implementacion', 'otro'] as const).map(t => (
                  <FilterChip key={t} active={filterTipo === t} onClick={() => setFilterTipo(t)}>
                    {t === 'all' ? 'Todos' : TIPO_CONFIG[t as Tipo].label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:px-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prioridad</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['all', 'alta', 'media', 'baja'] as const).map(p => (
                  <FilterChip key={p} active={filterPrioridad === p} onClick={() => setFilterPrioridad(p)}>
                    {p === 'all' ? 'Todas' : PRIORIDAD_CONFIG[p as Prioridad].label}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:pl-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Versión</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <FilterChip active={filterVersion === 'all'} onClick={() => setFilterVersion('all')}>Todas</FilterChip>
                {versionesDisponibles.map(v => (
                  <FilterChip key={v} active={filterVersion === v} onClick={() => setFilterVersion(v)}>v{v}</FilterChip>
                ))}
                <FilterChip active={filterVersion === 'sin_version'} onClick={() => setFilterVersion('sin_version')}>Sin versión</FilterChip>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-400">{filtered.length} tarea{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => { setSearchQuery(''); setFilterTipo('all'); setFilterPrioridad('all'); setFilterVersion('all') }}
                className="text-xs text-[#002868] hover:underline cursor-pointer font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* ── Kanban ───────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-[#002868]/20 border-t-[#002868] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNAS.map(estado => {
              const cfg = ESTADO_CONFIG[estado]
              const cards = grouped[estado]
              return (
                <div key={estado} className={cn('flex flex-col gap-3 rounded-2xl p-3 border border-slate-200', cfg.columnBg)}>
                  <div className="flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                      {cfg.icon} {cfg.label}
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.count_bg)}>{cards.length}</span>
                  </div>
                  <div className="flex flex-col gap-2.5 min-h-[100px]">
                    {cards.length === 0 ? (
                      <EmptyColumn />
                    ) : (
                      cards.map(t => (
                        <TaskCard
                          key={t.id}
                          tarea={t}
                          moving={movingId === t.id}
                          searchQuery={searchQuery}
                          highlighted={highlightedId === t.id}
                          onViewDetail={setDetailTarget}
                          onEdit={tarea => { setEditTarget(tarea); setDialogOpen(true) }}
                          onDelete={setDeleteTarget}
                          onMoveForward={tarea => handleMoveEstado(tarea, ESTADO_SIGUIENTE[tarea.estado]!)}
                          onMoveBack={tarea => handleMoveEstado(tarea, ESTADO_ANTERIOR[tarea.estado]!)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="w-full py-5 mt-auto border-t border-slate-200 text-center text-slate-500 text-sm bg-white">
        Developed with ❤️ by{' '}
        <a href="https://lumarsoft.com" target="_blank" rel="noopener noreferrer" className="text-[#002868] hover:underline font-semibold">
          Lumarsoft
        </a>
      </footer>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <TareaDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditTarget(null) }}
        onSave={handleSave}
        saving={saving}
        initial={editTarget}
        usuarios={usuarios}
      />

      <DeleteDialog
        tarea={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <DetailDialog
        tarea={detailTarget}
        onClose={() => {
          const closingId = detailTarget?.id ?? null
          setDetailTarget(null)
          if (pendingHighlightId !== null && pendingHighlightId === closingId) {
            setPendingHighlightId(null)
            setHighlightedId(closingId)
            setTimeout(() => setHighlightedId(null), 3500)
          }
        }}
        onEdit={t => { setDetailTarget(null); setEditTarget(t); setDialogOpen(true) }}
        onMoveForward={t => handleMoveEstado(t, ESTADO_SIGUIENTE[t.estado]!)}
        onMoveBack={t => handleMoveEstado(t, ESTADO_ANTERIOR[t.estado]!)}
        moving={movingId === detailTarget?.id}
        currentUserId={user?.id ?? null}
        usuarios={usuarios}
        onCommentAdded={handleCommentAdded}
        onCommentDeleted={handleCommentDeleted}
        onCommentSent={handleCommentSent}
        onAssign={handleAssign}
      />

      <NotificarDialog
        data={notificarData}
        usuarios={usuarios}
        currentUserId={user?.id ?? null}
        onSend={handleEnviarNotificacion}
        onClose={() => setNotificarData(null)}
      />
    </div>
  )
}
