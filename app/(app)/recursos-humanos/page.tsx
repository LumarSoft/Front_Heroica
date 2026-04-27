'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, CalendarDays, MapPin, Users } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBanner } from '@/components/ui/error-banner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Sucursal } from '@/lib/types'

export default function RecursosHumanosPage() {
  const router = useRouter()
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const response = await apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar sucursales')
        }

        setSucursales(data.data)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar sucursales'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSucursales()
  }, [])

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-8 sm:mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#002868] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A93BB] mb-1">Módulo</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#002868]">Recursos Humanos</h1>
              <p className="text-[#666666] text-base sm:text-lg mt-1">
                Seleccioná una sucursal para gestionar su información de RRHH.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/recursos-humanos/calendario')}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#002868] border border-[#D8E3F8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#002868] hover:shadow-md cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            Calendario
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <ErrorBanner error={error} />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sucursales.map(sucursal => (
              <Card
                key={sucursal.id}
                onClick={() => sucursal.activo && router.push(`/recursos-humanos/${sucursal.id}`)}
                className={`group relative overflow-hidden border-[#D8E3F8] bg-white shadow-sm transition-all duration-300 ${
                  sucursal.activo
                    ? 'cursor-pointer hover:-translate-y-1 hover:border-[#002868] hover:shadow-xl'
                    : 'opacity-60 grayscale cursor-not-allowed'
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#002868]/5 -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-150" />

                <CardHeader className="relative pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF0FF] flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-[#002868]" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        sucursal.activo
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sucursal.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                      {sucursal.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <CardTitle className="text-xl font-bold text-[#002868] group-hover:text-[#003d8f] transition-colors">
                    {sucursal.nombre}
                  </CardTitle>
                  <CardDescription className="text-[#666666]">{sucursal.razon_social}</CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  <div className="flex items-start gap-3 text-sm text-[#666666]">
                    <MapPin className="w-4 h-4 text-[#002868] mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{sucursal.direccion}</span>
                  </div>

                  <div className="pt-4 border-t border-[#E8EDF8] flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9AA0AC]">
                      Gestión por sucursal
                    </span>
                    <ArrowRight className="w-5 h-5 text-[#002868] transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && sucursales.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#D8E3F8]">
            <Building2 className="w-16 h-16 mx-auto text-[#B0C0D8] mb-4" />
            <p className="text-[#666666] text-lg font-medium">No hay sucursales disponibles</p>
            <p className="text-[#999999] text-sm mt-1">Cuando se registren sucursales, aparecerán acá.</p>
          </div>
        )}

      </main>
    </div>
  )
}
