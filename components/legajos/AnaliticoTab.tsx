'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { AlertTriangle, Clock, DollarSign, Loader2, Star, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SueldoPunto {
  periodo: string
  sueldo_base: number
  valor_hora: number | null
}

interface ApercibimientoPunto {
  periodo: string
  leve: number
  moderada: number
  grave: number
  total: number
}

interface IncentivoPunto {
  periodo: string
  monto: number
  cantidad: number
}

interface HorasExtrasPunto {
  periodo: string
  horas: number
}

interface Resumen {
  total_apercibimientos: number
  total_incentivos_monto: number
  total_horas_extras: number
  variacion_sueldo_pct: number | null
}

interface AnaliticoData {
  sueldos: SueldoPunto[]
  apercibimientos: ApercibimientoPunto[]
  incentivos: IncentivoPunto[]
  horas_extras: HorasExtrasPunto[]
  resumen: Resumen
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoneda(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartCard({
  icon: Icon,
  title,
  subtitle,
  children,
  isEmpty,
  emptyLabel,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
  children: React.ReactNode
  isEmpty?: boolean
  emptyLabel?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[#5A6070]" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none">{title}</p>
          {subtitle && <p className="text-[10px] text-[#B0B8C4] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {isEmpty ? (
        <div className="flex items-center justify-center h-[180px]">
          <p className="text-sm text-[#B0B8C4]">{emptyLabel ?? 'Sin datos disponibles.'}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function StatBadge({
  label,
  value,
  sub,
  color = 'blue',
}: {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'amber'
}) {
  const colorMap = {
    blue: 'bg-[#EEF3FF] text-[#002868]',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className={`rounded-xl px-4 py-3 ${colorMap[color]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-lg font-bold leading-none">{value}</p>
      {sub && <p className="text-[10px] mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

function TooltipSueldo({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-[#1A1A1A] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatMoneda(p.value)}
        </p>
      ))}
    </div>
  )
}

function TooltipGeneric({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-[#1A1A1A] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Chart components ────────────────────────────────────────────────────────

function SueldosChart({ data }: { data: SueldoPunto[] }) {
  const hasValorHora = data.some(d => d.valor_hora != null)
  return (
    <ChartCard
      icon={DollarSign}
      title="Evolución Salarial"
      subtitle="Escala del puesto — últimos períodos"
      isEmpty={data.length === 0}
      emptyLabel="Sin escalas salariales registradas para este puesto."
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSueldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#002868" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#002868" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradHora" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" />
          <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#9AA0AC' }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: '#9AA0AC' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<TooltipSueldo />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area
            type="monotone"
            dataKey="sueldo_base"
            name="Sueldo base"
            stroke="#002868"
            strokeWidth={2}
            fill="url(#gradSueldo)"
            dot={{ r: 3, fill: '#002868', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          {hasValorHora && (
            <Area
              type="monotone"
              dataKey="valor_hora"
              name="Valor hora"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradHora)"
              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function ApercibimientosChart({ data }: { data: ApercibimientoPunto[] }) {
  return (
    <ChartCard
      icon={AlertTriangle}
      title="Apercibimientos"
      subtitle="Por mes — apilados por severidad"
      isEmpty={data.length === 0}
      emptyLabel="Sin apercibimientos registrados."
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
          <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#9AA0AC' }} tickLine={false} axisLine={false} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#9AA0AC' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<TooltipGeneric />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="leve" name="Leve" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
          <Bar dataKey="moderada" name="Moderada" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
          <Bar dataKey="grave" name="Grave" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function IncentivosChart({ data }: { data: IncentivoPunto[] }) {
  return (
    <ChartCard
      icon={Star}
      title="Incentivos y Premios"
      subtitle="Monto acumulado por mes"
      isEmpty={data.length === 0}
      emptyLabel="Sin incentivos ni premios registrados."
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
          <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#9AA0AC' }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: '#9AA0AC' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<TooltipGeneric formatter={formatMoneda} />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="monto" name="Monto" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

function HorasExtrasChart({ data }: { data: HorasExtrasPunto[] }) {
  return (
    <ChartCard
      icon={Clock}
      title="Horas Extras"
      subtitle="Horas acumuladas por mes"
      isEmpty={data.length === 0}
      emptyLabel="Sin horas extras registradas."
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
          <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#9AA0AC' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9AA0AC' }} tickLine={false} axisLine={false} width={28} />
          <Tooltip content={<TooltipGeneric formatter={(v: number) => `${v} h`} />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Bar dataKey="horas" name="Horas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnaliticoTab({ personalId }: { personalId: number }) {
  const [data, setData] = useState<AnaliticoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.PERSONAL.GET_ANALITICO(personalId))
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
    return () => {
      cancelled = true
    }
  }, [personalId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#9AA0AC] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
        <p className="text-sm text-rose-700">{error || 'Error al cargar datos analíticos'}</p>
      </div>
    )
  }

  const { resumen } = data

  return (
    <div className="space-y-4">
      {/* KPIs resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge
          label="Variación salarial"
          value={
            resumen.variacion_sueldo_pct != null
              ? `${resumen.variacion_sueldo_pct > 0 ? '+' : ''}${resumen.variacion_sueldo_pct}%`
              : '—'
          }
          sub="respecto al primer período"
          color={resumen.variacion_sueldo_pct != null && resumen.variacion_sueldo_pct >= 0 ? 'green' : 'red'}
        />
        <StatBadge
          label="Apercibimientos"
          value={String(resumen.total_apercibimientos)}
          sub="total aprobados"
          color={resumen.total_apercibimientos > 0 ? 'red' : 'green'}
        />
        <StatBadge
          label="Incentivos"
          value={formatMoneda(resumen.total_incentivos_monto)}
          sub="total acumulado"
          color="blue"
        />
        <StatBadge
          label="Horas extras"
          value={`${resumen.total_horas_extras} h`}
          sub="total acumuladas"
          color="amber"
        />
      </div>

      {/* Gráfico evolución salarial (ancho completo) */}
      <SueldosChart data={data.sueldos} />

      {/* Gráficos secundarios en grilla */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncentivosChart data={data.incentivos} />
        <ApercibimientosChart data={data.apercibimientos} />
      </div>

      <HorasExtrasChart data={data.horas_extras} />
    </div>
  )
}
