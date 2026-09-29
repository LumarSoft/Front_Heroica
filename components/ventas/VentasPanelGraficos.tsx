'use client'

import { useMemo } from 'react'
import { DIAS_SEMANA_CORTO, formatCantidad, formatMonto } from '@/lib/formatters'
import type { AgrupacionVentas, PanelVentas } from '@/lib/types'
import { EvolucionVentasChart } from './EvolucionVentasChart'
import { TopProductosPanel } from './TopProductosPanel'
import { VentasChartCard } from './VentasChartCard'
import { VentasColumnasChart } from './VentasColumnasChart'
import { VentasRankingBars } from './VentasRankingBars'
import { VentasSegmentedControl } from './VentasSegmentedControl'

interface VentasPanelGraficosProps {
  data: PanelVentas
  agrupacion: AgrupacionVentas
  onAgrupacionChange: (agrupacion: AgrupacionVentas) => void
}

const OPCIONES_AGRUPACION: Array<{ valor: AgrupacionVentas; label: string }> = [
  { valor: 'dia', label: 'Día' },
  { valor: 'semana', label: 'Semana' },
  { valor: 'mes', label: 'Mes' },
]

export function VentasPanelGraficos({ data, agrupacion, onAgrupacionChange }: VentasPanelGraficosProps) {
  const sucursales = useMemo(
    () =>
      data.porSucursal.map(s => ({
        clave: String(s.sucursalId ?? 'sin-asignar'),
        label: s.sucursal,
        valor: s.facturacion,
        detalle: `${formatCantidad(s.tickets)} ventas · ticket prom. ${formatMonto(s.ticketPromedio)}`,
      })),
    [data.porSucursal],
  )

  const categorias = useMemo(
    () =>
      data.categorias.map(c => ({
        clave: c.categoria,
        label: c.categoria,
        valor: c.facturacion,
        detalle: `${formatCantidad(c.unidades, 2)} unidades`,
      })),
    [data.categorias],
  )

  const mediosPago = useMemo(
    () =>
      data.mediosPago.map(m => ({
        clave: m.medioPago,
        label: m.medioPago,
        valor: m.importe,
        detalle: `${formatCantidad(m.operaciones)} operaciones`,
      })),
    [data.mediosPago],
  )

  const canales = useMemo(
    () =>
      data.canales.map(c => ({
        clave: c.canal,
        label: c.canal,
        valor: c.facturacion,
        detalle: `${formatCantidad(c.tickets)} ventas`,
      })),
    [data.canales],
  )

  // Las 24 horas siempre visibles: un hueco sin ventas también es información.
  const franjas = useMemo(() => {
    const porHora = new Map(data.franjaHoraria.map(f => [f.hora, f]))
    if (porHora.size === 0) return []
    return Array.from({ length: 24 }, (_, hora) => {
      const f = porHora.get(hora)
      return {
        etiqueta: `${hora}h`,
        valor: f?.facturacion ?? 0,
        facturacion: f?.facturacion ?? 0,
        tickets: f?.tickets ?? 0,
      }
    })
  }, [data.franjaHoraria])

  const dias = useMemo(
    () =>
      data.diaSemana.map(d => ({
        etiqueta: DIAS_SEMANA_CORTO[d.dia] ?? String(d.dia),
        valor: d.promedioPorJornada,
        facturacion: d.facturacion,
        tickets: d.tickets,
        promedioPorJornada: d.promedioPorJornada,
      })),
    [data.diaSemana],
  )

  return (
    <div className="space-y-6">
      <VentasChartCard
        title="Evolución de la facturación"
        subtitle="Ventas de productos, sin anulaciones"
        acciones={
          <VentasSegmentedControl
            opciones={OPCIONES_AGRUPACION}
            valor={agrupacion}
            onChange={onAgrupacionChange}
            ariaLabel="Agrupar evolución por"
          />
        }
      >
        <EvolucionVentasChart data={data.evolucion} agrupacion={agrupacion} />
      </VentasChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VentasChartCard title="Por sucursal" subtitle="Facturación y participación">
          <VentasRankingBars filas={sucursales} />
        </VentasChartCard>
        <TopProductosPanel porImporte={data.topProductosImporte} porUnidades={data.topProductosUnidades} />
        <VentasChartCard title="Franja horaria" subtitle="Facturación por hora del día">
          <VentasColumnasChart data={franjas} />
        </VentasChartCard>
        <VentasChartCard title="Día de la semana" subtitle="Facturación promedio por jornada">
          <VentasColumnasChart data={dias} mostrarPromedio />
        </VentasChartCard>
        <VentasChartCard title="Medios de pago" subtitle="Importe cobrado por medio">
          <VentasRankingBars filas={mediosPago} vacio="La fuente no informó medios de pago en el período." />
        </VentasChartCard>
        <VentasChartCard title="Canales de venta" subtitle="Facturación por canal">
          <VentasRankingBars filas={canales} vacio="La fuente no informó canales en el período." />
        </VentasChartCard>
        <VentasChartCard title="Categorías" subtitle="Facturación por categoría de producto" className="lg:col-span-2">
          <VentasRankingBars filas={categorias} />
        </VentasChartCard>
      </div>
    </div>
  )
}
