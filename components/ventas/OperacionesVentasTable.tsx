import { ChevronRight, Receipt } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'
import { formatCantidad, formatFecha, formatMonto } from '@/lib/formatters'
import type { OperacionVenta } from '@/lib/types'

interface OperacionesVentasTableProps {
  operaciones: OperacionVenta[]
  onVerDetalle: (operacion: OperacionVenta) => void
}

const TH = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-[#7A93BB] whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-[#1E293B] whitespace-nowrap'

function hora(fechaHora: string | null): string {
  return fechaHora ? fechaHora.slice(11, 16) : '—'
}

export function OperacionesVentasTable({ operaciones, onVerDetalle }: OperacionesVentasTableProps) {
  if (operaciones.length === 0) {
    return (
      <div className={VENTAS_CARD_CLASS}>
        <EmptyState
          icon={Receipt}
          title="Sin operaciones"
          description="No hay ventas importadas para los filtros seleccionados."
        />
      </div>
    )
  }

  return (
    <div className={`${VENTAS_CARD_CLASS} overflow-x-auto`}>
      <table className="w-full min-w-[880px]">
        <thead className="border-b border-[#EEF2FB] bg-[#F8FAFF]">
          <tr>
            <th className={TH}>Día operativo</th>
            <th className={TH}>Hora</th>
            <th className={TH}>Sucursal</th>
            <th className={TH}>Operación</th>
            <th className={`${TH} text-right`}>Unidades</th>
            <th className={`${TH} text-right`}>Total</th>
            <th className={TH}>Medios de pago</th>
            <th className={TH}>Canal</th>
            <th className={TH}>
              <span className="sr-only">Detalle</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2FB]">
          {operaciones.map(op => (
            <tr
              key={`${op.fuente}-${op.fecha}-${op.transaccionId}`}
              onClick={() => onVerDetalle(op)}
              className="cursor-pointer hover:bg-[#F8FAFF] transition-colors"
            >
              <td className={TD}>{formatFecha(op.fecha)}</td>
              <td className={`${TD} tabular-nums`}>{hora(op.fechaHora)}</td>
              <td className={TD}>
                {op.sucursal ?? (
                  <span className="text-amber-700" title="El local todavía no tiene sucursal asignada">
                    {op.localExterno ?? 'Sin asignar'} (sin asignar)
                  </span>
                )}
              </td>
              <td className={`${TD} font-mono text-xs text-[#5A6B8C]`}>
                {op.transaccionId}
                {op.anulada && (
                  <span className="ml-2 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-sans text-[11px] font-semibold text-rose-700">
                    Anulada
                  </span>
                )}
              </td>
              <td className={`${TD} text-right tabular-nums`}>{formatCantidad(op.unidades, 2)}</td>
              <td
                className={`${TD} text-right tabular-nums font-semibold ${op.anulada ? 'line-through text-[#9AAACC]' : ''}`}
              >
                {formatMonto(op.total || op.cobrado)}
              </td>
              <td className={`${TD} max-w-[220px] truncate`} title={op.mediosPago ?? undefined}>
                {op.mediosPago ?? '—'}
              </td>
              <td className={TD}>{op.canal ?? '—'}</td>
              <td className={`${TD} text-right`}>
                <button
                  type="button"
                  aria-label={`Ver detalle de la operación ${op.transaccionId}`}
                  className="text-[#7A93BB] hover:text-[#002868] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
