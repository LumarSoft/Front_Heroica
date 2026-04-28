'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BadgePercent, BellRing, Edit2, Plus, Scale, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { EscalaSalarial, RhIncentivoMetodoCalculo, RhIncentivoPremio, RhIncentivoTipo, Sucursal } from '@/lib/types'

const MESES = [
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

const METODOS: Array<{ value: RhIncentivoMetodoCalculo; label: string }> = [
  { value: 'porcentaje_escala', label: '% de escala' },
  { value: 'monto_fijo', label: 'Monto fijo' },
  { value: 'multiplicador_valor_hora', label: 'Horas por valor hora' },
]

interface IncentivoForm {
  nombre: string
  tipo: RhIncentivoTipo
  descripcion: string
  mes: number
  anio: number
  metodo_calculo: RhIncentivoMetodoCalculo
  valor: string
  escala_salarial_id: string
  activo: boolean
}

function currentPeriod() {
  const now = new Date()
  return { mes: now.getMonth() + 1, anio: now.getFullYear() }
}

function emptyForm(mes: number, anio: number): IncentivoForm {
  return {
    nombre: '',
    tipo: 'Incentivo',
    descripcion: '',
    mes,
    anio,
    metodo_calculo: 'porcentaje_escala',
    valor: '',
    escala_salarial_id: '',
    activo: true,
  }
}

function currency(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })
}

/** Miles con punto, decimales con coma (es-AR). */
function formatArMoney(n: number) {
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Parsea número ingresado en formato es-AR (miles `.`, decimales `,`). */
function parseArNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '')
  if (!s) return null
  if (s.includes(',')) {
    const parts = s.split(',')
    if (parts.length > 2) return null
    const intPart = parts[0].replace(/\./g, '')
    const decPart = (parts[1] ?? '').replace(/\./g, '').replace(/[^\d]/g, '').slice(0, 2)
    const n = Number(`${intPart}.${decPart}`)
    return Number.isFinite(n) ? n : null
  }
  const intOnly = s.replace(/\./g, '')
  const n = Number(intOnly)
  return Number.isFinite(n) ? n : null
}

function parseValorNumeric(valorStr: string, metodo: RhIncentivoMetodoCalculo): number | null {
  if (metodo === 'monto_fijo') return parseArNumber(valorStr)
  const n = Number(valorStr)
  return Number.isFinite(n) ? n : null
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isActive(incentivo: RhIncentivoPremio) {
  return incentivo.activo === true || incentivo.activo === 1
}

function toForm(incentivo: RhIncentivoPremio): IncentivoForm {
  const valorStr =
    incentivo.metodo_calculo === 'monto_fijo' ? formatArMoney(Number(incentivo.valor)) : String(incentivo.valor)
  return {
    nombre: incentivo.nombre,
    tipo: incentivo.tipo,
    descripcion: incentivo.descripcion ?? '',
    mes: incentivo.mes,
    anio: incentivo.anio,
    metodo_calculo: incentivo.metodo_calculo,
    valor: valorStr,
    escala_salarial_id: incentivo.escala_salarial_id ? String(incentivo.escala_salarial_id) : '',
    activo: isActive(incentivo),
  }
}

export default function RecursosHumanosIncentivosPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)
  const initialPeriod = useMemo(() => currentPeriod(), [])

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [incentivos, setIncentivos] = useState<RhIncentivoPremio[]>([])
  const [escalas, setEscalas] = useState<EscalaSalarial[]>([])
  const [mes, setMes] = useState(initialPeriod.mes)
  const [anio, setAnio] = useState(initialPeriod.anio)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RhIncentivoPremio | null>(null)
  const [form, setForm] = useState<IncentivoForm>(() => emptyForm(initialPeriod.mes, initialPeriod.anio))
  const [saving, setSaving] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [sucursalId])

  useEffect(() => {
    fetchIncentivos()
  }, [sucursalId, mes, anio])

  async function fetchInitialData() {
    setIsLoading(true)
    setError('')
    try {
      const [sucursalRes, escalasRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId)),
        apiFetch(API_ENDPOINTS.ESCALAS_SALARIALES.GET_BY_SUCURSAL(sucursalId)),
      ])
      const [sucursalData, escalasData] = await Promise.all([sucursalRes.json(), escalasRes.json()])
      if (!sucursalRes.ok) throw new Error(sucursalData.message || 'Error al cargar sucursal')
      if (!escalasRes.ok) throw new Error(escalasData.message || 'Error al cargar escalas salariales')
      setSucursal(sucursalData.data)
      setEscalas(escalasData.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar incentivos'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchIncentivos() {
    if (!sucursalId) return
    try {
      const response = await apiFetch(API_ENDPOINTS.RRHH_INCENTIVOS.GET_BY_SUCURSAL(sucursalId, mes, anio))
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar incentivos')
      setIncentivos(data.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar incentivos'
      setError(message)
      toast.error(message)
    }
  }

  const escalasDelPeriodo = useMemo(
    () => escalas.filter(escala => Number(escala.mes) === mes && Number(escala.anio) === anio),
    [escalas, mes, anio],
  )

  const escalasParaFormulario = useMemo(
    () => escalas.filter(escala => Number(escala.mes) === form.mes && Number(escala.anio) === form.anio),
    [escalas, form.mes, form.anio],
  )

  const escalaSeleccionada = useMemo(
    () => escalas.find(escala => String(escala.id) === form.escala_salarial_id) ?? null,
    [escalas, form.escala_salarial_id],
  )

  const totalActivo = useMemo(
    () => incentivos.filter(isActive).reduce((total, incentivo) => total + Number(incentivo.monto_calculado ?? 0), 0),
    [incentivos],
  )

  const previewMonto = useMemo(() => {
    const valorNum = parseValorNumeric(form.valor, form.metodo_calculo)
    if (valorNum === null || valorNum < 0) return 0
    if (form.metodo_calculo === 'monto_fijo') return valorNum
    if (!escalaSeleccionada) return 0
    if (form.metodo_calculo === 'porcentaje_escala') return Number(escalaSeleccionada.sueldo_base ?? 0) * valorNum / 100
    return Number(escalaSeleccionada.valor_hora ?? 0) * valorNum
  }, [escalaSeleccionada, form.metodo_calculo, form.valor])

  function openCreateDialog() {
    setEditing(null)
    setForm(emptyForm(mes, anio))
    setDialogOpen(true)
  }

  function openEditDialog(incentivo: RhIncentivoPremio) {
    setEditing(incentivo)
    setForm(toForm(incentivo))
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error('Ingresá un nombre')
      return
    }

    if (!form.escala_salarial_id) {
      toast.error('Elegí una escala salarial')
      return
    }

    const valorNum = parseValorNumeric(form.valor, form.metodo_calculo)
    if (valorNum === null || valorNum < 0) {
      toast.error('Ingresá un valor válido')
      return
    }

    setSaving(true)
    try {
      const payload = {
        sucursal_id: sucursalId,
        escala_salarial_id: Number(form.escala_salarial_id),
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion,
        mes: form.mes,
        anio: form.anio,
        metodo_calculo: form.metodo_calculo,
        valor: valorNum,
        activo: form.activo,
      }

      const response = await apiFetch(
        editing ? API_ENDPOINTS.RRHH_INCENTIVOS.UPDATE(editing.id) : API_ENDPOINTS.RRHH_INCENTIVOS.CREATE,
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al guardar incentivo')

      await fetchIncentivos()
      setDialogOpen(false)
      setEditing(null)
      toast.success(editing ? 'Incentivo actualizado' : 'Incentivo creado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar incentivo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(incentivo: RhIncentivoPremio) {
    setDeactivatingId(incentivo.id)
    try {
      const response = await apiFetch(API_ENDPOINTS.RRHH_INCENTIVOS.DELETE(incentivo.id), { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al desactivar incentivo')
      setIncentivos(prev => prev.map(item => (item.id === incentivo.id ? data.data : item)))
      toast.success('Incentivo desactivado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar incentivo')
    } finally {
      setDeactivatingId(null)
    }
  }

  if (isLoading) return <PageLoadingSpinner />

  if (!sucursal) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#1A1A1A] text-xl mb-4">Sucursal no encontrada</p>
          <Button onClick={() => router.push('/recursos-humanos')} className="bg-[#002868] text-white hover:bg-[#003d8f]">
            Volver a Recursos Humanos
          </Button>
        </div>
      </div>
    )
  }

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
              aria-label="Volver a recursos humanos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos / {sucursal.nombre}
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                Incentivos y premios
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 sm:mb-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0 shadow-sm">
              <BadgePercent className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A93BB] mb-1">
                {MESES[mes - 1]} {anio}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#002868]">Incentivos y premios</h2>
              <p className="text-[#666666] text-base sm:text-lg mt-1">
                Uso informativo y cálculo automático de incentivos vinculados a la escala salarial.
              </p>
            </div>
          </div>

          <Button onClick={openCreateDialog} className="bg-[#002868] text-white hover:bg-[#003d8f] rounded-2xl px-5 py-5">
            <Plus className="w-4 h-4" />
            Nuevo incentivo
          </Button>
        </div>

        <ErrorBanner error={error} />

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 max-w-7xl">
          <div className="space-y-5">
            <Card className="bg-white border-[#D8E3F8] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#002868]">Filtro por mes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Mes</Label>
                    <Select value={String(mes)} onValueChange={value => setMes(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((label, index) => (
                          <SelectItem key={label} value={String(index + 1)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Año</Label>
                    <Input type="number" value={anio} onChange={event => setAnio(Number(event.target.value))} />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F8FAFF] border border-[#D8E3F8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#9AA0AC] mb-1">Total activo estimado</p>
                  <p className="text-2xl font-bold text-[#002868]">{currency(totalActivo)}</p>
                  <p className="text-xs text-[#666666] mt-1">Se recalcula con la escala seleccionada.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFF8E1] border-[#EFE3BC] shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-[#8A6D1D] mt-0.5" />
                  <div>
                    <h3 className="font-bold text-[#8A6D1D]">Alarma de escala</h3>
                    <p className="text-sm text-[#6B5A24] mt-1">
                      Si no hay escala para el mes, RRHH debe actualizarla antes de fijar incentivos automáticos.
                    </p>
                    {escalasDelPeriodo.length === 0 && (
                      <p className="text-sm font-semibold text-[#8A6D1D] mt-3">
                        No hay escalas cargadas para {MESES[mes - 1]} {anio}.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-[#D8E3F8] shadow-sm overflow-hidden">
            <CardHeader className="border-b border-[#E8EDF8] flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-[#002868] flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Incentivos del período
              </CardTitle>
              <span className="rounded-full bg-[#EAF0FF] px-3 py-1 text-xs font-bold text-[#002868]">
                {incentivos.length} registros
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {incentivos.length === 0 ? (
                <div className="p-8 sm:p-10 min-h-[360px] flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#EAF0FF] flex items-center justify-center mb-6">
                    <BadgePercent className="w-8 h-8 text-[#002868]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#002868] mb-3">Sin incentivos cargados</h3>
                  <p className="text-[#666666] leading-relaxed max-w-xl">
                    Usá el botón “Nuevo incentivo” para registrar premios, objetivos o incentivos por escala.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E8EDF8]">
                  {incentivos.map(incentivo => (
                    <article key={incentivo.id} className="p-5 sm:p-6 hover:bg-[#F8FAFF] transition-colors">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex rounded-full border border-[#D8E3F8] bg-[#EAF0FF] px-3 py-1 text-xs font-bold text-[#002868]">
                              {incentivo.tipo}
                            </span>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${isActive(incentivo) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                              {isActive(incentivo) ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-[#002868]">{incentivo.nombre}</h3>
                          <p className="text-sm text-[#666666] mt-1">
                            {incentivo.escala_puesto ?? 'Sin escala'} · Actualizado {formatDate(incentivo.fecha_ultima_actualizacion)}
                          </p>
                          {incentivo.descripcion && <p className="text-sm text-[#4B5563] mt-3">{incentivo.descripcion}</p>}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:text-right">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#9AA0AC]">Cálculo automático</p>
                            <p className="text-2xl font-bold text-[#002868]">{currency(incentivo.monto_calculado)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEditDialog(incentivo)} aria-label="Editar incentivo">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeactivate(incentivo)}
                              disabled={!isActive(incentivo) || deactivatingId === incentivo.id}
                              className="text-rose-600 hover:text-rose-700"
                              aria-label="Desactivar incentivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002868]">
              {editing ? 'Editar incentivo' : 'Nuevo incentivo o premio'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={form.nombre} onChange={event => setForm(prev => ({ ...prev, nombre: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={value => setForm(prev => ({ ...prev, tipo: value as RhIncentivoTipo }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incentivo">Incentivo</SelectItem>
                  <SelectItem value="Premio">Premio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Método</Label>
              <Select
                value={form.metodo_calculo}
                onValueChange={value => {
                  const next = value as RhIncentivoMetodoCalculo
                  setForm(prev => {
                    let nextValor = prev.valor
                    if (next === 'monto_fijo' && prev.metodo_calculo !== 'monto_fijo') {
                      const n = Number(prev.valor)
                      if (prev.valor.trim() !== '' && Number.isFinite(n)) nextValor = formatArMoney(n)
                    } else if (next !== 'monto_fijo' && prev.metodo_calculo === 'monto_fijo') {
                      const n = parseArNumber(prev.valor)
                      nextValor = n !== null ? String(n) : prev.valor
                    }
                    return { ...prev, metodo_calculo: next, valor: nextValor }
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS.map(metodo => (
                    <SelectItem key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mes</Label>
              <Select value={String(form.mes)} onValueChange={value => setForm(prev => ({ ...prev, mes: Number(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((label, index) => (
                    <SelectItem key={label} value={String(index + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio">Año</Label>
              <Input id="anio" type="number" value={form.anio} onChange={event => setForm(prev => ({ ...prev, anio: Number(event.target.value) }))} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Escala salarial (obligatorio)</Label>
              <Select
                value={form.escala_salarial_id || undefined}
                onValueChange={value => setForm(prev => ({ ...prev, escala_salarial_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una escala" />
                </SelectTrigger>
                <SelectContent>
                  {escalasParaFormulario.map(escala => (
                    <SelectItem key={escala.id} value={String(escala.id)}>
                      {escala.puesto_nombre} · {currency(escala.sueldo_base)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {escalasParaFormulario.length === 0 && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No hay escalas para {MESES[form.mes - 1]} {form.anio}. Cargalas en Escala o cambiá mes/año.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">
                Valor
                {form.metodo_calculo === 'monto_fijo' && (
                  <span className="font-normal text-[#666666]"> (miles con punto, decimales con coma)</span>
                )}
              </Label>
              {form.metodo_calculo === 'monto_fijo' ? (
                <Input
                  id="valor"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={form.valor}
                  placeholder="Ej: 25.000,50"
                  onChange={event => setForm(prev => ({ ...prev, valor: event.target.value }))}
                  onBlur={() => {
                    const n = parseArNumber(form.valor)
                    if (n !== null) setForm(prev => ({ ...prev, valor: formatArMoney(n) }))
                  }}
                />
              ) : (
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor}
                  placeholder={form.metodo_calculo === 'porcentaje_escala' ? 'Ej: 10' : 'Ej: horas'}
                  onChange={event => setForm(prev => ({ ...prev, valor: event.target.value }))}
                />
              )}
            </div>

            <div className="rounded-2xl bg-[#F8FAFF] border border-[#D8E3F8] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#9AA0AC] mb-1">Vista previa</p>
              <p className="text-2xl font-bold text-[#002868]">{currency(previewMonto)}</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descripcion">Detalle informativo</Label>
              <Textarea
                id="descripcion"
                value={form.descripcion}
                placeholder="Cómo se calcula, objetivo asociado o comentario interno"
                onChange={event => setForm(prev => ({ ...prev, descripcion: event.target.value }))}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-[#D8E3F8] bg-white p-4">
              <div>
                <p className="font-semibold text-[#002868]">Activo</p>
                <p className="text-sm text-[#666666]">Desactivá el incentivo cuando deje de aplicar.</p>
              </div>
              <Switch checked={form.activo} onCheckedChange={checked => setForm(prev => ({ ...prev, activo: checked }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#002868] text-white hover:bg-[#003d8f]">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
