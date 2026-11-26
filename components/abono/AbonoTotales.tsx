import { formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TotalesAbono } from '@/lib/types'

/** Totales de todas las facturas: lo facturado, lo abonado y lo que se adeuda */
export function AbonoTotales({ totales }: { totales: TotalesAbono }) {
  const tarjetas = [
    { label: 'Total facturado', valor: totales.facturado, clase: 'text-[#002868]' },
    { label: 'Total abonado', valor: totales.abonado, clase: 'text-emerald-700' },
    {
      label: 'Total adeudado',
      valor: totales.adeudado,
      clase: totales.adeudado > 0 ? 'text-rose-700' : 'text-[#5A6070]',
    },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tarjetas.map(t => (
        <div key={t.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6070]">{t.label}</p>
          <p className={cn('mt-1 text-2xl font-bold', t.clase)}>{formatMonto(t.valor)}</p>
        </div>
      ))}
    </div>
  )
}
