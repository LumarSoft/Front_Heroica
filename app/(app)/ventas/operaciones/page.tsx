'use client'

import { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/ui/access-denied'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, LoadingSpinner } from '@/components/ui/loading-spinner'
import { OperacionesVentasTable } from '@/components/ventas/OperacionesVentasTable'
import { OperacionVentaDetalleDialog } from '@/components/ventas/OperacionVentaDetalleDialog'
import { VentasCoberturaAviso } from '@/components/ventas/VentasCoberturaAviso'
import { VentasFiltrosBar } from '@/components/ventas/VentasFiltrosBar'
import { VentasSinDatos } from '@/components/ventas/VentasSinDatos'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { VentasPaginacion } from '@/components/ventas/VentasPaginacion'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useVentasCobertura } from '@/hooks/use-ventas-cobertura'
import { useVentasPeriodoInicial } from '@/hooks/use-ventas-periodo-inicial'
import { useVentasExportar } from '@/hooks/use-ventas-exportar'
import { useVentasFiltros } from '@/hooks/use-ventas-filtros'
import { useVentasOperaciones } from '@/hooks/use-ventas-operaciones'
import { useVentasOpciones } from '@/hooks/use-ventas-opciones'
import { useAuthStore } from '@/store/authStore'
import type { OperacionVenta } from '@/lib/types'

export default function VentasOperacionesPage() {
  useDocumentTitle('Operaciones de venta')
  const canVer = useAuthStore(state => state.canVerVentas())
  const canExportar = useAuthStore(state => state.canExportarVentas())
  const canIntegraciones = useAuthStore(state => state.canSincronizarVentas() || state.canConfigurarVentas())

  const [seleccionada, setSeleccionada] = useState<OperacionVenta | null>(null)
  const { filtros, filtrosAplicados, rangoValido, setFiltro, limpiar } = useVentasFiltros()
  const { opciones, error: errorOpciones } = useVentasOpciones()
  const { operaciones, paginacion, setPagina, isLoading, error } = useVentasOperaciones(
    filtrosAplicados,
    canVer && rangoValido,
  )
  const { exportar, isExporting } = useVentasExportar()
  const { cobertura } = useVentasCobertura(filtrosAplicados.desde, filtrosAplicados.hasta)
  useVentasPeriodoInicial(cobertura, filtros, setFiltro)

  if (!canVer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="las operaciones de venta" backUrl="/home" />
      </main>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader title="Operaciones" subtitle="Detalle de cada venta importada desde los puntos de venta.">
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

        {cobertura?.diasImportados === 0 ? (
          <VentasSinDatos puedeImportar={canIntegraciones} />
        ) : (
          <>
            <VentasFiltrosBar filtros={filtros} opciones={opciones} onChange={setFiltro} onLimpiar={limpiar} />
            <VentasCoberturaAviso cobertura={cobertura} puedeImportar={canIntegraciones} />
            <ErrorBanner error={error || errorOpciones} />

            {isLoading && !paginacion ? (
              <ContentLoadingSpinner />
            ) : (
              <div className={isLoading ? 'opacity-60 transition-opacity' : ''}>
                <OperacionesVentasTable operaciones={operaciones} onVerDetalle={setSeleccionada} />
                {paginacion && paginacion.total > 0 && (
                  <VentasPaginacion paginacion={paginacion} onChange={setPagina} disabled={isLoading} />
                )}
              </div>
            )}
          </>
        )}

        <OperacionVentaDetalleDialog operacion={seleccionada} onClose={() => setSeleccionada(null)} />
      </main>
    </div>
  )
}
