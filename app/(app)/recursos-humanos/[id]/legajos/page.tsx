'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { LegajosTable } from '@/components/legajos/LegajosTable'
import type { Personal, Puesto, Sucursal } from '@/lib/types'

type EstadoFiltro = 'todos' | 'activos' | 'inactivos'

const ESTADO_OPTIONS: { value: EstadoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
]

export default function LegajosPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)

  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [personal, setPersonal] = useState<Personal[]>([])
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterEstado, setFilterEstado] = useState<EstadoFiltro>('activos')
  const [filterPuestoId, setFilterPuestoId] = useState<number | ''>('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sucursalRes, personalRes, puestosRes] = await Promise.all([
          apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId)),
          apiFetch(API_ENDPOINTS.PERSONAL.GET_BY_SUCURSAL(sucursalId)),
          apiFetch(API_ENDPOINTS.PUESTOS.GET_ALL),
        ])

        const [sucursalData, personalData, puestosData] = await Promise.all([
          sucursalRes.json(),
          personalRes.json(),
          puestosRes.json(),
        ])

        if (!sucursalRes.ok) throw new Error(sucursalData.message || 'Error al cargar sucursal')
        if (!personalRes.ok) throw new Error(personalData.message || 'Error al cargar personal')
        if (!puestosRes.ok) throw new Error(puestosData.message || 'Error al cargar puestos')

        setSucursal(sucursalData.data)
        setPersonal(personalData.data ?? [])
        setPuestos(puestosData.data ?? puestosData)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [sucursalId])

  const personalFiltrado = useMemo(() => {
    return personal.filter(p => {
      if (filterEstado === 'activos' && !p.activo) return false
      if (filterEstado === 'inactivos' && p.activo) return false
      if (filterPuestoId !== '' && p.puesto_id !== filterPuestoId) return false
      return true
    })
  }, [personal, filterEstado, filterPuestoId])

  if (isLoading) return <PageLoadingSpinner />

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
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos · {sucursal?.nombre ?? ''}
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">Legajos</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ErrorBanner error={error} />

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold text-[#002868]">Legajos</h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              Personal de {sucursal?.nombre ?? 'la sucursal'} · {personalFiltrado.length} colaborador
              {personalFiltrado.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-[#9AA0AC] flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA0AC]">Estado:</span>
            <div className="flex rounded-lg border border-[#D8E3F8] overflow-hidden">
              {ESTADO_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterEstado(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer
                    ${
                      filterEstado === opt.value
                        ? 'bg-[#002868] text-white'
                        : 'bg-white text-[#5A6070] hover:bg-[#EEF3FF] hover:text-[#002868]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {puestos.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA0AC]">Puesto:</span>
              <select
                value={filterPuestoId}
                onChange={e => setFilterPuestoId(e.target.value === '' ? '' : Number(e.target.value))}
                className="h-9 rounded-lg border border-[#D8E3F8] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 focus:border-[#002868] transition-colors cursor-pointer"
              >
                <option value="">Todos los puestos</option>
                {puestos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(filterEstado !== 'activos' || filterPuestoId !== '') && (
            <button
              onClick={() => {
                setFilterEstado('activos')
                setFilterPuestoId('')
              }}
              className="text-xs text-[#002868] underline underline-offset-2 hover:text-[#003d8f] cursor-pointer ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <LegajosTable
          personal={personalFiltrado}
          onSelect={persona => router.push(`/recursos-humanos/${sucursalId}/legajos/${persona.id}`)}
        />
      </main>
    </div>
  )
}
