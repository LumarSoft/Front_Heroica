'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiapositivaPreview } from '@/components/reportes/corte-balance/vista-previa/DiapositivaPreview'
import { corteCardClasses } from '@/lib/dialog-styles'
import { construirDiapositivas } from '@/lib/corte-balance/modelo/construir'
import type { DatosExportCorteBalance } from '@/lib/types'

interface VistaPreviaTabProps {
  datos: DatosExportCorteBalance
}

export function VistaPreviaTab({ datos }: VistaPreviaTabProps) {
  const diapositivas = useMemo(() => construirDiapositivas(datos), [datos])
  const [actual, setActual] = useState(0)
  const indice = Math.min(actual, diapositivas.length - 1)
  const seleccionada = diapositivas[indice]
  const fuente = datos.borrador.opciones.fuente

  if (!seleccionada) {
    return <p className="text-sm text-[#5A6070]">No hay diapositivas para mostrar con las opciones elegidas.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className={`${corteCardClasses} max-h-[75vh] space-y-3 overflow-y-auto p-3`}>
        {diapositivas.map((d, i) => (
          <Button
            key={d.id}
            type="button"
            variant="ghost"
            onClick={() => setActual(i)}
            className={`block h-auto w-full rounded-lg p-1.5 text-left whitespace-normal ${
              i === indice ? 'bg-[#EAF0FF] ring-2 ring-[#002868]' : ''
            }`}
          >
            <DiapositivaPreview diapositiva={d} fuente={fuente} miniatura />
            <span className="mt-1 block truncate text-[11px] font-normal text-[#5A6070]">
              {i + 1}. {d.nombre}
            </span>
          </Button>
        ))}
      </aside>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[#002868]">
            {indice + 1} / {diapositivas.length} · {seleccionada.nombre}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={indice === 0}
              onClick={() => setActual(indice - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={indice === diapositivas.length - 1}
              onClick={() => setActual(indice + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <DiapositivaPreview diapositiva={seleccionada} fuente={fuente} />
        <p className="text-xs text-[#9AA0AC]">
          Vista aproximada: los gráficos del PPTX son nativos y editables; las fuentes pueden variar según el programa.
        </p>
      </section>
    </div>
  )
}
