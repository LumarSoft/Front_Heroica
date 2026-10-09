'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { formatCantidad, formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { DesempenioVentas } from '@/lib/types'

type Clave =
  | 'facturacion'
  | 'tickets'
  | 'ticketPromedio'
  | 'unidadesPorTicket'
  | 'porcentajeDescuento'
  | 'promedioDiario'
  | 'anuladas'

const COLUMNAS: Array<{ clave: Clave; etiqueta: string; ayuda?: string }> = [
  { clave: 'facturacion', etiqueta: 'Facturación' },
  { clave: 'tickets', etiqueta: 'Tickets' },
  { clave: 'ticketPromedio', etiqueta: 'Ticket prom.' },
  {
    clave: 'unidadesPorTicket',
    etiqueta: 'Unid./ticket',
    ayuda: 'Cuántos productos lleva cada ticket: mide la venta sugerida.',
  },
  { clave: 'promedioDiario', etiqueta: 'Prom. por día', ayuda: 'Facturación dividida por los días que vendió.' },
  { clave: 'porcentajeDescuento', etiqueta: '% desc.', ayuda: 'Descuentos sobre la venta bruta.' },
  { clave: 'anuladas', etiqueta: 'Anulados', ayuda: 'Tickets anulados en el período.' },
]

const TH = 'px-3 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#7A93BB] whitespace-nowrap'
const TD = 'px-3 py-2.5 text-sm text-[#1E293B] whitespace-nowrap tabular-nums'

function valor(f: DesempenioVentas, clave: Clave): number {
  return clave === 'anuladas' ? f.anuladas.tickets : f[clave]
}

export function DesempenioTable({ filas, etiqueta }: { filas: DesempenioVentas[]; etiqueta: string }) {
  const [orden, setOrden] = useState<Clave>('facturacion')
  const ordenadas = useMemo(() => [...filas].sort((a, b) => valor(b, orden) - valor(a, orden)), [filas, orden])
  const maximo = Math.max(...filas.map(f => f.facturacion), 0)

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full min-w-[900px]">
        <thead className="border-b border-[#EEF2FB] bg-[#F8FAFF]">
          <tr>
            <th className={`${TH} text-left`}>{etiqueta}</th>
            {COLUMNAS.map(c => (
              <th key={c.clave} className={`${TH} text-right`} title={c.ayuda}>
                <button
                  type="button"
                  onClick={() => setOrden(c.clave)}
                  className={cn(
                    'inline-flex items-center gap-1 cursor-pointer hover:text-[#002868]',
                    orden === c.clave && 'text-[#002868]',
                  )}
                >
                  {c.etiqueta}
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2FB]">
          {ordenadas.map(f => (
            <tr key={f.nombre} className="hover:bg-[#F8FAFF]">
              <td className="px-3 py-2.5 text-sm min-w-[200px]">
                <p className="font-medium text-[#1E293B]">{f.nombre}</p>
                <div className="mt-1 h-1.5 rounded-full bg-[#EEF2FB] overflow-hidden w-40">
                  <div
                    className="h-full bg-[#2F5BBD]"
                    style={{ width: `${maximo ? (f.facturacion / maximo) * 100 : 0}%` }}
                  />
                </div>
                {f.sucursales && <p className="text-[11px] text-[#9AAACC] mt-0.5">{f.sucursales}</p>}
              </td>
              <td className={`${TD} text-right font-semibold`}>
                {formatMonto(f.facturacion)}
                <span className="block text-[11px] font-normal text-[#9AAACC]">{f.participacion.toFixed(1)}%</span>
              </td>
              <td className={`${TD} text-right`}>{formatCantidad(f.tickets)}</td>
              <td className={`${TD} text-right`}>{formatMonto(f.ticketPromedio)}</td>
              <td className={`${TD} text-right`}>{formatCantidad(f.unidadesPorTicket, 2)}</td>
              <td className={`${TD} text-right`}>
                {formatMonto(f.promedioDiario)}
                <span className="block text-[11px] text-[#9AAACC]">{f.jornadas} días</span>
              </td>
              <td className={`${TD} text-right`}>{f.porcentajeDescuento.toFixed(1)}%</td>
              <td className={cn(`${TD} text-right`, f.anuladas.tickets > 0 && 'text-rose-700')}>
                {f.anuladas.tickets > 0 ? `${f.anuladas.tickets} · ${formatMonto(f.anuladas.importe)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
