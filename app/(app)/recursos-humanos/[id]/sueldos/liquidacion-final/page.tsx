'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Calculator, Check, ChevronLeft, ChevronRight, FileX2, Landmark, Wallet, X } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import type { Sucursal } from '@/lib/types'

interface Liquidacion {
  id: number
  solicitud_id: number
  personal_id: number
  nombre: string
  legajo: string
  puesto: string
  fecha_solicitud: string
  estado: string
  detalle?: string
  sueldo_base: number
  detalles?: {
    fecha_baja?: string
    motivo_baja?: string
  }
}

interface SueldosData {
  periodo: { mes: number; anio: number; label: string }
  liquidaciones: Liquidacion[]
}

interface LiquidacionSimRow {
  id: number
  seleccionado: boolean
  nombre: string
  legajo: string
  puesto: string
  motivo: string
  fechaBaja: string
  escala: number
  banco: number
  efectivo: number
  fa: string
  fb: string
  aplicaEscala: boolean
  aplicaBanco: boolean
  aplicaEfectivo: boolean
}

const MESES_LABEL = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(v)
}

function fmtDate(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toMoney(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function LiquidacionFinalPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const sucursalId = Number(params.id)

  const hoy = new Date()
  const initialMes = Number(searchParams.get('mes')) || hoy.getMonth() + 1
  const initialAnio = Number(searchParams.get('anio')) || hoy.getFullYear()

  const [mes, setMes] = useState(initialMes)
  const [anio, setAnio] = useState(initialAnio)
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [data, setData] = useState<SueldosData | null>(null)
  const [rows, setRows] = useState<LiquidacionSimRow[]>([])
  const [finalModalOpen, setFinalModalOpen] = useState(false)
  const [sacPct, setSacPct] = useState(0)
  const [vngPct, setVngPct] = useState(0)
  const [preavisoPct, setPreavisoPct] = useState(0)
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
      if (!res.ok) throw new Error(json.message || 'Error al cargar liquidaciones finales')

      const sueldosData = json.data as SueldosData
      setData(sueldosData)
      setRows(
        sueldosData.liquidaciones.map(liq => {
          const sueldoBase = Number(liq.sueldo_base) || 0
          return {
            id: liq.id,
            seleccionado: true,
            nombre: liq.nombre,
            legajo: liq.legajo,
            puesto: liq.puesto,
            motivo: liq.detalles?.motivo_baja ?? '',
            fechaBaja: liq.detalles?.fecha_baja ?? liq.fecha_solicitud,
            escala: sueldoBase,
            banco: sueldoBase,
            efectivo: 0,
            fa: '',
            fb: '',
            aplicaEscala: true,
            aplicaBanco: true,
            aplicaEfectivo: false,
          }
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar liquidaciones finales')
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId, mes, anio])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateRow = (id: number, patch: Partial<LiquidacionSimRow>) => {
    setRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row
        const next = { ...row, ...patch }
        if (patch.aplicaEscala === false) next.escala = 0
        if (patch.aplicaBanco === false) next.banco = 0
        if (patch.aplicaEfectivo === false) next.efectivo = 0
        return next
      }),
    )
  }

  const toggleAll = (checked: boolean) => {
    setRows(prev => prev.map(row => ({ ...row, seleccionado: checked })))
  }

  const prevPeriodo = () => {
    if (mes === 1) {
      setMes(12)
      setAnio(a => a - 1)
    } else {
      setMes(m => m - 1)
    }
  }

  const nextPeriodo = () => {
    if (mes === 12) {
      setMes(1)
      setAnio(a => a + 1)
    } else {
      setMes(m => m + 1)
    }
  }

  const selectedRows = rows.filter(row => row.seleccionado)
  const totalBanco = selectedRows.reduce((sum, row) => sum + row.banco, 0)
  const totalEfectivo = selectedRows.reduce((sum, row) => sum + row.efectivo, 0)
  const totalEscala = selectedRows.reduce((sum, row) => sum + row.escala, 0)
  const totalSueldo = totalBanco + totalEfectivo
  const sacTotal = Math.round((totalSueldo * sacPct) / 100)
  const vngTotal = Math.round((totalSueldo * vngPct) / 100)
  const preavisoTotal = Math.round((totalSueldo * preavisoPct) / 100)
  const totalLiquidacion = sacTotal + vngTotal + preavisoTotal
  const total = totalBanco + totalEfectivo
  const allSelected = rows.length > 0 && rows.every(row => row.seleccionado)
  const someSelected = rows.some(row => row.seleccionado)
  const periodoLabel = data?.periodo.label ?? `${MESES_LABEL[mes - 1]} ${anio}`

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(`/recursos-humanos/${sucursalId}/sueldos`)}
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
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                Liquidación Final
              </h1>
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
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 rounded-lg cursor-pointer"
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
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center shadow-md shadow-rose-600/20 flex-shrink-0">
                <FileX2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#002868] leading-tight">
                  Simulador de Liquidación Final
                </h2>
                <p className="text-sm text-[#666666] mt-0.5">
                  {periodoLabel} · {selectedRows.length} de {rows.length} baja{rows.length !== 1 ? 's' : ''}{' '}
                  seleccionada{selectedRows.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/recursos-humanos/${sucursalId}/sueldos`)}
                  className="gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={() => setFinalModalOpen(true)}
                  disabled={!someSelected}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Final simu
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#9AA0AC] font-semibold">Total liq final</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-2 tabular-nums">{fmtCurrency(total)}</p>
                </CardContent>
              </Card>
              <Card className="border border-emerald-100 bg-emerald-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Wallet className="w-4 h-4" />
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Efectivo</p>
                  </div>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-2 tabular-nums">
                    {fmtCurrency(totalEfectivo)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-[#D8E3F8] bg-[#EEF3FF] shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-[#002868]">
                    <Landmark className="w-4 h-4" />
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Banco</p>
                  </div>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-2 tabular-nums">{fmtCurrency(totalBanco)}</p>
                </CardContent>
              </Card>
              <Card className="border border-amber-100 bg-amber-50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Calculator className="w-4 h-4" />
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Escala</p>
                  </div>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-2 tabular-nums">{fmtCurrency(totalEscala)}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-rose-600" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-rose-600" />
                  <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
                    Bajas pendientes para simular
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                      <FileX2 className="w-7 h-7 text-rose-300" />
                    </div>
                    <p className="font-semibold text-[#1A1A1A]">No hay bajas pendientes para simular</p>
                    <p className="text-sm text-[#9AA0AC] mt-1 max-w-md">
                      Las bajas aparecen acá cuando una solicitud de baja aprobada genera su liquidación final.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1180px] text-sm">
                      <thead>
                        <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                          <th className="px-4 py-3 text-left">
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={checked => toggleAll(checked === true)}
                              aria-label="Seleccionar todos"
                            />
                          </th>
                          {['Nombre', 'Puesto', 'Fecha baja', 'Escala', 'Banco', 'Efectivo', 'FA', 'FB', 'Aplica'].map(
                            h => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC]"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F5]">
                        {rows.map(row => (
                          <tr
                            key={row.id}
                            className={`bg-white hover:bg-[#F8FAFF] ${!row.seleccionado ? 'opacity-50' : ''}`}
                          >
                            <td className="px-4 py-4">
                              <Checkbox
                                checked={row.seleccionado}
                                onCheckedChange={checked => updateRow(row.id, { seleccionado: checked === true })}
                                aria-label={`Seleccionar ${row.nombre}`}
                              />
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-[#1A1A1A]">{row.nombre}</p>
                              <p className="text-xs text-[#9AA0AC]">Leg. {row.legajo}</p>
                              {row.motivo && <p className="text-xs text-[#5A6070] mt-1">{row.motivo}</p>}
                            </td>
                            <td className="px-4 py-4 text-[#5A6070]">{row.puesto}</td>
                            <td className="px-4 py-4 text-[#5A6070] tabular-nums">{fmtDate(row.fechaBaja)}</td>
                            <td className="px-4 py-4">
                              <Input
                                type="number"
                                value={row.escala}
                                disabled={!row.aplicaEscala}
                                onChange={event => updateRow(row.id, { escala: toMoney(event.target.value) })}
                                className="h-9 w-32 text-right"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <Input
                                type="number"
                                value={row.banco}
                                disabled={!row.aplicaBanco}
                                onChange={event => updateRow(row.id, { banco: toMoney(event.target.value) })}
                                className="h-9 w-32 text-right"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <Input
                                type="number"
                                value={row.efectivo}
                                disabled={!row.aplicaEfectivo}
                                onChange={event => updateRow(row.id, { efectivo: toMoney(event.target.value) })}
                                className="h-9 w-32 text-right"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <Input
                                value={row.fa}
                                onChange={event => updateRow(row.id, { fa: event.target.value })}
                                className="h-9 w-24"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <Input
                                value={row.fb}
                                onChange={event => updateRow(row.id, { fb: event.target.value })}
                                className="h-9 w-24"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-xs text-[#5A6070]">
                                  <Checkbox
                                    checked={row.aplicaEscala}
                                    onCheckedChange={checked => updateRow(row.id, { aplicaEscala: checked === true })}
                                  />
                                  Escala
                                </label>
                                <label className="flex items-center gap-2 text-xs text-[#5A6070]">
                                  <Checkbox
                                    checked={row.aplicaBanco}
                                    onCheckedChange={checked => updateRow(row.id, { aplicaBanco: checked === true })}
                                  />
                                  Banco
                                </label>
                                <label className="flex items-center gap-2 text-xs text-[#5A6070]">
                                  <Checkbox
                                    checked={row.aplicaEfectivo}
                                    onCheckedChange={checked => updateRow(row.id, { aplicaEfectivo: checked === true })}
                                  />
                                  Efectivo
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Dialog open={finalModalOpen} onOpenChange={setFinalModalOpen}>
        <DialogContent className="!w-[min(1080px,calc(100vw-48px))] !max-w-none p-0 overflow-hidden">
          <DialogHeader className="px-8 pt-6 pb-5 border-b border-[#EEF0F4]">
            <DialogTitle className="flex items-center gap-3 text-2xl text-[#002868]">
              <Calculator className="w-6 h-6" />
              Cierre de simulación
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-7 px-8 py-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-[#9AA0AC] font-bold mb-5">Conceptos de liquidación</p>
              <div className="grid grid-cols-[minmax(0,1fr)_160px] gap-x-5 gap-y-5 items-center">
                <span className="text-lg font-semibold text-[#1A1A1A]">SAC</span>
                <Input
                  type="number"
                  min={0}
                  value={sacPct}
                  onChange={event => setSacPct(toMoney(event.target.value))}
                  className="h-12 text-right text-lg"
                />
                <span className="text-lg font-semibold text-[#1A1A1A] leading-tight">Vacaciones no gozadas</span>
                <Input
                  type="number"
                  min={0}
                  value={vngPct}
                  onChange={event => setVngPct(toMoney(event.target.value))}
                  className="h-12 text-right text-lg"
                />
                <span className="text-lg font-semibold text-[#1A1A1A]">Preaviso</span>
                <Input
                  type="number"
                  min={0}
                  value={preavisoPct}
                  onChange={event => setPreavisoPct(toMoney(event.target.value))}
                  className="h-12 text-right text-lg"
                />
              </div>
              <p className="text-sm text-[#9AA0AC] mt-5 leading-relaxed">Los valores se aplican como porcentaje.</p>
            </div>

            <div className="space-y-4 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#D8E3F8] bg-[#EEF3FF] p-5 min-h-[118px] min-w-0">
                  <p className="text-xs uppercase tracking-wider text-[#002868] font-bold">Sueldo banco</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-5 tabular-nums whitespace-nowrap">
                    {fmtCurrency(totalBanco)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#D8E3F8] bg-white p-5 min-h-[118px] min-w-0">
                  <p className="text-xs uppercase tracking-wider text-[#002868] font-bold">Liq banco</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-5 tabular-nums whitespace-nowrap">
                    {fmtCurrency(totalLiquidacion)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 min-h-[118px] min-w-0">
                  <p className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Sueldo efectivo</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-5 tabular-nums whitespace-nowrap">
                    {fmtCurrency(totalEfectivo)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-white p-5 min-h-[118px] min-w-0">
                  <p className="text-xs uppercase tracking-wider text-emerald-700 font-bold">Liq efectivo</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-5 tabular-nums whitespace-nowrap">
                    {fmtCurrency(0)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-lg">
                  <span className="flex items-center justify-between gap-4">
                    Total sueldo: <strong>{fmtCurrency(totalSueldo)}</strong>
                  </span>
                  <span className="flex items-center justify-between gap-4">
                    Total liq: <strong>{fmtCurrency(totalLiquidacion)}</strong>
                  </span>
                  <span className="flex items-center justify-between gap-4 text-xl">
                    Total: <strong>{fmtCurrency(totalSueldo + totalLiquidacion)}</strong>
                  </span>
                </div>
                <p className="text-sm text-[#9AA0AC] mt-4">
                  Seleccionados: {selectedRows.length} colaborador{selectedRows.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[#EEF0F4] px-8 py-5">
            <Button
              variant="ghost"
              onClick={() => setFinalModalOpen(false)}
              className="h-11 px-5 gap-2 cursor-pointer text-base"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
            <Button
              onClick={() => router.push(`/recursos-humanos/${sucursalId}/sueldos`)}
              className="h-11 px-7 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer text-base"
            >
              <Check className="w-4 h-4" />
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
