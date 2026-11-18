'use client'
import { formatMonto } from '@/lib/formatters'
import type { TotalImpositivo } from '@/lib/types'

interface Props {
  titulo: string
  totales: TotalImpositivo[]
}

/** Tabla chica de totales (por sucursal o por período): pendiente, pagado y total */
export function BaseImpositivaTotales({ titulo, totales }: Props) {
  if (totales.length === 0) return null
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <p className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#002868] bg-[#F8F9FA] border-b">
        {titulo}
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-[#8A8F9C]">
            <th className="px-4 py-2 text-left font-semibold" />
            <th className="px-4 py-2 text-right font-semibold">Pendiente</th>
            <th className="px-4 py-2 text-right font-semibold">Pagado</th>
            <th className="px-4 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F0]">
          {totales.map(t => (
            <tr key={t.clave}>
              <td className="px-4 py-2 font-medium text-[#1A1A1A]">
                {t.etiqueta}
                {t.moneda === 'USD' && <span className="ml-1 text-xs text-[#8A8F9C]">USD</span>}
              </td>
              <td className="px-4 py-2 text-right text-amber-700">{formatMonto(t.pendiente, t.moneda)}</td>
              <td className="px-4 py-2 text-right text-emerald-700">{formatMonto(t.pagado, t.moneda)}</td>
              <td className="px-4 py-2 text-right font-semibold">{formatMonto(t.pendiente + t.pagado, t.moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
