'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BadgePercent, Briefcase, ClipboardList, FileText, Layers3, Scale, Users, Wallet } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'
import type { Sucursal } from '@/lib/types'

const PRIMARY_SECTIONS = [
  {
    label: 'Legajos',
    description: 'Documentación y datos del personal.',
    icon: FileText,
    href: (id: number) => `/recursos-humanos/${id}/legajos`,
  },
  {
    label: 'Sueldos',
    description: 'Liquidaciones, haberes y novedades.',
    icon: Wallet,
    href: undefined,
  },
  {
    label: 'Solicitudes',
    description: 'Pedidos y gestión administrativa.',
    icon: ClipboardList,
    href: undefined,
  },
] as const

const SECONDARY_SECTIONS = [
  {
    label: 'Puestos',
    description: 'Puestos de trabajo de la sucursal.',
    icon: Briefcase,
    href: (id: number) => `/recursos-humanos/${id}/puestos`,
  },
  {
    label: 'Incentivos',
    description: 'Premios y objetivos por desempeño.',
    icon: BadgePercent,
    href: (id: number) => `/recursos-humanos/${id}/incentivos`,
  },
  {
    label: 'Escala',
    description: 'Categorías y referencias salariales.',
    icon: Scale,
    href: (id: number) => `/recursos-humanos/${id}/escalas`,
  },
] as const

export default function RecursosHumanosSucursalPage() {
  const router = useRouter()
  const params = useParams()
  const sucursalId = Number(params.id)
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSucursal = async () => {
      try {
        const response = await apiFetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(sucursalId))
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar sucursal')
        }

        setSucursal(data.data)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar sucursal'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSucursal()
  }, [sucursalId])

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
              onClick={() => router.push('/recursos-humanos')}
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-[#5A6070] hover:text-[#002868] hover:bg-[#002868]/8 cursor-pointer rounded-lg"
              aria-label="Volver a recursos humanos"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] leading-none mb-1">
                Recursos Humanos
              </p>
              <h1 className="text-sm sm:text-base font-semibold text-[#002868] truncate leading-none">
                {sucursal.nombre}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <ErrorBanner error={error} />

        <div className="text-center mb-8 md:mb-12">
          <div className="w-16 h-16 rounded-3xl bg-[#002868] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#002868]/15">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#002868] mb-3">Recursos Humanos</h2>
          <p className="text-lg text-[#666666] max-w-xl mx-auto">
            Gestioná la información del personal de {sucursal.nombre}.
          </p>
        </div>

        <div className="max-w-5xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SECONDARY_SECTIONS.map(section => {
            const Icon = section.icon
            const href = section.href?.(sucursalId)
            return (
              <Card
                key={section.label}
                onClick={() => href && router.push(href)}
                className={`group border-2 border-[#D8E3F8] bg-white shadow-sm transition-all duration-300 overflow-hidden ${
                  href ? 'hover:border-[#002868] hover:shadow-lg cursor-pointer' : 'opacity-90 cursor-default'
                }`}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rotate-45 rounded-2xl bg-[#EAF0FF] flex items-center justify-center transition-transform group-hover:scale-110">
                    <Icon className="w-6 h-6 -rotate-45 text-[#002868]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#002868]">{section.label}</h3>
                    <p className="text-sm text-[#666666] mt-1">{section.description}</p>
                    {!href && (
                      <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#9AA0AC]">
                        <Layers3 className="w-4 h-4" />
                        Próximamente
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
          {PRIMARY_SECTIONS.map(section => {
            const Icon = section.icon
            const href = section.href?.(sucursalId)
            return (
              <Card
                key={section.label}
                onClick={() => href && router.push(href)}
                className="group border-2 border-[#E0E0E0] bg-white hover:border-[#002868] hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#002868]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                <CardContent className="p-8 md:p-10 text-center relative z-10">
                  <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#002868]/10 to-[#002868]/5 flex items-center justify-center group-hover:from-[#002868]/20 group-hover:to-[#002868]/10 transition-all duration-300 group-hover:scale-110">
                    <Icon className="w-10 h-10 md:w-12 md:h-12 text-[#002868]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#002868] mb-3 group-hover:text-[#003d8f] transition-colors">
                    {section.label}
                  </h3>
                  <p className="text-[#666666] text-base leading-relaxed">{section.description}</p>

                  {!href && (
                    <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#9AA0AC]">
                      <Layers3 className="w-4 h-4" />
                      Próximamente
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
