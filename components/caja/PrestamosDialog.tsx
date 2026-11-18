'use client'
import { useEffect, useState } from 'react'
import { HandCoins } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { CajaPrestamo, SelectOption } from '@/lib/types'
import type { PrestamosCajaState } from '@/hooks/use-prestamos-caja'
import { PrestamosPorConfirmar } from './PrestamosPorConfirmar'
import { PrestamosEstadoCuenta } from './PrestamosEstadoCuenta'
import { DeudasAnterioresPanel } from './DeudasAnterioresPanel'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  prestamos: PrestamosCajaState
  sucursalId: number
  cajaTipo: CajaPrestamo
  moneda: 'ARS' | 'USD'
  bancos: SelectOption[]
  /** Al aceptar, confirmar o anular cambian los movimientos de la caja */
  onMovimientosChange?: () => void
}

type Pestania = 'confirmar' | 'cuenta' | 'deudas'

const DESCRIPCION_DEUDAS =
  'Deudas con terceros ("Marcar como deuda") y las deudas entre sucursales del sistema anterior que todavía no pasaron a préstamos.'

/**
 * Préstamos y deudas desde la caja: lo que hay que aceptar acá, el estado de cuenta de los
 * préstamos y las demás deudas (terceros y las del sistema anterior).
 */
export function PrestamosDialog({
  open,
  onOpenChange,
  prestamos,
  sucursalId,
  cajaTipo,
  moneda,
  bancos,
  onMovimientosChange,
}: Props) {
  const { hasPermiso, user } = useAuthStore()
  const puedeAprobar = hasPermiso('aprobar_movimientos')
  const [pestania, setPestania] = useState<Pestania>('confirmar')
  const { cantidadPorConfirmar, cargarPorConfirmar, cargarEstadoCuenta } = prestamos

  useEffect(() => {
    if (!open) return
    setPestania(cantidadPorConfirmar > 0 ? 'confirmar' : 'cuenta')
    void cargarPorConfirmar()
    void cargarEstadoCuenta()
    // Solo al abrir: la pestaña inicial depende del contador de ese momento.
  }, [open])

  const pestanias: { value: Pestania; label: string }[] = [
    { value: 'confirmar', label: `Por confirmar${cantidadPorConfirmar ? ` (${cantidadPorConfirmar})` : ''}` },
    { value: 'cuenta', label: 'Estado de cuenta' },
    { value: 'deudas', label: 'Otras deudas' },
  ]

  const descripcionPrestamos = `"Por confirmar" muestra solo lo de esta caja (${cajaTipo === 'banco' ? 'banco' : 'efectivo'}, ${moneda}). El estado de cuenta incluye todas las cajas de la sucursal.`

  let contenido: React.ReactNode
  if (pestania === 'confirmar') {
    contenido = (
      <PrestamosPorConfirmar
        prestamos={prestamos}
        cajaTipo={cajaTipo}
        moneda={moneda}
        bancos={bancos}
        puedeResolver={puedeAprobar}
        onResuelto={() => onMovimientosChange?.()}
      />
    )
  } else if (pestania === 'cuenta') {
    contenido = (
      <PrestamosEstadoCuenta
        prestamos={prestamos}
        sucursalId={sucursalId}
        moneda={moneda}
        userId={user?.id}
        puedeAnular={puedeAprobar}
        onCambio={() => onMovimientosChange?.()}
      />
    )
  } else {
    contenido = <DeudasAnterioresPanel activo={open} sucursalId={sucursalId} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-h-[90vh] overflow-y-auto', pestania === 'deudas' ? 'sm:max-w-[1040px]' : 'sm:max-w-[760px]')}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <HandCoins className="h-5 w-5 text-indigo-600" />
            </span>
            Préstamos y deudas
          </DialogTitle>
          <DialogDescription>{pestania === 'deudas' ? DESCRIPCION_DEUDAS : descripcionPrestamos}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#F0F2F5] p-1">
          {pestanias.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setPestania(t.value)}
              className={cn(
                'h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer',
                pestania === t.value ? 'bg-white text-[#002868] shadow-sm' : 'text-[#5A6070] hover:text-[#002868]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {contenido}
      </DialogContent>
    </Dialog>
  )
}
