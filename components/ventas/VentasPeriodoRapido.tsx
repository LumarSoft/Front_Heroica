'use client'

import { useMemo } from 'react'
import { periodosRapidos } from '@/lib/ventas-rangos'
import { cn } from '@/lib/utils'

interface VentasPeriodoRapidoProps {
  desde: string
  hasta: string
  onElegir: (desde: string, hasta: string) => void
}

/** Atajos de período; el que coincide con las fechas elegidas queda resaltado. */
export function VentasPeriodoRapido({ desde, hasta, onElegir }: VentasPeriodoRapidoProps) {
  const periodos = useMemo(() => periodosRapidos(), [])

  return (
    <div role="group" aria-label="Períodos rápidos" className="flex flex-wrap gap-2">
      {periodos.map(p => {
        const activo = p.desde === desde && p.hasta === hasta
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={activo}
            onClick={() => onElegir(p.desde, p.hasta)}
            className={cn(
              'px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer',
              activo
                ? 'bg-[#002868] border-[#002868] text-white'
                : 'bg-white border-[#D8E3F8] text-[#002868] hover:border-[#002868]',
            )}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
