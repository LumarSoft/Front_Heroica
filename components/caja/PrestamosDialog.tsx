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

type Pestania = 'confirmar' | 'cuenta'

/** Préstamos entre sucursales desde la caja: lo que hay que aceptar acá y el estado de cuenta */
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
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-[#1A1A1A]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <HandCoins className="h-5 w-5 text-indigo-600" />
            </span>
            Préstamos entre sucursales
          </DialogTitle>
          <DialogDescription>
            "Por confirmar" muestra solo lo de esta caja ({cajaTipo === 'banco' ? 'banco' : 'efectivo'}, {moneda}). El
            estado de cuenta incluye todas las cajas de la sucursal.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#F0F2F5] p-1">
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

        {pestania === 'confirmar' ? (
          <PrestamosPorConfirmar
            prestamos={prestamos}
            cajaTipo={cajaTipo}
            moneda={moneda}
            bancos={bancos}
            puedeResolver={puedeAprobar}
            onResuelto={() => onMovimientosChange?.()}
          />
        ) : (
          <PrestamosEstadoCuenta
            prestamos={prestamos}
            sucursalId={sucursalId}
            moneda={moneda}
            userId={user?.id}
            puedeAnular={puedeAprobar}
            onCambio={() => onMovimientosChange?.()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
