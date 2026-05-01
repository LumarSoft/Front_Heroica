'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Filter,
  UserPlus,
  UserMinus,
  Umbrella,
  FileText,
  AlertTriangle,
  GraduationCap,
  Package,
  TrendingUp,
  Star,
  Banknote,
  Loader2,
  MinusCircle,
  Timer,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { ErrorBanner } from '@/components/ui/error-banner'
import type { RhSolicitud, RhSolicitudTipo, RhSolicitudEstado } from '@/lib/types'

// ─── Configuración visual por tipo ────────────────────────────────────────────

interface TipoConfig {
  label: string
  icon: ReactNode
  textColor: string
  bgColor: string
  borderColor: string
}

const TIPO_CONFIG: Record<RhSolicitudTipo, TipoConfig> = {
  Altas: {
    label: 'Alta',
    icon: <UserPlus className="w-4 h-4" />,
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-l-indigo-400',
  },
  Bajas: {
    label: 'Baja',
    icon: <UserMinus className="w-4 h-4" />,
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-l-rose-400',
  },
  Vacaciones: {
    label: 'Vacaciones',
    icon: <Umbrella className="w-4 h-4" />,
    textColor: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-l-sky-400',
  },
  Licencias: {
    label: 'Licencia',
    icon: <FileText className="w-4 h-4" />,
    textColor: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-l-violet-400',
  },
  Suspensiones: {
    label: 'Suspensión',
    icon: <X className="w-4 h-4" />,
    textColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-orange-400',
  },
  Apercibimientos: {
    label: 'Apercibimiento',
    icon: <AlertTriangle className="w-4 h-4" />,
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-400',
  },
  Capacitaciones: {
    label: 'Capacitación',
    icon: <GraduationCap className="w-4 h-4" />,
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-l-emerald-400',
  },
  'Pedido de uniforme': {
    label: 'Uniforme',
    icon: <Package className="w-4 h-4" />,
    textColor: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-l-teal-400',
  },
  'Novedades de sueldo': {
    label: 'Novedad de sueldo',
    icon: <TrendingUp className="w-4 h-4" />,
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-400',
  },
  'Incentivos y premios': {
    label: 'Incentivo / Premio',
    icon: <Star className="w-4 h-4" />,
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-amber-400',
  },
  Adelantos: {
    label: 'Adelanto',
    icon: <Banknote className="w-4 h-4" />,
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-l-cyan-400',
  },
  Descuentos: {
    label: 'Descuento',
    icon: <MinusCircle className="w-4 h-4" />,
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-l-red-400',
  },
  'Horas extras': {
    label: 'Horas extras',
    icon: <Timer className="w-4 h-4" />,
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-l-purple-400',
  },
}

const TIPOS_FILTRO: Array<{ value: RhSolicitudTipo | ''; label: string }> = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Vacaciones', label: 'Vacaciones' },
  { value: 'Licencias', label: 'Licencias' },
  { value: 'Capacitaciones', label: 'Capacitaciones' },
  { value: 'Apercibimientos', label: 'Apercibimientos' },
  { value: 'Suspensiones', label: 'Suspensiones' },
  { value: 'Pedido de uniforme', label: 'Uniformes' },
  { value: 'Novedades de sueldo', label: 'Novedades de sueldo' },
  { value: 'Incentivos y premios', label: 'Incentivos y premios' },
  { value: 'Adelantos', label: 'Adelantos' },
  { value: 'Descuentos', label: 'Descuentos' },
  { value: 'Horas extras', label: 'Horas extras' },
  { value: 'Bajas', label: 'Bajas' },
  { value: 'Altas', label: 'Altas' },
]

const ESTADOS_FILTRO: Array<{ value: RhSolicitudEstado | ''; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Aprobada', label: 'Aprobada' },
  { value: 'Rechazada', label: 'Rechazada' },
  { value: 'Cancelada', label: 'Cancelada' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  try {
    const [year, month, day] = fecha.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  } catch {
    return fecha
  }
}

function formatCurrency(value: unknown): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: RhSolicitudEstado }) {
  const map: Record<RhSolicitudEstado, { cls: string; icon: ReactNode }> = {
    Pendiente: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3 h-3" /> },
    Aprobada: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
    Rechazada: { cls: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle className="w-3 h-3" /> },
    Cancelada: { cls: 'bg-slate-50 text-slate-500 border-slate-200', icon: <X className="w-3 h-3" /> },
  }
  const { cls, icon } = map[estado]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${cls}`}
    >
      {icon}
      {estado}
    </span>
  )
}

// ─── Chips de detalles ────────────────────────────────────────────────────────

function Chip({ children, highlight }: { children: ReactNode; highlight?: 'amber' | 'orange' | 'red' }) {
  const color =
    highlight === 'red'
      ? 'bg-red-50 text-red-700 border-red-200'
      : highlight === 'orange'
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : highlight === 'amber'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-[#F3F6FB] text-[#5A6070] border-[#E5E9F0]'
  return <span className={`text-xs px-2 py-0.5 rounded-md border ${color}`}>{children}</span>
}

function DetallesChips({ solicitud }: { solicitud: RhSolicitud }) {
  const d = (solicitud.detalles ?? {}) as Record<string, unknown>
  const chips: ReactNode[] = []

  if (solicitud.tipo === 'Altas') {
    if (d.fecha_incorporacion) chips.push(<Chip key="fi">Ingreso: {formatFecha(String(d.fecha_incorporacion))}</Chip>)
    chips.push(<Chip key="carnet">{d.carnet_manipulacion_alimentos ? 'Con carnet' : 'Sin carnet'}</Chip>)
  } else if (solicitud.tipo === 'Bajas') {
    if (d.fecha_baja) chips.push(<Chip key="fb">Fecha baja: {formatFecha(String(d.fecha_baja))}</Chip>)
    if (d.motivo_baja) chips.push(<Chip key="m">{String(d.motivo_baja)}</Chip>)
  } else if (solicitud.tipo === 'Vacaciones') {
    if (d.fecha_desde) chips.push(<Chip key="fd">Desde: {formatFecha(String(d.fecha_desde))}</Chip>)
    if (d.fecha_hasta) chips.push(<Chip key="fh">Hasta: {formatFecha(String(d.fecha_hasta))}</Chip>)
    if (d.cantidad_dias)
      chips.push(
        <Chip key="dias">
          {Number(d.cantidad_dias)} día{Number(d.cantidad_dias) !== 1 ? 's' : ''}
        </Chip>,
      )
  } else if (solicitud.tipo === 'Licencias') {
    if (d.tipo_licencia) chips.push(<Chip key="tl">{String(d.tipo_licencia)}</Chip>)
    if (d.fecha_desde) chips.push(<Chip key="fd">Desde: {formatFecha(String(d.fecha_desde))}</Chip>)
    if (d.fecha_hasta) chips.push(<Chip key="fh">Hasta: {formatFecha(String(d.fecha_hasta))}</Chip>)
    if (d.motivo) chips.push(<Chip key="m">{String(d.motivo)}</Chip>)
  } else if (solicitud.tipo === 'Novedades de sueldo') {
    if (d.sueldo_actual !== undefined && d.sueldo_nuevo !== undefined)
      chips.push(
        <Chip key="s">
          {formatCurrency(d.sueldo_actual)} → {formatCurrency(d.sueldo_nuevo)}
        </Chip>,
      )
    if (d.fecha_vigencia) chips.push(<Chip key="fv">Desde: {formatFecha(String(d.fecha_vigencia))}</Chip>)
    if (d.motivo) chips.push(<Chip key="m">{String(d.motivo)}</Chip>)
  } else if (solicitud.tipo === 'Apercibimientos') {
    const sev = String(d.severidad ?? '')
    const sevHighlight = sev === 'Grave' ? 'red' : sev === 'Moderada' ? 'orange' : sev === 'Leve' ? 'amber' : undefined
    if (d.fecha) chips.push(<Chip key="f">{formatFecha(String(d.fecha))}</Chip>)
    if (d.severidad)
      chips.push(
        <Chip key="s" highlight={sevHighlight}>
          Severidad: {sev}
        </Chip>,
      )
    if (d.motivo) chips.push(<Chip key="m">{String(d.motivo)}</Chip>)
  } else {
    // Tipos sin estructura fija: mostrar campos genéricos
    const SKIP = new Set(['id', 'created_at', 'updated_at'])
    Object.entries(d).forEach(([key, val]) => {
      if (SKIP.has(key) || val === null || val === undefined || val === '') return
      const label = key.replaceAll('_', ' ')
      const valueStr = typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val) ? formatFecha(val) : String(val)
      chips.push(
        <Chip key={key}>
          {label}: {valueStr}
        </Chip>,
      )
    })
  }

  if (solicitud.observaciones) {
    chips.push(<Chip key="obs">Obs: {solicitud.observaciones}</Chip>)
  }

  if (chips.length === 0) return null
  return <div className="flex flex-wrap gap-1.5 mt-2.5">{chips}</div>
}

// ─── Tarjeta de solicitud ─────────────────────────────────────────────────────

function SolicitudCard({ solicitud }: { solicitud: RhSolicitud }) {
  const config = TIPO_CONFIG[solicitud.tipo]

  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E9F0] border-l-4 ${config.borderColor} p-4 hover:shadow-sm transition-shadow`}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`flex-shrink-0 p-1.5 rounded-lg ${config.bgColor} ${config.textColor}`}>{config.icon}</span>
          <span className="text-sm font-semibold text-[#1A1A1A]">{config.label}</span>
        </div>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#888]">
        <span className="font-medium text-[#5A6070]">{formatFecha(solicitud.fecha_solicitud)}</span>
        <span>
          Solicitada por <strong className="text-[#5A6070]">{solicitud.usuario_nombre}</strong>
        </span>
        {solicitud.resuelto_por_nombre && solicitud.estado !== 'Pendiente' && (
          <span>
            {solicitud.estado === 'Aprobada'
              ? 'Aprobada'
              : solicitud.estado === 'Rechazada'
                ? 'Rechazada'
                : 'Cancelada'}{' '}
            por <strong className="text-[#5A6070]">{solicitud.resuelto_por_nombre}</strong>
            {solicitud.fecha_resolucion && <> · {formatFecha(solicitud.fecha_resolucion)}</>}
          </span>
        )}
      </div>

      {/* Detalles */}
      <DetallesChips solicitud={solicitud} />

      {/* Motivo de rechazo */}
      {solicitud.estado === 'Rechazada' && solicitud.motivo_resolucion && (
        <p className="mt-2.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2.5 py-1.5">
          Motivo de rechazo: {solicitud.motivo_resolucion}
        </p>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface HistorialTabProps {
  personalId: number
}

export function HistorialTab({ personalId }: HistorialTabProps) {
  const [solicitudes, setSolicitudes] = useState<RhSolicitud[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterTipo, setFilterTipo] = useState<RhSolicitudTipo | ''>('')
  const [filterEstado, setFilterEstado] = useState<RhSolicitudEstado | ''>('')

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.GET_BY_PERSONAL(personalId))
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(data.message || 'Error al cargar el historial')
        setSolicitudes(data.data ?? [])
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar el historial')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [personalId])

  const filtered = useMemo(() => {
    return solicitudes.filter(s => {
      if (filterTipo && s.tipo !== filterTipo) return false
      if (filterEstado && s.estado !== filterEstado) return false
      return true
    })
  }, [solicitudes, filterTipo, filterEstado])

  const hasFilters = !!(filterTipo || filterEstado)
  const selectCls =
    'h-8 rounded-lg border border-[#D8E3F8] bg-white px-2.5 text-xs text-[#444] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 cursor-pointer'

  return (
    <div>
      {/* Encabezado y filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">Historial del colaborador</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value as RhSolicitudTipo | '')}
            className={selectCls}
          >
            {TIPOS_FILTRO.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value as RhSolicitudEstado | '')}
            className={selectCls}
          >
            {ESTADOS_FILTRO.map(e => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                setFilterTipo('')
                setFilterEstado('')
              }}
              className="text-xs text-[#002868] underline underline-offset-2 hover:text-[#003d8f] cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <ErrorBanner error={error} />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#002868]/40" />
        </div>
      )}

      {/* Contenido */}
      {!isLoading &&
        !error &&
        (filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F3F6FB] flex items-center justify-center mb-3">
              <Filter className="w-5 h-5 text-[#B0B8C4]" />
            </div>
            <p className="text-sm font-medium text-[#666]">
              {solicitudes.length === 0
                ? 'No hay novedades registradas para este colaborador.'
                : 'No hay registros que coincidan con los filtros seleccionados.'}
            </p>
            {hasFilters && solicitudes.length > 0 && (
              <button
                onClick={() => {
                  setFilterTipo('')
                  setFilterEstado('')
                }}
                className="mt-2 text-xs text-[#002868] underline underline-offset-2 cursor-pointer"
              >
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#9AA0AC]">
              {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
              {solicitudes.length !== filtered.length && ` de ${solicitudes.length} totales`}
            </p>
            {filtered.map(solicitud => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud} />
            ))}
          </div>
        ))}
    </div>
  )
}
