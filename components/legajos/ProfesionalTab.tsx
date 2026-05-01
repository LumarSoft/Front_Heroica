'use client'

import { useEffect, useState, useRef, type ReactNode } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock, DollarSign, FileText,
  Loader2, MessageSquare, MinusCircle, Plus, Shield, Star,
  TrendingDown, TrendingUp, Trash2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PeriodoPrueba {
  en_periodo: boolean
  dias_transcurridos: number
  dias_restantes: number
  dias_totales: number
  porcentaje: number
  fecha_fin: string
  alerta: boolean
}

interface EscalaActual {
  id: number
  puesto_id: number
  puesto_nombre: string
  sueldo_base: number
  mes: number
  anio: number
  valor_hora: number | null
}

interface SolicitudItem {
  id: number
  tipo: string
  detalles: Record<string, unknown>
  estado: string
  fecha_solicitud: string
  created_at: string
  creador_nombre: string
}

interface Nota {
  id: number
  contenido: string
  usuario_id: number
  usuario_nombre: string
  created_at: string
}

interface ProfesionalData {
  periodo_prueba: PeriodoPrueba
  escala_actual: EscalaActual | null
  apercibimientos: SolicitudItem[]
  adelantos: SolicitudItem[]
  incentivos_premios: SolicitudItem[]
  novedades_sueldo: SolicitudItem[]
  suspensiones: SolicitudItem[]
  descuentos: SolicitudItem[]
  horas_extras: SolicitudItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function formatMoneda(valor: number | string): string {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num)
}

function timeAgo(fecha: string): string {
  const diff = Date.now() - new Date(fecha).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} d`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[#5A6070]" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">{label}</p>
      {count !== undefined && (
        <span className="ml-auto text-xs font-semibold text-[#5A6070] bg-[#F3F4F6] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <p className="text-sm text-[#B0B8C4] py-3 text-center">{label}</p>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── Período de Prueba ────────────────────────────────────────────────────────

function PeriodoPruebaCard({ data }: { data: PeriodoPrueba }) {
  const barColor = data.alerta
    ? 'bg-amber-400'
    : data.en_periodo
    ? 'bg-[#002868]'
    : 'bg-emerald-500'

  return (
    <Card>
      <SectionTitle icon={Clock} label="Período de Prueba" />

      {data.alerta && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            Quedan <span className="font-bold">{data.dias_restantes} días</span> para completar el período de prueba.
          </p>
        </div>
      )}

      {!data.en_periodo && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">Período de prueba completado.</p>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[#5A6070]">
            {data.en_periodo
              ? `${data.dias_transcurridos} de ${data.dias_totales} días`
              : `Completado — ${data.dias_totales} días`}
          </span>
          <span className="text-xs font-bold text-[#002868]">{data.porcentaje}%</span>
        </div>
        <div className="w-full h-2 bg-[#F0F2F5] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${data.porcentaje}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-[#B0B8C4]">
        Vencimiento: {formatFecha(data.fecha_fin)}
        {data.en_periodo && (
          <> · <span className="font-semibold text-[#5A6070]">{data.dias_restantes} días restantes</span></>
        )}
      </p>
    </Card>
  )
}

// ─── Escala Salarial ──────────────────────────────────────────────────────────

function EscalaSalarialCard({ data }: { data: EscalaActual | null }) {
  if (!data) {
    return (
      <Card>
        <SectionTitle icon={DollarSign} label="Remuneración" />
        <EmptyRow label="Sin escala salarial registrada para este puesto." />
      </Card>
    )
  }

  return (
    <Card>
      <SectionTitle icon={DollarSign} label="Remuneración Actual" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#F8F9FA] rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] mb-1">Sueldo Base</p>
          <p className="text-lg font-bold text-[#002868]">{formatMoneda(data.sueldo_base)}</p>
        </div>
        {data.valor_hora != null && (
          <div className="bg-[#F8F9FA] rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] mb-1">Valor Hora</p>
            <p className="text-lg font-bold text-[#002868]">{formatMoneda(data.valor_hora)}</p>
          </div>
        )}
        <div className="bg-[#F8F9FA] rounded-xl p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] mb-1">Período</p>
          <p className="text-sm font-semibold text-[#1A1A1A]">
            {MESES[(data.mes ?? 1) - 1]} {data.anio}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-[#B0B8C4]">Puesto: {data.puesto_nombre}</p>
    </Card>
  )
}

// ─── Apercibimientos ──────────────────────────────────────────────────────────

const SEVERIDAD_CONFIG: Record<string, { label: string; className: string }> = {
  Grave: { label: 'Grave', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  Moderada: { label: 'Moderada', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  Leve: { label: 'Leve', className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

function ApercibimientosSection({ items }: { items: SolicitudItem[] }) {
  return (
    <Card>
      <SectionTitle icon={Shield} label="Apercibimientos" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin apercibimientos registrados." />
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const sev = String(item.detalles?.severidad ?? item.detalles?.nivel ?? 'Leve')
            const cfg = SEVERIDAD_CONFIG[sev] ?? SEVERIDAD_CONFIG.Leve
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-[#B0B8C4]">{formatFecha(item.fecha_solicitud)}</span>
                  </div>
                  {item.detalles?.motivo && (
                    <p className="text-xs text-[#444] line-clamp-2">{String(item.detalles.motivo)}</p>
                  )}
                  <p className="text-[10px] text-[#9AA0AC] mt-1">Por {item.creador_nombre}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Adelantos ────────────────────────────────────────────────────────────────

function AdelantosSection({ items }: { items: SolicitudItem[] }) {
  const total = items.reduce((sum, item) => {
    const monto = parseFloat(String(item.detalles?.monto ?? 0))
    return sum + (isNaN(monto) ? 0 : monto)
  }, 0)

  return (
    <Card>
      <SectionTitle icon={TrendingDown} label="Adelantos" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin adelantos registrados." />
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
              >
                <div>
                  <p className="text-xs text-[#9AA0AC]">{formatFecha(item.fecha_solicitud)}</p>
                  {item.detalles?.motivo && (
                    <p className="text-xs text-[#444] mt-0.5 line-clamp-1">{String(item.detalles.motivo)}</p>
                  )}
                  <p className="text-[10px] text-[#B0B8C4] mt-0.5">Por {item.creador_nombre}</p>
                </div>
                {item.detalles?.monto && (
                  <span className="text-sm font-bold text-rose-600 whitespace-nowrap">
                    -{formatMoneda(Number(item.detalles.monto))}
                  </span>
                )}
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <div className="mt-3 pt-3 border-t border-[#F0F2F5] flex justify-between items-center">
              <span className="text-xs font-semibold text-[#5A6070]">Total adelantos</span>
              <span className="text-sm font-bold text-rose-600">-{formatMoneda(total)}</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

// ─── Suspensiones ─────────────────────────────────────────────────────────────

function SuspensionesSSection({ items }: { items: SolicitudItem[] }) {
  return (
    <Card>
      <SectionTitle icon={MinusCircle} label="Suspensiones" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin suspensiones registradas." />
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.detalles?.dias && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                      {String(item.detalles.dias)} día{Number(item.detalles.dias) !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-[11px] text-[#B0B8C4]">{formatFecha(item.fecha_solicitud)}</span>
                </div>
                {item.detalles?.motivo && (
                  <p className="text-xs text-[#444] line-clamp-2">{String(item.detalles.motivo)}</p>
                )}
                <p className="text-[10px] text-[#9AA0AC] mt-1">Por {item.creador_nombre}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Incentivos y Premios ─────────────────────────────────────────────────────

function IncentivosPremiosSection({ items }: { items: SolicitudItem[] }) {
  return (
    <Card>
      <SectionTitle icon={Star} label="Incentivos y Premios" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin incentivos ni premios registrados." />
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const tipo = String(item.detalles?.tipo ?? 'Incentivo')
            const isIncentivo = tipo === 'Incentivo'
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isIncentivo
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {tipo}
                    </span>
                    <span className="text-[11px] text-[#B0B8C4]">{formatFecha(item.fecha_solicitud)}</span>
                  </div>
                  {item.detalles?.descripcion && (
                    <p className="text-xs text-[#444] line-clamp-1">{String(item.detalles.descripcion)}</p>
                  )}
                  <p className="text-[10px] text-[#9AA0AC] mt-0.5">Por {item.creador_nombre}</p>
                </div>
                {item.detalles?.monto_calculado && (
                  <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                    +{formatMoneda(Number(item.detalles.monto_calculado))}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Novedades de Sueldo ──────────────────────────────────────────────────────

function NovedadesSueldoSection({ items }: { items: SolicitudItem[] }) {
  return (
    <Card>
      <SectionTitle icon={TrendingUp} label="Novedades de Sueldo" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin novedades de sueldo registradas." />
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
            >
              <div className="flex items-center gap-2 mb-1">
                {item.detalles?.tipo && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                    {String(item.detalles.tipo)}
                  </span>
                )}
                <span className="text-[11px] text-[#B0B8C4]">{formatFecha(item.fecha_solicitud)}</span>
              </div>
              {item.detalles?.descripcion && (
                <p className="text-xs text-[#444] line-clamp-2">{String(item.detalles.descripcion)}</p>
              )}
              {item.detalles?.monto && (
                <p className="text-xs font-semibold text-[#002868] mt-1">{formatMoneda(Number(item.detalles.monto))}</p>
              )}
              <p className="text-[10px] text-[#9AA0AC] mt-1">Por {item.creador_nombre}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Descuentos ───────────────────────────────────────────────────────────────

function DescuentosSection({ items }: { items: SolicitudItem[] }) {
  const total = items.reduce((sum, item) => {
    const monto = parseFloat(String(item.detalles?.monto ?? 0))
    return sum + (isNaN(monto) ? 0 : monto)
  }, 0)

  return (
    <Card>
      <SectionTitle icon={TrendingDown} label="Descuentos" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin descuentos registrados." />
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
              >
                <div>
                  <p className="text-xs text-[#9AA0AC]">{formatFecha(item.fecha_solicitud)}</p>
                  {item.detalles?.motivo && (
                    <p className="text-xs text-[#444] mt-0.5 line-clamp-1">{String(item.detalles.motivo)}</p>
                  )}
                  <p className="text-[10px] text-[#B0B8C4] mt-0.5">Por {item.creador_nombre}</p>
                </div>
                {item.detalles?.monto && (
                  <span className="text-sm font-bold text-rose-600 whitespace-nowrap">
                    -{formatMoneda(Number(item.detalles.monto))}
                  </span>
                )}
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <div className="mt-3 pt-3 border-t border-[#F0F2F5] flex justify-between items-center">
              <span className="text-xs font-semibold text-[#5A6070]">Total descuentos</span>
              <span className="text-sm font-bold text-rose-600">-{formatMoneda(total)}</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

// ─── Horas Extras ─────────────────────────────────────────────────────────────

function HorasExtrasSection({ items }: { items: SolicitudItem[] }) {
  const totalHoras = items.reduce((sum, item) => {
    const h = parseFloat(String(item.detalles?.cantidad_horas ?? 0))
    return sum + (isNaN(h) ? 0 : h)
  }, 0)

  return (
    <Card>
      <SectionTitle icon={TrendingUp} label="Horas Extras" count={items.length} />
      {items.length === 0 ? (
        <EmptyRow label="Sin horas extras registradas." />
      ) : (
        <>
          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#9AA0AC]">{formatFecha(item.fecha_solicitud)}</p>
                  {item.detalles?.descripcion && (
                    <p className="text-xs text-[#444] mt-0.5 line-clamp-1">{String(item.detalles.descripcion)}</p>
                  )}
                  <p className="text-[10px] text-[#B0B8C4] mt-0.5">Por {item.creador_nombre}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {item.detalles?.cantidad_horas && (
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">
                      {String(item.detalles.cantidad_horas)} h
                    </span>
                  )}
                  {item.detalles?.valor_hora != null && (
                    <p className="text-[10px] text-[#9AA0AC]">{formatMoneda(Number(item.detalles.valor_hora))}/h</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <div className="mt-3 pt-3 border-t border-[#F0F2F5] flex justify-between items-center">
              <span className="text-xs font-semibold text-[#5A6070]">Total horas</span>
              <span className="text-sm font-bold text-emerald-600">{totalHoras} h</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

// ─── Comentarios Internos ─────────────────────────────────────────────────────

function ComentariosInternosSection({
  personalId,
  canEditar,
}: {
  personalId: number
  canEditar: boolean
}) {
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false
    const fetchNotas = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.PERSONAL.GET_NOTAS(personalId))
        const data = await res.json()
        if (!cancelled) setNotas(data.data ?? [])
      } catch {
        if (!cancelled) toast.error('Error al cargar comentarios')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchNotas()
    return () => { cancelled = true }
  }, [personalId])

  async function handleCreate() {
    if (!texto.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.PERSONAL.CREATE_NOTA(personalId), {
        method: 'POST',
        body: JSON.stringify({ contenido: texto.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Error al guardar'); return }
      setNotas(prev => [data.data, ...prev])
      setTexto('')
      toast.success('Comentario guardado')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(notaId: number) {
    setDeletingId(notaId)
    try {
      const res = await apiFetch(API_ENDPOINTS.PERSONAL.DELETE_NOTA(personalId, notaId), { method: 'DELETE' })
      if (!res.ok) { toast.error('Error al eliminar'); return }
      setNotas(prev => prev.filter(n => n.id !== notaId))
      toast.success('Comentario eliminado')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <SectionTitle icon={MessageSquare} label="Comentarios Internos" count={notas.length} />

      {canEditar && (
        <div className="mb-4">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Agregar un comentario interno sobre este colaborador…"
            rows={3}
            className="w-full text-sm rounded-xl border border-[#E5E9F0] px-3 py-2 resize-none outline-none focus:border-[#002868] focus:ring-2 focus:ring-[#002868]/15 transition placeholder:text-[#C8CCD4]"
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving || !texto.trim()}
              className="h-8 px-3 text-xs bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              {saving ? 'Guardando…' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-[#9AA0AC] animate-spin" />
        </div>
      ) : notas.length === 0 ? (
        <EmptyRow label="Sin comentarios internos." />
      ) : (
        <div className="space-y-2">
          {notas.map(nota => (
            <div
              key={nota.id}
              className="group flex items-start gap-3 border border-[#F0F2F5] rounded-xl p-3 bg-[#FAFBFC] hover:border-[#E0E0E0] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#002868] to-[#1A4CB0] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-white select-none">
                  {nota.usuario_nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1A1A1A]">{nota.usuario_nombre}</span>
                  <span className="text-[10px] text-[#B0B8C4]">{timeAgo(nota.created_at)}</span>
                </div>
                <p className="text-sm text-[#444] mt-0.5 whitespace-pre-wrap break-words">{nota.contenido}</p>
              </div>
              {canEditar && (
                <button
                  onClick={() => handleDelete(nota.id)}
                  disabled={deletingId === nota.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded-lg hover:bg-rose-50 text-[#C8CCD4] hover:text-rose-500 cursor-pointer flex-shrink-0"
                  aria-label="Eliminar comentario"
                >
                  {deletingId === nota.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfesionalTab({ personalId }: { personalId: number }) {
  const [data, setData] = useState<ProfesionalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { canGestionarPersonal, isSuperAdmin } = useAuthStore()

  const canEditar = isSuperAdmin() || canGestionarPersonal()

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.PERSONAL.GET_PROFESIONAL(personalId))
        const json = await res.json()
        if (!res.ok) throw new Error(json.message || 'Error al cargar datos')
        if (!cancelled) setData(json.data)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [personalId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#9AA0AC] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
        <p className="text-sm text-rose-700">{error || 'Error al cargar datos profesionales'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fila 1: Período de prueba + Remuneración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeriodoPruebaCard data={data.periodo_prueba} />
        <EscalaSalarialCard data={data.escala_actual} />
      </div>

      {/* Fila 2: Apercibimientos + Suspensiones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ApercibimientosSection items={data.apercibimientos} />
        <SuspensionesSSection items={data.suspensiones} />
      </div>

      {/* Fila 3: Adelantos + Descuentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdelantosSection items={data.adelantos} />
        <DescuentosSection items={data.descuentos} />
      </div>

      {/* Fila 4: Horas Extras + Incentivos y Premios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HorasExtrasSection items={data.horas_extras} />
        <IncentivosPremiosSection items={data.incentivos_premios} />
      </div>

      {/* Fila 5: Novedades de Sueldo */}
      {data.novedades_sueldo.length > 0 && (
        <NovedadesSueldoSection items={data.novedades_sueldo} />
      )}

      {/* Fila 6: Comentarios internos */}
      <ComentariosInternosSection personalId={personalId} canEditar={canEditar} />
    </div>
  )
}
