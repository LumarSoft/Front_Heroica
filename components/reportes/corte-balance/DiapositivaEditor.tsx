import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { TablaReporteEditor } from '@/components/reportes/corte-balance/TablaReporteEditor'
import { corteCardClasses, corteIconButtonClasses } from '@/lib/dialog-styles'
import { nuevoId } from '@/lib/corte-balance/borrador-por-defecto'
import { quitarEn, reemplazarEn } from '@/lib/corte-balance/edicion'
import type { DiapositivaReporte } from '@/lib/types'

interface DiapositivaEditorProps {
  diapositiva: DiapositivaReporte
  numero: number
  esPrimera: boolean
  esUltima: boolean
  importes: Map<string, number>
  moneda: 'ARS' | 'USD'
  onChange: (diapositiva: DiapositivaReporte) => void
  onMove: (delta: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
}

export function DiapositivaEditor({
  diapositiva,
  numero,
  esPrimera,
  esUltima,
  importes,
  moneda,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: DiapositivaEditorProps) {
  const d = diapositiva
  return (
    <section className={`${corteCardClasses} ${d.incluir ? '' : 'opacity-60'}`}>
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#002868] text-[11px] font-bold text-white">
          {numero}
        </span>
        <Input
          value={d.subtitulo}
          onChange={e => onChange({ ...d, subtitulo: e.target.value })}
          placeholder="Subtítulo de la diapositiva"
          className="h-9 max-w-sm text-sm font-semibold"
          aria-label="Subtítulo de la diapositiva"
        />
        <Label className="ml-auto flex items-center gap-2 text-xs text-[#5A6070]">
          <Switch checked={d.incluir} onCheckedChange={incluir => onChange({ ...d, incluir })} />
          Incluir
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={corteIconButtonClasses}
          disabled={esPrimera}
          onClick={() => onMove(-1)}
          title="Subir"
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
          title="Bajar"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={corteIconButtonClasses}
          onClick={onDuplicate}
          title="Duplicar"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={corteIconButtonClasses}
          onClick={onRemove}
          title="Quitar diapositiva"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      <Textarea
        value={d.texto}
        onChange={e => onChange({ ...d, texto: e.target.value })}
        placeholder="Texto libre de la diapositiva (opcional). Si no tiene tablas, ocupa toda la diapositiva."
        className="mb-3 min-h-[64px] text-sm"
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {d.tablas.map((t, i) => (
          <TablaReporteEditor
            key={t.id}
            tabla={t}
            importes={importes}
            moneda={moneda}
            onChange={tabla => onChange({ ...d, tablas: reemplazarEn(d.tablas, i, tabla) })}
            onRemove={() => onChange({ ...d, tablas: quitarEn(d.tablas, i) })}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() =>
          onChange({
            ...d,
            tablas: [
              ...d.tablas,
              {
                id: nuevoId('tabla'),
                titulo: '',
                filas: [{ id: nuevoId('fila'), etiqueta: '', formato: 'moneda', valor: '' }],
              },
            ],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Agregar tabla
      </Button>
    </section>
  )
}
