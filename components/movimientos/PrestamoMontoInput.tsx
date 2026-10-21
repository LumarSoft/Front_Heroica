'use client'
import { Input } from '@/components/ui/input'
import { inputClasses } from '@/lib/dialog-styles'
import { parseInputMonto, formatInputMonto } from '@/lib/formatters'

interface Props {
  id: string
  value: string
  moneda: 'ARS' | 'USD'
  onChange: (value: string) => void
  disabled?: boolean
}

/** Monto con símbolo de moneda, mismo formato que el resto de los formularios de caja */
export function PrestamoMontoInput({ id, value, moneda, onChange, disabled }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
        {moneda === 'USD' ? 'US$' : '$'}
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={formatInputMonto(value)}
        onChange={e => onChange(parseInputMonto(e.target.value))}
        disabled={disabled}
        className={`${inputClasses} ${moneda === 'USD' ? 'pl-12' : 'pl-8'}`}
      />
    </div>
  )
}
