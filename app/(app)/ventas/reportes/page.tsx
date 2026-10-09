'use client'

import { useMemo, useState } from 'react'
import { BookmarkPlus, FileSpreadsheet, Share2, Trash2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/ui/access-denied'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, LoadingSpinner } from '@/components/ui/loading-spinner'
import { GuardarReporteDialog } from '@/components/ventas/GuardarReporteDialog'
import { ReporteConfigPanel } from '@/components/ventas/ReporteConfigPanel'
import { ReporteResultadoTable } from '@/components/ventas/ReporteResultadoTable'
import { VentasChartCard } from '@/components/ventas/VentasChartCard'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { VentasSinDatos } from '@/components/ventas/VentasSinDatos'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useReporteConsulta, useReporteExportar, useReportesGuardados } from '@/hooks/use-reporte-ventas'
import { useVentasCobertura } from '@/hooks/use-ventas-cobertura'
import { useVentasOpciones } from '@/hooks/use-ventas-opciones'
import { VENTAS_CARD_CLASS, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import { formatRangoFechas } from '@/lib/formatters'
import { aplicarPlantilla, CONFIG_INICIAL, PLANTILLAS_REPORTE } from '@/lib/ventas-reportes'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { ConfigReporteVentas } from '@/lib/types'

export default function VentasReportesPage() {
  useDocumentTitle('Reportes de ventas')
  const canVer = useAuthStore(state => state.canVerVentas())
  const canExportar = useAuthStore(state => state.canExportarVentas())
  const canGestionar = useAuthStore(state => state.canGestionarReportesVentas())
  const canIntegraciones = useAuthStore(state => state.canSincronizarVentas() || state.canConfigurarVentas())

  const [config, setConfig] = useState<ConfigReporteVentas>(CONFIG_INICIAL)
  const [abierto, setAbierto] = useState<{
    id: number
    nombre: string
    descripcion: string
    compartido: boolean
    propio: boolean
  } | null>(null)
  const [plantilla, setPlantilla] = useState<string | null>('sucursales')
  const [dialogoGuardar, setDialogoGuardar] = useState(false)
  const [aEliminar, setAEliminar] = useState<number | null>(null)

  const { opciones, error: errorOpciones } = useVentasOpciones()
  const { cobertura } = useVentasCobertura()
  const { data, isLoading, error } = useReporteConsulta(canVer ? config : null)
  const { exportar, isExporting } = useReporteExportar()
  const { guardados, guardar, eliminar } = useReportesGuardados()

  const nombreActual =
    abierto?.nombre ?? PLANTILLAS_REPORTE.find(p => p.id === plantilla)?.nombre ?? 'Reporte de ventas'
  const misReportes = useMemo(() => guardados.filter(g => g.propio), [guardados])
  const compartidos = useMemo(() => guardados.filter(g => !g.propio), [guardados])

  const cambiarConfig = (nueva: ConfigReporteVentas) => {
    setConfig(nueva)
    setPlantilla(null)
  }

  const abrirGuardado = (id: number) => {
    const g = guardados.find(x => x.id === id)
    if (!g) return
    setConfig(g.config)
    setPlantilla(null)
    setAbierto({
      id: g.id,
      nombre: g.nombre,
      descripcion: g.descripcion ?? '',
      compartido: g.compartido,
      propio: g.propio,
    })
  }

  if (!canVer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="los reportes de ventas" backUrl="/home" />
      </main>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader
          title="Reportes"
          subtitle="Elegí cómo agrupar, qué medir y con qué filtros. Guardalo para tenerlo siempre a mano o mandarlo por mail."
        >
          <Button
            variant="outline"
            onClick={() => setDialogoGuardar(true)}
            className="cursor-pointer border-[#002868] text-[#002868] font-semibold flex items-center gap-2"
          >
            <BookmarkPlus className="w-4 h-4" /> Guardar
          </Button>
          {canExportar && (
            <Button
              variant="outline"
              onClick={() => exportar(config, nombreActual)}
              disabled={isExporting}
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
            <div className={`${VENTAS_CARD_CLASS} p-4 mb-6 space-y-3`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] flex items-center gap-1.5 mr-1">
                  <Wand2 className="w-3.5 h-3.5" /> Listos para usar
                </span>
                {PLANTILLAS_REPORTE.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.descripcion}
                    onClick={() => {
                      setConfig(c => aplicarPlantilla(c, p.config))
                      setPlantilla(p.id)
                      setAbierto(null)
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm font-medium transition-colors cursor-pointer',
                      plantilla === p.id
                        ? 'bg-[#002868] border-[#002868] text-white'
                        : 'bg-white border-[#D8E3F8] text-[#002868] hover:border-[#002868]',
                    )}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
              {guardados.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] mr-1">Guardados</span>
                  <select
                    value={abierto?.id ?? ''}
                    onChange={e => e.target.value && abrirGuardado(Number(e.target.value))}
                    className={`${VENTAS_SELECT_CLASS} min-w-[260px]`}
                  >
                    <option value="">Abrir un reporte guardado…</option>
                    {misReportes.length > 0 && (
                      <optgroup label="Míos">
                        {misReportes.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                            {g.compartido ? ' (compartido)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {compartidos.length > 0 && (
                      <optgroup label="Compartidos conmigo">
                        {compartidos.map(g => (
                          <option key={g.id} value={g.id}>
                            {g.nombre} {g.autor ? `· ${g.autor}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {abierto && (abierto.propio || canGestionar) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAEliminar(abierto.id)}
                      className="cursor-pointer text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
              <ReporteConfigPanel config={config} opciones={opciones} onChange={cambiarConfig} />

              <VentasChartCard
                title={nombreActual}
                subtitle={
                  data
                    ? `Ventas ${formatRangoFechas(data.periodo.desde, data.periodo.hasta)}${
                        data.periodoComparado
                          ? ` · comparado ${formatRangoFechas(data.periodoComparado.desde, data.periodoComparado.hasta)}`
                          : ''
                      }`
                    : undefined
                }
                acciones={
                  abierto?.compartido ? (
                    <span className="text-xs text-[#7A93BB] flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" /> Compartido
                    </span>
                  ) : undefined
                }
              >
                <ErrorBanner error={error || errorOpciones} />
                {data?.avisos.map(a => (
                  <p
                    key={a}
                    className="mb-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                  >
                    {a}
                  </p>
                ))}
                {isLoading && !data ? (
                  <ContentLoadingSpinner />
                ) : data ? (
                  <div className={cn('transition-opacity', isLoading && 'opacity-60')}>
                    <ReporteResultadoTable resultado={data} />
                  </div>
                ) : null}
              </VentasChartCard>
            </div>
          </>
        )}

        <GuardarReporteDialog
          open={dialogoGuardar}
          inicial={{
            nombre: abierto?.nombre ?? nombreActual,
            descripcion: abierto?.descripcion ?? '',
            compartido: abierto?.compartido ?? false,
          }}
          editando={Boolean(abierto && (abierto.propio || canGestionar))}
          puedeCompartir={canGestionar}
          onClose={() => setDialogoGuardar(false)}
          onGuardar={async (datos, comoNuevo) => {
            const idEditar = abierto && (abierto.propio || canGestionar) && !comoNuevo ? abierto.id : undefined
            const id = await guardar({ ...datos, config }, idEditar)
            if (id) {
              setAbierto({ id, ...datos, propio: idEditar ? (abierto?.propio ?? true) : true })
              setDialogoGuardar(false)
            }
          }}
        />
        <DeleteDialog
          open={aEliminar !== null}
          nombre={guardados.find(g => g.id === aEliminar)?.nombre ?? 'el reporte'}
          onCancel={() => setAEliminar(null)}
          onConfirm={async () => {
            if (aEliminar) await eliminar(aEliminar)
            setAEliminar(null)
            setAbierto(null)
          }}
        />
      </main>
    </div>
  )
}
