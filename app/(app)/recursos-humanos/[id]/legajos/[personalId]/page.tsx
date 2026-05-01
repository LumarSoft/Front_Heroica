'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, UserCircle2 } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DatosPersonalesTab } from '@/components/legajos/DatosPersonalesTab'
import { HistorialTab } from '@/components/legajos/HistorialTab'
import { ProfesionalTab } from '@/components/legajos/ProfesionalTab'
import type { Personal, Puesto, Sucursal } from '@/lib/types'

function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function formatFechaShort(fecha: string): string {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export default function FichaPersonalPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)
  const personalId = Number(params.personalId)

  const { canGestionarPersonal, isSuperAdmin } = useAuthStore()

  const [personal, setPersonal] = useState<Personal | null>(null)
  const [puestos, setPuestos] = useState<Puesto[]>([])
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [personalRes, puestosRes, sucursalRes] = await Promise.all([
          apiFetch(API_ENDPOINTS.PERSONAL.GET_BY_ID(personalId)),
          apiFetch(API_ENDPOINTS.PUESTOS.GET_BY_SUCURSAL(sucursalId)),
          apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId)),
        ])

        const [personalData, puestosData, sucursalData] = await Promise.all([
          personalRes.json(),
          puestosRes.json(),
          sucursalRes.json(),
        ])

        if (!personalRes.ok) throw new Error(personalData.message || 'Error al cargar colaborador')
        if (!puestosRes.ok) throw new Error(puestosData.message || 'Error al cargar puestos')
        if (!sucursalRes.ok) throw new Error(sucursalData.message || 'Error al cargar sucursal')

        setPersonal(personalData.data)
        setPuestos(puestosData.data ?? puestosData)
        setSucursal(sucursalData.data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAll()
  }, [personalId, sucursalId])

  if (isLoading) return <PageLoadingSpinner />

  if (error) {
    return (
      <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <ErrorBanner error={error} />
        </div>
      </div>
    )
  }

  if (!personal) return null

  const canEditar = isSuperAdmin() || canGestionarPersonal()

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F8F9FA] to-[#EEF3FF]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0] sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-3">
            <Button
              onClick={() => router.push(`/recursos-humanos/${sucursalId}/legajos`)}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg flex-shrink-0"
              aria-label="Volver a legajos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos · {sucursal?.nombre ?? ''} · Legajos
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                {personal.nombre}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        {/* Tarjeta de perfil */}
        <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-5 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar con iniciales */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#002868] to-[#1A4CB0] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg sm:text-xl tracking-tight select-none">
              {getInitials(personal.nombre)}
            </span>
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#002868] truncate">{personal.nombre}</h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0
                  ${personal.activo
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${personal.activo ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                {personal.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#666]">
              <span className="font-mono font-semibold text-[#002868]/70">
                Legajo #{personal.legajo}
              </span>
              {personal.puesto_nombre && (
                <>
                  <span className="text-[#D0D5DD]">·</span>
                  <span>{personal.puesto_nombre}</span>
                </>
              )}
              {personal.fecha_incorporacion && (
                <>
                  <span className="text-[#D0D5DD]">·</span>
                  <span className="text-[#888]">
                    Desde {formatFechaShort(personal.fecha_incorporacion)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Ícono decorativo */}
          <UserCircle2 className="w-8 h-8 text-[#D0D5DD] hidden sm:block flex-shrink-0" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="datos" className="w-full">
          <TabsList className="!bg-[#ECEEF1] mb-6 h-10">
            <TabsTrigger
              value="datos"
              className="text-sm px-4 data-[state=active]:bg-white data-[state=active]:text-[#002868] data-[state=active]:font-semibold"
            >
              Datos Personales
            </TabsTrigger>
            <TabsTrigger
              value="profesional"
              className="text-sm px-4 data-[state=active]:bg-white data-[state=active]:text-[#002868] data-[state=active]:font-semibold"
            >
              Profesional
            </TabsTrigger>
            <TabsTrigger
              value="historial"
              className="text-sm px-4 data-[state=active]:bg-white data-[state=active]:text-[#002868] data-[state=active]:font-semibold"
            >
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos">
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-5 sm:p-6">
              <DatosPersonalesTab
                personal={personal}
                puestos={puestos}
                sucursalNombre={sucursal?.nombre ?? ''}
                canEditar={canEditar}
                onUpdate={setPersonal}
              />
            </div>
          </TabsContent>

          <TabsContent value="profesional">
            <ProfesionalTab personalId={personal.id} />
          </TabsContent>

          <TabsContent value="historial">
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm p-5 sm:p-6">
              <HistorialTab personalId={personal.id} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
