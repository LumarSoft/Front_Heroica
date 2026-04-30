'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardList, Plus } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { SolicitudesTable } from '@/components/solicitudes/SolicitudesTable'
import { SolicitudDialog } from '@/components/solicitudes/SolicitudDialog'
import { AprobarSolicitudDialog } from '@/components/solicitudes/AprobarSolicitudDialog'
import { SolicitudesFilters, type SolicitudesFilterState } from '@/components/solicitudes/SolicitudesFilters'
import { SolicitudTiposGrid } from '@/components/solicitudes/SolicitudTiposGrid'
import { useAuthStore } from '@/store/authStore'
import type { Personal, Puesto, RhSolicitud, RhSolicitudTipo, Sucursal } from '@/lib/types'

const TIPOS_GRID: RhSolicitudTipo[] = [
  'Altas',
  'Bajas',
  'Novedades de sueldo',
  'Incentivos y premios',
  'Licencias',
  'Vacaciones',
  'Suspensiones',
  'Apercibimientos',
  'Capacitaciones',
  'Pedido de uniforme',
  'Adelantos',
]

const initialFilters: SolicitudesFilterState = {
  estado: 'todos',
  personalId: 'todos',
  sucursalId: 'todas',
  solicitante: '',
  fechaDesde: '',
  fechaHasta: '',
}

export default function SolicitudesPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)
  const canCrearSolicitudes = useAuthStore(state => state.canCrearSolicitudes())
  const canEditarSolicitudes = useAuthStore(state => state.canEditarSolicitudes())
  const canCancelarSolicitudes = useAuthStore(state => state.canCancelarSolicitudes())
  const canAprobarSolicitudes = useAuthStore(state => state.canAprobarSolicitudes())
  const canVerTodasSucursales = useAuthStore(state => state.canVerSolicitudesTodasSucursales())
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin())

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [solicitudes, setSolicitudes] = useState<RhSolicitud[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<SolicitudesFilterState>(initialFilters)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<RhSolicitudTipo | null>(null)
  const [selectedSolicitud, setSelectedSolicitud] = useState<RhSolicitud | null>(null)
  const [editingSolicitud, setEditingSolicitud] = useState<RhSolicitud | null>(null)

  const isGlobalView = isSuperAdmin || canVerTodasSucursales

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    solicitudes.forEach(solicitud => {
      if (solicitud.estado === 'Pendiente') counts[solicitud.tipo] = (counts[solicitud.tipo] || 0) + 1
    })
    return counts
  }, [solicitudes])

  async function fetchAll() {
    try {
      setError('')
      const solicitudesUrl = isGlobalView ? API_ENDPOINTS.RRHH_SOLICITUDES.GET_ALL : API_ENDPOINTS.RRHH_SOLICITUDES.GET_BY_SUCURSAL(sucursalId)
      const personalUrl = isGlobalView ? API_ENDPOINTS.PERSONAL.GET_ALL : API_ENDPOINTS.PERSONAL.GET_BY_SUCURSAL(sucursalId)
      const sucursalesUrl = API_ENDPOINTS.SUCURSALES.GET_ALL
      const [sucursalRes, solicitudesRes, personalRes, puestosRes, sucursalesRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId)),
        apiFetch(solicitudesUrl),
        apiFetch(personalUrl),
        apiFetch(API_ENDPOINTS.PUESTOS.GET_BY_SUCURSAL(sucursalId)),
        apiFetch(sucursalesUrl),
      ])

      const [sucursalData, solicitudesData, personalData, puestosData, sucursalesData] = await Promise.all([
        sucursalRes.json(),
        solicitudesRes.json(),
        personalRes.json(),
        puestosRes.json(),
        sucursalesRes.json(),
      ])

      if (!sucursalRes.ok) throw new Error(sucursalData.message || 'Error al cargar sucursal')
      if (!solicitudesRes.ok) throw new Error(solicitudesData.message || 'Error al cargar solicitudes')
      if (!personalRes.ok) throw new Error(personalData.message || 'Error al cargar personal')
      if (!puestosRes.ok) throw new Error(puestosData.message || 'Error al cargar puestos')
      if (!sucursalesRes.ok) throw new Error(sucursalesData.message || 'Error al cargar sucursales')

      setSucursal(sucursalData.data)
      setSolicitudes(solicitudesData.data ?? [])
      setPersonal(personalData.data ?? [])
      setPuestos(puestosData.data ?? [])
      setSucursales(sucursalesData.data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchAll()
  }, [sucursalId, isGlobalView])

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(solicitud => {
      if (selectedTipo && solicitud.tipo !== selectedTipo) return false
      if (filters.estado !== 'todos' && solicitud.estado !== filters.estado) return false
      if (filters.personalId !== 'todos' && String(solicitud.personal_id ?? solicitud.personal_creado_id ?? '') !== filters.personalId) return false
      if (isGlobalView && filters.sucursalId !== 'todas' && String(solicitud.sucursal_id) !== filters.sucursalId) return false
      if (filters.solicitante && !solicitud.usuario_nombre.toLowerCase().includes(filters.solicitante.toLowerCase())) return false
      if (filters.fechaDesde && solicitud.fecha_solicitud.split('T')[0] < filters.fechaDesde) return false
      if (filters.fechaHasta && solicitud.fecha_solicitud.split('T')[0] > filters.fechaHasta) return false
      return true
    })
  }, [filters, isGlobalView, selectedTipo, solicitudes])

  if (isLoading) return <PageLoadingSpinner />

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-3">
              <Button onClick={() => router.push(`/recursos-humanos/${sucursalId}`)} variant="ghost" size="icon" className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg" aria-label="Volver">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                  Recursos Humanos · {isGlobalView ? 'Vista global' : sucursal?.nombre ?? ''}
                </p>
                <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">Solicitudes</h1>
              </div>
            </div>

            {canCrearSolicitudes && (
              <Button onClick={() => { setEditingSolicitud(null); setIsDialogOpen(true) }} className="bg-gradient-to-r from-[#002868] to-[#003d8f] hover:shadow-lg text-white gap-2 transition-all cursor-pointer" size="sm">
                <Plus className="w-4 h-4" />
                Nueva Solicitud
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ErrorBanner error={error} />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#002868] flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-[#002868]" />
              Solicitudes
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              {isGlobalView ? 'Bandeja global de revisión, seguimiento y auditoría' : 'Carga y seguimiento de solicitudes de la sucursal'} · {solicitudesFiltradas.length} registro{solicitudesFiltradas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {!selectedTipo ? (
          <SolicitudTiposGrid tipos={TIPOS_GRID} pendingCounts={pendingCounts} onSelect={setSelectedTipo} showBadges={canAprobarSolicitudes} />
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={() => { setSelectedTipo(null); setFilters(initialFilters) }} className="text-[#5A6070] border-[#D8E3F8]">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Categorías
              </Button>
            </div>

            <SolicitudesFilters filters={filters} onChange={setFilters} personal={personal.filter(colaborador => colaborador.activo)} sucursales={sucursales} showSucursalFilter={isGlobalView} />
            <SolicitudesTable solicitudes={solicitudesFiltradas} onSelect={setSelectedSolicitud} showSucursal={isGlobalView} />
          </div>
        )}

        <AprobarSolicitudDialog
          solicitud={selectedSolicitud}
          open={Boolean(selectedSolicitud)}
          onOpenChange={open => !open && setSelectedSolicitud(null)}
          onSuccess={fetchAll}
          canAprobar={canAprobarSolicitudes}
          canEditar={canEditarSolicitudes}
          canCancelar={canCancelarSolicitudes}
          onEdit={solicitud => {
            setSelectedSolicitud(null)
            setEditingSolicitud(solicitud)
            setIsDialogOpen(true)
          }}
        />

        {isDialogOpen && (
          <SolicitudDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            sucursalId={editingSolicitud?.sucursal_id ?? sucursalId}
            personal={personal}
            puestos={puestos}
            onSuccess={fetchAll}
            solicitud={editingSolicitud}
          />
        )}
      </main>
    </div>
  )
}
