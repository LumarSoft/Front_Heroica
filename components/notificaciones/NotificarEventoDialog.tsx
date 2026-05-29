'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCheck, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS, type NotificacionEventoTipo } from '@/lib/config'
import { Avatar } from '@/components/tareas/Avatar'

interface Destinatario {
  id: number
  nombre: string
  email: string
  sugerido: boolean
  motivo_sugerido?: string
}

interface DestinatariosResponse {
  success: boolean
  message?: string
  data?: {
    contexto: { titulo: string; resumen: string; tipoLabel: string }
    destinatarios: Destinatario[]
  }
}

export interface NotificarEventoData {
  tipo: NotificacionEventoTipo
  entidadId: number
}

interface Props {
  data: NotificarEventoData | null
  onClose: () => void
}

export function NotificarEventoDialog({ data, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([])
  const [contexto, setContexto] = useState<{ titulo: string; resumen: string; tipoLabel: string } | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [mensaje, setMensaje] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!data) {
      abortRef.current?.abort()
      return
    }
    let active = true
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setDestinatarios([])
    setSelected(new Set())
    setMensaje('')
    setQuery('')
    setContexto(null)

    apiFetch(API_ENDPOINTS.NOTIFICACIONES.EMAIL_DESTINATARIOS(data.tipo, data.entidadId), {
      signal: controller.signal,
    })
      .then(async res => {
        const json = (await res.json()) as DestinatariosResponse
        if (!active) return
        if (!res.ok || !json.success || !json.data) {
          setError(json.message ?? 'No se pudieron cargar los destinatarios')
          return
        }
        setDestinatarios(json.data.destinatarios)
        setContexto(json.data.contexto)
        const sugeridosIds = new Set(json.data.destinatarios.filter(d => d.sugerido).map(d => d.id))
        setSelected(sugeridosIds)
      })
      .catch(err => {
        if (!active || err?.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Error al cargar destinatarios')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [data])

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return destinatarios
    return destinatarios.filter(d => d.nombre.toLowerCase().includes(q) || d.email.toLowerCase().includes(q))
  }, [destinatarios, query])

  const sugeridos = useMemo(() => filtrados.filter(d => d.sugerido), [filtrados])
  const otros = useMemo(() => filtrados.filter(d => !d.sugerido), [filtrados])

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSugeridos() {
    const sugeridosIds = destinatarios.filter(d => d.sugerido).map(d => d.id)
    const allSelected = sugeridosIds.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) sugeridosIds.forEach(id => next.delete(id))
      else sugeridosIds.forEach(id => next.add(id))
      return next
    })
  }

  function clearAll() {
    setSelected(new Set())
  }

  async function handleSend() {
    if (!data || selected.size === 0) return
    setSending(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.NOTIFICACIONES.EMAIL_ENVIAR, {
        method: 'POST',
        body: JSON.stringify({
          tipo: data.tipo,
          entidad_id: data.entidadId,
          destinatarios_usuario_ids: Array.from(selected),
          mensaje_extra: mensaje.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message ?? 'No se pudo enviar la notificación')
        return
      }
      const count = json.data?.enviados ?? selected.size
      toast.success(`Notificación enviada a ${count} ${count === 1 ? 'persona' : 'personas'}`)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar la notificación')
    } finally {
      setSending(false)
    }
  }

  function handleSkip() {
    if (sending) return
    onClose()
  }

  const open = !!data
  const totalDisponibles = destinatarios.length
  const haySugeridos = destinatarios.some(d => d.sugerido)

  return (
    <Dialog open={open} onOpenChange={v => !v && handleSkip()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#002868] flex items-center gap-2">
            <Bell className="w-4.5 h-4.5" />
            ¿Querés avisar a alguien?
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Elegí a qué usuarios enviarles un email con esta novedad. Si no querés notificar, podés omitir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-1 pr-1 -mr-1">
          {contexto && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl border bg-blue-50 border-blue-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{contexto.titulo}</p>
                <p className="text-xs text-slate-600 mt-0.5 truncate">{contexto.resumen}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-[#002868] rounded-full animate-spin mr-2" />
              Cargando destinatarios...
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : totalDisponibles === 0 ? (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-sm text-slate-500 text-center">
              No hay otros usuarios con email disponibles para notificar.
            </div>
          ) : (
            <>
              {totalDisponibles > 6 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar usuarios..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {selected.size > 0
                    ? `${selected.size} seleccionado${selected.size === 1 ? '' : 's'}`
                    : 'Ninguno seleccionado'}
                </span>
                <div className="flex items-center gap-3">
                  {haySugeridos && (
                    <button
                      type="button"
                      onClick={toggleSugeridos}
                      className="text-[#002868] hover:underline font-medium"
                    >
                      Alternar sugeridos
                    </button>
                  )}
                  {selected.size > 0 && (
                    <button type="button" onClick={clearAll} className="text-slate-500 hover:text-slate-700">
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {sugeridos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Sugeridos
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {sugeridos.map(d => (
                      <UsuarioRow
                        key={d.id}
                        destinatario={d}
                        selected={selected.has(d.id)}
                        onToggle={() => toggle(d.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {otros.length > 0 && (
                <div>
                  {sugeridos.length > 0 && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Otros usuarios</p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {otros.map(d => (
                      <UsuarioRow
                        key={d.id}
                        destinatario={d}
                        selected={selected.has(d.id)}
                        onToggle={() => toggle(d.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filtrados.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-3">Sin resultados para "{query}"</p>
              )}

              <div>
                <Label className="text-sm font-semibold text-slate-700">
                  Mensaje adicional <span className="font-normal text-slate-400">(opcional)</span>
                </Label>
                <textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Agregá un comentario si querés contextualizar el aviso..."
                  rows={3}
                  className="w-full mt-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#002868] focus:ring-1 focus:ring-[#002868] resize-none placeholder:text-slate-400"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleSkip} disabled={sending} className="cursor-pointer">
            No notificar
          </Button>
          <Button
            onClick={handleSend}
            disabled={selected.size === 0 || sending || loading || !!error}
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

function UsuarioRow({
  destinatario,
  selected,
  onToggle,
}: {
  destinatario: Destinatario
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all cursor-pointer',
        selected
          ? 'bg-[#002868] text-white border-[#002868]'
          : 'bg-white text-slate-700 border-slate-200 hover:border-[#002868]/40',
      )}
    >
      <Avatar name={destinatario.nombre} size="md" />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', selected ? 'text-white' : 'text-slate-800')}>
          {destinatario.nombre}
        </p>
        <p className={cn('text-xs truncate', selected ? 'text-white/70' : 'text-slate-500')}>
          {destinatario.motivo_sugerido
            ? `${destinatario.motivo_sugerido} · ${destinatario.email}`
            : destinatario.email}
        </p>
      </div>
      {selected && <CheckCheck className="w-4 h-4 opacity-90 shrink-0" />}
    </button>
  )
}
