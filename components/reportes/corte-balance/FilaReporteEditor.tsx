'use client'

import { useState } from 'react'
import { Link2, Sigma, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MontoInput } from '@/components/ui/monto-input'
import type { ComboboxOption } from '@/components/ui/combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormulaFilaEditor } from '@/components/reportes/corte-balance/FormulaFilaEditor'
import { corteIconButtonClasses } from '@/lib/dialog-styles'
import { resolverFila } from '@/lib/corte-balance/formulas'
import { formatearValor } from '@/lib/corte-balance/valores'
import type { ContextoValores, FilaReporte, FormatoValorReporte } from '@/lib/types'

interface FilaReporteEditorProps {
  fila: FilaReporte
  contexto: ContextoValores
  /** Filas del anexo que se pueden usar en una fórmula. */
  filasDisponibles: ComboboxOption[]
  moneda: 'ARS' | 'USD'
  onChange: (fila: FilaReporte) => void
  onRemove: () => void
}

const FORMATOS: { value: FormatoValorReporte; label: string }[] = [
  { value: 'moneda', label: '$ Moneda' },
  { value: 'numero', label: 'Número' },
  { value: 'porcentaje', label: '% Porcentaje' },
  { value: 'texto', label: 'Texto' },
]

const esFormato = (v: string): v is FormatoValorReporte => FORMATOS.some(f => f.value === v)

export function FilaReporteEditor({
  fila,
  contexto,
  filasDisponibles,
  moneda,
  onChange,
  onRemove,
}: FilaReporteEditorProps) {
  const [editandoFormula, setEditandoFormula] = useState(false)
  const resuelto = resolverFila(fila, contexto)
  const vinculada = (fila.lineasVinculadas?.length ?? 0) > 0
  const conFormula = Boolean(fila.formula)
  const automatico =
    resuelto.automatico && resuelto.numero !== null
      ? formatearValor(resuelto, fila.formato, moneda, 'cero')
      : vinculada && fila.valor === ''
        ? formatearValor({ ...resuelto, numero: 0 }, fila.formato, moneda, 'cero')
        : ''
  const placeholder = automatico
    ? `Auto: ${automatico}`
    : conFormula
      ? 'Fórmula (faltan datos)'
      : 'Vacío (se completa en Canva)'
  const opcionesFormula = filasDisponibles.filter(f => f.value !== fila.id)

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[minmax(0,1fr)_130px_minmax(0,1fr)_32px_32px] items-center gap-2">
        <Input
          value={fila.etiqueta}
          onChange={e => onChange({ ...fila, etiqueta: e.target.value })}
          placeholder="Etiqueta"
          className="h-8 text-sm font-medium"
          aria-label="Etiqueta de la fila"
        />
        <Select value={fila.formato} onValueChange={v => esFormato(v) && onChange({ ...fila, formato: v })}>
          <SelectTrigger className="h-8 w-full bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATOS.map(f => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          {fila.formato === 'moneda' ? (
            <MontoInput
              value={fila.valor}
              onChange={valor => onChange({ ...fila, valor })}
              placeholder={placeholder}
              className="h-8 text-sm"
              aria-label={`Valor de ${fila.etiqueta}`}
            />
          ) : (
            <Input
              value={fila.valor}
              inputMode={fila.formato === 'texto' ? 'text' : 'decimal'}
              onChange={e => onChange({ ...fila, valor: e.target.value })}
              placeholder={placeholder}
              className="h-8 text-sm"
              aria-label={`Valor de ${fila.etiqueta}`}
            />
          )}
          {vinculada && (
            <Link2
              className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA0AC]"
              aria-label="Vinculada a egresos"
            />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={`${corteIconButtonClasses} ${conFormula ? 'bg-[#EAF0FF] text-[#002868]' : ''}`}
          onClick={() => setEditandoFormula(v => !v)}
          title={conFormula ? 'Editar fórmula' : 'Agregar fórmula'}
          disabled={fila.formato === 'texto'}
        >
          <Sigma className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={corteIconButtonClasses}
          onClick={onRemove}
          title="Quitar fila"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {editandoFormula && fila.formato !== 'texto' && (
        <FormulaFilaEditor
          formula={fila.formula}
          filas={opcionesFormula}
          onChange={formula => onChange({ ...fila, formula })}
        />
      )}
    </div>
  )
}
