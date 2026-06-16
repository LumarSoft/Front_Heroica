'use client'

import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { parseInputMonto, formatInputMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface MontoInputProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value: string
  onChange: (rawValue: string) => void
}

export function MontoInput({ value, onChange, className, ...props }: MontoInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none select-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5A6070]">
        $
      </span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        className={cn('pl-7', className)}
        value={formatInputMonto(value)}
        onChange={e => onChange(parseInputMonto(e.target.value))}
      />
    </div>
  )
}
