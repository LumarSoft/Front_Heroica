import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DiapositivaEditor } from '@/components/reportes/corte-balance/DiapositivaEditor'
import { corteCardClasses, labelClasses } from '@/lib/dialog-styles'
import { nuevoId } from '@/lib/corte-balance/borrador-por-defecto'
import { mover, quitarEn, reemplazarEn } from '@/lib/corte-balance/edicion'
import type { AnexoManual, DiapositivaReporte } from '@/lib/types'

interface AnexoManualEditorProps {
  anexo: AnexoManual
  ayuda: string
  importes: Map<string, number>
  moneda: 'ARS' | 'USD'
  onChange: (anexo: AnexoManual) => void
}

/** Copia profunda con ids nuevos (para duplicar una diapositiva sin compartir filas). */
function duplicar(d: DiapositivaReporte): DiapositivaReporte {
  return {
    ...d,
    id: nuevoId('dia'),
    subtitulo: `${d.subtitulo} (copia)`,
    tablas: d.tablas.map(t => ({
      ...t,
      id: nuevoId('tabla'),
      filas: t.filas.map(f => ({ ...f, id: nuevoId('fila') })),
    })),
  }
}

export function AnexoManualEditor({ anexo, ayuda, importes, moneda, onChange }: AnexoManualEditorProps) {
  const setDiapositivas = (diapositivas: DiapositivaReporte[]) => onChange({ ...anexo, diapositivas })

  return (
    <div className="space-y-4">
      <div className={`${corteCardClasses} flex flex-wrap items-end gap-4`}>
        <div className="min-w-[240px] flex-1 space-y-1">
          <Label className={labelClasses}>Título del anexo</Label>
          <Input value={anexo.titulo} onChange={e => onChange({ ...anexo, titulo: e.target.value })} />
        </div>
        <Label className="flex items-center gap-2 pb-2 text-sm text-[#5A6070]">
          <Switch checked={anexo.incluir} onCheckedChange={incluir => onChange({ ...anexo, incluir })} />
          Incluir en la presentación
        </Label>
        <p className="w-full text-xs text-[#5A6070]">{ayuda}</p>
      </div>

      {anexo.diapositivas.map((d, i) => (
        <DiapositivaEditor
          key={d.id}
          diapositiva={d}
          numero={i + 1}
          esPrimera={i === 0}
          esUltima={i === anexo.diapositivas.length - 1}
          importes={importes}
          moneda={moneda}
          onChange={dia => setDiapositivas(reemplazarEn(anexo.diapositivas, i, dia))}
          onMove={delta => setDiapositivas(mover(anexo.diapositivas, i, delta))}
          onDuplicate={() =>
            setDiapositivas([...anexo.diapositivas.slice(0, i + 1), duplicar(d), ...anexo.diapositivas.slice(i + 1)])
          }
          onRemove={() => setDiapositivas(quitarEn(anexo.diapositivas, i))}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setDiapositivas([
            ...anexo.diapositivas,
            { id: nuevoId('dia'), subtitulo: 'Nueva diapositiva', texto: '', incluir: true, tablas: [] },
          ])
        }
      >
        <Plus className="h-4 w-4" /> Agregar diapositiva
      </Button>
    </div>
  )
}
