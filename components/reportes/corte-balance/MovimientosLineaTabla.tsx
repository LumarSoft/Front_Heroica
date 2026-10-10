import { formatFecha } from '@/lib/formatters'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { MovimientoEgresoCorte } from '@/lib/types'

interface MovimientosLineaTablaProps {
  movimientos: MovimientoEgresoCorte[]
  moneda: 'ARS' | 'USD'
}

/** Detalle de los egresos que suman en una línea o grupo, para poder verificarlos. */
export function MovimientosLineaTabla({ movimientos, moneda }: MovimientosLineaTablaProps) {
  if (movimientos.length === 0) {
    return <p className="px-3 py-2 text-xs text-[#9AA0AC]">No hay egresos del sistema en esta línea.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[#EEF0F3] bg-white">
      <table className="w-full text-xs">
        <thead className="bg-[#F8F9FA] text-[#5A6070]">
          <tr>
            <th className="px-3 py-1.5 text-left font-semibold">Fecha</th>
            <th className="px-3 py-1.5 text-left font-semibold">Descripción</th>
            <th className="px-3 py-1.5 text-left font-semibold">Categoría › Subcategoría</th>
            <th className="px-3 py-1.5 text-left font-semibold">Proveedor</th>
            <th className="px-3 py-1.5 text-left font-semibold">Medio</th>
            <th className="px-3 py-1.5 text-right font-semibold">Monto</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map(m => (
            <tr key={m.id} className="border-t border-[#EEF0F3]">
              <td className="px-3 py-1.5 whitespace-nowrap">{formatFecha(m.fecha)}</td>
              <td className="px-3 py-1.5">{m.descripcion_nombre ?? 'Sin descripción'}</td>
              <td className="px-3 py-1.5 text-[#5A6070]">
                {[m.categoria_nombre, m.subcategoria_nombre].filter(Boolean).join(' › ') || '—'}
              </td>
              <td className="px-3 py-1.5 text-[#5A6070]">{m.proveedor_nombre ?? '—'}</td>
              <td className="px-3 py-1.5 capitalize">{m.medio}</td>
              <td className="px-3 py-1.5 text-right font-medium whitespace-nowrap">
                {formatearImporte(m.monto, moneda)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
