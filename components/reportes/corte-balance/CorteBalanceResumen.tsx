import { AlertTriangle, Ban, Scale, TrendingDown } from 'lucide-react'
import { SummaryCard } from '@/components/reportes/SummaryCard'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { BalanceCalculado, ResultadoCorteBalance } from '@/lib/types'

interface CorteBalanceResumenProps {
  resultado: ResultadoCorteBalance
  balance: BalanceCalculado
  moneda: 'ARS' | 'USD'
}

export function CorteBalanceResumen({ resultado, balance, moneda }: CorteBalanceResumenProps) {
  const cantidad = (n: number) => `${n} ${n === 1 ? 'grupo' : 'grupos'}`
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Egresos en el reporte"
        value={formatearImporte(balance.egresos, moneda)}
        accent="rose"
        icon={<TrendingDown className="h-5 w-5" />}
        sub={`${resultado.secciones.length} secciones`}
      />
      <SummaryCard
        label="Sin clasificar"
        value={formatearImporte(resultado.totalSinClasificar, moneda)}
        accent="orange"
        icon={<AlertTriangle className="h-5 w-5" />}
        sub={resultado.sinClasificar.length ? cantidad(resultado.sinClasificar.length) : 'Todo clasificado'}
      />
      <SummaryCard
        label="Excluidos"
        value={formatearImporte(resultado.totalExcluido, moneda)}
        accent="indigo"
        icon={<Ban className="h-5 w-5" />}
        sub={resultado.excluidos.length ? cantidad(resultado.excluidos.length) : 'Ninguno'}
      />
      <SummaryCard
        label="Resultado final"
        value={formatearImporte(balance.resultadoFinal, moneda)}
        accent={balance.resultadoFinal >= 0 ? 'blue' : 'red'}
        icon={<Scale className="h-5 w-5" />}
        sub={balance.ingresos ? 'Con los ingresos cargados' : 'Faltan cargar los ingresos'}
      />
    </div>
  )
}
