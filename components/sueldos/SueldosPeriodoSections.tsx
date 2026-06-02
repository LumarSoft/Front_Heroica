'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Edit3,
  FileX2,
  Landmark,
  Loader2,
  Lock,
  MessageSquare,
  Save,
  Send,
  Wallet,
  X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
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

export interface ResumenSueldos {
  total_colaboradores: number
  masa_salarial: number
  sueldo_promedio: number
  liquidaciones_finales_count: number
  total_banco: number
  total_efectivo: number
  pct_banco: number
  pct_efectivo: number
  colaboradores_banco: number
  colaboradores_efectivo: number
}

export interface PorPuesto {
  puesto_id: number
  puesto: string
  colaboradores: number
  masa_salarial: number
  sueldo_promedio: number
}

export interface LiqFinalRow {
  liquidacion_id: number
  personal_id: number
  nombre: string
  legajo: string
  puesto: string
  fa: string
  fb: string
  forma_cobro: string
  estado: string
  fecha_solicitud: string
  escala: number
  valor_hora_escala: number
  aplica_valor_hora: boolean
  aplica_sueldo_basico_escala: boolean
  aplica_banco: boolean
  aplica_horas_extra: boolean
  aplica_incentivos: boolean
  hs_realizadas_mes: number
  valor_hora: number
  sueldo_basico: number
  horas_extra_50: number
  horas_extra_hs: number
  horas_feriado: number
  horas_feriado_hs: number
  incentivos: number
  incentivos_seleccionados: number[]
  incentivos_items: IncentivoSueldo[]
  extras: number
  ausencias_justificadas: number
  ausencias_injustificadas: number
  tardanzas: number
  descuentos: number
  adelantos: number
  sueldo_neto: number
  banco: number
  efectivo: number
  antiguedad_anios: number
  antiguedad_texto: string
  sac_auto: number
  vng_auto: number
  preaviso_auto: number
  sac_porcentaje: number
  sac_importe: number
  vng_porcentaje: number
  vng_importe: number
  preaviso_porcentaje: number
  preaviso_importe: number
  total_liq: number
  liq_banco: number
  liq_efectivo: number
  total_general: number
  sueldo_pagado: boolean
  comentario_cobro: string
  fecha_deposito: string
  ministerio_aplica: boolean
  ministerio_direccion: string
  ministerio_fecha: string
  ministerio_horario: string
  enviado_pagos?: boolean
  fecha_enviado_pagos?: string
}

/** @deprecated use LiqFinalRow */
export interface Liquidacion {
  id: number
  nombre: string
  legajo: string
  puesto: string
  fecha_solicitud: string
  estado: string
}

export interface TablaMensualRow {
  personal_id: number
  nombre: string
  colaborador?: string
  legajo: string
  puesto: string
  escala: number
  valor_hora_escala: number
  aplica_valor_hora: boolean
  aplica_sueldo_basico_escala: boolean
  aplica_horas_extra: boolean
  aplica_incentivos: boolean
  aplica_banco: boolean
  hs_realizadas_mes: number
  valor_hora: number
  sueldo_basico: number
  horas_extra_50: number
  horas_extra_hs?: number
  horas_feriado: number
  horas_feriado_hs?: number
  incentivos: number
  incentivos_seleccionados: number[]
  incentivos_items: IncentivoSueldo[]
  extras: number
  ausencias_justificadas: number
  ausencias_justificadas_hs?: number
  ausencias_injustificadas: number
  ausencias_injustificadas_hs?: number
  tardanzas: number
  tardanzas_hs?: number
  descuentos: number
  adelantos: number
  sueldo_sac: number
  sueldo_neto: number
  banco: number
  efectivo: number
  fecha_deposito: string
  sueldo_pagado: boolean
  comentario_cobro: string
  comentarios_count: number
  tiene_comentarios: boolean
  fa: string
  fb: string
  forma_cobro?: 'banco' | 'efectivo'
  es_mes_sac?: boolean
  enviado_pagos?: boolean
  fecha_enviado_pagos?: string
  simulacion?: Partial<TablaMensualRow>
}

export interface IncentivoSueldo {
  id: number
  nombre: string
  monto: number
  selected: boolean
}

export interface SueldosData {
  periodo: { mes: number; anio: number; label: string }
  resumen: ResumenSueldos
  por_puesto: PorPuesto[]
  tabla_mensual: TablaMensualRow[]
  liquidaciones: LiqFinalRow[]
}

export const MESES_LABEL = [
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

const CHART_COLORS = ['#002868', '#0047ab', '#1a5fb4', '#3a78c9', '#4a90e2', '#7cb9e8']

export function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(v)
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[190px]">
      <p className="font-semibold text-[#1A1A1A] mb-1.5 border-b border-[#F0F0F0] pb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6 mt-1">
          <span className="text-[#666]">{p.name}</span>
          <span className="font-bold text-[#1A1A1A]">{fmtCurrency(Number(p.value ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}

export function BancoEfectivoSplit({ resumen }: { resumen: ResumenSueldos }) {
  const { total_banco, total_efectivo, pct_banco, pct_efectivo, colaboradores_banco, colaboradores_efectivo } = resumen

  return (
    <Card className="border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#002868] to-emerald-500" />
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
          Distribución por forma de cobro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="relative h-5 rounded-full overflow-hidden bg-slate-100">
          <div
            className="absolute left-0 top-0 h-full bg-[#002868] rounded-l-full"
            style={{ width: `${pct_banco}%` }}
          />
          {pct_efectivo > 0 && (
            <div
              className="absolute right-0 top-0 h-full bg-emerald-500 rounded-r-full"
              style={{ width: `${pct_efectivo}%` }}
            />
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg bg-[#EEF3FF] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Landmark className="w-4 h-4 text-[#002868]" />
              <span className="text-xs font-bold text-[#002868] uppercase tracking-wide">Banco</span>
              <span className="ml-auto text-xs font-bold text-[#002868]">{pct_banco}%</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 tabular-nums leading-none">
              {fmtCurrency(total_banco)}
            </p>
            <p className="text-xs text-[#9AA0AC] mt-1.5">
              {colaboradores_banco} colaborador{colaboradores_banco !== 1 ? 'es' : ''}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Efectivo</span>
              <span className="ml-auto text-xs font-bold text-emerald-700">{pct_efectivo}%</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 tabular-nums leading-none">
              {fmtCurrency(total_efectivo)}
            </p>
            <p className="text-xs text-[#9AA0AC] mt-1.5">
              {colaboradores_efectivo} colaborador{colaboradores_efectivo !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PorPuestoChart({ data }: { data: PorPuesto[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[#B0B8C4]">
        Sin datos de puestos para este período.
      </div>
    )
  }

  const chartData = data.slice(0, 10)

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 46)}>
        <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={v => `$${(Number(v) / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: '#9AA0AC' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="puesto"
            width={148}
            tick={{ fontSize: 11, fill: '#5A6070' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={ChartTooltip} cursor={{ fill: '#F0F5FF' }} />
          <Bar dataKey="masa_salarial" name="Masa salarial" radius={[0, 6, 6, 0]} maxBarSize={26}>
            {chartData.map((item, i) => (
              <Cell key={item.puesto_id} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="divide-y divide-[#F5F5F5]">
        {data.map((p, i) => (
          <div key={p.puesto_id} className="flex items-center justify-between gap-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-[#5A6070] font-medium truncate">{p.puesto}</span>
            </div>
            <div className="flex items-center gap-4 text-right flex-shrink-0">
              <span className="text-[#9AA0AC]">{p.colaboradores} col.</span>
              <span className="hidden sm:inline text-[#9AA0AC]">prom. {fmtCurrency(p.sueldo_promedio)}</span>
              <span className="font-bold text-[#1A1A1A] tabular-nums w-28 text-right">
                {fmtCurrency(p.masa_salarial)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type TablaField = keyof TablaMensualRow
type EditableField = Exclude<
  TablaField,
  | 'personal_id'
  | 'nombre'
  | 'colaborador'
  | 'legajo'
  | 'puesto'
  | 'escala'
  | 'valor_hora_escala'
  | 'comentarios_count'
  | 'tiene_comentarios'
  | 'fa'
  | 'fb'
  | 'forma_cobro'
  | 'simulacion'
>

interface SueldosColumn {
  key: TablaField
  label: string
  kind: 'text' | 'money' | 'number' | 'date' | 'checkboxMoney' | 'checkboxAmount' | 'checkboxText'
  editable?: boolean
  sticky?: boolean
}

const SUELDOS_COLUMNS: SueldosColumn[] = [
  { key: 'legajo', label: 'Legajo', kind: 'text', sticky: true },
  { key: 'nombre', label: 'Colaborador', kind: 'text', sticky: true },
  { key: 'puesto', label: 'Puesto', kind: 'text' },
  { key: 'hs_realizadas_mes', label: 'Hs realizadas en el mes', kind: 'number' },
  { key: 'valor_hora', label: 'Valor Hora', kind: 'checkboxMoney', editable: true },
  { key: 'sueldo_basico', label: 'Sueldo Básico', kind: 'checkboxAmount', editable: true },
  { key: 'horas_extra_50', label: 'Horas extra (50%)', kind: 'checkboxAmount', editable: true },
  { key: 'horas_feriado', label: 'Horas feriado', kind: 'money', editable: true },
  { key: 'incentivos', label: 'Incentivos', kind: 'checkboxMoney', editable: true },
  { key: 'extras', label: 'Extras', kind: 'money', editable: true },
  { key: 'ausencias_justificadas', label: 'Ausencias Justificadas', kind: 'number', editable: true },
  { key: 'ausencias_injustificadas', label: 'Ausencias Injustificadas', kind: 'number', editable: true },
  { key: 'tardanzas', label: 'Tardanzas', kind: 'number', editable: true },
  { key: 'descuentos', label: 'Descuentos', kind: 'money', editable: true },
  { key: 'adelantos', label: 'Adelantos', kind: 'money', editable: true },
  { key: 'sueldo_sac', label: 'SUELDO SAC', kind: 'money', editable: true },
  { key: 'sueldo_neto', label: 'Sueldo Neto', kind: 'money', editable: true },
  { key: 'banco', label: 'Banco', kind: 'checkboxMoney', editable: true },
  { key: 'efectivo', label: 'Efectivo', kind: 'money' },
  { key: 'fecha_deposito', label: 'Fecha Depósito', kind: 'date', editable: true },
  { key: 'sueldo_pagado', label: 'Pagado', kind: 'checkboxText', editable: true },
]

export const SAVE_FIELDS: EditableField[] = [
  'aplica_valor_hora',
  'aplica_sueldo_basico_escala',
  'aplica_horas_extra',
  'aplica_incentivos',
  'aplica_banco',
  'hs_realizadas_mes',
  'valor_hora',
  'sueldo_basico',
  'horas_extra_50',
  'horas_extra_hs',
  'horas_feriado',
  'horas_feriado_hs',
  'incentivos',
  'incentivos_seleccionados',
  'extras',
  'ausencias_justificadas',
  'ausencias_injustificadas',
  'tardanzas',
  'descuentos',
  'adelantos',
  'sueldo_sac',
  'sueldo_neto',
  'banco',
  'efectivo',
  'fecha_deposito',
  'sueldo_pagado',
]

export function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCell(row: TablaMensualRow, column: SueldosColumn): string {
  const value = row[column.key]
  if (column.key === 'valor_hora' && !row.aplica_valor_hora) return '-'
  if (column.key === 'horas_extra_50' && !row.aplica_horas_extra) return '-'
  if (column.key === 'incentivos' && !row.aplica_incentivos) return '-'
  if (column.key === 'banco' && !row.aplica_banco) return '-'
  if (column.kind === 'money') return fmtCurrency(asNumber(value))
  if (column.kind === 'number') return String(value ?? 0)
  if (column.kind === 'date') return typeof value === 'string' && value ? fmtDate(value) : '-'
  if (column.key === 'sueldo_pagado') return value ? 'Pagado' : 'Pendiente'
  if (column.kind === 'checkboxMoney' || column.kind === 'checkboxAmount') return fmtCurrency(asNumber(value))
  return String(value ?? '-')
}

export function effectiveValorHora(row: TablaMensualRow): number {
  if (row.aplica_valor_hora && asNumber(row.valor_hora) > 0) return asNumber(row.valor_hora)
  return asNumber(row.sueldo_basico) > 0 ? asNumber(row.sueldo_basico) / 26 / 8 : 0
}

export function recalculateRow(row: TablaMensualRow): TablaMensualRow {
  const sueldoBasico = row.aplica_sueldo_basico_escala ? asNumber(row.escala) : asNumber(row.sueldo_basico)
  const valorHora = row.aplica_valor_hora ? asNumber(row.valor_hora_escala) || sueldoBasico / 26 / 8 : 0
  const valorHoraCalculo = valorHora || sueldoBasico / 26 / 8
  const horasExtra = row.aplica_horas_extra ? asNumber(row.horas_extra_hs) * valorHoraCalculo * 1.5 : 0
  const horasFeriado = asNumber(row.horas_feriado_hs) * valorHoraCalculo
  const incentivos = row.aplica_incentivos
    ? row.incentivos_items.filter(item => item.selected).reduce((sum, item) => sum + asNumber(item.monto), 0)
    : 0
  const banco = row.aplica_banco ? asNumber(row.banco) : 0
  // El SAC (aguinaldo) es un haber editable que solo aplica en junio y diciembre
  const sueldoSac = row.es_mes_sac ? asNumber(row.sueldo_sac) : 0
  const sueldoNeto =
    sueldoBasico +
    horasExtra +
    horasFeriado +
    incentivos +
    asNumber(row.extras) +
    sueldoSac +
    asNumber(row.ausencias_justificadas) -
    asNumber(row.ausencias_injustificadas) -
    asNumber(row.tardanzas) -
    asNumber(row.descuentos) -
    asNumber(row.adelantos)

  return {
    ...row,
    valor_hora: Math.round(valorHora),
    sueldo_basico: Math.round(sueldoBasico),
    horas_extra_50: Math.round(horasExtra),
    horas_feriado: Math.round(horasFeriado),
    incentivos: Math.round(incentivos),
    incentivos_seleccionados: row.incentivos_items.filter(item => item.selected).map(item => item.id),
    sueldo_sac: Math.round(sueldoSac),
    sueldo_neto: Math.round(sueldoNeto),
    banco: row.aplica_banco ? Math.min(Math.round(banco), Math.round(sueldoNeto)) : 0,
    efectivo: row.aplica_banco ? Math.max(Math.round(sueldoNeto) - Math.round(banco), 0) : Math.round(sueldoNeto),
  }
}

function checkboxFieldFor(column: SueldosColumn): EditableField | null {
  if (column.key === 'valor_hora') return 'aplica_valor_hora'
  if (column.key === 'sueldo_basico') return 'aplica_sueldo_basico_escala'
  if (column.key === 'horas_extra_50') return 'aplica_horas_extra'
  if (column.key === 'banco') return 'aplica_banco'
  return null
}

function checkboxChecked(row: TablaMensualRow, field: EditableField | null): boolean {
  return field ? Boolean(row[field]) : false
}

export function normalizeDraftRow(row: TablaMensualRow): TablaMensualRow {
  const incentivosItems = Array.isArray(row.incentivos_items) ? row.incentivos_items : []
  return {
    ...row,
    incentivos_items: incentivosItems,
    incentivos_seleccionados: Array.isArray(row.incentivos_seleccionados)
      ? row.incentivos_seleccionados
      : incentivosItems.filter(item => item.selected).map(item => item.id),
  }
}

export function TablaMensualSection({
  rows,
  sucursalId,
  mes,
  anio,
  onSaved,
}: {
  rows: TablaMensualRow[]
  sucursalId: number
  mes: number
  anio: number
  onSaved?: () => void
}) {
  const router = useRouter()
  const user = useAuthStore(state => state.user)
  const [simulationMode, setSimulationMode] = useState(false)
  const [draftRows, setDraftRows] = useState<TablaMensualRow[]>(rows)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const esMesSac = mes === 6 || mes === 12
  function goToDetalle(pid: number) {
    router.push(`/recursos-humanos/${sucursalId}/sueldos/mensual/${pid}?mes=${mes}&anio=${anio}`)
  }
  const columns = useMemo(() => SUELDOS_COLUMNS.filter(column => column.key !== 'sueldo_sac' || esMesSac), [esMesSac])

  const visibleRows = simulationMode ? draftRows : rows
  const pendientesEnvio = rows.filter(row => !row.enviado_pagos && asNumber(row.sueldo_neto) > 0)
  const enviadosCount = rows.filter(row => row.enviado_pagos).length
  const totals = useMemo(
    () => ({
      neto: visibleRows.reduce((sum, row) => sum + asNumber(row.sueldo_neto), 0),
      banco: visibleRows.reduce((sum, row) => sum + asNumber(row.banco), 0),
      efectivo: visibleRows.reduce((sum, row) => sum + asNumber(row.efectivo), 0),
    }),
    [visibleRows],
  )

  function enterSimulation() {
    setDraftRows(rows.map(row => normalizeDraftRow({ ...row, ...(row.simulacion ?? {}) })))
    setSimulationMode(true)
  }

  function cancelSimulation() {
    setDraftRows(rows)
    setSimulationMode(false)
  }

  function updateDraft(personalId: number, field: EditableField, value: string) {
    setDraftRows(current =>
      current.map(row => {
        if (row.personal_id !== personalId) return row
        const nextValue = field === 'fecha_deposito' ? value : Number(value || 0)
        return recalculateRow({ ...row, [field]: nextValue })
      }),
    )
  }

  function toggleDraft(personalId: number, field: EditableField, checked: boolean) {
    setDraftRows(current =>
      current.map(row => {
        if (row.personal_id !== personalId) return row
        const next = { ...row, [field]: checked }
        if (field === 'aplica_valor_hora' && checked)
          next.valor_hora = asNumber(row.valor_hora_escala) || effectiveValorHora(row)
        if (field === 'aplica_sueldo_basico_escala' && checked) next.sueldo_basico = row.escala
        if (field === 'aplica_banco' && !checked) next.banco = 0
        return recalculateRow(next)
      }),
    )
  }

  function toggleIncentivo(personalId: number, incentivoId: number, checked: boolean) {
    setDraftRows(current =>
      current.map(row => {
        if (row.personal_id !== personalId) return row
        const incentivosItems = row.incentivos_items.map(item =>
          item.id === incentivoId ? { ...item, selected: checked } : item,
        )
        return recalculateRow({
          ...row,
          aplica_incentivos: incentivosItems.some(item => item.selected),
          incentivos_items: incentivosItems,
        })
      }),
    )
  }

  async function saveSimulation() {
    setSaving(true)
    try {
      await Promise.all(
        draftRows.map(row => {
          const payload = SAVE_FIELDS.reduce<Record<string, string | number | boolean | number[] | null>>(
            (acc, field) => {
              acc[field] = row[field] as string | number | boolean | number[] | null
              return acc
            },
            {},
          )
          return apiFetch(API_ENDPOINTS.RRHH_SUELDOS.UPDATE_PERIODO(row.personal_id, sucursalId, mes, anio), {
            method: 'PUT',
            body: JSON.stringify({ data: payload }),
          }).then(async response => {
            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.message || 'Error al guardar simulación')
            }
          })
        }),
      )
      toast.success('Simulación aceptada y aplicada al período')
      setSimulationMode(false)
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar simulación')
    } finally {
      setSaving(false)
    }
  }

  async function enviarPagos() {
    if (pendientesEnvio.length === 0) return
    setSending(true)
    try {
      const response = await apiFetch(API_ENDPOINTS.RRHH_SUELDOS.ENVIAR_PAGOS, {
        method: 'POST',
        body: JSON.stringify({
          sucursal_id: sucursalId,
          user_id: user?.id,
          mes,
          anio,
          rows: pendientesEnvio.map(row => ({
            personal_id: row.personal_id,
            nombre: row.nombre,
            sueldo_neto: row.sueldo_neto,
            banco: row.banco,
            efectivo: row.efectivo,
            fecha_deposito: row.fecha_deposito,
          })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al enviar a Pagos Pendientes')
      toast.success(data.message || 'Sueldos enviados a Pagos Pendientes')
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar a Pagos Pendientes')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[#002868] via-[#1a5fb4] to-emerald-500" />
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#002868]" />
            <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
              Tabla mensual de sueldos
            </CardTitle>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {visibleRows.length} registro{visibleRows.length !== 1 ? 's' : ''}
            </span>
            {simulationMode && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Simulación</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2850px] text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  {columns.map((column, index) => (
                    <th
                      key={column.key}
                      className={`px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] align-bottom ${column.sticky ? 'sticky z-20 bg-[#FAFAFA]' : ''} ${
                        index === 0 ? 'left-0 min-w-[92px]' : ''
                      } ${index === 1 ? 'left-[92px] min-w-[210px]' : 'min-w-[128px]'}`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] min-w-[110px]">
                    Comentarios
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {visibleRows.map(row => (
                  <tr
                    key={row.personal_id}
                    className={`group transition-colors ${row.sueldo_pagado ? 'bg-emerald-50 hover:bg-emerald-100/70' : 'hover:bg-[#F8FAFF]'}`}
                  >
                    {columns.map((column, index) => {
                      const editable = simulationMode && column.editable
                      const checkboxField = checkboxFieldFor(column)
                      return (
                        <td
                          key={column.key}
                          className={`px-3 py-3 align-middle ${column.kind === 'money' ? 'tabular-nums text-right' : ''} ${
                            column.sticky ? 'sticky z-10 bg-white group-hover:bg-[#F8FAFF]' : ''
                          } ${row.sueldo_pagado && column.sticky ? 'bg-emerald-50 group-hover:bg-emerald-100/70' : ''} ${index === 0 ? 'left-0' : ''} ${index === 1 ? 'left-[92px]' : ''}`}
                        >
                          {editable ? (
                            <div className="flex items-center justify-end gap-2">
                              {checkboxField && (
                                <Checkbox
                                  checked={checkboxChecked(row, checkboxField)}
                                  onCheckedChange={checked =>
                                    toggleDraft(row.personal_id, checkboxField, checked === true)
                                  }
                                  className="size-5"
                                  aria-label={`Aplicar ${column.label}`}
                                />
                              )}
                              {column.key === 'valor_hora' ? (
                                <span className="min-w-[92px] text-right text-xs font-semibold text-[#1A1A1A]">
                                  {row.aplica_valor_hora ? fmtCurrency(row.valor_hora) : '-'}
                                </span>
                              ) : column.key === 'sueldo_basico' && row.aplica_sueldo_basico_escala ? (
                                <span className="min-w-[104px] text-right text-xs font-semibold text-[#1A1A1A]">
                                  {fmtCurrency(row.sueldo_basico)}
                                </span>
                              ) : column.key === 'horas_extra_50' ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    value={String(row.horas_extra_hs ?? 0)}
                                    onChange={event =>
                                      updateDraft(row.personal_id, 'horas_extra_hs', event.target.value)
                                    }
                                    disabled={!row.aplica_horas_extra}
                                    className="h-8 w-16 text-xs"
                                  />
                                  <span className="min-w-[82px] text-right text-xs font-semibold text-[#1A1A1A]">
                                    {row.aplica_horas_extra ? fmtCurrency(row.horas_extra_50) : '-'}
                                  </span>
                                </div>
                              ) : column.key === 'horas_feriado' ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    value={String(row.horas_feriado_hs ?? 0)}
                                    onChange={event =>
                                      updateDraft(row.personal_id, 'horas_feriado_hs', event.target.value)
                                    }
                                    className="h-8 w-16 text-xs"
                                  />
                                  <span className="min-w-[82px] text-right text-xs font-semibold text-[#1A1A1A]">
                                    {fmtCurrency(row.horas_feriado)}
                                  </span>
                                </div>
                              ) : column.key === 'incentivos' ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="h-8 min-w-[154px] justify-between gap-2 px-2 text-xs"
                                    >
                                      <span className="truncate">
                                        {row.incentivos_items.filter(item => item.selected).length}/
                                        {row.incentivos_items.length} · {fmtCurrency(row.incentivos)}
                                      </span>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-80 p-3">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-[#002868]">
                                          Incentivos aplicables
                                        </p>
                                        <p className="text-xs text-[#9AA0AC]">Marcá los que cumple este colaborador.</p>
                                      </div>
                                      {row.incentivos_items.length === 0 ? (
                                        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-[#9AA0AC]">
                                          Sin incentivos activos para este período.
                                        </p>
                                      ) : (
                                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                                          {row.incentivos_items.map(item => (
                                            <label
                                              key={item.id}
                                              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 hover:bg-[#F8FAFF]"
                                            >
                                              <Checkbox
                                                checked={item.selected}
                                                onCheckedChange={checked =>
                                                  toggleIncentivo(row.personal_id, item.id, checked === true)
                                                }
                                              />
                                              <span className="min-w-0 flex-1">
                                                <span className="block truncate text-xs font-semibold text-[#1A1A1A]">
                                                  {item.nombre}
                                                </span>
                                                <span className="block text-[11px] text-[#9AA0AC]">
                                                  {fmtCurrency(item.monto)}
                                                </span>
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : column.key === 'banco' ? (
                                <Input
                                  type="number"
                                  value={String(row.banco ?? 0)}
                                  onChange={event => updateDraft(row.personal_id, 'banco', event.target.value)}
                                  disabled={!row.aplica_banco}
                                  className="h-8 min-w-[104px] text-xs"
                                />
                              ) : column.key === 'sueldo_pagado' ? (
                                <div className="flex min-w-[96px] items-center justify-end gap-2">
                                  <span className="text-[11px] font-semibold text-[#5A6070]">
                                    {row.sueldo_pagado ? 'Pagado' : 'Pendiente'}
                                  </span>
                                  <Switch
                                    checked={Boolean(row.sueldo_pagado)}
                                    onCheckedChange={checked => toggleDraft(row.personal_id, 'sueldo_pagado', checked)}
                                    aria-label="Marcar sueldo pagado"
                                  />
                                </div>
                              ) : (
                                <Input
                                  type={column.kind === 'date' ? 'date' : column.kind === 'text' ? 'text' : 'number'}
                                  value={String(row[column.key] ?? '')}
                                  onChange={event =>
                                    updateDraft(row.personal_id, column.key as EditableField, event.target.value)
                                  }
                                  className="h-8 min-w-[104px] text-xs"
                                />
                              )}
                            </div>
                          ) : column.key === 'nombre' ? (
                            <button
                              type="button"
                              onClick={() => goToDetalle(row.personal_id)}
                              className="text-left cursor-pointer"
                            >
                              <p className="font-semibold text-[#1A1A1A] hover:text-[#002868]">{row.nombre}</p>
                              {row.enviado_pagos ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                  <Lock className="w-2.5 h-2.5" />
                                  Enviado a pagos
                                </span>
                              ) : (
                                <p className="text-[10px] text-[#9AA0AC]">Click para detalle</p>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => goToDetalle(row.personal_id)}
                              className={`w-full cursor-pointer ${column.kind === 'money' ? 'text-right' : 'text-left'}`}
                            >
                              <span
                                className={
                                  column.key === 'sueldo_pagado'
                                    ? `inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${row.sueldo_pagado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`
                                    : column.key === 'sueldo_neto'
                                      ? 'font-bold text-[#002868]'
                                      : 'text-[#1A1A1A]'
                                }
                              >
                                {formatCell(row, column)}
                              </span>
                            </button>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3">
                      {row.comentario_cobro ? (
                        <button
                          type="button"
                          onClick={() => goToDetalle(row.personal_id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3FF] px-2.5 py-1 text-xs font-semibold text-[#002868] hover:bg-[#D8E3F8] cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Cobro
                        </button>
                      ) : row.tiene_comentarios ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/recursos-humanos/${sucursalId}/legajos/${row.personal_id}`)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {row.comentarios_count}
                        </button>
                      ) : (
                        <span className="text-xs text-[#B0B8C4]">Sin comentarios</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#D8E3F8] bg-[#F8FAFF] font-bold text-[#002868]">
                  {columns.map((column, index) => {
                    if (index === 0)
                      return (
                        <td key={column.key} className="sticky left-0 z-20 bg-[#F8FAFF] px-3 py-3">
                          Totales
                        </td>
                      )
                    if (index === 1)
                      return <td key={column.key} className="sticky left-[92px] z-20 bg-[#F8FAFF] px-3 py-3" />
                    const total =
                      column.key === 'sueldo_neto'
                        ? totals.neto
                        : column.key === 'banco'
                          ? totals.banco
                          : column.key === 'efectivo'
                            ? totals.efectivo
                            : null
                    return (
                      <td key={column.key} className="px-3 py-3 text-right tabular-nums">
                        {total !== null ? fmtCurrency(total) : ''}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] bg-white px-4 py-4">
            <div className="space-y-1">
              <p className="text-xs text-[#9AA0AC] max-w-md">
                {simulationMode
                  ? 'Ajustá los valores y aceptá la simulación para guardarlos en el período.'
                  : 'Paso 1: simulá y guardá los valores. Paso 2: enviá a Pagos Pendientes para impactar la acreditación.'}
              </p>
              {!simulationMode && enviadosCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {enviadosCount} enviado{enviadosCount !== 1 ? 's' : ''} a Pagos Pendientes
                </span>
              )}
            </div>
            {simulationMode ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={cancelSimulation}
                  disabled={saving}
                  className="h-9 gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={saveSimulation}
                  disabled={saving}
                  className="h-9 gap-2 bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Aceptar simulación
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={enterSimulation}
                  variant="outline"
                  className="h-9 gap-2 border-[#002868]/30 text-[#002868] hover:bg-[#002868]/8 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  Modo simulación
                </Button>
                <Button
                  onClick={enviarPagos}
                  disabled={sending || pendientesEnvio.length === 0}
                  className="h-9 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
                  title={
                    pendientesEnvio.length === 0
                      ? 'No hay sueldos pendientes de enviar'
                      : `Enviar ${pendientesEnvio.length} sueldo(s) a Pagos Pendientes`
                  }
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar a Pagos Pendientes
                  {pendientesEnvio.length > 0 && ` (${pendientesEnvio.length})`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Liq Final helpers ───────────────────────────────────────────────────────

export function recalculateLiqFinalRow(row: LiqFinalRow): LiqFinalRow {
  const sueldoBasico = row.aplica_sueldo_basico_escala ? asNumber(row.escala) : asNumber(row.sueldo_basico)
  const valorHora = row.aplica_valor_hora ? asNumber(row.valor_hora_escala) || sueldoBasico / 26 / 8 : 0
  const valorHoraCalculo = valorHora || sueldoBasico / 26 / 8
  const horasExtra = row.aplica_horas_extra ? asNumber(row.horas_extra_hs) * valorHoraCalculo * 1.5 : 0
  const horasFeriado = asNumber(row.horas_feriado_hs) * valorHoraCalculo
  const incentivos = row.aplica_incentivos
    ? row.incentivos_items.filter(i => i.selected).reduce((s, i) => s + asNumber(i.monto), 0)
    : 0

  const sueldoNeto = Math.round(
    sueldoBasico +
      horasExtra +
      horasFeriado +
      incentivos +
      asNumber(row.extras) +
      asNumber(row.ausencias_justificadas) -
      asNumber(row.ausencias_injustificadas) -
      asNumber(row.tardanzas) -
      asNumber(row.descuentos) -
      asNumber(row.adelantos),
  )

  const banco = row.aplica_banco ? Math.min(Math.round(asNumber(row.banco)), sueldoNeto) : 0
  const efectivo = row.aplica_banco ? Math.max(sueldoNeto - banco, 0) : sueldoNeto

  // SAC, VNG y Preaviso son importes editables (defaults calculados por antigüedad).
  const sacImporte = Math.round(asNumber(row.sac_importe))
  const vngImporte = Math.round(asNumber(row.vng_importe))
  const preavisoImporte = Math.round(asNumber(row.preaviso_importe))
  const totalLiq = sacImporte + vngImporte + preavisoImporte

  // Porcentajes derivados (informativos) respecto del neto del período.
  const pct = (importe: number) => (sueldoNeto > 0 ? Math.round((importe / sueldoNeto) * 10000) / 100 : 0)

  const ratio = sueldoNeto > 0 ? banco / sueldoNeto : row.aplica_banco ? 1 : 0
  const liqBanco = Math.round(totalLiq * ratio)
  const liqEfectivo = totalLiq - liqBanco

  return {
    ...row,
    sueldo_basico: Math.round(sueldoBasico),
    valor_hora: Math.round(valorHora),
    horas_extra_50: Math.round(horasExtra),
    horas_feriado: Math.round(horasFeriado),
    incentivos: Math.round(incentivos),
    incentivos_seleccionados: row.incentivos_items.filter(i => i.selected).map(i => i.id),
    sueldo_neto: sueldoNeto,
    banco,
    efectivo,
    sac_importe: sacImporte,
    vng_importe: vngImporte,
    preaviso_importe: preavisoImporte,
    sac_porcentaje: pct(sacImporte),
    vng_porcentaje: pct(vngImporte),
    preaviso_porcentaje: pct(preavisoImporte),
    total_liq: totalLiq,
    liq_banco: liqBanco,
    liq_efectivo: liqEfectivo,
    total_general: sueldoNeto + totalLiq,
  }
}

export function normalizeLiqFinalRow(row: LiqFinalRow): LiqFinalRow {
  const items = Array.isArray(row.incentivos_items) ? row.incentivos_items : []
  return recalculateLiqFinalRow({
    ...row,
    incentivos_items: items,
    incentivos_seleccionados: Array.isArray(row.incentivos_seleccionados)
      ? row.incentivos_seleccionados
      : items.filter(i => i.selected).map(i => i.id),
  })
}

export function liqEffectiveValorHora(row: LiqFinalRow): number {
  if (row.aplica_valor_hora && asNumber(row.valor_hora) > 0) return asNumber(row.valor_hora)
  return asNumber(row.sueldo_basico) > 0 ? asNumber(row.sueldo_basico) / 26 / 8 : 0
}

// ─── Liq Final Section ───────────────────────────────────────────────────────

export const LIQ_SAVE_FIELDS: (keyof LiqFinalRow)[] = [
  'aplica_valor_hora',
  'aplica_sueldo_basico_escala',
  'aplica_banco',
  'aplica_horas_extra',
  'aplica_incentivos',
  'valor_hora',
  'sueldo_basico',
  'horas_extra_50',
  'horas_extra_hs',
  'horas_feriado',
  'horas_feriado_hs',
  'incentivos',
  'incentivos_seleccionados',
  'extras',
  'ausencias_justificadas',
  'ausencias_injustificadas',
  'tardanzas',
  'descuentos',
  'adelantos',
  'sueldo_neto',
  'banco',
  'efectivo',
  'sac_porcentaje',
  'sac_importe',
  'vng_porcentaje',
  'vng_importe',
  'preaviso_porcentaje',
  'preaviso_importe',
  'total_liq',
  'liq_banco',
  'liq_efectivo',
  'total_general',
  'sueldo_pagado',
  'fecha_deposito',
  'comentario_cobro',
  'ministerio_aplica',
  'ministerio_direccion',
  'ministerio_fecha',
  'ministerio_horario',
]

export function LiquidacionesSection({
  liquidaciones,
  sucursalId,
  mes,
  anio,
}: {
  liquidaciones: LiqFinalRow[]
  sucursalId: number
  mes: number
  anio: number
}) {
  const router = useRouter()
  const enviadasCount = liquidaciones.filter(r => r.enviado_pagos).length

  const totals = useMemo(
    () => ({
      neto: liquidaciones.reduce((s, r) => s + asNumber(r.sueldo_neto), 0),
      liq: liquidaciones.reduce((s, r) => s + asNumber(r.total_liq), 0),
      total: liquidaciones.reduce((s, r) => s + asNumber(r.total_general), 0),
    }),
    [liquidaciones],
  )

  function openDetalle(liquidacionId: number) {
    router.push(`/recursos-humanos/${sucursalId}/sueldos/liquidaciones/${liquidacionId}?mes=${mes}&anio=${anio}`)
  }

  return (
    <Card className="border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-rose-500" />
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <FileX2 className="w-4 h-4 text-rose-500" />
          <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
            Liquidaciones finales del período
          </CardTitle>
          {liquidaciones.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {liquidaciones.length}
            </span>
          )}
          {enviadasCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {enviadasCount} enviada{enviadasCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {liquidaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <FileX2 className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm text-[#9AA0AC]">Sin liquidaciones finales este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-xs">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  {['Legajo', 'Colaborador', 'Puesto', 'FA', 'FB', 'Antigüedad'].map(h => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC]"
                    >
                      {h}
                    </th>
                  ))}
                  {['Sueldo Neto', 'Total Liq.', 'Total General'].map(h => (
                    <th
                      key={h}
                      className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC]"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {liquidaciones.map(row => (
                  <tr
                    key={row.liquidacion_id}
                    onClick={() => openDetalle(row.liquidacion_id)}
                    className={`group cursor-pointer transition-colors ${row.enviado_pagos ? 'bg-emerald-50/60 hover:bg-emerald-100/60' : 'hover:bg-rose-50/40'}`}
                  >
                    <td className="px-3 py-3 text-[#5A6070]">{row.legajo}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-[#1A1A1A] group-hover:text-rose-700">{row.nombre}</p>
                      {row.enviado_pagos ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                          <Lock className="w-2.5 h-2.5" />
                          Enviada a pagos
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#9AA0AC]">Ver detalle →</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[#5A6070]">{row.puesto}</td>
                    <td className="px-3 py-3 text-[#5A6070] tabular-nums">{row.fa ? fmtDate(row.fa) : '—'}</td>
                    <td className="px-3 py-3 text-[#5A6070] tabular-nums">{row.fb ? fmtDate(row.fb) : '—'}</td>
                    <td className="px-3 py-3 text-[#5A6070]">{row.antiguedad_texto || '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-[#002868]">
                      {fmtCurrency(row.sueldo_neto)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-rose-700">
                      {fmtCurrency(row.total_liq)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-rose-800">
                      {fmtCurrency(row.total_general)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${row.enviado_pagos ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {row.enviado_pagos ? 'Enviada' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-rose-100 bg-rose-50/60 font-bold text-rose-800 text-xs">
                  <td className="px-3 py-3">Totales</td>
                  <td colSpan={5} className="px-3 py-3" />
                  <td className="px-3 py-3 text-right tabular-nums">{fmtCurrency(totals.neto)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtCurrency(totals.liq)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{fmtCurrency(totals.total)}</td>
                  <td className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {liquidaciones.length > 0 && (
          <div className="border-t border-[#F0F0F0] bg-white px-4 py-4">
            <p className="text-xs text-[#9AA0AC]">
              Generadas desde bajas aprobadas. Hacé click en una fila para ver el detalle, editar y enviar a Pagos
              Pendientes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SueldosSectionLinks({ sucursalId, mes, anio }: { sucursalId: number; mes: number; anio: number }) {
  const router = useRouter()
  const query = `?mes=${mes}&anio=${anio}`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Button
        variant="outline"
        className="h-auto justify-between rounded-lg border-[#D8E3F8] bg-white px-5 py-4 text-left hover:bg-[#F8FAFF] cursor-pointer"
        onClick={() => router.push(`/recursos-humanos/${sucursalId}/sueldos/mensual${query}`)}
      >
        <span>
          <span className="block text-sm font-bold text-[#002868]">Sueldos del período</span>
          <span className="block text-xs font-normal text-[#9AA0AC] mt-1">Tabla mensual de colaboradores activos.</span>
        </span>
        <ArrowRight className="w-4 h-4 text-[#002868]" />
      </Button>
      <Button
        variant="outline"
        className="h-auto justify-between rounded-lg border-rose-100 bg-white px-5 py-4 text-left hover:bg-rose-50 cursor-pointer"
        onClick={() => router.push(`/recursos-humanos/${sucursalId}/sueldos/liquidaciones${query}`)}
      >
        <span>
          <span className="block text-sm font-bold text-rose-700">Liquidaciones finales</span>
          <span className="block text-xs font-normal text-[#9AA0AC] mt-1">
            Bajas aprobadas con liquidación generada.
          </span>
        </span>
        <ArrowRight className="w-4 h-4 text-rose-600" />
      </Button>
    </div>
  )
}
