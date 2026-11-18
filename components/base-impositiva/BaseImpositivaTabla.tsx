'use client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatFecha, formatMonto } from '@/lib/formatters'
import { formatPeriodo } from '@/lib/periodo'
import { cajaTexto, estadoTexto } from '@/lib/base-impositiva'
import type { MovimientoImpositivo } from '@/lib/types'

interface Props {
  items: MovimientoImpositivo[]
  puedeMarcarPagado: boolean
  marcandoId: number | null
  onMarcarPagado: (m: MovimientoImpositivo) => void
}

/** Lista de la base impositiva: sucursal, período, impuesto, vencimiento, monto, estado y caja */
export function BaseImpositivaTabla({ items, puedeMarcarPagado, marcandoId, onMarcarPagado }: Props) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-[#F8F9FA] text-xs uppercase tracking-wider text-[#5A6070]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Sucursal</th>
            <th className="px-4 py-3 text-left font-semibold">Período</th>
            <th className="px-4 py-3 text-left font-semibold">Impuesto</th>
            <th className="px-4 py-3 text-left font-semibold">Vencimiento</th>
            <th className="px-4 py-3 text-right font-semibold">Monto</th>
            <th className="px-4 py-3 text-left font-semibold">Estado</th>
            <th className="px-4 py-3 text-left font-semibold">Caja / banco</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F0]">
          {items.map(m => (
            <tr key={m.id} className="hover:bg-[#FAFBFC]">
              <td className="px-4 py-3 font-medium text-[#1A1A1A]">{m.sucursal_nombre}</td>
              <td className="px-4 py-3">{formatPeriodo(m.periodo)}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-[#002868]">{m.impuesto}</p>
                <p className="text-xs text-[#8A8F9C]">{m.descripcion_nombre ?? m.concepto}</p>
              </td>
              <td className="px-4 py-3">{m.fecha ? formatFecha(m.fecha) : '—'}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatMonto(m.monto, m.moneda)}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    m.situacion === 'pagado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}
                >
                  {estadoTexto(m)}
                </span>
              </td>
              <td className="px-4 py-3 text-[#5A6070]">{cajaTexto(m)}</td>
              <td className="px-4 py-3 text-right">
                {puedeMarcarPagado && m.estado === 'aprobado' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={marcandoId === m.id}
                    onClick={() => onMarcarPagado(m)}
                    className="h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    {marcandoId === m.id ? 'Marcando...' : 'Marcar pagado'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
