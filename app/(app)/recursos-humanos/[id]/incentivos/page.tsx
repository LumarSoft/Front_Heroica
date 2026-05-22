'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BadgePercent, BellRing, Scale } from 'lucide-react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IncentivoCard } from '@/components/incentivos/IncentivoCard'
import { IncentivoFormDialog } from '@/components/incentivos/IncentivoFormDialog'
import type { IncentivoPayload } from '@/components/incentivos/IncentivoFormDialog'
import type { RhIncentivoPremio, Sucursal } from '@/lib/types'

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

function currentPeriod() {
  const now = new Date()
  return { mes: now.getMonth() + 1, anio: now.getFullYear() }
}

export default function RecursosHumanosIncentivosPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)
  const initialPeriod = useMemo(() => currentPeriod(), [])

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [incentivos, setIncentivos] = useState<RhIncentivoPremio[]>([])
  const [mes, setMes] = useState(initialPeriod.mes)
  const [anio, setAnio] = useState(initialPeriod.anio)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RhIncentivoPremio | null>(null)
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
      const res = await apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cargar sucursal')
      setSucursal(data.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchIncentivos() {
    if (!sucursalId) return
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_INCENTIVOS.GET_BY_SUCURSAL(sucursalId, mes, anio))
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cargar incentivos')
      setIncentivos(data.data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar incentivos'
      setError(message)
      toast.error(message)
    }
  }

  function openCreateDialog() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEditDialog(incentivo: RhIncentivoPremio) {
    setEditing(incentivo)
    setDialogOpen(true)
  }

  async function handleSave(payload: IncentivoPayload) {
    setSaving(true)
    try {
      const res = await apiFetch(
        editing ? API_ENDPOINTS.RRHH_INCENTIVOS.UPDATE(editing.id) : API_ENDPOINTS.RRHH_INCENTIVOS.CREATE,
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify({ sucursal_id: sucursalId, ...payload }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar incentivo')
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
      const res = await apiFetch(API_ENDPOINTS.RRHH_INCENTIVOS.DELETE(incentivo.id), { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al desactivar incentivo')
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
          <Button
            onClick={() => router.push('/recursos-humanos')}
            className="bg-[#002868] text-white hover:bg-[#003d8f]"
          >
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
                Catálogo global de reglas de incentivos y premios.
              </p>
            </div>
          </div>

          <Button
            onClick={openCreateDialog}
            className="bg-[#002868] text-white hover:bg-[#003d8f] rounded-2xl px-5 py-5"
          >
            <BadgePercent className="w-4 h-4" />
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
                    <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES.map((label, i) => (
                          <SelectItem key={label} value={String(i + 1)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Año</Label>
                    <Input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFF8E1] border-[#EFE3BC] shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-[#8A6D1D] mt-0.5" />
                  <div>
                    <h3 className="font-bold text-[#8A6D1D]">Cálculo por empleado</h3>
                    <p className="text-sm text-[#6B5A24] mt-1">
                      Los incentivos son globales. Al liquidar el sueldo de cada empleado podés activar los que aplican
                      con un check — el monto se calcula según la escala de ese trabajador.
                    </p>
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
                    Usá el botón "Nuevo incentivo" para registrar premios, objetivos o incentivos por escala.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E8EDF8]">
                  {incentivos.map(incentivo => (
                    <IncentivoCard
                      key={incentivo.id}
                      incentivo={incentivo}
                      onEdit={openEditDialog}
                      onDeactivate={handleDeactivate}
                      deactivatingId={deactivatingId}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <IncentivoFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
        saving={saving}
        initial={editing}
        defaultMes={mes}
        defaultAnio={anio}
      />
    </div>
  )
}
