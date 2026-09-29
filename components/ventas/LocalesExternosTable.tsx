import { ArrowRight, CheckCircle2, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'
import type { LocalExternoVentas } from '@/lib/types'
import type { SucursalOpcion } from '@/hooks/use-ventas-locales'
import { LocalVinculoEstado } from './LocalVinculoEstado'

interface LocalesExternosTableProps {
  locales: LocalExternoVentas[]
  sucursales: SucursalOpcion[]
  editable: boolean
  guardandoId: number | null
  onAsignar: (localId: number, sucursalId: number | null) => void
}

/**
 * Cada local del punto de venta se corresponde con una sucursal de Heroica. La mayoría
 * se vinculan solos por nombre; acá solo hay que confirmar los que no coinciden.
 */
export function LocalesExternosTable({
  locales,
  sucursales,
  editable,
  guardandoId,
  onAsignar,
}: LocalesExternosTableProps) {
  if (locales.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="Todavía no hay locales"
        description="Aparecen solos con la primera sincronización y se vinculan a su sucursal por nombre."
      />
    )
  }

  return (
    <ul className="divide-y divide-[#EEF2FB]">
      {locales.map(local => {
        const guardando = guardandoId === local.id
        return (
          <li
            key={local.id}
            className={`py-4 flex flex-col lg:flex-row lg:items-center gap-3 ${local.sucursalId ? '' : 'bg-amber-50/60 -mx-5 px-5'}`}
          >
            <div className="flex items-center gap-3 lg:w-[34%] min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[#EEF3FF] text-[#002868] flex items-center justify-center flex-shrink-0">
                <Store className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#1E293B] truncate">{local.nombreExterno ?? local.codigoExterno}</p>
                <p className="text-xs text-[#7A93BB] capitalize">
                  {local.fuente} · código {local.codigoExterno}
                </p>
              </div>
            </div>

            <ArrowRight className="hidden lg:block w-4 h-4 text-[#9AAACC] flex-shrink-0" />

            <div className="flex flex-wrap items-center gap-2 flex-1">
              {editable ? (
                <select
                  value={local.sucursalId ?? ''}
                  disabled={guardando}
                  onChange={e => onAsignar(local.id, e.target.value ? Number(e.target.value) : null)}
                  aria-label={`Sucursal de Heroica para ${local.nombreExterno ?? local.codigoExterno}`}
                  className={`${VENTAS_SELECT_CLASS} min-w-[220px]`}
                >
                  <option value="">Elegí la sucursal…</option>
                  {sucursales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-medium text-[#1E293B]">{local.sucursal ?? 'Sin vincular'}</span>
              )}

              {editable && !local.sucursalId && local.sugerencia && (
                <Button
                  size="sm"
                  disabled={guardando}
                  onClick={() => onAsignar(local.id, local.sugerencia?.id ?? null)}
                  className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ¿Es {local.sugerencia.nombre}? Confirmar
                </Button>
              )}
              {guardando && <LoadingSpinner className="w-4 h-4 border-2" />}
            </div>

            <LocalVinculoEstado local={local} />
          </li>
        )
      })}
    </ul>
  )
}
