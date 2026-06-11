'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Users, Activity } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { formatMonto } from '@/lib/formatters'
import type { Sucursal } from '@/lib/types'

interface AnaliticoData {
  resumen: { empleadosActivos: number; totalAltas: number; totalBajas: number; rotacionNeta: number }
  distribucionArea: Array<{ area: string; cantidad: number }>
  distribucionPuesto: Array<{ puesto: string; cantidad: number }>
  rotacion: Array<{ periodo: string; altas: number; bajas: number }>
  evolucionSalarial: Array<{ periodo: string; sueldoPromedio: number }>
  sueldoPorPuesto: Array<{ puesto: string; sueldoPromedio: number }>
}

const PIE_COLORS = ['#002868', '#2F5BBD', '#5B86E5', '#7FA8F0', '#A9C5F7', '#CBD9F5', '#E07A5F', '#F2A65A']

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E6EDF9] shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A93BB]">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-[#002868] mt-3">{value}</p>
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-[#E6EDF9] shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#002868]">{title}</h3>
        {subtitle && <p className="text-xs text-[#7A93BB] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function AnaliticoGlobalPage() {
  const router = useRouter()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [data, setData] = useState<AnaliticoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL)
      .then(r => r.json())
      .then(d => setSucursales(d.data || []))
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiFetch(API_ENDPOINTS.RRHH_ANALITICO.GLOBAL(sucursalId, desde, hasta))
      const json = await response.json()
      if (!response.ok) throw new Error(json.message || 'Error al cargar el analítico')
      setData(json.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar el analítico')
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId, desde, hasta])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <button
            onClick={() => router.push('/recursos-humanos')}
            className="w-11 h-11 rounded-2xl bg-white border border-[#D8E3F8] flex items-center justify-center text-[#002868] hover:border-[#002868] transition-colors cursor-pointer flex-shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0 shadow-sm">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A93BB] mb-1">Recursos Humanos</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#002868]">Analítico Global</h1>
              <p className="text-[#666666] text-base mt-1">Evolución salarial, rotación y distribución del personal.</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl bg-white border border-[#E6EDF9] shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB]">Sucursal</label>
            <select
              value={sucursalId ?? ''}
              onChange={e => setSucursalId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-xl border border-[#D8E3F8] px-3 py-2 text-sm text-[#002868] bg-white min-w-[200px]"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB]">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="rounded-xl border border-[#D8E3F8] px-3 py-2 text-sm text-[#002868] bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB]">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="rounded-xl border border-[#D8E3F8] px-3 py-2 text-sm text-[#002868] bg-white"
            />
          </div>
          {(desde || hasta || sucursalId) && (
            <button
              onClick={() => {
                setSucursalId(null)
                setDesde('')
                setHasta('')
              }}
              className="text-sm text-[#7A93BB] hover:text-[#002868] underline cursor-pointer pb-2"
            >
              Limpiar
            </button>
          )}
        </div>

        <ErrorBanner error={error} />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Empleados activos"
                value={data.resumen.empleadosActivos}
                icon={<Users className="w-4 h-4 text-white" />}
                accent="bg-[#002868]"
              />
              <KpiCard
                label="Altas (período)"
                value={data.resumen.totalAltas}
                icon={<TrendingUp className="w-4 h-4 text-white" />}
                accent="bg-[#2E9E6B]"
              />
              <KpiCard
                label="Bajas (período)"
                value={data.resumen.totalBajas}
                icon={<TrendingDown className="w-4 h-4 text-white" />}
                accent="bg-[#E07A5F]"
              />
              <KpiCard
                label="Rotación neta"
                value={data.resumen.rotacionNeta}
                icon={<Activity className="w-4 h-4 text-white" />}
                accent="bg-[#5B86E5]"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evolución salarial */}
              <ChartCard title="Evolución salarial" subtitle="Sueldo base promedio por período (escala)">
                {data.evolucionSalarial.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.evolucionSalarial} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="gradSueldo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#002868" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#002868" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FB" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#7A93BB' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#7A93BB' }} width={70} tickFormatter={v => formatMonto(v)} />
                      <Tooltip formatter={(v: number) => formatMonto(v)} />
                      <Area
                        type="monotone"
                        dataKey="sueldoPromedio"
                        name="Sueldo prom."
                        stroke="#002868"
                        strokeWidth={2}
                        fill="url(#gradSueldo)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Rotación */}
              <ChartCard title="Rotación de personal" subtitle="Altas y bajas aprobadas por mes">
                {data.rotacion.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.rotacion} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FB" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#7A93BB' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#7A93BB' }} width={32} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="altas" name="Altas" fill="#2E9E6B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="bajas" name="Bajas" fill="#E07A5F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Distribución por área */}
              <ChartCard title="Distribución por área" subtitle="Empleados activos por área">
                {data.distribucionArea.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.distribucionArea}
                        dataKey="cantidad"
                        nameKey="area"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={entry => `${entry.area}: ${entry.cantidad}`}
                        labelLine={false}
                      >
                        {data.distribucionArea.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              {/* Distribución por puesto */}
              <ChartCard title="Distribución por puesto" subtitle="Empleados activos por puesto">
                {data.distribucionPuesto.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.distribucionPuesto}
                        dataKey="cantidad"
                        nameKey="puesto"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={entry => `${entry.puesto}: ${entry.cantidad}`}
                        labelLine={false}
                      >
                        {data.distribucionPuesto.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            {/* Sueldo por puesto */}
            <ChartCard title="Sueldo base promedio por puesto" subtitle="Según escalas salariales cargadas">
              {data.sueldoPorPuesto.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(220, data.sueldoPorPuesto.length * 38)}>
                  <BarChart
                    data={data.sueldoPorPuesto}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FB" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#7A93BB' }} tickFormatter={v => formatMonto(v)} />
                    <YAxis type="category" dataKey="puesto" tick={{ fontSize: 12, fill: '#002868' }} width={130} />
                    <Tooltip formatter={(v: number) => formatMonto(v)} />
                    <Bar dataKey="sueldoPromedio" name="Sueldo base prom." fill="#2F5BBD" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        ) : null}
      </main>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-[#7A93BB]">
      Sin datos para los filtros seleccionados.
    </div>
  )
}
