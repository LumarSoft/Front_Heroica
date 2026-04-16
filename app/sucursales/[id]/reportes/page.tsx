'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { formatMonto } from '@/lib/formatters'
import type { Sucursal } from '@/lib/types'
import { Printer, TrendingUp, TrendingDown, AlertTriangle, ArrowLeft } from 'lucide-react'
import { SectionHeading } from '@/components/reportes/SectionHeading'
import { SummaryCard } from '@/components/reportes/SummaryCard'
import { BreakdownPanel } from '@/components/reportes/BreakdownPanel'
import { DeudaPanel } from '@/components/reportes/DeudaPanel'
import { CreditoPanel } from '@/components/reportes/CreditoPanel'
import { MonthlyLineChart } from '@/components/reportes/MonthlyLineChart'
import { MonthlyCategoryBarChart } from '@/components/reportes/MonthlyCategoryBarChart'
import { TopConceptosPanel } from '@/components/reportes/TopConceptosPanel'
import { SaludFinancieraPanel } from '@/components/reportes/SaludFinancieraPanel'
import { ComparativoCategoriaPanel } from '@/components/reportes/ComparativoCategoriaPanel'
import type { ReportData } from '@/components/reportes/types'
import type { MonthlyDataPoint } from '@/components/reportes/MonthlyLineChart'
import type { CategoryDataPoint } from '@/components/reportes/MonthlyCategoryBarChart'

export default function ReportesPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const moneda = (searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS'
  const { isGuardLoading } = useAuthGuard()

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedIngresoCategory, setSelectedIngresoCategory] = useState<string | null>(null)
  const [selectedEgresoCategory, setSelectedEgresoCategory] = useState<string | null>(null)

  // Selector mensual con debounce para evitar fetches por cada tecla
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [debouncedMonth, setDebouncedMonth] = useState(selectedMonth)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMonth(selectedMonth), 500)
    return () => clearTimeout(timer)
  }, [selectedMonth])

  const isClosedMonth = useMemo(() => {
    const today = new Date()
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    return debouncedMonth < currentMonthStr
  }, [debouncedMonth])

  const { startDate, endDate } = useMemo(() => {
    const [year, month] = debouncedMonth.split('-')
    const start = `${year}-${month}-01`
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    const end = `${year}-${month}-${lastDay}`
    return { startDate: start, endDate: end }
  }, [debouncedMonth])

  const fetchSucursal = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)))
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setSucursal(data.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar sucursal'
      toast.error(message)
    }
  }, [params.id])

  const fetchMonthlyData = useCallback(async () => {
    try {
      const rawId = Array.isArray(params.id) ? params.id[0] : params.id
      const safeId = rawId != null ? encodeURIComponent(String(rawId)) : ''
      if (!safeId) return
      const url = API_ENDPOINTS.REPORTES.GET_ANUAL(safeId, moneda)
      const response = await apiFetch(url)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      const today = new Date()
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      setMonthlyData((data.data.mensual as MonthlyDataPoint[]).filter(d => d.mes <= currentMonth))
      setCategoryData((data.data.porCategoria as CategoryDataPoint[]).filter(d => d.mes <= currentMonth))
    } catch {
      // silencioso: el gráfico simplemente no muestra datos
    }
  }, [params.id, moneda])

  const fetchReportData = useCallback(async () => {
    setIsLoading(true)
    setSelectedIngresoCategory(null)
    setSelectedEgresoCategory(null)
    try {
      const rawId = Array.isArray(params.id) ? params.id[0] : params.id
      const safeId = rawId != null ? encodeURIComponent(String(rawId)) : ''
      if (!safeId) return
      const url = API_ENDPOINTS.REPORTES.GET_BY_SUCURSAL(safeId, startDate, endDate, moneda)
      const response = await apiFetch(url)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setReportData(data.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar reportes'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [params.id, startDate, endDate, moneda])

  useEffect(() => {
    if (isGuardLoading) return
    fetchSucursal()
    fetchReportData()
    fetchMonthlyData()
  }, [isGuardLoading, fetchSucursal, fetchReportData, fetchMonthlyData])

  // ── Computed data ────────────────────────────────────────────────────────────
  const currentIngresosData = useMemo(() => {
    if (!reportData?.ingresosBreakdown) return []
    if (selectedIngresoCategory) {
      const cat = reportData.ingresosBreakdown.find(c => c.name === selectedIngresoCategory)
      return cat?.subcategorias ?? []
    }
    return reportData.ingresosBreakdown
  }, [reportData, selectedIngresoCategory])

  const currentIngresosTotal = useMemo(() => {
    if (!reportData?.ingresosBreakdown) return 0
    if (selectedIngresoCategory) {
      const cat = reportData.ingresosBreakdown.find(c => c.name === selectedIngresoCategory)
      return cat?.value ?? 0
    }
    return reportData.resumen.ingresos
  }, [reportData, selectedIngresoCategory])

  const currentEgresosData = useMemo(() => {
    if (!reportData?.egresosBreakdown) return []
    if (selectedEgresoCategory) {
      const cat = reportData.egresosBreakdown.find(c => c.name === selectedEgresoCategory)
      return cat?.subcategorias ?? []
    }
    return reportData.egresosBreakdown
  }, [reportData, selectedEgresoCategory])

  const currentEgresosTotal = useMemo(() => {
    if (!reportData?.egresosBreakdown) return 0
    if (selectedEgresoCategory) {
      const cat = reportData.egresosBreakdown.find(c => c.name === selectedEgresoCategory)
      return cat?.value ?? 0
    }
    return reportData.resumen.egresos
  }, [reportData, selectedEgresoCategory])

  // ── Deltas vs mes anterior ────────────────────────────────────────────────
  const monthlyDeltas = useMemo(() => {
    const calcDelta = (curr: number, prev: number): number | null => {
      if (prev === 0) return null
      return ((curr - prev) / prev) * 100
    }

    const currentEntry = monthlyData.find(d => d.mes === debouncedMonth)
    if (!currentEntry) return null

    const [year, month] = debouncedMonth.split('-').map(Number)
    const prevDate = new Date(year, month - 2, 1) // mes anterior
    const prevMes = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prevEntry = monthlyData.find(d => d.mes === prevMes)
    if (!prevEntry) return null

    return {
      ingresos: calcDelta(currentEntry.ingresos, prevEntry.ingresos),
      egresos: calcDelta(currentEntry.egresos, prevEntry.egresos),
      resultado: calcDelta(currentEntry.resultado, prevEntry.resultado),
    }
  }, [monthlyData, debouncedMonth])

  const handlePrint = () => window.print()

  if (isGuardLoading || (!sucursal && isLoading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED] pb-24">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0]/50 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/sucursales/${params.id}?moneda=${moneda}`)}
                variant="outline"
                size="sm"
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#002868]">Reportes — {moneda}</h1>
                <p className="text-sm text-slate-500">{sucursal?.nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Label htmlFor="month" className="text-sm font-medium whitespace-nowrap">
                  Mes a consultar:
                </Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="w-auto h-9"
                />
              </div>

              {isClosedMonth ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                  🧊 Mes Cerrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Mes en Curso
                </span>
              )}

              <Button
                variant="default"
                className="ml-2 h-9 bg-[#002868] text-white hover:bg-[#003d8f] flex items-center gap-2"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {isLoading && !reportData ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
          </div>
        ) : reportData ? (
          <div className="space-y-10 print:space-y-4">
            {/* ─── Print header ───────────────────────────────────────────────── */}
            <div className="hidden print:block mb-6">
              {/* Título y meta */}
              <div className="flex justify-between items-start border-b-2 border-[#002868] pb-3 mb-4">
                <div>
                  <h2 className="text-2xl font-black text-[#002868] tracking-tight">Reporte de Resultados</h2>
                  <p className="text-slate-600 font-medium text-sm mt-0.5">Sucursal: {sucursal?.nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800 capitalize">
                    {new Date(startDate + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className={`text-xs font-bold mt-0.5 uppercase tracking-widest ${isClosedMonth ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {isClosedMonth ? 'Período Cerrado' : 'Mes en Curso (Parcial)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Moneda: {moneda}</p>
                </div>
              </div>

              {/* Resumen ejecutivo en tabla compacta */}
              <table className="print-table w-full" style={{ fontSize: '10pt' }}>
                <thead>
                  <tr>
                    <th className="text-center">Ingresos Totales</th>
                    <th className="text-center">Egresos Totales</th>
                    <th className="text-center">Resultado Neto</th>
                    <th className="text-center">Deudas (A Pagar)</th>
                    <th className="text-center">Créditos (A Cobrar)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center" style={{ fontWeight: 800, color: '#059669', fontSize: '12pt', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMonto(reportData.resumen.ingresos, moneda)}
                    </td>
                    <td className="text-center" style={{ fontWeight: 800, color: '#e11d48', fontSize: '12pt', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMonto(reportData.resumen.egresos, moneda)}
                    </td>
                    <td className="text-center" style={{ fontWeight: 800, fontSize: '12pt', fontVariantNumeric: 'tabular-nums', color: reportData.resumen.resultado >= 0 ? '#1d4ed8' : '#dc2626' }}>
                      {formatMonto(reportData.resumen.resultado, moneda)}
                      <div style={{ fontSize: '8pt', fontWeight: 600, marginTop: '2px', color: reportData.resumen.resultado > 0 ? '#059669' : reportData.resumen.resultado < 0 ? '#dc2626' : '#64748b' }}>
                        {reportData.resumen.resultado > 0 ? 'Ganancia' : reportData.resumen.resultado < 0 ? 'Pérdida' : 'Equilibrio'}
                      </div>
                    </td>
                    <td className="text-center" style={{ fontWeight: 800, color: '#d97706', fontSize: '12pt', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMonto(reportData.resumen.deudas || 0, moneda)}
                    </td>
                    <td className="text-center" style={{ fontWeight: 800, color: '#4f46e5', fontSize: '12pt', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMonto(reportData.resumen.creditos || 0, moneda)}
                    </td>
                  </tr>
                  {monthlyDeltas && (
                    <tr>
                      <td className="text-center" style={{ fontSize: '8pt', color: (monthlyDeltas.ingresos ?? 0) >= 0 ? '#059669' : '#e11d48' }}>
                        {monthlyDeltas.ingresos !== null ? `${(monthlyDeltas.ingresos ?? 0) > 0 ? '+' : ''}${(monthlyDeltas.ingresos ?? 0).toFixed(1)}% vs mes ant.` : '—'}
                      </td>
                      <td className="text-center" style={{ fontSize: '8pt', color: (monthlyDeltas.egresos ?? 0) <= 0 ? '#059669' : '#e11d48' }}>
                        {monthlyDeltas.egresos !== null ? `${(monthlyDeltas.egresos ?? 0) > 0 ? '+' : ''}${(monthlyDeltas.egresos ?? 0).toFixed(1)}% vs mes ant.` : '—'}
                      </td>
                      <td className="text-center" style={{ fontSize: '8pt', color: (monthlyDeltas.resultado ?? 0) >= 0 ? '#059669' : '#e11d48' }}>
                        {monthlyDeltas.resultado !== null ? `${(monthlyDeltas.resultado ?? 0) > 0 ? '+' : ''}${(monthlyDeltas.resultado ?? 0).toFixed(1)}% vs mes ant.` : '—'}
                      </td>
                      <td className="text-center" style={{ fontSize: '8pt', color: '#94a3b8' }}>Histórico total</td>
                      <td className="text-center" style={{ fontSize: '8pt', color: '#94a3b8' }}>A favor nuestro</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── 1 · Resumen General ──────────────────────────────────────── */}
            <section>
              <SectionHeading number="1" title="Resumen General del Período" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5 print-summary-grid">
                <SummaryCard
                  label="Ingresos Totales"
                  value={formatMonto(reportData.resumen.ingresos, moneda)}
                  accent="emerald"
                  icon={<TrendingUp className="w-5 h-5" />}
                  delta={monthlyDeltas?.ingresos ?? null}
                />
                <SummaryCard
                  label="Egresos Totales"
                  value={formatMonto(reportData.resumen.egresos, moneda)}
                  accent="rose"
                  icon={<TrendingDown className="w-5 h-5" />}
                  delta={monthlyDeltas?.egresos ?? null}
                  invertDelta
                />
                <SummaryCard
                  label="Resultado Neto"
                  value={formatMonto(reportData.resumen.resultado, moneda)}
                  accent={reportData.resumen.resultado >= 0 ? 'blue' : 'red'}
                  icon={
                    reportData.resumen.resultado >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )
                  }
                  sub={
                    reportData.resumen.resultado > 0
                      ? 'Ganancia'
                      : reportData.resumen.resultado < 0
                        ? 'Pérdida'
                        : 'Equilibrio'
                  }
                  delta={monthlyDeltas?.resultado ?? null}
                />
                <SummaryCard
                  label="Deudas (A Pagar)"
                  value={formatMonto(reportData.resumen.deudas || 0, moneda)}
                  accent="orange"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  sub="Histórico total"
                />
                <SummaryCard
                  label="Créditos (A Cobrar)"
                  value={formatMonto(reportData.resumen.creditos || 0, moneda)}
                  accent="indigo"
                  icon={<TrendingUp className="w-5 h-5" />}
                  sub="A favor nuestro"
                />
              </div>
            </section>

            {/* ── 2 · Evolución Mensual ────────────────────────────────────── */}
            <section className="page-break-before print:hidden">
              <SectionHeading number="2" title="Evolución Mensual (Histórico)" className="mt-4" />
              <div className="flex flex-col gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Ingresos · Egresos · Resultado Neto
                  </p>
                  <MonthlyLineChart data={monthlyData} moneda={moneda} />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Movimientos por Categoría
                  </p>
                  <MonthlyCategoryBarChart data={categoryData} moneda={moneda} />
                </div>
              </div>
            </section>

            {/* ── 3 · Ingresos ─────────────────────────────────────────────── */}
            <section className="page-break-before">
              <SectionHeading number="3" title="Discriminado de Ingresos" className="mt-4" />
              <BreakdownPanel
                breakdownData={reportData.ingresosBreakdown}
                currentData={currentIngresosData}
                currentTotal={currentIngresosTotal}
                selectedCategory={selectedIngresoCategory}
                onSliceClick={name => setSelectedIngresoCategory(name)}
                onBack={() => setSelectedIngresoCategory(null)}
                colorOffset={0}
                emptyMessage="No hay ingresos registrados en el período"
                valueColorClass="text-emerald-700"
                drillDownRoot="Todas las categorías"
                drillDownColorClass="text-emerald-600 hover:text-emerald-700"
                moneda={moneda}
              />
            </section>

            {/* ── 4 · Egresos ──────────────────────────────────────────────── */}
            <section className="page-break-before">
              <SectionHeading number="4" title="Discriminado de Egresos" className="mt-4" />
              <BreakdownPanel
                breakdownData={reportData.egresosBreakdown}
                currentData={currentEgresosData}
                currentTotal={currentEgresosTotal}
                selectedCategory={selectedEgresoCategory}
                onSliceClick={name => setSelectedEgresoCategory(name)}
                onBack={() => setSelectedEgresoCategory(null)}
                colorOffset={4}
                emptyMessage="No hay egresos registrados"
                valueColorClass="text-rose-600"
                drillDownRoot="Todas las categorías"
                drillDownColorClass="text-rose-500 hover:text-rose-600"
                moneda={moneda}
              />
            </section>

            {/* ── 5 · Deudas (A Pagar) ──────────────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading number="5" title="Listado de Deudas (A Pagar)" className="mt-4" />
              <DeudaPanel deudas={reportData.detalles?.deudas || []} moneda={moneda} />
            </section>

            {/* ── 6 · Créditos (A Cobrar) ──────────────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading number="6" title="Listado de Créditos (A Cobrar)" className="mt-4" />
              <CreditoPanel creditos={reportData.detalles?.creditos || []} moneda={moneda} />
            </section>

            {/* ── 7 · Top 10 Conceptos ─────────────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading number="7" title="Top 10 Descripciones del Período" className="mt-4" />
              <TopConceptosPanel
                ingresos={reportData.detalles?.ingresos ?? []}
                egresos={reportData.detalles?.egresos ?? []}
                moneda={moneda}
              />
            </section>

            {/* ── 8 · Salud Financiera ─────────────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading number="8" title="Indicadores de Salud Financiera" className="mt-4" />
              <SaludFinancieraPanel
                ingresosBreakdown={reportData.ingresosBreakdown}
                egresosBreakdown={reportData.egresosBreakdown}
                creditos={reportData.resumen.creditos ?? 0}
                deudas={reportData.resumen.deudas ?? 0}
                totalIngresos={reportData.resumen.ingresos}
                totalEgresos={reportData.resumen.egresos}
                moneda={moneda}
              />
            </section>

            {/* ── 9 · Comparativo por Categoría ────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading number="9" title="Comparativo por Categoría" className="mt-4" />
              <ComparativoCategoriaPanel
                categoryData={categoryData}
                currentMonth={debouncedMonth}
                moneda={moneda}
              />
            </section>

            {/* ── Print: Detalle de movimientos por tipo ────────────────────── */}
            <div className="page-break-before mt-8 hidden print:block">
              <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2" style={{ borderBottom: '2px solid #cbd5e1' }}>
                Detalle de Movimientos del Período
              </h2>

              {((reportData.detalles?.ingresos?.length ?? 0) === 0 && (reportData.detalles?.egresos?.length ?? 0) === 0) ? (
                <p className="text-center italic text-slate-500 mt-6 text-sm">
                  No hay movimientos registrados en este período.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Columna Ingresos */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#059669', fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #d1fae5' }}>
                      Ingresos — {formatMonto(reportData.resumen.ingresos, moneda)}
                    </p>
                    {(reportData.detalles?.ingresos?.length ?? 0) === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '9pt', fontStyle: 'italic' }}>Sin ingresos en el período.</p>
                    ) : (
                      <table className="print-table w-full">
                        <thead>
                          <tr>
                            <th className="text-left" style={{ width: '18%' }}>Fecha</th>
                            <th className="text-left" style={{ width: '42%' }}>Concepto</th>
                            <th className="text-left" style={{ width: '22%' }}>Categoría</th>
                            <th className="text-right" style={{ width: '18%' }}>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...(reportData.detalles?.ingresos ?? [])]
                            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                            .map((mov, i) => (
                              <tr key={mov.id ?? i}>
                                <td style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '8pt' }}>
                                  {new Date(mov.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td style={{ color: '#1e293b', fontWeight: 500, fontSize: '9pt' }}>
                                  {mov.concepto || '—'}
                                </td>
                                <td style={{ color: '#64748b', fontSize: '8pt' }}>
                                  {mov.categoria_nombre || 'General'}
                                  {mov.subcategoria_nombre ? ` / ${mov.subcategoria_nombre}` : ''}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums', fontSize: '9pt' }}>
                                  +{formatMonto(Math.abs(mov.monto), moneda)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} style={{ fontWeight: 700 }}>Subtotal ingresos</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                              {formatMonto(reportData.resumen.ingresos, moneda)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>

                  {/* Columna Egresos */}
                  <div>
                    <p style={{ fontWeight: 700, color: '#e11d48', fontSize: '10pt', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid #ffe4e6' }}>
                      Egresos — {formatMonto(reportData.resumen.egresos, moneda)}
                    </p>
                    {(reportData.detalles?.egresos?.length ?? 0) === 0 ? (
                      <p style={{ color: '#94a3b8', fontSize: '9pt', fontStyle: 'italic' }}>Sin egresos en el período.</p>
                    ) : (
                      <table className="print-table w-full">
                        <thead>
                          <tr>
                            <th className="text-left" style={{ width: '18%' }}>Fecha</th>
                            <th className="text-left" style={{ width: '42%' }}>Concepto</th>
                            <th className="text-left" style={{ width: '22%' }}>Categoría</th>
                            <th className="text-right" style={{ width: '18%' }}>Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...(reportData.detalles?.egresos ?? [])]
                            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                            .map((mov, i) => (
                              <tr key={mov.id ?? i}>
                                <td style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '8pt' }}>
                                  {new Date(mov.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </td>
                                <td style={{ color: '#1e293b', fontWeight: 500, fontSize: '9pt' }}>
                                  {mov.concepto || '—'}
                                </td>
                                <td style={{ color: '#64748b', fontSize: '8pt' }}>
                                  {mov.categoria_nombre || 'General'}
                                  {mov.subcategoria_nombre ? ` / ${mov.subcategoria_nombre}` : ''}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48', fontVariantNumeric: 'tabular-nums', fontSize: '9pt' }}>
                                  -{formatMonto(Math.abs(mov.monto), moneda)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} style={{ fontWeight: 700 }}>Subtotal egresos</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48', fontVariantNumeric: 'tabular-nums' }}>
                              {formatMonto(reportData.resumen.egresos, moneda)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Resultado neto al pie del detalle */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '10pt', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Resultado Neto del Período
                </span>
                <span style={{ fontSize: '14pt', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: reportData.resumen.resultado >= 0 ? '#1d4ed8' : '#dc2626' }}>
                  {formatMonto(reportData.resumen.resultado, moneda)}
                </span>
                <span style={{ fontSize: '9pt', fontWeight: 600, color: reportData.resumen.resultado > 0 ? '#059669' : reportData.resumen.resultado < 0 ? '#dc2626' : '#64748b' }}>
                  ({reportData.resumen.resultado > 0 ? 'Ganancia' : reportData.resumen.resultado < 0 ? 'Pérdida' : 'Equilibrio'})
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
