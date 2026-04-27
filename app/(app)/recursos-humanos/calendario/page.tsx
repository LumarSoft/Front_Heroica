'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit2,
  Globe2,
  MapPin,
  MessageSquareText,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { RhCalendarioEvento, RhCalendarioEventoTipo, RhCalendarioTipoNotion } from '@/lib/types'

const EVENTOS: RhCalendarioEventoTipo[] = ['Capacitación', 'Reunión', 'Comunicado', 'Vencimiento', 'Evento interno', 'Otro']
const TIPOS_NOTION: RhCalendarioTipoNotion[] = ['General', 'Invitación', 'Comunicado', 'Recordatorio']

interface EventoForm {
  evento: RhCalendarioEventoTipo
  fecha: string
  hora: string
  direccion: string
  participantes: string
  comentarios: string
  tipo_notion: RhCalendarioTipoNotion
}

const emptyForm = (fecha: string): EventoForm => ({
  evento: 'Comunicado',
  fecha,
  hora: '',
  direccion: '',
  participantes: '',
  comentarios: '',
  tipo_notion: 'General',
})

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  return fromDateInput(value).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function toForm(evento: RhCalendarioEvento): EventoForm {
  return {
    evento: evento.evento,
    fecha: evento.fecha,
    hora: evento.hora ?? '',
    direccion: evento.direccion ?? '',
    participantes: evento.participantes ?? '',
    comentarios: evento.comentarios ?? '',
    tipo_notion: evento.tipo_notion,
  }
}

export default function RecursosHumanosCalendarioPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [eventos, setEventos] = useState<RhCalendarioEvento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RhCalendarioEvento | null>(null)
  const [form, setForm] = useState<EventoForm>(() => emptyForm(toDateInput(new Date())))
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const selectedDateKey = selectedDate ? toDateInput(selectedDate) : toDateInput(new Date())

  useEffect(() => {
    fetchEventos()
  }, [])

  async function fetchEventos() {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiFetch(API_ENDPOINTS.RRHH_CALENDARIO.GET_ALL)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar calendario')
      setEventos(data.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar calendario'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const eventosPorFecha = useMemo(() => {
    const map = new Map<string, RhCalendarioEvento[]>()
    for (const evento of eventos) {
      const list = map.get(evento.fecha) ?? []
      list.push(evento)
      map.set(evento.fecha, list)
    }
    return map
  }, [eventos])

  const selectedEventos = eventosPorFecha.get(selectedDateKey) ?? []
  const highlightedDates = useMemo(() => eventos.map(evento => fromDateInput(evento.fecha)), [eventos])

  function openCreateDialog() {
    setEditing(null)
    setForm(emptyForm(selectedDateKey))
    setDialogOpen(true)
  }

  function openEditDialog(evento: RhCalendarioEvento) {
    setEditing(evento)
    setForm(toForm(evento))
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.fecha) {
      toast.error('Seleccioná una fecha')
      return
    }

    setSaving(true)
    try {
      const response = await apiFetch(
        editing ? API_ENDPOINTS.RRHH_CALENDARIO.UPDATE(editing.id) : API_ENDPOINTS.RRHH_CALENDARIO.CREATE,
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al guardar evento')

      if (editing) {
        setEventos(prev => prev.map(evento => (evento.id === editing.id ? data.data : evento)))
        toast.success('Evento actualizado')
      } else {
        setEventos(prev => [...prev, data.data].sort((a, b) => `${a.fecha}${a.hora ?? ''}`.localeCompare(`${b.fecha}${b.hora ?? ''}`)))
        toast.success('Evento creado')
      }

      setDialogOpen(false)
      setEditing(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar evento')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(evento: RhCalendarioEvento) {
    setDeletingId(evento.id)
    try {
      const response = await apiFetch(API_ENDPOINTS.RRHH_CALENDARIO.DELETE(evento.id), { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al eliminar evento')
      setEventos(prev => prev.filter(item => item.id !== evento.id))
      toast.success('Evento eliminado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar evento')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push('/recursos-humanos')}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
              aria-label="Volver a recursos humanos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                Calendario general
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0 shadow-sm">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A93BB] mb-1">General</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#002868]">Calendario de RRHH</h2>
              <p className="text-[#666666] text-base sm:text-lg mt-1">
                Eventos, invitaciones y comunicados compartidos por toda la compañía.
              </p>
            </div>
          </div>

          <Button onClick={openCreateDialog} className="bg-[#002868] text-white hover:bg-[#003d8f] rounded-2xl px-5 py-5">
            <Plus className="w-4 h-4" />
            Nuevo evento
          </Button>
        </div>

        <ErrorBanner error={error} />

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 max-w-7xl">
          <Card className="bg-white border-[#D8E3F8] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-[#002868] flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Calendario 2026
              </CardTitle>
              <Button
                onClick={openCreateDialog}
                size="icon"
                className="rounded-full bg-[#002868] text-white hover:bg-[#003d8f]"
                aria-label="Crear evento"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="mx-auto"
                buttonVariant="outline"
                modifiers={{ conEventos: highlightedDates }}
                modifiersClassNames={{
                  conEventos: 'after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-[#D4AF37]',
                }}
              />

              <div className="mt-6 rounded-2xl border border-dashed border-[#D8E3F8] bg-[#F8FAFF] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#9AA0AC] mb-1">Fecha seleccionada</p>
                <p className="text-lg font-semibold text-[#1A1A1A]">
                  {selectedDate ? formatDate(selectedDateKey) : 'Sin fecha seleccionada'}
                </p>
                <p className="text-sm text-[#666666] mt-1">
                  {selectedEventos.length === 1
                    ? '1 evento cargado'
                    : `${selectedEventos.length} eventos cargados`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#D8E3F8] shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[#E8EDF8]">
              <CardTitle className="text-[#002868] flex items-center gap-2">
                <Globe2 className="w-5 h-5" />
                Agenda global
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <LoadingSpinner />
                </div>
              ) : selectedEventos.length === 0 ? (
                <div className="p-8 sm:p-10 min-h-[360px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#EAF0FF] flex items-center justify-center mb-6">
                    <Globe2 className="w-8 h-8 text-[#002868]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#002868] mb-3">Sin eventos para esta fecha</h3>
                  <p className="text-[#666666] leading-relaxed max-w-xl">
                    Esta agenda vive fuera de la gestión individual por sucursal. Usá el botón `+` para cargar
                    invitaciones, comunicados o eventos generales.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E8EDF8]">
                  {selectedEventos.map(evento => (
                    <article key={evento.id} className="p-5 sm:p-6 hover:bg-[#F8FAFF] transition-colors">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex rounded-full border border-[#D8E3F8] bg-[#EAF0FF] px-3 py-1 text-xs font-bold text-[#002868]">
                              {evento.evento}
                            </span>
                            <span className="inline-flex rounded-full border border-[#EFE3BC] bg-[#FFF8E1] px-3 py-1 text-xs font-bold text-[#8A6D1D]">
                              {evento.tipo_notion}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold text-[#002868]">{evento.evento}</h3>
                          <p className="text-sm font-medium text-[#666666] mt-1 capitalize">{formatDate(evento.fecha)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(evento)} aria-label="Editar evento">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(evento)}
                            disabled={deletingId === evento.id}
                            className="text-rose-600 hover:text-rose-700"
                            aria-label="Eliminar evento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#4B5563]">
                        {evento.hora && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#002868]" />
                            {evento.hora}
                          </div>
                        )}
                        {evento.direccion && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#002868]" />
                            {evento.direccion}
                          </div>
                        )}
                        {evento.participantes && (
                          <div className="flex items-start gap-2 md:col-span-2">
                            <Users className="w-4 h-4 text-[#002868] mt-0.5" />
                            <span>{evento.participantes}</span>
                          </div>
                        )}
                        {evento.comentarios && (
                          <div className="flex items-start gap-2 md:col-span-2">
                            <MessageSquareText className="w-4 h-4 text-[#002868] mt-0.5" />
                            <span>{evento.comentarios}</span>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002868]">
              {editing ? 'Editar evento' : 'Nuevo evento de RRHH'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Evento</Label>
              <Select value={form.evento} onValueChange={value => setForm(prev => ({ ...prev, evento: value as RhCalendarioEventoTipo }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar evento" />
                </SelectTrigger>
                <SelectContent>
                  {EVENTOS.map(evento => (
                    <SelectItem key={evento} value={evento}>
                      {evento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo Notion</Label>
              <Select
                value={form.tipo_notion}
                onValueChange={value => setForm(prev => ({ ...prev, tipo_notion: value as RhCalendarioTipoNotion }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_NOTION.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={event => setForm(prev => ({ ...prev, fecha: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={form.hora}
                onChange={event => setForm(prev => ({ ...prev, hora: event.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                placeholder="Lugar físico o enlace de reunión"
                onChange={event => setForm(prev => ({ ...prev, direccion: event.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="participantes">Participantes</Label>
              <Textarea
                id="participantes"
                value={form.participantes}
                placeholder="Todos, áreas involucradas o personas invitadas"
                onChange={event => setForm(prev => ({ ...prev, participantes: event.target.value }))}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="comentarios">Comentarios</Label>
              <Textarea
                id="comentarios"
                value={form.comentarios}
                placeholder="Detalle del comunicado, agenda o información adicional"
                onChange={event => setForm(prev => ({ ...prev, comentarios: event.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#002868] text-white hover:bg-[#003d8f]">
              {saving ? 'Guardando...' : 'Guardar evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
