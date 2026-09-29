import { Ban, Package, Receipt, ShoppingCart, Tag, Wallet } from 'lucide-react'
import { formatCantidad, formatMonto, variacionPorcentual } from '@/lib/formatters'
import type { PanelVentas } from '@/lib/types'
import { VentasKpiCard } from './VentasKpiCard'

interface VentasKpiGridProps {
  kpis: PanelVentas['kpis']
  comparacion: PanelVentas['comparacion']
}

export function VentasKpiGrid({ kpis, comparacion }: VentasKpiGridProps) {
  const previo = comparacion.kpis
  const etiqueta = comparacion.tipo === 'anio_anterior' ? 'año ant.' : 'período ant.'
  // Sin días importados en el período comparado no hay variación posible (no es un -100%).
  const comparable = comparacion.diasConDatos > 0
  const variacion = (actual: number, anterior: number) => (comparable ? variacionPorcentual(actual, anterior) : null)
  const detalle = (texto: string) => (comparable ? texto : undefined)
  const brutoConDescuentos = kpis.facturacion + kpis.descuentos

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <VentasKpiCard
        label="Facturación"
        value={formatMonto(kpis.facturacion)}
        icon={<Wallet className="w-4 h-4" />}
        variacion={variacion(kpis.facturacion, previo.facturacion)}
        detalle={detalle(`${formatMonto(previo.facturacion)} ${etiqueta}`)}
      />
      <VentasKpiCard
        label="Cantidad de ventas"
        value={formatCantidad(kpis.tickets)}
        icon={<Receipt className="w-4 h-4" />}
        variacion={variacion(kpis.tickets, previo.tickets)}
        detalle={detalle(`${formatCantidad(previo.tickets)} ${etiqueta}`)}
      />
      <VentasKpiCard
        label="Ticket promedio"
        value={formatMonto(kpis.ticketPromedio)}
        icon={<ShoppingCart className="w-4 h-4" />}
        variacion={variacion(kpis.ticketPromedio, previo.ticketPromedio)}
        detalle={detalle(`${formatMonto(previo.ticketPromedio)} ${etiqueta}`)}
      />
      <VentasKpiCard
        label="Unidades vendidas"
        value={formatCantidad(kpis.unidades, 2)}
        icon={<Package className="w-4 h-4" />}
        variacion={variacion(kpis.unidades, previo.unidades)}
        detalle={detalle(`${formatCantidad(previo.unidades, 2)} ${etiqueta}`)}
      />
      <VentasKpiCard
        label="Descuentos"
        value={formatMonto(kpis.descuentos)}
        icon={<Tag className="w-4 h-4" />}
        variacion={variacion(kpis.descuentos, previo.descuentos)}
        detalle={
          brutoConDescuentos > 0
            ? `${((kpis.descuentos / brutoConDescuentos) * 100).toFixed(1)}% del total antes de descuentos`
            : undefined
        }
        invertir
      />
      <VentasKpiCard
        label="Anulaciones"
        value={formatCantidad(kpis.anuladas.tickets)}
        icon={<Ban className="w-4 h-4" />}
        variacion={variacion(kpis.anuladas.tickets, previo.anuladas.tickets)}
        detalle={`${formatMonto(kpis.anuladas.importe)} anulados`}
        invertir
      />
    </div>
  )
}
