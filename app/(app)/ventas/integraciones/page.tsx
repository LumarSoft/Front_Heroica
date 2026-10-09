'use client'

import { Suspense, useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccessDenied } from '@/components/ui/access-denied'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { HioposConfigCard } from '@/components/ventas/HioposConfigCard'
import { IntegracionEstadoCard } from '@/components/ventas/IntegracionEstadoCard'
import { LocalesExternosTable } from '@/components/ventas/LocalesExternosTable'
import { SincronizacionesVentasTable } from '@/components/ventas/SincronizacionesVentasTable'
import { SincronizarVentasDialog } from '@/components/ventas/SincronizarVentasDialog'
import { TraerDesdeUrl } from '@/components/ventas/TraerDesdeUrl'
import { VentasChartCard } from '@/components/ventas/VentasChartCard'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useVentasCobertura } from '@/hooks/use-ventas-cobertura'
import { useVentasIntegraciones } from '@/hooks/use-ventas-integraciones'
import { useVentasLocales } from '@/hooks/use-ventas-locales'
import { useAuthStore } from '@/store/authStore'
import type { EstadoIntegracionVentas } from '@/lib/types'

export default function VentasIntegracionesPage() {
  useDocumentTitle('Integraciones de ventas')
  const canSincronizar = useAuthStore(state => state.canSincronizarVentas())
  const canConfigurar = useAuthStore(state => state.canConfigurarVentas())
  const puedeVer = canSincronizar || canConfigurar

  const router = useRouter()
  const [aSincronizar, setASincronizar] = useState<EstadoIntegracionVentas | null>(null)
  const [rangoPedido, setRangoPedido] = useState<{ desde: string; hasta: string } | null>(null)
  const [versionFinal, setVersionFinal] = useState(0)
  const locales = useVentasLocales()
  const { recargar: recargarLocales } = locales

  // Al terminar una importación pueden aparecer locales nuevos y cambia el rango importado.
  const alFinalizar = useCallback(() => {
    void recargarLocales()
    setVersionFinal(v => v + 1)
  }, [recargarLocales])
  const integraciones = useVentasIntegraciones(alFinalizar)

  // Mientras importa, el rango importado se refresca con cada día que avanza.
  const avance = useMemo(
    () =>
      integraciones.sincronizaciones.reduce(
        (acc, s) => acc + (s.estado === 'en_curso' ? (s.diasProcesados ?? 0) : 0),
        0,
      ),
    [integraciones.sincronizaciones],
  )
  const { cobertura } = useVentasCobertura(undefined, undefined, versionFinal * 10_000 + avance)

  const hiopos = integraciones.estados.find(e => e.fuente === 'hiopos') ?? null
  const abrirConRango = useCallback((desde: string, hasta: string) => setRangoPedido({ desde, hasta }), [])
  // El diálogo se abre con el rango del enlace cuando ya se sabe el estado de Hiopos.
  const dialogoIntegracion = aSincronizar ?? (rangoPedido && canSincronizar && hiopos?.configurada ? hiopos : null)

  const cerrarDialogo = useCallback(() => {
    setASincronizar(null)
    if (rangoPedido) {
      setRangoPedido(null)
      router.replace('/ventas/integraciones')
    }
  }, [rangoPedido, router])

  if (!puedeVer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="las integraciones de ventas" backUrl="/ventas" />
      </main>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader
          title="Integraciones"
          subtitle="De dónde salen las ventas: qué días están importados, cómo traer más y a qué sucursal va cada local."
        />
        <ErrorBanner error={integraciones.error || locales.error} />

        {integraciones.isLoading ? (
          <ContentLoadingSpinner />
        ) : (
          <div className="space-y-6">
            {integraciones.estados.map(estado => (
              <IntegracionEstadoCard
                key={estado.fuente}
                estado={estado}
                cobertura={cobertura}
                canSincronizar={canSincronizar}
                onSincronizar={() => setASincronizar(estado)}
              />
            ))}

            <HioposConfigCard editable={canConfigurar} />

            <VentasChartCard
              title="Importaciones"
              subtitle={
                integraciones.hayEnCurso
                  ? 'Hay una importación en curso: el avance se actualiza solo. Dejá esta pantalla abierta para que termine antes.'
                  : 'Cada vez que se trajeron ventas, qué días y cómo terminó.'
              }
            >
              <SincronizacionesVentasTable sincronizaciones={integraciones.sincronizaciones} />
            </VentasChartCard>

            <VentasChartCard
              title="Locales de Hiopos"
              subtitle="A qué sucursal de Heroica corresponde cada local. Se vinculan solos por nombre; si alguno no se reconoce, se elige una única vez."
            >
              {locales.isLoading ? (
                <ContentLoadingSpinner />
              ) : (
                <LocalesExternosTable
                  locales={locales.locales}
                  sucursales={locales.sucursales}
                  editable={canConfigurar}
                  guardandoId={locales.guardandoId}
                  onAsignar={locales.asignarSucursal}
                />
              )}
            </VentasChartCard>
          </div>
        )}

        <Suspense fallback={null}>
          <TraerDesdeUrl onRango={abrirConRango} />
        </Suspense>
        {dialogoIntegracion && (
          <SincronizarVentasDialog
            integracion={dialogoIntegracion}
            cobertura={cobertura}
            rangoInicial={aSincronizar ? null : rangoPedido}
            isSaving={integraciones.isSincronizando}
            onClose={cerrarDialogo}
            onConfirm={(desde, hasta) => integraciones.sincronizar(dialogoIntegracion.fuente, desde, hasta)}
          />
        )}
      </main>
    </div>
  )
}
