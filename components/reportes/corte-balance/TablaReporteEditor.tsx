import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComboboxOption } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilaReporteEditor } from '@/components/reportes/corte-balance/FilaReporteEditor'
import { corteIconButtonClasses, corteSubCardClasses } from '@/lib/dialog-styles'
import { nuevoId } from '@/lib/corte-balance/borrador-por-defecto'
import { quitarEn, reemplazarEn } from '@/lib/corte-balance/edicion'
import type { ContextoValores, TablaReporte, TipoGraficoTabla } from '@/lib/types'

interface TablaReporteEditorProps {
  tabla: TablaReporte
  contexto: ContextoValores
  filasDisponibles: ComboboxOption[]
  moneda: 'ARS' | 'USD'
  onChange: (tabla: TablaReporte) => void
  onRemove: () => void
}

const GRAFICOS: { value: TipoGraficoTabla; label: string }[] = [
  { value: 'ninguno', label: 'Sin gráfico' },
  { value: 'torta', label: 'Torta' },
  { value: 'barras', label: 'Barras' },
  { value: 'lineas', label: 'Líneas' },
]

const esGrafico = (v: string): v is TipoGraficoTabla => GRAFICOS.some(g => g.value === v)

export function TablaReporteEditor({
  tabla,
  contexto,
  filasDisponibles,
  moneda,
  onChange,
  onRemove,
}: TablaReporteEditorProps) {
  const formatoPorDefecto = tabla.filas[tabla.filas.length - 1]?.formato ?? 'moneda'

  return (
    <div className={corteSubCardClasses}>
      <div className="mb-2 flex items-center gap-2">
        <Input
          value={tabla.titulo}
          onChange={e => onChange({ ...tabla, titulo: e.target.value })}
          placeholder="Título de la tabla (opcional)"
          className="h-8 bg-white text-sm font-semibold text-[#002868]"
          aria-label="Título de la tabla"
        />
        <Select
          value={tabla.grafico ?? 'ninguno'}
          onValueChange={v => esGrafico(v) && onChange({ ...tabla, grafico: v })}
        >
          <SelectTrigger className="h-8 w-[130px] bg-white text-xs" title="Gráfico en la presentación">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRAFICOS.map(g => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={corteIconButtonClasses}
          onClick={onRemove}
          title="Quitar tabla"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1.5">
        {tabla.filas.map((fila, i) => (
          <FilaReporteEditor
            key={fila.id}
            fila={fila}
            contexto={contexto}
            filasDisponibles={filasDisponibles}
            moneda={moneda}
            onChange={f => onChange({ ...tabla, filas: reemplazarEn(tabla.filas, i, f) })}
            onRemove={() => onChange({ ...tabla, filas: quitarEn(tabla.filas, i) })}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 text-[#002868]"
        onClick={() =>
          onChange({
            ...tabla,
            filas: [...tabla.filas, { id: nuevoId('fila'), etiqueta: '', formato: formatoPorDefecto, valor: '' }],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" /> Agregar fila
      </Button>
    </div>
  )
}
