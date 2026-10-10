import { corteCardClasses } from '@/lib/dialog-styles'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { IndicadoresCorte } from '@/lib/types'

interface IndicadoresCardProps {
  indicadores: IndicadoresCorte | null
  moneda: 'ARS' | 'USD'
}

const pct = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`

export function IndicadoresCard({ indicadores: ind, moneda }: IndicadoresCardProps) {
  if (!ind) {
    return (
      <section className={`${corteCardClasses} lg:col-span-2`}>
        <h3 className="text-sm font-bold text-[#002868]">Indicadores y punto de equilibrio</h3>
        <p className="mt-1 text-xs text-[#5A6070]">Cargá las ventas del período para calcularlos.</p>
      </section>
    )
  }
  const m = (n: number) => formatearImporte(n, moneda)
  const deficit = ind.diferencia !== null && ind.diferencia < 0
  const kpis = [
    { etiqueta: 'Margen de contribución', valor: pct(ind.margenContribucionPct) },
    { etiqueta: 'Punto de equilibrio', valor: ind.puntoEquilibrio === null ? '—' : m(ind.puntoEquilibrio) },
    { etiqueta: 'Ventas / equilibrio', valor: ind.coberturaPct === null ? '—' : pct(ind.coberturaPct) },
    {
      etiqueta: deficit ? 'Faltante para el equilibrio' : 'Superávit sobre el equilibrio',
      valor: ind.diferencia === null ? '—' : m(Math.abs(ind.diferencia)),
    },
  ]

  return (
    <section className={`${corteCardClasses} lg:col-span-2`}>
      <h3 className="mb-3 text-sm font-bold text-[#002868]">Indicadores y punto de equilibrio</h3>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(k => (
          <div key={k.etiqueta} className="rounded-lg border border-[#EEF0F3] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">{k.etiqueta}</p>
            <p
              className={`text-base font-bold ${deficit && k.etiqueta.startsWith('Faltante') ? 'text-rose-600' : 'text-[#002868]'}`}
            >
              {k.valor}
            </p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
        {ind.incidencias.map(i => (
          <div key={i.id} className="flex items-center justify-between border-t border-[#EEF0F3] py-1.5 text-sm">
            <span>
              {i.nombre}{' '}
              <span className="text-[10px] uppercase text-[#9AA0AC]">
                {i.tipoCosto === 'fijo' ? 'fijo' : 'variable'}
              </span>
            </span>
            <span className="font-semibold">{pct(i.pct)} de las ventas</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[#9AA0AC]">
        Punto de equilibrio = costos fijos / (1 − costos variables / ventas). Fijo o variable se define por sección en
        la pestaña Plantilla.
      </p>
    </section>
  )
}
