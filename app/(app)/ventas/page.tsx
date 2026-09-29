'use client'

import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/ui/access-denied'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, LoadingSpinner } from '@/components/ui/loading-spinner'
import { VentasAlertaIntegraciones } from '@/components/ventas/VentasAlertaIntegraciones'
import { VentasComparacionInfo } from '@/components/ventas/VentasComparacionInfo'
import { VentasCoberturaAviso } from '@/components/ventas/VentasCoberturaAviso'
import { VentasPeriodoSinImportar } from '@/components/ventas/VentasPeriodoSinImportar'
import { VentasSinDatos } from '@/components/ventas/VentasSinDatos'
import { VentasFiltrosBar } from '@/components/ventas/VentasFiltrosBar'
import { VentasKpiGrid } from '@/components/ventas/VentasKpiGrid'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { VentasPanelGraficos } from '@/components/ventas/VentasPanelGraficos'
import { VentasSegmentedControl } from '@/components/ventas/VentasSegmentedControl'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useVentasAlertasIntegraciones } from '@/hooks/use-ventas-alertas-integraciones'
import { useVentasCobertura } from '@/hooks/use-ventas-cobertura'
import { useVentasPeriodoInicial } from '@/hooks/use-ventas-periodo-inicial'
import { useVentasExportar } from '@/hooks/use-ventas-exportar'
import { useVentasFiltros } from '@/hooks/use-ventas-filtros'
import { useVentasOpciones } from '@/hooks/use-ventas-opciones'
import { useVentasPanel } from '@/hooks/use-ventas-panel'
import { useVentasSyncBajoDemanda } from '@/hooks/use-ventas-sync-bajo-demanda'
import { useAuthStore } from '@/store/authStore'
import type { AgrupacionVentas, ComparacionVentas } from '@/lib/types'

const OPCIONES_COMPARACION: Array<{ valor: ComparacionVentas; label: string }> = [
  { valor: 'periodo_anterior', label: 'vs. período anterior' },
  { valor: 'anio_anterior', label: 'vs. año anterior' },
]

export default function VentasPanelPage() {
  useDocumentTitle('Ventas')
  const canVer = useAuthStore(state => state.canVerVentas())
  const canExportar = useAuthStore(state => state.canExportarVentas())
  const canIntegraciones = useAuthStore(state => state.canSincronizarVentas() || state.canConfigurarVentas())

  const [agrupacion, setAgrupacion] = useState<AgrupacionVentas>('dia')
  const [comparacion, setComparacion] = useState<ComparacionVentas>('periodo_anterior')
  const { filtros, filtrosAplicados, rangoValido, setFiltro, limpiar } = useVentasFiltros()
  const { opciones, error: errorOpciones } = useVentasOpciones()
  const versionDatos = useVentasSyncBajoDemanda(canVer)
  const { data, isLoading, error } = useVentasPanel(
    filtrosAplicados,
    agrupacion,
    comparacion,
    canVer && rangoValido,
    versionDatos,
  )
  const { exportar, isExporting } = useVentasExportar()
  const alertas = useVentasAlertasIntegraciones(canIntegraciones)
  const { cobertura } = useVentasCobertura(filtrosAplicados.desde, filtrosAplicados.hasta, versionDatos)
  useVentasPeriodoInicial(cobertura, filtros, setFiltro)
  const sinDatos = cobertura?.diasImportados === 0
  // El período elegido no tiene ningún día importado (≠ días importados sin ventas).
  const periodoVacio = data?.periodo.diasConDatos === 0

  if (!canVer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="el panel de ventas" backUrl="/home" />
      </main>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader title="Panel de ventas" subtitle="Ventas consolidadas de todas las sucursales.">
          {canExportar && (
            <Button
              variant="outline"
              onClick={() => exportar(filtrosAplicados)}
              disabled={isExporting || !rangoValido}
              className="cursor-pointer border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-2"
            >
              {isExporting ? <LoadingSpinner className="w-4 h-4 border-2" /> : <FileSpreadsheet className="w-4 h-4" />}
              Exportar Excel
            </Button>
          )}
        </VentasPageHeader>

        <VentasAlertaIntegraciones alertas={alertas} />
        {sinDatos ? (
          <VentasSinDatos puedeImportar={canIntegraciones} />
        ) : (
          <>
            <VentasFiltrosBar filtros={filtros} opciones={opciones} onChange={setFiltro} onLimpiar={limpiar} />
            {!periodoVacio && <VentasCoberturaAviso cobertura={cobertura} puedeImportar={canIntegraciones} />}
            <ErrorBanner error={error || errorOpciones} />

            {periodoVacio && data ? (
              <VentasPeriodoSinImportar
                desde={data.periodo.desde}
                hasta={data.periodo.hasta}
                puedeImportar={canIntegraciones}
              />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    {data && <VentasComparacionInfo comparacion={data.comparacion} puedeImportar={canIntegraciones} />}
                  </div>
                  <VentasSegmentedControl
                    opciones={OPCIONES_COMPARACION}
                    valor={comparacion}
                    onChange={setComparacion}
                    ariaLabel="Comparar contra"
                  />
                </div>

                {isLoading && !data ? (
                  <ContentLoadingSpinner />
                ) : data ? (
                  <div className={`space-y-6 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
                    <VentasKpiGrid kpis={data.kpis} comparacion={data.comparacion} />
                    <VentasPanelGraficos data={data} agrupacion={agrupacion} onAgrupacionChange={setAgrupacion} />
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
