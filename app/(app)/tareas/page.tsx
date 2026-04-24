'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Clock, Loader2, CheckCheck, Search, X, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import {
  COLUMNAS,
  ESTADO_CONFIG,
  ESTADO_SIGUIENTE,
  ESTADO_ANTERIOR,
  TIPO_CONFIG,
  PRIORIDAD_CONFIG,
} from '@/components/tareas/constants'
import { TaskCard } from '@/components/tareas/TaskCard'
import { EmptyColumn } from '@/components/tareas/EmptyColumn'
import { FilterChip } from '@/components/tareas/FilterChip'
import { TareaDialog } from '@/components/tareas/TareaDialog'
import { DeleteDialog } from '@/components/tareas/DeleteDialog'
import { DetailDialog } from '@/components/tareas/DetailDialog'
import { NotificarDialog } from '@/components/tareas/NotificarDialog'
import type { Tarea, UsuarioBasico, NotificarData, Tipo, Prioridad, Estado } from '@/components/tareas/types'

export default function TareasPage() {
  const user = useAuthStore(state => state.user)

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

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    fetchTareas()
    fetchUsuarios()
  }, [user])

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
    } catch {
      /* silent */
    }
  }

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

  useEffect(() => {
    if (!pendingOpenId || tareas.length === 0) return
    const tarea = tareas.find(t => t.id === pendingOpenId)
    if (!tarea) return
    setPendingOpenId(null)
    setPendingHighlightId(tarea.id)
    setDetailTarget(tarea)
  }, [tareas, pendingOpenId])

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async function handleSave(formData: {
    titulo: string
    descripcion: string
    tipo: Tipo
    prioridad: Prioridad
    version: string
    asignado_a: number | null
  }) {
    setSaving(true)
    try {
      if (editTarget) {
        const res = await apiFetch(API_ENDPOINTS.TAREAS.UPDATE(editTarget.id), {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setTareas(prev => prev.map(t => (t.id === editTarget.id ? data.data : t)))
        toast.success('Tarea actualizada')
      } else {
        const res = await apiFetch(API_ENDPOINTS.TAREAS.CREATE, {
          method: 'POST',
          body: JSON.stringify({ ...formData, creado_por: user?.id ?? null }),
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
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTareas(prev => prev.map(t => (t.id === tarea.id ? data.data : t)))
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
        method: 'PATCH',
        body: JSON.stringify({ asignado_a: usuarioId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setTareas(prev => prev.map(t => (t.id === tareaId ? data.data : t)))
      setDetailTarget(data.data)
      toast.success('Tarea asignada')
    } catch {
      toast.error('Error al asignar la tarea')
    }
  }

  function handleCommentAdded(tareaId: number) {
    setTareas(prev => prev.map(t => (t.id === tareaId ? { ...t, comentarios_count: t.comentarios_count + 1 } : t)))
  }

  function handleCommentDeleted(tareaId: number) {
    setTareas(prev =>
      prev.map(t => (t.id === tareaId ? { ...t, comentarios_count: Math.max(0, t.comentarios_count - 1) } : t)),
    )
  }

  function handleCommentSent(descripcion: string, tareaId: number) {
    setNotificarData({ tipo: 'comentario', descripcion, tareaId })
  }

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

  // ─── Filters ─────────────────────────────────────────────────────────────────

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
        if (filterVersion === 'sin_version') {
          if (t.version) return false
        } else {
          if (t.version !== filterVersion) return false
        }
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

  const stats = useMemo(
    () => ({
      total: tareas.length,
      pendientes: tareas.filter(t => t.estado === 'pendiente').length,
      enProgreso: tareas.filter(t => t.estado === 'en_progreso').length,
      enPruebas: tareas.filter(t => t.estado === 'en_pruebas').length,
      completados: tareas.filter(t => t.estado === 'completado').length,
    }),
    [tareas],
  )

  const hasActiveFilters = filterTipo !== 'all' || filterPrioridad !== 'all' || filterVersion !== 'all' || !!searchQuery

  return (
    <div className="min-h-full bg-slate-100 flex flex-col">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#002868] tracking-tight">Tablero de Tareas</h1>
              <p className="text-slate-500 text-sm mt-0.5">Reportá bugs, mejoras e implementaciones para el equipo.</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                onClick={() => {
                  setEditTarget(null)
                  setDialogOpen(true)
                }}
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
              {
                label: 'Pendientes',
                value: stats.pendientes,
                color: 'text-slate-600',
                bg: 'bg-slate-100 border-slate-200',
                icon: <Clock className="w-3 h-3" />,
              },
              {
                label: 'En Progreso',
                value: stats.enProgreso,
                color: 'text-blue-600',
                bg: 'bg-blue-50 border-blue-200',
                icon: <Loader2 className="w-3 h-3" />,
              },
              {
                label: 'En Pruebas',
                value: stats.enPruebas,
                color: 'text-violet-600',
                bg: 'bg-violet-50 border-violet-200',
                icon: <FlaskConical className="w-3 h-3" />,
              },
              {
                label: 'Completadas',
                value: stats.completados,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50 border-emerald-200',
                icon: <CheckCheck className="w-3 h-3" />,
              },
            ].map(s => (
              <div
                key={s.label}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold',
                  s.bg,
                  s.color,
                )}
              >
                {(s as { icon?: React.ReactNode }).icon}
                <span className="font-bold">{s.value}</span>
                <span className="font-medium opacity-70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Filters */}
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
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
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
                <FilterChip active={filterVersion === 'all'} onClick={() => setFilterVersion('all')}>
                  Todas
                </FilterChip>
                {versionesDisponibles.map(v => (
                  <FilterChip key={v} active={filterVersion === v} onClick={() => setFilterVersion(v)}>
                    v{v}
                  </FilterChip>
                ))}
                <FilterChip active={filterVersion === 'sin_version'} onClick={() => setFilterVersion('sin_version')}>
                  Sin versión
                </FilterChip>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {filtered.length} tarea{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterTipo('all')
                  setFilterPrioridad('all')
                  setFilterVersion('all')
                }}
                className="text-xs text-[#002868] hover:underline cursor-pointer font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Kanban */}
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
                <div
                  key={estado}
                  className={cn('flex flex-col gap-3 rounded-2xl p-3 border border-slate-200', cfg.columnBg)}
                >
                  <div className="flex items-center justify-between px-1 py-1">
                    <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                      {cfg.icon} {cfg.label}
                    </div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', cfg.count_bg)}>
                      {cards.length}
                    </span>
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
                          onEdit={tarea => {
                            setEditTarget(tarea)
                            setDialogOpen(true)
                          }}
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
        <a
          href="https://lumarsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#002868] hover:underline font-semibold"
        >
          Lumarsoft
        </a>
      </footer>

      <TareaDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditTarget(null)
        }}
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
        onEdit={t => {
          setDetailTarget(null)
          setEditTarget(t)
          setDialogOpen(true)
        }}
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
