'use client'

import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { parseInputMonto, formatInputMonto } from '@/lib/formatters'

interface MontoInputProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value: string
  onChange: (rawValue: string) => void
}

export function MontoInput({ value, onChange, ...props }: MontoInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={formatInputMonto(value)}
      onChange={e => onChange(parseInputMonto(e.target.value))}
    />
  )
}
