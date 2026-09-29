import { VENTAS_SERIE_COLOR } from '@/lib/dialog-styles'
import { formatMonto } from '@/lib/formatters'

export interface FilaRankingVentas {
  clave: string
  label: string
  valor: number
  /** Texto secundario bajo la etiqueta (ej. "120 ventas · ticket $ 9.100"). */
  detalle?: string
}

interface VentasRankingBarsProps {
  filas: FilaRankingVentas[]
  /** Cómo mostrar el valor; por defecto, moneda. */
  formatValor?: (valor: number) => string
  mostrarParticipacion?: boolean
  vacio?: string
}

/**
 * Ranking en barras horizontales con valor y participación rotulados: legible con
 * muchas categorías y sin depender del color (cada barra lleva su etiqueta).
 */
export function VentasRankingBars({
  filas,
  formatValor = formatMonto,
  mostrarParticipacion = true,
  vacio = 'Sin datos para los filtros seleccionados.',
}: VentasRankingBarsProps) {
  if (filas.length === 0) return <p className="py-10 text-center text-sm text-[#7A93BB]">{vacio}</p>

  const maximo = Math.max(...filas.map(f => f.valor), 0)
  const total = filas.reduce((acc, f) => acc + f.valor, 0)

  return (
    <ul className="space-y-3">
      {filas.map(fila => {
        const ancho = maximo > 0 ? Math.max((fila.valor / maximo) * 100, 1) : 0
        const participacion = total > 0 ? (fila.valor / total) * 100 : 0
        return (
          <li key={fila.clave} title={`${fila.label}: ${formatValor(fila.valor)}`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-[#1E293B] truncate">{fila.label}</span>
              <span className="flex-shrink-0 tabular-nums text-[#1E293B] font-semibold">
                {formatValor(fila.valor)}
                {mostrarParticipacion && (
                  <span className="ml-2 text-xs font-medium text-[#7A93BB]">{participacion.toFixed(1)}%</span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-[#F1F5FD] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${ancho}%`, backgroundColor: VENTAS_SERIE_COLOR }}
              />
            </div>
            {fila.detalle && <p className="mt-1 text-xs text-[#7A93BB]">{fila.detalle}</p>}
          </li>
        )
      })}
    </ul>
  )
}
