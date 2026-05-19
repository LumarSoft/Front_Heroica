'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, DollarSign, FileX2 } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import {
  LiquidacionesSection,
  MESES_LABEL,
  TablaMensualSection,
  type SueldosData,
} from '@/components/sueldos/SueldosPeriodoSections'
import type { Sucursal } from '@/lib/types'

type VistaSueldosDetalle = 'mensual' | 'liquidaciones'

interface SueldosDetallePageProps {
  vista: VistaSueldosDetalle
}

function readPeriodo(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback
  return parsed
}

export function SueldosDetallePage({ vista }: SueldosDetallePageProps) {
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
    router.replace(`/recursos-humanos/${sucursalId}/sueldos/${vista}?mes=${mes}&anio=${anio}`, { scroll: false })
  }, [anio, mes, router, sucursalId, vista])

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
  const title = vista === 'mensual' ? 'Sueldos del período' : 'Liquidaciones finales'
  const subtitle =
    vista === 'mensual'
      ? 'Colaboradores activos con escala salarial vigente en el mes seleccionado.'
      : 'Liquidaciones generadas automáticamente desde solicitudes de baja aprobadas.'
  const Icon = vista === 'mensual' ? DollarSign : FileX2

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(`/recursos-humanos/${sucursalId}/sueldos?mes=${mes}&anio=${anio}`)}
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
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">{title}</h1>
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
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#D8E3F8] flex items-center justify-center shadow-sm flex-shrink-0">
                <Icon className={vista === 'mensual' ? 'w-6 h-6 text-[#002868]' : 'w-6 h-6 text-rose-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#002868] leading-tight">{title}</h2>
                <p className="text-sm text-[#666666] mt-0.5">{subtitle}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white border border-[#D8E3F8] text-[#002868] text-xs font-bold uppercase tracking-wide">
                {periodoLabel}
              </span>
            </div>

            {data && vista === 'mensual' && (
              <TablaMensualSection
                rows={data.tabla_mensual}
                sucursalId={sucursalId}
                mes={mes}
                anio={anio}
                onSaved={loadData}
              />
            )}
            {data && vista === 'liquidaciones' && <LiquidacionesSection liquidaciones={data.liquidaciones} />}
          </>
        )}
      </main>
    </div>
  )
}
