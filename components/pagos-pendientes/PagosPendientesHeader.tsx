'use client'

import { AlertTriangle, ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PagosPendientesHeaderProps {
  sucursalNombre: string
  isReadOnly: boolean
  onBack: () => void
  onNuevoMovimiento: () => void
}

export function PagosPendientesHeader({
  sucursalNombre,
  isReadOnly,
  onBack,
  onNuevoMovimiento,
}: PagosPendientesHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#E0E0E0] bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center gap-3">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="size-9 cursor-pointer rounded-lg text-[#5A6070] hover:bg-[#002868]/8 hover:text-[#002868]"
              aria-label="Volver a la sucursal"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase leading-none tracking-wider text-[#9AA0AC]">
                Sucursal
              </p>
              <h2 className="truncate text-sm font-semibold leading-none text-[#002868] sm:text-base">
                {sucursalNombre || 'Cargando...'}
              </h2>
            </div>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#002868]">Pagos Pendientes</h1>
            <p className="mt-1 text-[#666666]">Gestión y seguimiento de movimientos por autorizar</p>
          </div>
          <Button
            onClick={isReadOnly ? undefined : onNuevoMovimiento}
            disabled={isReadOnly}
            className="flex cursor-pointer items-center gap-2 self-end bg-[#002868] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-[#003d8f] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none md:self-auto"
          >
            <Plus className="size-5" strokeWidth={2} />
            Nuevo Movimiento
          </Button>
        </div>

        {isReadOnly && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              Esta sucursal está <strong>inactiva</strong>. Podés ver los datos pero no crear ni autorizar movimientos.
            </p>
          </div>
        )}
      </section>
    </>
  )
}
