'use client'

import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, FileSpreadsheet, Package, PackageX, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessDenied } from '@/components/ui/access-denied'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner, LoadingSpinner } from '@/components/ui/loading-spinner'
import { VentasChartCard } from '@/components/ventas/VentasChartCard'
import { VentasCoberturaAviso } from '@/components/ventas/VentasCoberturaAviso'
import { VentasFiltrosBar } from '@/components/ventas/VentasFiltrosBar'
import { VentasPageHeader } from '@/components/ventas/VentasPageHeader'
import { VentasSegmentedControl } from '@/components/ventas/VentasSegmentedControl'
import { VentasSinDatos } from '@/components/ventas/VentasSinDatos'
import { VentasVariacion } from '@/components/ventas/VentasVariacion'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { useVentasConsulta } from '@/hooks/use-ventas-consulta'
import { useVentasPagina } from '@/hooks/use-ventas-pagina'
import { useReporteExportar } from '@/hooks/use-reporte-ventas'
import { API_ENDPOINTS } from '@/lib/config'
import { VENTAS_CARD_CLASS, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import { formatCantidad, formatFecha, formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { AnalisisProductosVentas, ClaseAbc, ProductoAnalizado } from '@/lib/types'

type FiltroClase = 'todas' | ClaseAbc
type Orden = 'facturacion' | 'unidades' | 'variacion' | 'penetracion'

const CLASE_ESTILO: Record<ClaseAbc, string> = {
  A: 'bg-[#002868] text-white',
  B: 'bg-[#DCE6FA] text-[#002868]',
  C: 'bg-slate-100 text-slate-600',
}
const CLASE_TEXTO: Record<ClaseAbc, string> = {
  A: 'Hacen el 80% de la facturación: que nunca falten.',
  B: 'Aportan el siguiente 15%: vigilar stock y precio.',
  C: 'El 5% restante: candidatos a revisar o simplificar la carta.',
}
const TH = 'px-3 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-[#7A93BB] whitespace-nowrap'
const TD = 'px-3 py-2.5 text-sm text-[#1E293B] whitespace-nowrap'
const POR_PAGINA = 100

function ListaTendencia({
  titulo,
  icono,
  productos,
  vacio,
}: {
  titulo: string
  icono: React.ReactNode
  productos: Array<{ producto: string; detalle: string; variacion?: number | null }>
  vacio: string
}) {
  return (
    <VentasChartCard title={titulo} acciones={icono}>
      {productos.length === 0 ? (
        <p className="text-sm text-[#7A93BB]">{vacio}</p>
      ) : (
        <ul className="divide-y divide-[#EEF2FB]">
          {productos.map(p => (
            <li key={p.producto} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1E293B] truncate">{p.producto}</p>
                <p className="text-xs text-[#7A93BB]">{p.detalle}</p>
              </div>
              {p.variacion !== undefined && <VentasVariacion valor={p.variacion} />}
            </li>
          ))}
        </ul>
      )}
    </VentasChartCard>
  )
}

export default function VentasProductosPage() {
  useDocumentTitle('Análisis de productos')
  const pagina = useVentasPagina()
  const {
    canVer,
    canExportar,
    canIntegraciones,
    filtros,
    filtrosAplicados,
    rangoValido,
    setFiltro,
    limpiar,
    opciones,
    cobertura,
  } = pagina
  const { data, isLoading, error } = useVentasConsulta<AnalisisProductosVentas>(
    canVer && rangoValido ? API_ENDPOINTS.VENTAS.PRODUCTOS(filtrosAplicados) : null,
    'Error al analizar los productos',
  )
  const { exportar, isExporting } = useReporteExportar()
  const [clase, setClase] = useState<FiltroClase>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<Orden>('facturacion')
  const [limite, setLimite] = useState(POR_PAGINA)

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const lista = (data?.productos ?? []).filter(
      p =>
        (clase === 'todas' || p.clase === clase) &&
        (!texto ||
          p.producto.toLowerCase().includes(texto) ||
          (p.codigo ?? '').toLowerCase().includes(texto) ||
          (p.categoria ?? '').toLowerCase().includes(texto)),
    )
    const clave: Record<Orden, (p: ProductoAnalizado) => number> = {
      facturacion: p => p.facturacion,
      unidades: p => p.unidades,
      variacion: p => p.variacionUnidades ?? -Infinity,
      penetracion: p => p.penetracion ?? 0,
    }
    return [...lista].sort((a, b) => clave[orden](b) - clave[orden](a))
  }, [data, clase, busqueda, orden])

  if (!canVer) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <AccessDenied resource="el análisis de productos" backUrl="/home" />
      </main>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <VentasPageHeader
          title="Productos"
          subtitle="Qué productos sostienen la facturación (curva ABC), cuáles crecen, cuáles caen y cuáles dejaron de venderse."
        >
          {canExportar && (
            <Button
              variant="outline"
              disabled={isExporting || !rangoValido}
              onClick={() =>
                exportar(
                  {
                    dimensiones: ['producto', 'categoria'],
                    metricas: ['facturacion', 'unidades', 'tickets', 'precio_promedio', 'participacion'],
                    comparacion: 'periodo_anterior',
                    orden: { campo: 'facturacion', direccion: 'desc' },
                    limite: 5000,
                    periodo: { tipo: 'fijo', desde: filtrosAplicados.desde, hasta: filtrosAplicados.hasta },
                    filtros: {
                      sucursal_ids: filtrosAplicados.sucursalIds,
                      categoria: filtrosAplicados.categoria || undefined,
                      canal: filtrosAplicados.canal || undefined,
                      producto: filtrosAplicados.producto || undefined,
                      vendedor: filtrosAplicados.vendedor || undefined,
                      caja: filtrosAplicados.caja || undefined,
                      medio_pago: filtrosAplicados.medioPago || undefined,
                    },
                  },
                  'Productos',
                )
              }
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
            <ErrorBanner error={error || pagina.errorOpciones} />

            {isLoading && !data ? (
              <ContentLoadingSpinner />
            ) : data ? (
              <div className={cn('space-y-6 transition-opacity', isLoading && 'opacity-60')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className={`${VENTAS_CARD_CLASS} p-5`}>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB]">Productos vendidos</p>
                    <p className="mt-2 text-3xl font-bold text-[#002868] tabular-nums">
                      {formatCantidad(data.resumen.productos)}
                    </p>
                    <p className="text-xs text-[#7A93BB] mt-1">
                      {formatMonto(data.resumen.facturacion)} en {formatCantidad(data.resumen.ticketsTotales)} tickets
                    </p>
                  </div>
                  {data.resumen.clases.map(c => (
                    <button
                      key={c.clase}
                      type="button"
                      onClick={() => setClase(clase === c.clase ? 'todas' : c.clase)}
                      className={cn(
                        `${VENTAS_CARD_CLASS} p-5 text-left cursor-pointer transition-shadow hover:shadow-md`,
                        clase === c.clase && 'ring-2 ring-[#002868]',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', CLASE_ESTILO[c.clase])}>
                          Clase {c.clase}
                        </span>
                        <span className="text-sm font-semibold text-[#5A6B8C] tabular-nums">
                          {c.participacion.toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-[#002868] tabular-nums">
                        {formatCantidad(c.productos)}{' '}
                        <span className="text-sm font-medium text-[#7A93BB]">productos</span>
                      </p>
                      <p className="text-xs text-[#7A93BB] mt-1">{CLASE_TEXTO[c.clase]}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <ListaTendencia
                    titulo="En alza"
                    icono={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
                    vacio="Ningún producto creció respecto del período anterior."
                    productos={data.enAlza.map(p => ({
                      producto: p.producto,
                      detalle: `${formatCantidad(p.unidadesAnterior, 2)} → ${formatCantidad(p.unidades, 2)} u.`,
                      variacion: p.variacionUnidades,
                    }))}
                  />
                  <ListaTendencia
                    titulo="En baja"
                    icono={<ArrowDownRight className="w-5 h-5 text-rose-600" />}
                    vacio="Ningún producto cayó respecto del período anterior."
                    productos={data.enBaja.map(p => ({
                      producto: p.producto,
                      detalle: `${formatCantidad(p.unidadesAnterior, 2)} → ${formatCantidad(p.unidades, 2)} u.`,
                      variacion: p.variacionUnidades,
                    }))}
                  />
                  <ListaTendencia
                    titulo="Nuevos"
                    icono={<Sparkles className="w-5 h-5 text-[#2F5BBD]" />}
                    vacio="No hay productos que no se hayan vendido en el período anterior."
                    productos={data.nuevos.map(p => ({
                      producto: p.producto,
                      detalle: `${formatCantidad(p.unidades, 2)} u. · ${formatMonto(p.facturacion)}`,
                    }))}
                  />
                  <ListaTendencia
                    titulo="Ya no se venden"
                    icono={<PackageX className="w-5 h-5 text-amber-600" />}
                    vacio="Todo lo que se vendió antes se siguió vendiendo."
                    productos={data.sinVentas.map(p => ({
                      producto: p.producto,
                      detalle: `Antes: ${formatCantidad(p.unidadesAnterior, 2)} u. · ${formatMonto(p.facturacionAnterior)}`,
                    }))}
                  />
                </div>
                <p className="text-xs text-[#7A93BB] -mt-3">
                  Comparado con {formatFecha(data.periodoAnterior.desde)} al {formatFecha(data.periodoAnterior.hasta)}{' '}
                  (mismo largo, inmediatamente anterior).
                </p>

                <VentasChartCard
                  title="Curva ABC"
                  subtitle="Todos los productos del período, de mayor a menor facturación."
                  acciones={
                    <div className="flex flex-wrap items-center gap-2">
                      <VentasSegmentedControl
                        ariaLabel="Clase"
                        valor={clase}
                        onChange={setClase}
                        opciones={[
                          { valor: 'todas', label: 'Todas' },
                          { valor: 'A', label: 'A' },
                          { valor: 'B', label: 'B' },
                          { valor: 'C', label: 'C' },
                        ]}
                      />
                      <select
                        value={orden}
                        onChange={e => setOrden(e.target.value as Orden)}
                        className={VENTAS_SELECT_CLASS}
                        aria-label="Ordenar por"
                      >
                        <option value="facturacion">Por facturación</option>
                        <option value="unidades">Por unidades</option>
                        <option value="variacion">Por crecimiento</option>
                        <option value="penetracion">Por presencia en tickets</option>
                      </select>
                      <span className="relative">
                        <Search className="w-4 h-4 text-[#7A93BB] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="search"
                          value={busqueda}
                          onChange={e => setBusqueda(e.target.value)}
                          placeholder="Buscar producto"
                          className={`${VENTAS_SELECT_CLASS} pl-9 w-48`}
                        />
                      </span>
                    </div>
                  }
                >
                  {visibles.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[#7A93BB] flex flex-col items-center gap-2">
                      <Package className="w-6 h-6" /> Sin productos para estos filtros.
                    </p>
                  ) : (
                    <div className="overflow-x-auto -mx-5">
                      <table className="w-full min-w-[980px]">
                        <thead className="border-b border-[#EEF2FB] bg-[#F8FAFF]">
                          <tr>
                            <th className={TH}>Producto</th>
                            <th className={TH}>Clase</th>
                            <th className={`${TH} text-right`}>Facturación</th>
                            <th className={TH}>% / acumulado</th>
                            <th className={`${TH} text-right`}>Unidades</th>
                            <th className={`${TH} text-right`}>vs. anterior</th>
                            <th className={`${TH} text-right`}>Precio prom.</th>
                            <th
                              className={`${TH} text-right`}
                              title="Porcentaje de los tickets que incluyeron el producto"
                            >
                              En tickets
                            </th>
                            <th className={`${TH} text-right`}>Sucursales</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EEF2FB]">
                          {visibles.slice(0, limite).map(p => (
                            <tr key={p.producto} className="hover:bg-[#F8FAFF]">
                              <td className={`${TD} max-w-[320px]`}>
                                <p className="font-medium truncate" title={p.producto}>
                                  {p.producto}
                                </p>
                                <p className="text-xs text-[#7A93BB] truncate">
                                  {[p.categoria, p.codigo ? `Cód. ${p.codigo}` : null].filter(Boolean).join(' · ') ||
                                    '—'}
                                </p>
                              </td>
                              <td className={TD}>
                                <span
                                  className={cn('px-2 py-0.5 rounded-full text-xs font-bold', CLASE_ESTILO[p.clase])}
                                >
                                  {p.clase}
                                </span>
                              </td>
                              <td className={`${TD} text-right tabular-nums font-semibold`}>
                                {formatMonto(p.facturacion)}
                              </td>
                              <td className={TD}>
                                <div className="w-32">
                                  <div className="flex justify-between text-xs tabular-nums text-[#5A6B8C]">
                                    <span>{p.participacion.toFixed(1)}%</span>
                                    <span className="text-[#9AAACC]">{p.acumulado.toFixed(0)}%</span>
                                  </div>
                                  <div className="mt-1 h-1.5 rounded-full bg-[#EEF2FB] overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-[#2F5BBD]"
                                      style={{ width: `${Math.min(p.acumulado, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className={`${TD} text-right tabular-nums`}>{formatCantidad(p.unidades, 2)}</td>
                              <td className={`${TD} text-right`}>
                                <VentasVariacion valor={p.variacionUnidades} />
                              </td>
                              <td className={`${TD} text-right tabular-nums`}>
                                {p.precioPromedio !== null ? formatMonto(p.precioPromedio) : '—'}
                              </td>
                              <td className={`${TD} text-right tabular-nums`}>
                                {p.penetracion !== null ? `${p.penetracion.toFixed(1)}%` : '—'}
                              </td>
                              <td className={`${TD} text-right tabular-nums`}>{p.sucursales}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {visibles.length > limite && (
                    <div className="pt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setLimite(l => l + POR_PAGINA)}
                        className="cursor-pointer"
                      >
                        Ver {Math.min(POR_PAGINA, visibles.length - limite)} más (de {formatCantidad(visibles.length)})
                      </Button>
                    </div>
                  )}
                </VentasChartCard>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
