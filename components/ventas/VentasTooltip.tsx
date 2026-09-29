import { formatCantidad, formatMonto } from '@/lib/formatters'

interface VentasTooltipProps {
  active?: boolean
  label?: string | number
  payload?: Array<{ payload?: { facturacion?: number | null; tickets?: number | null; promedioPorJornada?: number } }>
  /** Convierte la etiqueta del eje X en texto legible. */
  formatLabel?: (label: string | number) => string
  /** Muestra el promedio por jornada en lugar del total (día de la semana). */
  mostrarPromedio?: boolean
}

/** Tooltip común de los gráficos de ventas: importe + cantidad de ventas del punto. */
export function VentasTooltip({ active, label, payload, formatLabel, mostrarPromedio = false }: VentasTooltipProps) {
  const punto = payload?.[0]?.payload
  if (!active || !punto) return null
  const etiqueta = label !== undefined && formatLabel ? formatLabel(label) : label

  if (punto.facturacion === null) {
    return (
      <div className="bg-white border border-[#E6EDF9] rounded-xl shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-[#002868] mb-1">{etiqueta}</p>
        <p className="text-[#7A93BB]">Sin importar: no hay datos de este período.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E6EDF9] rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-[#002868] mb-1">{etiqueta}</p>
      <p className="text-[#1A1A1A] tabular-nums">
        {mostrarPromedio ? 'Promedio por jornada: ' : 'Facturación: '}
        <strong>{formatMonto((mostrarPromedio ? punto.promedioPorJornada : punto.facturacion) ?? 0)}</strong>
      </p>
      {punto.tickets !== undefined && punto.tickets !== null && (
        <p className="text-[#5A6B8C] tabular-nums">Ventas: {formatCantidad(punto.tickets)}</p>
      )}
    </div>
  )
}
