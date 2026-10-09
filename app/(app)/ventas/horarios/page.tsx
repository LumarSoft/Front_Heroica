'use client'

import { useState } from 'react'
import { Clock, Flame, Users } from 'lucide-react'
import { AccessDenied } from '@/components/ui/access-denied'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { DesempenioTable } from '@/components/ventas/DesempenioTable'
import { MapaCalorVentas } from '@/components/ventas/MapaCalorVentas'
import { VentasChartCard } from '@/components/ventas/VentasChartCard'
import { VentasCoberturaAviso } from '@/components/ventas/VentasCoberturaAviso'
import { VentasFiltrosBar } from '@/components/ventas/VentasFiltrosBar'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { VentasSegmentedControl } from '@/components/ventas/VentasSegmentedControl'
import { VentasSinDatos } from '@/components/ventas/VentasSinDatos'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useVentasConsulta } from '@/hooks/use-ventas-consulta'
import { useVentasPagina } from '@/hooks/use-ventas-pagina'
import { API_ENDPOINTS } from '@/lib/config'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'
import { formatCantidad, formatMonto } from '@/lib/formatters'
import type { AnalisisVendedoresVentas, MapaCalorVentas as MapaCalorDatos } from '@/lib/types'

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

export default function VentasHorariosPage() {
  useDocumentTitle('Horarios y equipo')
  const pagina = useVentasPagina()
  const { canVer, canIntegraciones, filtros, filtrosAplicados, rangoValido, setFiltro, limpiar, opciones, cobertura } =
    pagina
  const [metrica, setMetrica] = useState<'facturacion' | 'tickets'>('facturacion')
  const [vista, setVista] = useState<'vendedores' | 'cajas'>('vendedores')

  const habilitado = canVer && rangoValido
  const mapa = useVentasConsulta<MapaCalorDatos>(
    habilitado ? API_ENDPOINTS.VENTAS.MAPA_CALOR(filtrosAplicados) : null,
    'Error al armar el mapa de calor',
  )
  const equipo = useVentasConsulta<AnalisisVendedoresVentas>(
    habilitado ? API_ENDPOINTS.VENTAS.VENDEDORES(filtrosAplicados) : null,
    'Error al analizar vendedores',
  )

  if (!canVer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="el análisis de horarios" backUrl="/home" />
      </main>
    )
  }

  const pico = mapa.data?.pico
  const filasEquipo = vista === 'vendedores' ? (equipo.data?.vendedores ?? []) : (equipo.data?.cajas ?? [])
  const disponible = vista === 'vendedores' ? equipo.data?.vendedoresDisponibles : equipo.data?.cajasDisponibles

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader
          title="Horarios y equipo"
          subtitle="Cuándo se vende (para armar turnos y producción) y cómo rinde cada vendedor y cada caja."
        />
        {cobertura?.diasImportados === 0 ? (
          <VentasSinDatos puedeImportar={canIntegraciones} />
        ) : (
          <>
            <VentasFiltrosBar filtros={filtros} opciones={opciones} onChange={setFiltro} onLimpiar={limpiar} />
            <VentasCoberturaAviso cobertura={cobertura} puedeImportar={canIntegraciones} />
            <ErrorBanner error={mapa.error || equipo.error || pagina.errorOpciones} />

            <div className="space-y-6">
              {mapa.data && !mapa.data.sinHora && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${VENTAS_CARD_CLASS} p-5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Momento pico
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002868] capitalize">
                      {pico ? `${DIAS[pico.dia]} ${String(pico.hora).padStart(2, '0')}h` : '—'}
                    </p>
                    {pico && (
                      <p className="text-xs text-[#7A93BB]">
                        {formatMonto(pico.promedioFacturacion)} y {formatCantidad(pico.promedioTickets, 1)} tickets por
                        jornada
                      </p>
                    )}
                  </div>
                  <div className={`${VENTAS_CARD_CLASS} p-5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Hora más fuerte
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002868]">
                      {mapa.data.horaPico !== null
                        ? `${String(mapa.data.horaPico).padStart(2, '0')}:00 a ${String(mapa.data.horaPico).padStart(2, '0')}:59`
                        : '—'}
                    </p>
                    <p className="text-xs text-[#7A93BB]">Sumando todos los días del período</p>
                  </div>
                  <div className={`${VENTAS_CARD_CLASS} p-5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Mejor vendedor
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#002868] truncate">
                      {equipo.data?.vendedoresDisponibles
                        ? (equipo.data.vendedores.find(v => v.nombre !== 'Sin informar')?.nombre ?? '—')
                        : '—'}
                    </p>
                    <p className="text-xs text-[#7A93BB]">Por facturación en el período</p>
                  </div>
                </div>
              )}

              <VentasChartCard
                title="Mapa de calor"
                subtitle="Promedio por jornada de cada día de la semana y hora. Pasá el mouse por una celda para ver el detalle."
                acciones={
                  <VentasSegmentedControl
                    ariaLabel="Métrica del mapa"
                    valor={metrica}
                    onChange={setMetrica}
                    opciones={[
                      { valor: 'facturacion', label: 'Facturación' },
                      { valor: 'tickets', label: 'Tickets' },
                    ]}
                  />
                }
              >
                {mapa.isLoading && !mapa.data ? (
                  <ContentLoadingSpinner />
                ) : mapa.data ? (
                  <div className={mapa.isLoading ? 'opacity-60' : ''}>
                    <MapaCalorVentas data={mapa.data} metrica={metrica} />
                  </div>
                ) : null}
              </VentasChartCard>

              <VentasChartCard
                title={vista === 'vendedores' ? 'Desempeño por vendedor' : 'Desempeño por caja'}
                subtitle="Hacé clic en una columna para ordenar."
                acciones={
                  <VentasSegmentedControl
                    ariaLabel="Ver por"
                    valor={vista}
                    onChange={setVista}
                    opciones={[
                      { valor: 'vendedores', label: 'Vendedores' },
                      { valor: 'cajas', label: 'Cajas' },
                    ]}
                  />
                }
              >
                {equipo.isLoading && !equipo.data ? (
                  <ContentLoadingSpinner />
                ) : equipo.data && !disponible ? (
                  <p className="py-10 text-center text-sm text-[#7A93BB]">
                    Las ventas importadas no traen {vista === 'vendedores' ? 'el vendedor' : 'la caja'} de cada ticket.
                    En Hiopos, agregá esa columna al dashboard de HiOffice y asignala en Integraciones.
                  </p>
                ) : (
                  <DesempenioTable filas={filasEquipo} etiqueta={vista === 'vendedores' ? 'Vendedor' : 'Caja'} />
                )}
              </VentasChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
