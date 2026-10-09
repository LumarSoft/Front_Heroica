import { History } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { formatFechaHora, formatRangoFechas, pluralDias } from '@/lib/formatters'
import type { SincronizacionVentas } from '@/lib/types'
import { SincronizacionEstadoBadge } from './SincronizacionEstadoBadge'
import { SincronizacionProgreso } from './SincronizacionProgreso'
import { SincronizacionResultado } from './SincronizacionResultado'

interface SincronizacionesVentasTableProps {
  sincronizaciones: SincronizacionVentas[]
}

const TH = 'px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-[#7A93BB] whitespace-nowrap'
const TD = 'px-4 py-3 text-sm text-[#1E293B] align-top'

export function SincronizacionesVentasTable({ sincronizaciones }: SincronizacionesVentasTableProps) {
  if (sincronizaciones.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Todavía no se trajeron ventas"
        description="Cada vez que se importen ventas (a mano o automáticamente) va a quedar registrado acá."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-[#EEF2FB] bg-[#F8FAFF]">
          <tr>
            <th className={TH}>Días importados</th>
            <th className={TH}>Estado</th>
            <th className={TH}>Resultado</th>
            <th className={TH}>Pedido por</th>
            <th className={TH}>Iniciado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2FB]">
          {sincronizaciones.map(s => (
            <tr key={s.id}>
              <td className={TD}>
                {s.tipo === 'cambios' ? (
                  <>
                    <p className="font-semibold text-[#002868] whitespace-nowrap">Cambios en HiOffice</p>
                    <p className="text-xs text-[#7A93BB]">Tickets nuevos o corregidos</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-[#002868] whitespace-nowrap">
                      {formatRangoFechas(s.fechaDesde, s.fechaHasta)}
                    </p>
                    <p className="text-xs text-[#7A93BB]">{pluralDias(s.diasTotales)}</p>
                  </>
                )}
              </td>
              <td className={`${TD} min-w-[240px]`}>
                {s.estado === 'en_curso' ? (
                  <SincronizacionProgreso sincronizacion={s} />
                ) : (
                  <div className="space-y-1">
                    <SincronizacionEstadoBadge estado={s.estado} />
                    {s.mensaje && <p className="text-xs text-[#5A6B8C] max-w-[340px]">{s.mensaje}</p>}
                  </div>
                )}
              </td>
              <td className={TD}>
                <SincronizacionResultado sincronizacion={s} />
              </td>
              <td className={`${TD} whitespace-nowrap`}>
                {s.origen === 'manual' ? (s.usuario ?? 'Manual') : 'Automático'}
              </td>
              <td className={`${TD} whitespace-nowrap text-[#5A6B8C]`}>{formatFechaHora(s.iniciadaAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
