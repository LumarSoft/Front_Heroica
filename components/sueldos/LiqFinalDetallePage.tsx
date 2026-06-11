'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Loader2,
  Lock,
  Save,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import {
  LIQ_SAVE_FIELDS,
  MESES_LABEL,
  asNumber,
  fmtCurrency,
  fmtDate,
  liqEffectiveValorHora,
  normalizeLiqFinalRow,
  recalculateLiqFinalRow,
  type LiqFinalRow,
  type SueldosData,
} from '@/components/sueldos/SueldosPeriodoSections'

function readPeriodo(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback
  return parsed
}

function ReadCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`min-w-0 rounded-lg border px-4 py-3 shadow-sm ${accent ? 'border-[#002868] bg-[#EEF3FF]' : 'border-slate-200 bg-white'}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">{label}</p>
      <p
        className={`mt-1 text-sm font-bold leading-tight tabular-nums break-words ${accent ? 'text-[#002868]' : 'text-[#1A1A1A]'}`}
      >
        {value}
      </p>
    </div>
  )
}

export function LiqFinalDetallePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const user = useAuthStore(state => state.user)
  const sucursalId = Number(params.id)
  const liquidacionId = Number(params.liquidacionId)
  const hoy = new Date()

  const mes = readPeriodo(searchParams.get('mes'), hoy.getMonth() + 1, 1, 12)
  const anio = readPeriodo(searchParams.get('anio'), hoy.getFullYear(), 2020, 2100)
  const periodoLabel = `${MESES_LABEL[mes - 1]} ${anio}`
  const backUrl = `/recursos-humanos/${sucursalId}/sueldos/liquidaciones?mes=${mes}&anio=${anio}`

  const [row, setRow] = useState<LiqFinalRow | null>(null)
  const [original, setOriginal] = useState<LiqFinalRow | null>(null)
  const [editing, setEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_SUELDOS.GET_PERIODO(sucursalId, mes, anio))
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Error al cargar la liquidación')
      const data: SueldosData = json.data
      const found = data.liquidaciones.find(l => l.liquidacion_id === liquidacionId)
      if (!found) throw new Error('No se encontró la liquidación en este período')
      const normalized = normalizeLiqFinalRow(found)
      setRow(normalized)
      setOriginal(normalized)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la liquidación')
    } finally {
      setIsLoading(false)
    }
  }, [sucursalId, mes, anio, liquidacionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const enviado = Boolean(row?.enviado_pagos)
  const canEdit = editing && !enviado

  function update(updater: (r: LiqFinalRow) => LiqFinalRow) {
    setRow(cur => (cur ? updater(cur) : cur))
  }
  function updateField(field: keyof LiqFinalRow, value: string) {
    const textFields: (keyof LiqFinalRow)[] = [
      'comentario_cobro',
      'ministerio_direccion',
      'ministerio_horario',
      'ministerio_fecha',
      'fecha_deposito',
    ]
    update(r => recalculateLiqFinalRow({ ...r, [field]: textFields.includes(field) ? value : Number(value || 0) }))
  }
  function toggleField(field: keyof LiqFinalRow, checked: boolean) {
    update(r => {
      const next = { ...r, [field]: checked }
      if (field === 'aplica_valor_hora' && checked)
        next.valor_hora = asNumber(r.valor_hora_escala) || liqEffectiveValorHora(r)
      if (field === 'aplica_sueldo_basico_escala' && checked) next.sueldo_basico = r.escala
      if (field === 'aplica_banco' && !checked) next.banco = 0
      return recalculateLiqFinalRow(next)
    })
  }
  function toggleIncentivo(incentivoId: number, checked: boolean) {
    update(r => {
      const items = r.incentivos_items.map(i => (i.id === incentivoId ? { ...i, selected: checked } : i))
      return recalculateLiqFinalRow({ ...r, aplica_incentivos: items.some(i => i.selected), incentivos_items: items })
    })
  }

  function cancelEdit() {
    setRow(original)
    setEditing(false)
  }

  async function save() {
    if (!row) return
    setSaving(true)
    try {
      const payload = LIQ_SAVE_FIELDS.reduce<Record<string, unknown>>((acc, field) => {
        acc[field] = row[field]
        return acc
      }, {})
      const res = await apiFetch(API_ENDPOINTS.RRHH_SUELDOS.UPDATE_LIQUIDACION(row.liquidacion_id), {
        method: 'PUT',
        body: JSON.stringify({ data: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar')
      toast.success('Liquidación final guardada')
      setEditing(false)
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar liquidación')
    } finally {
      setSaving(false)
    }
  }

  async function enviar() {
    if (!row) return
    setSending(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_SUELDOS.ENVIAR_LIQUIDACION_PAGOS(row.liquidacion_id), {
        method: 'POST',
        body: JSON.stringify({ user_id: user?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al enviar a Pagos Pendientes')
      toast.success(data.message || 'Liquidación enviada a Pagos Pendientes')
      await loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar a Pagos Pendientes')
    } finally {
      setSending(false)
    }
  }

  const incentivosSel = useMemo(() => (row ? row.incentivos_items.filter(i => i.selected).length : 0), [row])

  const moneyInput = (field: keyof LiqFinalRow, opts?: { disabled?: boolean }) => (
    <Input
      type="number"
      min={0}
      step={1}
      value={String(row?.[field] ?? 0)}
      onChange={e => updateField(field, e.target.value)}
      disabled={opts?.disabled ?? !canEdit}
      className="h-8 text-sm"
    />
  )

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(backUrl)}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-rose-700 hover:bg-rose-50 cursor-pointer rounded-lg"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-0.5">
                Liquidación final · {periodoLabel}
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-rose-700 truncate leading-none">
                {row ? row.nombre : 'Liquidación final'}
              </h1>
            </div>
            {enviado && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <Lock className="w-3.5 h-3.5" />
                Enviada a pagos
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 pb-28">
        <ErrorBanner error={error} />
        {isLoading ? (
          <PageLoadingSpinner />
        ) : !row ? null : (
          <>
            {/* Datos del colaborador */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-rose-500" />
              <CardHeader className="pb-2 flex-row items-center justify-between gap-3">
                <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
                  Datos del colaborador
                </CardTitle>
                <span className="rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                  Antigüedad: {row.antiguedad_texto || '—'}
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  <ReadCard label="Legajo" value={row.legajo} />
                  <ReadCard label="Puesto" value={row.puesto} />
                  <ReadCard label="Fecha Alta (FA)" value={row.fa ? fmtDate(row.fa) : '—'} />
                  <ReadCard label="Fecha Baja (FB)" value={row.fb ? fmtDate(row.fb) : '—'} />
                  <ReadCard label="Forma de cobro" value={row.aplica_banco ? 'Banco' : 'Efectivo'} />
                </div>
              </CardContent>
            </Card>

            {/* Haberes */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-emerald-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
                  Haberes y adicionales
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Sueldo básico */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    {canEdit && (
                      <Checkbox
                        checked={row.aplica_sueldo_basico_escala}
                        onCheckedChange={c => toggleField('aplica_sueldo_basico_escala', c === true)}
                        className="size-4"
                      />
                    )}
                    Sueldo Básico {row.aplica_sueldo_basico_escala && '(escala)'}
                  </label>
                  {canEdit && !row.aplica_sueldo_basico_escala ? (
                    moneyInput('sueldo_basico')
                  ) : (
                    <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{fmtCurrency(row.sueldo_basico)}</p>
                  )}
                </div>
                {/* Valor hora */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    {canEdit && (
                      <Checkbox
                        checked={row.aplica_valor_hora}
                        onCheckedChange={c => toggleField('aplica_valor_hora', c === true)}
                        className="size-4"
                      />
                    )}
                    Valor Hora
                  </label>
                  <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">
                    {row.aplica_valor_hora ? fmtCurrency(row.valor_hora) : '—'}
                  </p>
                </div>
                {/* Horas extra */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    {canEdit && (
                      <Checkbox
                        checked={row.aplica_horas_extra}
                        onCheckedChange={c => toggleField('aplica_horas_extra', c === true)}
                        className="size-4"
                      />
                    )}
                    Horas Extra (50%)
                  </label>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={String(row.horas_extra_hs ?? 0)}
                        onChange={e => updateField('horas_extra_hs', e.target.value)}
                        disabled={!row.aplica_horas_extra}
                        className="h-8 w-20 text-sm"
                      />
                      <span className="text-xs text-[#9AA0AC]">hs →</span>
                      <span className="text-sm font-bold text-[#1A1A1A] tabular-nums">
                        {row.aplica_horas_extra ? fmtCurrency(row.horas_extra_50) : '—'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">
                      {row.aplica_horas_extra ? fmtCurrency(row.horas_extra_50) : '—'}
                    </p>
                  )}
                </div>
                {/* Horas feriado */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    Horas Feriado
                  </label>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={String(row.horas_feriado_hs ?? 0)}
                        onChange={e => updateField('horas_feriado_hs', e.target.value)}
                        className="h-8 w-20 text-sm"
                      />
                      <span className="text-xs text-[#9AA0AC]">hs →</span>
                      <span className="text-sm font-bold text-[#1A1A1A] tabular-nums">
                        {fmtCurrency(row.horas_feriado)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{fmtCurrency(row.horas_feriado)}</p>
                  )}
                </div>
                {/* Incentivos */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    Incentivos
                  </label>
                  {canEdit ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 w-full justify-between gap-2 px-2 text-xs"
                        >
                          <span className="truncate">
                            {incentivosSel}/{row.incentivos_items.length} · {fmtCurrency(row.incentivos)}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80 p-3">
                        {row.incentivos_items.length === 0 ? (
                          <p className="text-xs text-[#9AA0AC]">Sin incentivos activos para este período.</p>
                        ) : (
                          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                            {row.incentivos_items.map(item => (
                              <label
                                key={item.id}
                                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 hover:bg-[#F8FAFF]"
                              >
                                <Checkbox
                                  checked={item.selected}
                                  onCheckedChange={c => toggleIncentivo(item.id, c === true)}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-semibold text-[#1A1A1A]">
                                    {item.nombre}
                                  </span>
                                  <span className="block text-[11px] text-[#9AA0AC]">{fmtCurrency(item.monto)}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{fmtCurrency(row.incentivos)}</p>
                  )}
                </div>
                {/* Extras */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">Extras</label>
                  {canEdit ? (
                    moneyInput('extras')
                  ) : (
                    <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{fmtCurrency(row.extras)}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ausencias y descuentos */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-rose-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-rose-700 uppercase tracking-widest">
                  Ausencias y descuentos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {(
                  [
                    ['Aus. Justificadas', 'ausencias_justificadas'],
                    ['Aus. Injustificadas', 'ausencias_injustificadas'],
                    ['Tardanzas', 'tardanzas'],
                    ['Descuentos', 'descuentos'],
                    ['Adelantos', 'adelantos'],
                  ] as [string, keyof LiqFinalRow][]
                ).map(([label, field]) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">{label}</label>
                    {canEdit ? (
                      moneyInput(field)
                    ) : (
                      <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">
                        {fmtCurrency(asNumber(row[field]))}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sueldo del período + Banco */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-[#002868]" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[#002868] uppercase tracking-widest">
                  Sueldo del período
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ReadCard label="Sueldo Neto" value={fmtCurrency(row.sueldo_neto)} accent />
                  <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                      {canEdit && (
                        <Checkbox
                          checked={row.aplica_banco}
                          onCheckedChange={c => toggleField('aplica_banco', c === true)}
                          className="size-4"
                        />
                      )}
                      Banco
                    </label>
                    {canEdit ? (
                      <Input
                        type="number"
                        min={0}
                        value={String(row.banco ?? 0)}
                        onChange={e => updateField('banco', e.target.value)}
                        disabled={!row.aplica_banco}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-bold text-[#1A1A1A] tabular-nums">{fmtCurrency(row.banco)}</p>
                    )}
                  </div>
                  <ReadCard label="Efectivo" value={fmtCurrency(row.efectivo)} />
                </div>
              </CardContent>
            </Card>

            {/* Liquidación final */}
            <Card className="border border-rose-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-rose-600" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-rose-700 uppercase tracking-widest">
                  Liquidación final · según antigüedad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canEdit && (
                  <p className="text-[11px] text-rose-600/80">
                    Valores sugeridos automáticamente (FA → FB). Editalos o restaurá el cálculo con «Auto».
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'SAC proporcional', field: 'sac_importe', auto: row.sac_auto } as const,
                    { label: 'Vac. No Gozadas', field: 'vng_importe', auto: row.vng_auto } as const,
                    { label: 'Preaviso', field: 'preaviso_importe', auto: row.preaviso_auto } as const,
                  ].map(item => (
                    <div key={item.label} className="rounded-lg border border-rose-200 bg-white px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">{item.label}</p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() =>
                              update(r => recalculateLiqFinalRow({ ...r, [item.field]: asNumber(item.auto) }))
                            }
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            ↻ Auto
                          </button>
                        )}
                      </div>
                      {canEdit ? (
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={String(row[item.field] ?? 0)}
                          onChange={e => updateField(item.field, e.target.value)}
                          className="h-8 text-sm font-semibold"
                        />
                      ) : (
                        <p className="text-sm font-bold text-rose-700 tabular-nums">
                          {fmtCurrency(asNumber(row[item.field]))}
                        </p>
                      )}
                      <p className="text-[10px] text-[#9AA0AC]">Sugerido: {fmtCurrency(asNumber(item.auto))}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-rose-100">
                  <ReadCard label="Total Liq." value={fmtCurrency(row.total_liq)} />
                  <ReadCard label="Liq. Banco" value={fmtCurrency(row.liq_banco)} />
                  <ReadCard label="Liq. Efectivo" value={fmtCurrency(row.liq_efectivo)} />
                  <div className="min-w-0 rounded-lg border border-rose-500 bg-rose-100 px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600">TOTAL GENERAL</p>
                    <p className="mt-1 text-sm font-bold leading-tight tabular-nums break-words text-rose-700">
                      {fmtCurrency(row.total_general)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pago */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-[#002868]" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[#002868] uppercase tracking-widest">Pago</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    Fecha Depósito
                  </label>
                  {canEdit ? (
                    <Input
                      type="date"
                      value={String(row.fecha_deposito ?? '')}
                      onChange={e => updateField('fecha_deposito', e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-bold text-[#1A1A1A]">
                      {row.fecha_deposito ? fmtDate(row.fecha_deposito) : '—'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                    Estado de pago
                  </label>
                  <div className="flex items-center gap-2 h-8">
                    <Switch
                      checked={Boolean(row.sueldo_pagado)}
                      onCheckedChange={c => update(r => ({ ...r, sueldo_pagado: c }))}
                      disabled={!canEdit}
                    />
                    <span className="text-sm font-semibold text-[#5A6070]">
                      {row.sueldo_pagado ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ministerio */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-amber-400" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Ministerio de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={row.ministerio_aplica}
                    onCheckedChange={c => update(r => recalculateLiqFinalRow({ ...r, ministerio_aplica: c }))}
                    disabled={!canEdit}
                  />
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {row.ministerio_aplica ? 'Requiere presentación en Ministerio' : 'No requiere presentación'}
                  </span>
                </div>
                {row.ministerio_aplica && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                        Dirección
                      </label>
                      <Input
                        value={row.ministerio_direccion}
                        onChange={e => update(r => ({ ...r, ministerio_direccion: e.target.value }))}
                        placeholder="Ej: Av. Callao 144, CABA"
                        className="h-8 text-sm"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">Fecha</label>
                      <Input
                        type="date"
                        value={row.ministerio_fecha}
                        onChange={e => update(r => ({ ...r, ministerio_fecha: e.target.value }))}
                        className="h-8 text-sm"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#7B8496]">
                        Horario
                      </label>
                      <Input
                        value={row.ministerio_horario}
                        onChange={e => update(r => ({ ...r, ministerio_horario: e.target.value }))}
                        placeholder="Ej: 10:00 hs"
                        className="h-8 text-sm"
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700 font-medium w-fit">
                      <Calendar className="w-3.5 h-3.5" />
                      Se agenda automáticamente en el Calendario · Recordar llevar DNI
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comentarios */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-1 w-full bg-slate-300" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[#002868] uppercase tracking-widest">
                  Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={row.comentario_cobro}
                  onChange={e => update(r => ({ ...r, comentario_cobro: e.target.value }))}
                  placeholder="Observaciones sobre esta liquidación..."
                  className="min-h-20 resize-none"
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Barra de acciones fija */}
      {!isLoading && row && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="container mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#9AA0AC]">
              {enviado ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Liquidación enviada a Pagos Pendientes
                </span>
              ) : editing ? (
                'Editá los valores y guardá los cambios.'
              ) : (
                'Revisá la liquidación. Editá o enviá a Pagos Pendientes.'
              )}
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving} className="h-9 gap-2 cursor-pointer">
                    <X className="w-4 h-4" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={save}
                    disabled={saving}
                    className="h-9 gap-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </Button>
                </>
              ) : (
                <>
                  {!enviado && (
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                      className="h-9 gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </Button>
                  )}
                  <Button
                    onClick={enviar}
                    disabled={sending || enviado}
                    className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar a Pagos Pendientes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
