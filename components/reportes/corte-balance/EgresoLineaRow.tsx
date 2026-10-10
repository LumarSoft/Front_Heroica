'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MontoInput } from '@/components/ui/monto-input'
import { MovimientosLineaTabla } from '@/components/reportes/corte-balance/MovimientosLineaTabla'
import { corteIconButtonClasses } from '@/lib/dialog-styles'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { AjusteLineaCorte, LineaCalculada } from '@/lib/types'

interface EgresoLineaRowProps {
  linea: LineaCalculada
  ajuste: AjusteLineaCorte | undefined
  moneda: 'ARS' | 'USD'
  onAjusteChange: (lineaId: string, cambios: Partial<AjusteLineaCorte>) => void
}

export function EgresoLineaRow({ linea, ajuste, moneda, onAjusteChange }: EgresoLineaRowProps) {
  const [abierta, setAbierta] = useState(false)
  const cantidad = linea.movimientos.length

  return (
    <div className="border-t border-[#EEF0F3] first:border-t-0">
      <div className="grid grid-cols-1 items-center gap-2 py-2 md:grid-cols-[minmax(0,1.3fr)_150px_170px_minmax(0,1fr)_120px]">
        <Button
          type="button"
          variant="ghost"
          className="h-auto justify-start gap-1.5 px-1 py-1 text-left text-sm font-medium text-[#1A1A1A]"
          onClick={() => setAbierta(v => !v)}
        >
          {abierta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="truncate">{linea.nombre}</span>
          <span className="text-[10px] font-normal text-[#9AA0AC]">
            {cantidad} mov{cantidad === 1 ? '.' : 's.'}
          </span>
        </Button>
        <div className="text-right text-sm text-[#5A6070] md:pr-2">
          <span className="md:hidden text-xs">Sistema: </span>
          {formatearImporte(linea.automatico, moneda)}
        </div>
        <div className="flex items-center gap-1">
          <MontoInput
            value={ajuste?.valor ?? ''}
            onChange={valor => onAjusteChange(linea.id, { valor })}
            placeholder="Ajuste manual"
            className="h-8 text-sm"
            aria-label={`Ajuste manual de ${linea.nombre}`}
          />
          {linea.ajustada && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={corteIconButtonClasses}
              title="Volver al valor del sistema"
              onClick={() => onAjusteChange(linea.id, { valor: '' })}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <Input
          value={ajuste?.nota ?? ''}
          onChange={e => onAjusteChange(linea.id, { nota: e.target.value })}
          placeholder="Nota (solo Excel)"
          className="h-8 text-sm"
          aria-label={`Nota de ${linea.nombre}`}
        />
        <div className={`text-right text-sm font-semibold ${linea.ajustada ? 'text-amber-700' : 'text-[#002868]'}`}>
          {formatearImporte(linea.importe, moneda)}
        </div>
      </div>
      {abierta && (
        <div className="pb-3 pl-6">
          <MovimientosLineaTabla movimientos={linea.movimientos} moneda={moneda} />
        </div>
      )}
    </div>
  )
}
