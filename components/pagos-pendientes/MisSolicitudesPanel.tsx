'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { ErrorBanner } from '@/components/ui/error-banner'
import { EmptyState } from '@/components/ui/empty-state'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SeguimientoFiltros } from '@/components/pagos-pendientes/SeguimientoFiltros'
import { SeguimientoMobileList } from '@/components/pagos-pendientes/SeguimientoMobileList'
import { SeguimientoResumen } from '@/components/pagos-pendientes/SeguimientoResumen'
import { SeguimientoTable } from '@/components/pagos-pendientes/SeguimientoTable'
import type { PagoPendiente, SeguimientoEstadoFiltro, SeguimientoPagosResumen } from '@/lib/types'

interface MisSolicitudesPanelProps {
  solicitudes: PagoPendiente[]
  isLoading: boolean
  error: string
}

export function MisSolicitudesPanel({ solicitudes, isLoading, error }: MisSolicitudesPanelProps) {
  const [filtroEstado, setFiltroEstado] = useState<SeguimientoEstadoFiltro>('todos')
  const [busqueda, setBusqueda] = useState('')

  const resumen = useMemo<SeguimientoPagosResumen>(
    () => ({
      todos: solicitudes.length,
      pendiente: solicitudes.filter(solicitud => solicitud.estado === 'pendiente').length,
      aprobado: solicitudes.filter(solicitud => solicitud.estado === 'aprobado' || solicitud.estado === 'completado')
        .length,
      rechazado: solicitudes.filter(solicitud => solicitud.estado === 'rechazado').length,
    }),
    [solicitudes],
  )

  const solicitudesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es')

    return solicitudes.filter(solicitud => {
      const coincideEstado =
        filtroEstado === 'todos' ||
        (filtroEstado === 'aprobado'
          ? solicitud.estado === 'aprobado' || solicitud.estado === 'completado'
          : solicitud.estado === filtroEstado)
      if (!coincideEstado) return false
      if (!termino) return true

      const contenido = [
        solicitud.concepto,
        solicitud.comentarios,
        solicitud.descripcion_nombre,
        solicitud.proveedor_nombre,
        String(solicitud.monto),
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es')
      return contenido.includes(termino)
    })
  }, [busqueda, filtroEstado, solicitudes])

  if (isLoading) return <ContentLoadingSpinner />

  return (
    <div className="space-y-4">
      <ErrorBanner error={error} />

      <div>
        <h2 className="text-2xl font-bold text-[#002868]">Mi seguimiento</h2>
        <p className="mt-1 text-sm text-[#666666]">Todo lo que cargaste y su estado actual, en un solo lugar.</p>
      </div>

      <SeguimientoResumen resumen={resumen} filtroActivo={filtroEstado} onFiltroChange={setFiltroEstado} />
      <SeguimientoFiltros
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        resultadosCount={solicitudesFiltradas.length}
      />

      <Card className="gap-0 overflow-hidden border-[#E0E0E0] bg-white py-0 shadow-lg">
        <CardHeader className="border-b border-[#E0E0E0] bg-[#F8F9FA]/50 py-5">
          <CardTitle className="text-lg font-bold text-[#002868]">Mis solicitudes</CardTitle>
          <CardDescription>Las aprobadas incluyen solicitudes autorizadas y pagos ya completados.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {solicitudesFiltradas.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={resumen.todos === 0 ? 'Todavía no cargaste solicitudes' : 'No hay resultados para este filtro'}
              description={
                resumen.todos === 0
                  ? 'Cuando cargues un pago pendiente, vas a poder seguirlo desde acá.'
                  : 'Probá otro estado o limpiá la búsqueda para volver a ver tus solicitudes.'
              }
            />
          ) : (
            <>
              <SeguimientoTable solicitudes={solicitudesFiltradas} />
              <SeguimientoMobileList solicitudes={solicitudesFiltradas} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
