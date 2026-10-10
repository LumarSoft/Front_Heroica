import { Combobox, type ComboboxOption } from '@/components/ui/combobox'
import { MultiSelect } from '@/components/ui/multi-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FormulaFila } from '@/lib/types'

interface FormulaFilaEditorProps {
  formula: FormulaFila | undefined
  filas: ComboboxOption[]
  onChange: (formula: FormulaFila | undefined) => void
}

type ClaveFormula =
  | 'ninguna'
  | 'cociente'
  | 'cociente_pct'
  | 'diferencia'
  | 'variacion_pct'
  | 'promedio_diario'
  | 'suma'

const TIPOS: { value: ClaveFormula; label: string }[] = [
  { value: 'ninguna', label: 'Sin fórmula' },
  { value: 'cociente', label: 'A ÷ B' },
  { value: 'cociente_pct', label: 'A ÷ B en %' },
  { value: 'diferencia', label: 'A − B' },
  { value: 'variacion_pct', label: 'Variación % de A contra B' },
  { value: 'promedio_diario', label: 'A ÷ días del mes' },
  { value: 'suma', label: 'Suma de filas' },
]

const esClave = (v: string): v is ClaveFormula => TIPOS.some(t => t.value === v)

function claveDe(f: FormulaFila | undefined): ClaveFormula {
  if (!f) return 'ninguna'
  if (f.tipo === 'cociente') return f.porcentaje ? 'cociente_pct' : 'cociente'
  if (f.tipo === 'variacion') return f.porcentaje ? 'variacion_pct' : 'diferencia'
  return f.tipo
}

/** Operandos actuales como [A, B] para conservarlos al cambiar de tipo. */
function operandos(f: FormulaFila | undefined): [string, string] {
  if (!f) return ['', '']
  if (f.tipo === 'cociente') return [f.a, f.b]
  if (f.tipo === 'variacion') return [f.actual, f.anterior]
  if (f.tipo === 'promedio_diario') return [f.a, '']
  return [f.filas[0] ?? '', f.filas[1] ?? '']
}

function armar(clave: ClaveFormula, a: string, b: string, filas: string[]): FormulaFila | undefined {
  switch (clave) {
    case 'cociente':
    case 'cociente_pct':
      return { tipo: 'cociente', a, b, porcentaje: clave === 'cociente_pct' }
    case 'diferencia':
    case 'variacion_pct':
      return { tipo: 'variacion', actual: a, anterior: b, porcentaje: clave === 'variacion_pct' }
    case 'promedio_diario':
      return { tipo: 'promedio_diario', a }
    case 'suma':
      return { tipo: 'suma', filas }
    default:
      return undefined
  }
}

export function FormulaFilaEditor({ formula, filas, onChange }: FormulaFilaEditorProps) {
  const clave = claveDe(formula)
  const [a, b] = operandos(formula)
  const sumandos = formula?.tipo === 'suma' ? formula.filas : []
  const usaB = clave === 'cociente' || clave === 'cociente_pct' || clave === 'diferencia' || clave === 'variacion_pct'

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#B0B8C8] bg-white p-2 text-xs">
      <Select
        value={clave}
        onValueChange={v => esClave(v) && onChange(armar(v, a, b, v === 'suma' ? [a, b].filter(Boolean) : []))}
      >
        <SelectTrigger className="h-8 w-[200px] bg-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIPOS.map(t => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {clave !== 'ninguna' && clave !== 'suma' && (
        <Combobox
          options={filas}
          value={a}
          onChange={v => onChange(armar(clave, v, b, []))}
          placeholder="Fila A…"
          searchPlaceholder="Buscar fila…"
          className="min-w-[200px] flex-1"
          overlay
        />
      )}
      {usaB && (
        <Combobox
          options={filas}
          value={b}
          onChange={v => onChange(armar(clave, a, v, []))}
          placeholder="Fila B…"
          searchPlaceholder="Buscar fila…"
          className="min-w-[200px] flex-1"
          overlay
        />
      )}
      {clave === 'suma' && (
        <MultiSelect
          options={filas}
          selected={sumandos}
          onChange={sel => onChange(armar('suma', '', '', sel))}
          placeholder="Elegí las filas a sumar…"
          className="min-w-[260px] flex-1"
        />
      )}
      <span className="w-full text-[11px] text-[#9AA0AC]">
        La fórmula se usa solo si dejás el valor vacío; si escribís un número, manda lo escrito.
      </span>
    </div>
  )
}
