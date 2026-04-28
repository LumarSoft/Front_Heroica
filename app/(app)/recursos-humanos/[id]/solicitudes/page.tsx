'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ClipboardList, Filter, Plus } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { SolicitudesTable } from '@/components/solicitudes/SolicitudesTable'
import { SolicitudDialog } from '@/components/solicitudes/SolicitudDialog'
import { AprobarSolicitudDialog } from '@/components/solicitudes/AprobarSolicitudDialog'
import { useAuthStore } from '@/store/authStore'
import type { RhSolicitud, Sucursal, Personal } from '@/lib/types'

const TIPOS_GRID = [
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

type EstadoFiltro = 'todos' | 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada'

const ESTADO_OPTIONS: { value: EstadoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todas' },
  { value: 'Pendiente', label: 'Pendientes' },
  { value: 'Aprobada', label: 'Aprobadas' },
  { value: 'Rechazada', label: 'Rechazadas' },
]

export default function SolicitudesPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)

  const canGestionarSolicitudes = useAuthStore(state => state.canGestionarSolicitudes())

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [personal, setPersonal] = useState<Personal[]>([])
  const [solicitudes, setSolicitudes] = useState<RhSolicitud[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterEstado, setFilterEstado] = useState<EstadoFiltro>('todos')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null)
  const [solicitudToApprove, setSolicitudToApprove] = useState<RhSolicitud | null>(null)

  const pendingCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    solicitudes.forEach(s => {
      if (s.estado === 'Pendiente') {
        counts[s.tipo] = (counts[s.tipo] || 0) + 1
      }
    })
    return counts
  }, [solicitudes])

  const fetchAll = async () => {
    try {
      const [sucursalRes, solicitudesRes, personalRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId)),
        apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.GET_BY_SUCURSAL(sucursalId)),
        apiFetch(API_ENDPOINTS.PERSONAL.GET_BY_SUCURSAL(sucursalId)),
      ])

      const [sucursalData, solicitudesData, personalData] = await Promise.all([
        sucursalRes.json(),
        solicitudesRes.json(),
        personalRes.json(),
      ])

      if (!sucursalRes.ok) throw new Error(sucursalData.message || 'Error al cargar sucursal')
      if (!solicitudesRes.ok) throw new Error(solicitudesData.message || 'Error al cargar solicitudes')
      if (!personalRes.ok) throw new Error(personalData.message || 'Error al cargar personal')

      setSucursal(sucursalData.data)
      setSolicitudes(solicitudesData.data ?? [])
      setPersonal(personalData.data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [sucursalId])

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(s => {
      if (selectedTipo && s.tipo !== selectedTipo) return false
      if (filterEstado !== 'todos' && s.estado !== filterEstado) return false
      return true
    })
  }, [solicitudes, filterEstado, selectedTipo])

  if (isLoading) return <PageLoadingSpinner />

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push(`/recursos-humanos/${sucursalId}`)}
                variant="ghost"
                size="icon"
                className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
                aria-label="Volver"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                  Recursos Humanos · {sucursal?.nombre ?? ''}
                </p>
                <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                  Solicitudes
                </h1>
              </div>
            </div>

            {canGestionarSolicitudes && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-[#002868] to-[#003d8f] hover:shadow-lg text-white gap-2 transition-all cursor-pointer"
                size="sm"
              >
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
              Gestión administrativa y pedidos de la sucursal · {solicitudesFiltradas.length} registro{solicitudesFiltradas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {!selectedTipo ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {TIPOS_GRID.map(tipo => {
              const pending = pendingCounts[tipo] || 0
              
              // Simplistic color mapping inspired by mockup
              const isYellow = tipo === 'Novedades de sueldo'
              const colorClasses = isYellow 
                ? 'bg-[#FEF9C3] border-[#FDE047] hover:border-[#EAB308]' 
                : 'bg-[#DCFCE7] border-[#BBF7D0] hover:border-[#22C55E]'

              return (
                <div
                  key={tipo}
                  onClick={() => setSelectedTipo(tipo)}
                  className={`relative p-6 border rounded-xl cursor-pointer shadow-sm transition-all group ${colorClasses}`}
                >
                  {pending > 0 && canGestionarSolicitudes && (
                    <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                      {pending > 99 ? '99+' : pending}
                    </div>
                  )}
                  <div className="flex flex-col h-full justify-center min-h-[60px]">
                    <h3 className="font-semibold text-[#1A1A1A] leading-tight group-hover:scale-105 transition-transform origin-left">
                      {tipo}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTipo(null)
                  setFilterEstado('todos')
                }}
                className="text-[#5A6070] border-[#D8E3F8]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Categorías
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-[#9AA0AC] flex-shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA0AC]">Estado:</span>
                <div className="flex rounded-lg border border-[#D8E3F8] overflow-hidden">
                  {ESTADO_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterEstado(opt.value)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer
                        ${filterEstado === opt.value
                          ? 'bg-[#002868] text-white'
                          : 'bg-white text-[#5A6070] hover:bg-[#EEF3FF] hover:text-[#002868]'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {filterEstado !== 'todos' && (
                <button
                  onClick={() => setFilterEstado('todos')}
                  className="text-xs text-[#002868] underline underline-offset-2 hover:text-[#003d8f] cursor-pointer ml-auto"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <SolicitudesTable
              solicitudes={solicitudesFiltradas}
              onSelect={(sol) => setSolicitudToApprove(sol)}
            />
          </div>
        )}

        <AprobarSolicitudDialog
          solicitud={solicitudToApprove}
          open={!!solicitudToApprove}
          onOpenChange={(open) => !open && setSolicitudToApprove(null)}
          onSuccess={fetchAll}
          canAprobar={canGestionarSolicitudes}
        />

        {isDialogOpen && (
          <SolicitudDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            sucursalId={sucursalId}
            personal={personal}
            onSuccess={fetchAll}
          />
        )}
      </main>
    </div>
  )
}
