import { formatCantidad, pluralDias } from '@/lib/formatters'
import type { SincronizacionVentas } from '@/lib/types'

/**
 * Qué dejó una importación. Distingue días nuevos de días que ya estaban y solo se
 * actualizaron, para que repetir un rango no parezca que "agregó" ventas.
 */
export function SincronizacionResultado({ sincronizacion: s }: { sincronizacion: SincronizacionVentas }) {
  if (s.tipo === 'cambios') {
    return s.importados > 0 ? (
      <p className="text-sm text-[#5A6B8C]">{formatCantidad(s.importados)} líneas actualizadas</p>
    ) : (
      <span className="text-sm text-[#9AAACC]">Sin cambios</span>
    )
  }
  if (s.diasNuevos === 0 && s.diasActualizados === 0) {
    return <span className="text-sm text-[#9AAACC]">—</span>
  }
  return (
    <div className="space-y-0.5">
      <p className="text-sm text-[#1E293B]">
        {s.diasNuevos > 0 && (
          <span className="font-semibold text-emerald-700">
            {pluralDias(s.diasNuevos)} {s.diasNuevos === 1 ? 'nuevo' : 'nuevos'}
          </span>
        )}
        {s.diasNuevos > 0 && s.diasActualizados > 0 && <span className="text-[#9AAACC]"> · </span>}
        {s.diasActualizados > 0 && (
          <span className="text-[#5A6B8C]">
            {pluralDias(s.diasActualizados)} {s.diasActualizados === 1 ? 'actualizado' : 'actualizados'}
          </span>
        )}
      </p>
      <p className="text-xs text-[#7A93BB]">{formatCantidad(s.importados)} líneas de Hiopos</p>
    </div>
  )
}
