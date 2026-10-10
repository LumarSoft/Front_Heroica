'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReglaSelector, type OpcionesReglas } from '@/components/reportes/corte-balance/ReglaSelector'
import { corteChipClasses, corteIconButtonClasses } from '@/lib/dialog-styles'
import { agregarReglaSiNoExiste, etiquetaRegla, quitarEn } from '@/lib/corte-balance/edicion'
import type { CatalogoEgresosCorte, LineaPlantilla } from '@/lib/types'

interface PlantillaLineaEditorProps {
  linea: LineaPlantilla
  catalogo: CatalogoEgresosCorte
  opcionesReglas: OpcionesReglas
  esPrimera: boolean
  esUltima: boolean
  onChange: (linea: LineaPlantilla) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}

export function PlantillaLineaEditor({
  linea,
  catalogo,
  opcionesReglas,
  esPrimera,
  esUltima,
  onChange,
  onMove,
  onRemove,
}: PlantillaLineaEditorProps) {
  const [agregando, setAgregando] = useState(false)

  return (
    <div className="border-t border-[#EEF0F3] py-2 first:border-t-0">
      <div className="flex flex-wrap items-start gap-2">
        <Input
          value={linea.nombre}
          onChange={e => onChange({ ...linea, nombre: e.target.value })}
          className="h-8 w-56 text-sm font-medium"
          aria-label="Nombre de la línea"
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-1">
          {linea.reglas.length === 0 && (
            <span className="text-xs text-[#9AA0AC]">Sin reglas: se completa solo con ajuste manual</span>
          )}
          {linea.reglas.map((r, i) => (
            <span key={`${r.tipo}-${r.id}-${r.medio ?? ''}`} className={corteChipClasses}>
              {etiquetaRegla(r, catalogo)}
              <Button
                type="button"
                variant="ghost"
                className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                onClick={() => onChange({ ...linea, reglas: quitarEn(linea.reglas, i) })}
                aria-label="Quitar regla"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}
          {!agregando && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-[#002868]"
              onClick={() => setAgregando(true)}
            >
              <Plus className="h-3 w-3" /> Regla
            </Button>
          )}
        </div>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={corteIconButtonClasses}
            disabled={esPrimera}
            onClick={() => onMove(-1)}
            title="Subir"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={corteIconButtonClasses}
            disabled={esUltima}
            onClick={() => onMove(1)}
            title="Bajar"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={corteIconButtonClasses}
            onClick={onRemove}
            title="Quitar línea"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {agregando && (
        <div className="mt-2">
          <ReglaSelector
            opciones={opcionesReglas}
            onAdd={regla => onChange({ ...linea, reglas: agregarReglaSiNoExiste(linea.reglas, regla) })}
            onClose={() => setAgregando(false)}
          />
        </div>
      )}
    </div>
  )
}
