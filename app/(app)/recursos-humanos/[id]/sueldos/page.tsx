'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, DollarSign, FileX2, TrendingUp, Users } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { SummaryCard } from '@/components/reportes/SummaryCard'
import {
  BancoEfectivoSplit,
  MESES_LABEL,
  PorPuestoChart,
  SueldosSectionLinks,
  fmtCurrency,
  type SueldosData,
} from '@/components/sueldos/SueldosPeriodoSections'
import type { Sucursal } from '@/lib/types'

function readPeriodo(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback
  return parsed
}

export default function SueldosPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const sucursalId = Number(params.id)

  const hoy = new Date()
  const [mes, setMes] = useState(() => readPeriodo(searchParams.get('mes'), hoy.getMonth() + 1, 1, 12))
  const [anio, setAnio] = useState(() => readPeriodo(searchParams.get('anio'), hoy.getFullYear(), 2020, 2100))
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [data, setData] = useState<SueldosData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
      .then(r => r.json())
      .then(d => setSucursal(d.data ?? null))
      .catch(() => {})
  }, [sucursalId])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_SUELDOS.GET_PERIODO(sucursalId, mes, anio))
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Error al cargar sueldos')
      setData(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar sueldos')
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId, mes, anio])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    router.replace(`/recursos-humanos/${sucursalId}/sueldos?mes=${mes}&anio=${anio}`, { scroll: false })
  }, [anio, mes, router, sucursalId])

  const prevPeriodo = () => {
    if (mes === 1) {
      setMes(12)
      setAnio(a => a - 1)
      return
    }
    setMes(m => m - 1)
  }

  const nextPeriodo = () => {
    const esActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()
    if (esActual) return
    if (mes === 12) {
      setMes(1)
      setAnio(a => a + 1)
      return
    }
    setMes(m => m + 1)
  }

  const isActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()
  const periodoLabel = `${MESES_LABEL[mes - 1]} ${anio}`
  const isEmpty = !isLoading && !error && data?.resumen.total_colaboradores === 0

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(`/recursos-humanos/${sucursalId}`)}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-0.5">
                {sucursal?.nombre ?? 'Recursos Humanos'}
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">Sueldos</h1>
            </div>

            <div className="flex items-center gap-1 bg-[#F5F7FF] border border-[#D8E3F8] rounded-xl px-1 py-1">
              <Button
                onClick={prevPeriodo}
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-semibold text-[#002868] min-w-[116px] text-center tabular-nums">
                {periodoLabel}
              </span>
              <Button
                onClick={nextPeriodo}
                disabled={isActual}
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 rounded-lg cursor-pointer disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
        <ErrorBanner error={error} />

        {isLoading ? (
          <PageLoadingSpinner />
        ) : error ? null : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#002868] flex items-center justify-center shadow-md shadow-[#002868]/20 flex-shrink-0">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#002868] leading-tight">{periodoLabel}</h2>
                <p className="text-sm text-[#666666] mt-0.5">Resumen de haberes de colaboradores activos</p>
              </div>
              {isActual && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                  Activo
                </span>
              )}
            </div>

            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <DollarSign className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-[#1A1A1A] font-semibold mb-1">Sin datos para {periodoLabel}</p>
                <p className="text-sm text-[#9AA0AC] max-w-xs">
                  No hay colaboradores con escala salarial para este período. Configurá escalas en el módulo de Puestos.
                </p>
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <SummaryCard
                    label="Colaboradores pagos"
                    value={String(data.resumen.total_colaboradores)}
                    accent="blue"
                    icon={<Users className="w-4 h-4" />}
                    sub={periodoLabel}
                  />
                  <SummaryCard
                    label="Masa salarial"
                    value={fmtCurrency(data.resumen.masa_salarial)}
                    accent="indigo"
                    icon={<DollarSign className="w-4 h-4" />}
                    sub="Total del período"
                  />
                  <SummaryCard
                    label="Sueldo promedio"
                    value={fmtCurrency(data.resumen.sueldo_promedio)}
                    accent="blue"
                    icon={<TrendingUp className="w-4 h-4" />}
                    sub="Por colaborador"
                  />
                  <SummaryCard
                    label="Liquidaciones finales"
                    value={String(data.resumen.liquidaciones_finales_count)}
                    accent={data.resumen.liquidaciones_finales_count > 0 ? 'rose' : 'emerald'}
                    icon={<FileX2 className="w-4 h-4" />}
                    sub="Del período"
                  />
                </div>

                <BancoEfectivoSplit resumen={data.resumen} />

                <Card className="border border-slate-100 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-[#002868]" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#5A6070]" />
                      <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
                        Sueldos por puesto
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PorPuestoChart data={data.por_puesto} />
                  </CardContent>
                </Card>

                <SueldosSectionLinks sucursalId={sucursalId} mes={mes} anio={anio} />
              </>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
