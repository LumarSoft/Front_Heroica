'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileX2,
  Landmark,
  Loader2,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { SummaryCard } from '@/components/reportes/SummaryCard'
import type { Sucursal } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResumenSueldos {
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

interface PorPuesto {
  puesto_id: number
  puesto: string
  colaboradores: number
  masa_salarial: number
  sueldo_promedio: number
}

interface Liquidacion {
  id: number
  nombre: string
  legajo: string
  puesto: string
  fecha_solicitud: string
  estado: string
}

interface Colaborador {
  id: number
  nombre: string
  legajo: string
  puesto: string
}

interface TablaMensualRow {
  personal_id: number
  nombre: string
  legajo: string
  puesto: string
  escala: number
  banco: number
  efectivo: number
  comentarios_count: number
  tiene_comentarios: boolean
  fa: string
  fb: string
}

interface SueldosData {
  periodo: { mes: number; anio: number; label: string }
  resumen: ResumenSueldos
  por_puesto: PorPuesto[]
  tabla_mensual: TablaMensualRow[]
  liquidaciones: Liquidacion[]
  colaboradores: Colaborador[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const CAUSAS_LIQUIDACION = [
  'Renuncia',
  'Despido sin causa',
  'Despido con causa',
  'Acuerdo mutuo',
  'Vencimiento de contrato',
]

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(v)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const CHART_COLORS = ['#002868', '#0047ab', '#1a5fb4', '#3a78c9', '#4a90e2', '#7cb9e8']

// ── Sub-components ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E0E0E0] rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[190px]">
      <p className="font-semibold text-[#1A1A1A] mb-1.5 border-b border-[#F0F0F0] pb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-6 mt-1">
          <span className="text-[#666]">{p.name}</span>
          <span className="font-bold text-[#1A1A1A]">{fmtCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function BancoEfectivoSplit({ resumen }: { resumen: ResumenSueldos }) {
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
            className="absolute left-0 top-0 h-full bg-[#002868] rounded-l-full transition-all duration-700"
            style={{ width: `${pct_banco}%` }}
          />
          {pct_efectivo > 0 && (
            <div
              className="absolute right-0 top-0 h-full bg-emerald-500 rounded-r-full transition-all duration-700"
              style={{ width: `${pct_efectivo}%` }}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#EEF3FF] p-4">
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
          <div className="rounded-xl bg-emerald-50 p-4">
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

function PorPuestoChart({ data }: { data: PorPuesto[] }) {
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
            tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
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
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F0F5FF' }} />
          <Bar dataKey="masa_salarial" name="Masa salarial" radius={[0, 6, 6, 0]} maxBarSize={26}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="divide-y divide-[#F5F5F5]">
        {data.map((p, i) => (
          <div key={p.puesto_id} className="flex items-center justify-between py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-[#5A6070] font-medium">{p.puesto}</span>
            </div>
            <div className="flex items-center gap-6 text-right">
              <span className="text-[#9AA0AC]">{p.colaboradores} col.</span>
              <span className="text-[#9AA0AC]">prom. {fmtCurrency(p.sueldo_promedio)}</span>
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

function LiquidacionesSection({ liquidaciones, onNueva }: { liquidaciones: Liquidacion[]; onNueva: () => void }) {
  return (
    <Card className="border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-rose-500" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileX2 className="w-4 h-4 text-rose-500" />
          <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
            Liquidaciones finales del período
          </CardTitle>
          {liquidaciones.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              {liquidaciones.length}
            </span>
          )}
          <Button
            onClick={onNueva}
            size="sm"
            className="ml-auto h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva liquidación
          </Button>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                  {['Colaborador', 'Puesto', 'Fecha', 'Estado'].map(h => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-semibold text-[#9AA0AC] uppercase tracking-wider px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {liquidaciones.map(l => (
                  <tr key={l.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-[#1A1A1A]">{l.nombre}</p>
                      <p className="text-xs text-[#9AA0AC]">Leg. {l.legajo}</p>
                    </td>
                    <td className="px-5 py-3 text-[#5A6070]">{l.puesto}</td>
                    <td className="px-5 py-3 text-[#5A6070] tabular-nums">{fmtDate(l.fecha_solicitud)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {l.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TablaMensualSection({ rows, sucursalId }: { rows: TablaMensualRow[]; sucursalId: number }) {
  const router = useRouter()

  return (
    <Card className="border border-slate-100 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#002868] via-[#1a5fb4] to-emerald-500" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#002868]" />
          <CardTitle className="text-xs font-semibold text-[#9AA0AC] uppercase tracking-widest">
            Tabla mensual de sueldos
          </CardTitle>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {rows.length} registro{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                {['Nombre', 'Puesto', 'Escala', 'Banco', 'Efectivo', 'Comentarios', 'FA', 'FB'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F5F5]">
              {rows.map(row => (
                <tr key={row.personal_id} className="hover:bg-[#F8FAFF] transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/recursos-humanos/${sucursalId}/legajos/${row.personal_id}`)}
                      className="text-left cursor-pointer"
                    >
                      <p className="font-semibold text-[#1A1A1A] hover:text-[#002868]">{row.nombre}</p>
                      <p className="text-xs text-[#9AA0AC]">Leg. {row.legajo}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#5A6070]">{row.puesto}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1A1A] tabular-nums">{fmtCurrency(row.escala)}</td>
                  <td className="px-4 py-3 text-[#002868] tabular-nums">{fmtCurrency(row.banco)}</td>
                  <td className="px-4 py-3 text-emerald-700 tabular-nums">{fmtCurrency(row.efectivo)}</td>
                  <td className="px-4 py-3">
                    {row.tiene_comentarios ? (
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
                  <td className="px-4 py-3 text-[#9AA0AC]">{row.fa ?? '—'}</td>
                  <td className="px-4 py-3 text-[#9AA0AC]">{row.fb ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Dialogs ────────────────────────────────────────────────────────────────────

interface SueldoDialogProps {
  open: boolean
  colaboradores: Colaborador[]
  sucursalId: number
  onClose: () => void
  onSuccess: () => void
}

function NuevoSueldoDialog({ open, colaboradores, sucursalId, onClose, onSuccess }: SueldoDialogProps) {
  const [personalId, setPersonalId] = useState('')
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setPersonalId('')
    setNuevoMonto('')
    setDescripcion('')
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!personalId) {
      setError('Seleccioná un colaborador.')
      return
    }
    if (!nuevoMonto || isNaN(Number(nuevoMonto))) {
      setError('Ingresá un monto válido.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'Novedades de sueldo',
          personal_id: Number(personalId),
          sucursal_id: sucursalId,
          detalles: { nuevo_monto: Number(nuevoMonto), descripcion },
          fecha_solicitud: new Date().toISOString().split('T')[0],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Error al registrar')
      reset()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#002868]">
            <DollarSign className="w-5 h-5" />
            Novedad de sueldo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <Select value={personalId} onValueChange={setPersonalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un colaborador..." />
              </SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre} — {c.puesto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Nuevo sueldo base ($)</Label>
            <Input
              type="number"
              min={0}
              placeholder="Ej: 85000"
              value={nuevoMonto}
              onChange={e => setNuevoMonto(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Descripción / motivo <span className="text-[#9AA0AC] font-normal">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Ej: Aumento por paritaria..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={submitting} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar novedad'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface LiquidacionDialogProps {
  open: boolean
  colaboradores: Colaborador[]
  sucursalId: number
  onClose: () => void
  onSuccess: () => void
}

function NuevaLiquidacionDialog({ open, colaboradores, sucursalId, onClose, onSuccess }: LiquidacionDialogProps) {
  const [personalId, setPersonalId] = useState('')
  const [causa, setCausa] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setPersonalId('')
    setCausa('')
    setDescripcion('')
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    if (!personalId) {
      setError('Seleccioná un colaborador.')
      return
    }
    if (!causa) {
      setError('Seleccioná la causa de la liquidación.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.CREATE, {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'Liquidación Final',
          personal_id: Number(personalId),
          sucursal_id: sucursalId,
          detalles: { causa, descripcion },
          fecha_solicitud: new Date().toISOString().split('T')[0],
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Error al registrar')
      reset()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600">
            <FileX2 className="w-5 h-5" />
            Liquidación final
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2.5 text-xs text-rose-700">
            Esto registrará una solicitud de liquidación final para el colaborador seleccionado.
          </div>

          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <Select value={personalId} onValueChange={setPersonalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un colaborador..." />
              </SelectTrigger>
              <SelectContent>
                {colaboradores.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre} — {c.puesto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Causa</Label>
            <Select value={causa} onValueChange={setCausa}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná la causa..." />
              </SelectTrigger>
              <SelectContent>
                {CAUSAS_LIQUIDACION.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Observaciones <span className="text-[#9AA0AC] font-normal">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Detalles adicionales..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={submitting} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar liquidación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SueldosPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)

  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [data, setData] = useState<SueldosData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialogoSueldo, setDialogoSueldo] = useState(false)
  const [dialogoLiquidacion, setDialogoLiquidacion] = useState(false)

  // Carga nombre de sucursal (una sola vez)
  useEffect(() => {
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
      .then(r => r.json())
      .then(d => setSucursal(d.data ?? null))
      .catch(() => {})
  }, [sucursalId])

  // Carga datos del período
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

  const prevPeriodo = () => {
    if (mes === 1) {
      setMes(12)
      setAnio(a => a - 1)
    } else setMes(m => m - 1)
  }

  const nextPeriodo = () => {
    const esActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()
    if (esActual) return
    if (mes === 12) {
      setMes(1)
      setAnio(a => a + 1)
    } else setMes(m => m + 1)
  }

  const isActual = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear()
  const periodoLabel = `${MESES_LABEL[mes - 1]} ${anio}`
  const isEmpty = !isLoading && !error && data?.resumen.total_colaboradores === 0

  const colaboradores = data?.colaboradores ?? []

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      {/* Header */}
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

            {/* Acciones rápidas */}
            <Button
              onClick={() => setDialogoSueldo(true)}
              size="sm"
              className="hidden sm:flex h-8 text-xs bg-[#002868] hover:bg-[#003d8f] text-white gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Sueldo
            </Button>
            <Button
              onClick={() => setDialogoLiquidacion(true)}
              size="sm"
              variant="outline"
              className="hidden sm:flex h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5 cursor-pointer"
            >
              <FileX2 className="w-3.5 h-3.5" />
              Liquidación final
            </Button>

            {/* Selector de período */}
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
            {/* Hero */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#002868] flex items-center justify-center shadow-md shadow-[#002868]/20 flex-shrink-0">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#002868] leading-tight">{periodoLabel}</h2>
                <p className="text-sm text-[#666666] mt-0.5">Resumen de haberes — {sucursal?.nombre}</p>
              </div>
              {/* Botones visibles en mobile solo en el hero */}
              <div className="flex sm:hidden items-center gap-2">
                <Button
                  onClick={() => setDialogoSueldo(true)}
                  size="sm"
                  className="h-8 text-xs bg-[#002868] hover:bg-[#003d8f] text-white gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Sueldo
                </Button>
                <Button
                  onClick={() => setDialogoLiquidacion(true)}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 gap-1 cursor-pointer"
                >
                  <FileX2 className="w-3.5 h-3.5" />
                  Liq. final
                </Button>
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
                {/* KPI cards originales */}
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

                {/* Banco / Efectivo */}
                <BancoEfectivoSplit resumen={data.resumen} />

                <TablaMensualSection rows={data.tabla_mensual} sucursalId={sucursalId} />

                {/* Por puesto + liquidaciones */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  <LiquidacionesSection
                    liquidaciones={data.liquidaciones}
                    onNueva={() => setDialogoLiquidacion(true)}
                  />
                </div>
              </>
            ) : null}
          </>
        )}
      </main>

      {/* Diálogos */}
      <NuevoSueldoDialog
        open={dialogoSueldo}
        colaboradores={colaboradores}
        sucursalId={sucursalId}
        onClose={() => setDialogoSueldo(false)}
        onSuccess={() => {
          setDialogoSueldo(false)
          loadData()
        }}
      />
      <NuevaLiquidacionDialog
        open={dialogoLiquidacion}
        colaboradores={colaboradores}
        sucursalId={sucursalId}
        onClose={() => setDialogoLiquidacion(false)}
        onSuccess={() => {
          setDialogoLiquidacion(false)
          loadData()
        }}
      />
    </div>
  )
}
