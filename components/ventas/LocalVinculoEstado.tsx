import { AlertTriangle, Link2, UserCheck } from 'lucide-react'
import type { LocalExternoVentas } from '@/lib/types'

/** Cómo quedó vinculado un local: lo resolvió el sistema, lo eligió una persona, o falta. */
export function LocalVinculoEstado({ local }: { local: LocalExternoVentas }) {
  if (!local.sucursalId) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5" />
        Falta elegir la sucursal
      </span>
    )
  }
  if (local.asignacion === 'manual') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6B8C] whitespace-nowrap">
        <UserCheck className="w-3.5 h-3.5" />
        Vinculado manualmente
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
      <Link2 className="w-3.5 h-3.5" />
      Vinculado automáticamente
    </span>
  )
}
