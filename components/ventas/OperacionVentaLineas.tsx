import { useMemo } from 'react'
import { formatCantidad, formatMonto } from '@/lib/formatters'
import type { LineaOperacionVenta } from '@/lib/types'

interface OperacionVentaLineasProps {
  lineas: LineaOperacionVenta[]
}

export function OperacionVentaLineas({ lineas }: OperacionVentaLineasProps) {
  const productos = useMemo(() => lineas.filter(l => l.tipoLinea !== 'pago'), [lineas])
  const pagos = useMemo(() => lineas.filter(l => l.tipoLinea === 'pago'), [lineas])

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] mb-2">Productos</h4>
        {productos.length === 0 ? (
          <p className="text-sm text-[#7A93BB]">La operación no informa productos.</p>
        ) : (
          <ul className="divide-y divide-[#EEF2FB]">
            {productos.map(l => (
              <li key={l.id} className="py-2 flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className={`font-medium text-[#1E293B] ${l.anulada ? 'line-through' : ''}`}>
                    {l.productoNombre ?? 'Sin nombre'}
                  </p>
                  <p className="text-xs text-[#7A93BB]">
                    {[l.categoria, l.productoCodigo ? `Cód. ${l.productoCodigo}` : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 tabular-nums">
                  <p className="font-semibold text-[#1E293B]">{formatMonto(l.importe)}</p>
                  <p className="text-xs text-[#7A93BB]">
                    {formatCantidad(l.cantidad, 3)} × {l.precioUnitario !== null ? formatMonto(l.precioUnitario) : '—'}
                    {l.descuento > 0 ? ` · desc. ${formatMonto(l.descuento)}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A93BB] mb-2">Pagos</h4>
        {pagos.length === 0 ? (
          <p className="text-sm text-[#7A93BB]">La operación no informa medios de pago.</p>
        ) : (
          <ul className="divide-y divide-[#EEF2FB]">
            {pagos.map(l => (
              <li key={l.id} className="py-2 flex items-center justify-between gap-4 text-sm">
                <span className="text-[#1E293B]">{l.medioPago ?? 'Sin informar'}</span>
                <span className="font-semibold tabular-nums text-[#1E293B]">{formatMonto(l.importe)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
