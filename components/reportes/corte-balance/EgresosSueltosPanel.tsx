'use client'

import { useState } from 'react'
import { AlertTriangle, Ban, ChevronDown, ChevronRight, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { MovimientosLineaTabla } from '@/components/reportes/corte-balance/MovimientosLineaTabla'
import { corteCardClasses } from '@/lib/dialog-styles'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { OpcionLinea } from '@/lib/corte-balance/edicion'
import type { GrupoEgresosSueltos, ReglaPlantilla } from '@/lib/types'

interface EgresosSueltosPanelProps {
  modo: 'sin-clasificar' | 'excluidos'
  grupos: GrupoEgresosSueltos[]
  total: number
  lineas: OpcionLinea[]
  moneda: 'ARS' | 'USD'
  onAsignar: (regla: ReglaPlantilla, lineaId: string) => void
  onExcluir: (regla: ReglaPlantilla) => void
  onIncluir: (regla: ReglaPlantilla) => void
}

const TEXTOS = {
  'sin-clasificar': {
    titulo: 'Egresos sin clasificar',
    ayuda:
      'No coinciden con ninguna línea de la plantilla, así que no suman en el reporte. Asignalos a una línea o excluilos.',
  },
  excluidos: {
    titulo: 'Egresos excluidos',
    ayuda: 'Quedan fuera del reporte a propósito (por ejemplo, gastos que no son de la sucursal).',
  },
}

export function EgresosSueltosPanel({
  modo,
  grupos,
  total,
  lineas,
  moneda,
  onAsignar,
  onExcluir,
  onIncluir,
}: EgresosSueltosPanelProps) {
  const [abierto, setAbierto] = useState<string | null>(null)
  if (grupos.length === 0) return null
  const textos = TEXTOS[modo]
  const esSinClasificar = modo === 'sin-clasificar'

  return (
    <section className={`${corteCardClasses} ${esSinClasificar ? 'border-amber-200 bg-amber-50/40' : ''}`}>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-[#1A1A1A]">
          {esSinClasificar ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <Ban className="h-4 w-4 text-[#9AA0AC]" />
          )}
          {textos.titulo}
        </h3>
        <p className="text-sm font-semibold text-[#5A6070]">{formatearImporte(total, moneda)}</p>
      </header>
      <p className="mb-3 text-xs text-[#5A6070]">{textos.ayuda}</p>
      {grupos.map(g => (
        <div key={g.clave} className="border-t border-[#EEF0F3] py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-0 flex-1 justify-start gap-1.5 px-1 py-1 text-left"
              onClick={() => setAbierto(a => (a === g.clave ? null : g.clave))}
            >
              {abierto === g.clave ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="truncate text-sm font-medium">{g.etiqueta}</span>
              {g.contexto && <span className="truncate text-[11px] font-normal text-[#9AA0AC]">{g.contexto}</span>}
            </Button>
            <span className="w-32 text-right text-sm font-semibold">{formatearImporte(g.total, moneda)}</span>
            {g.regla && esSinClasificar && (
              <>
                <Combobox
                  options={lineas}
                  value=""
                  onChange={lineaId => g.regla && lineaId && onAsignar(g.regla, lineaId)}
                  placeholder="Asignar a línea…"
                  searchPlaceholder="Buscar línea…"
                  className="w-64"
                  overlay
                />
                <Button type="button" variant="outline" size="sm" onClick={() => g.regla && onExcluir(g.regla)}>
                  <Ban className="h-3.5 w-3.5" /> Excluir
                </Button>
              </>
            )}
            {g.regla && !esSinClasificar && (
              <Button type="button" variant="outline" size="sm" onClick={() => g.regla && onIncluir(g.regla)}>
                <Undo2 className="h-3.5 w-3.5" /> Volver a incluir
              </Button>
            )}
          </div>
          {abierto === g.clave && (
            <div className="pt-2 pl-6">
              <MovimientosLineaTabla movimientos={g.movimientos} moneda={moneda} />
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
