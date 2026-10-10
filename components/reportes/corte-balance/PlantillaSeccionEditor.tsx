import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlantillaLineaEditor } from '@/components/reportes/corte-balance/PlantillaLineaEditor'
import type { OpcionesReglas } from '@/components/reportes/corte-balance/ReglaSelector'
import { corteCardClasses, corteIconButtonClasses } from '@/lib/dialog-styles'
import { mover, nuevaLinea, quitarEn, reemplazarEn } from '@/lib/corte-balance/edicion'
import type { CatalogoEgresosCorte, LineaPlantilla, SeccionPlantilla } from '@/lib/types'

interface PlantillaSeccionEditorProps {
  seccion: SeccionPlantilla
  catalogo: CatalogoEgresosCorte
  opcionesReglas: OpcionesReglas
  esPrimera: boolean
  esUltima: boolean
  onChange: (seccion: SeccionPlantilla) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}

export function PlantillaSeccionEditor({
  seccion,
  catalogo,
  opcionesReglas,
  esPrimera,
  esUltima,
  onChange,
  onMove,
  onRemove,
}: PlantillaSeccionEditorProps) {
  const setLineas = (lineas: LineaPlantilla[]) => onChange({ ...seccion, lineas })

  return (
    <section className={corteCardClasses}>
      <header className="mb-2 flex items-center gap-2">
        <Input
          value={seccion.nombre}
          onChange={e => onChange({ ...seccion, nombre: e.target.value })}
          className="h-9 max-w-sm text-base font-bold text-[#002868]"
          aria-label="Nombre de la sección"
        />
        <div className="ml-auto flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={corteIconButtonClasses}
            disabled={esPrimera}
            onClick={() => onMove(-1)}
            title="Subir sección"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={corteIconButtonClasses}
            disabled={esUltima}
            onClick={() => onMove(1)}
            title="Bajar sección"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={corteIconButtonClasses}
            onClick={onRemove}
            title="Quitar sección"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>
      {seccion.lineas.map((l, i) => (
        <PlantillaLineaEditor
          key={l.id}
          linea={l}
          catalogo={catalogo}
          opcionesReglas={opcionesReglas}
          esPrimera={i === 0}
          esUltima={i === seccion.lineas.length - 1}
          onChange={linea => setLineas(reemplazarEn(seccion.lineas, i, linea))}
          onMove={delta => setLineas(mover(seccion.lineas, i, delta))}
          onRemove={() => setLineas(quitarEn(seccion.lineas, i))}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1 text-[#002868]"
        onClick={() => setLineas([...seccion.lineas, nuevaLinea()])}
      >
        <Plus className="h-3.5 w-3.5" /> Agregar línea
      </Button>
      <Textarea
        value={seccion.detalle}
        onChange={e => onChange({ ...seccion, detalle: e.target.value })}
        placeholder="Detalle por defecto de la sección (se puede cambiar cada mes en la pestaña Egresos)"
        className="mt-2 min-h-[56px] text-sm"
      />
    </section>
  )
}
