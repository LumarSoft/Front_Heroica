'use client'

import { Input } from '@/components/ui/input'
import { CBU_DIGITOS } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface CbuInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  /** Clases adicionales para el <Input> — usar para ajustar tamaño, ej: "h-8 text-sm" o "h-10 rounded-lg" */
  className?: string
}

export function CbuInput({ id, value, onChange, className }: CbuInputProps) {
  const borderClass =
    value.length > 0 && value.length !== CBU_DIGITOS
      ? 'border-red-400 focus-visible:ring-red-400'
      : value.length === CBU_DIGITOS
        ? 'border-green-400 focus-visible:ring-green-400'
        : ''

  return (
    <div>
      <Input
        id={id}
        className={cn(borderClass, className)}
        placeholder={`${CBU_DIGITOS} dígitos`}
        inputMode="numeric"
        maxLength={CBU_DIGITOS}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, CBU_DIGITOS))}
      />
      <p
        className={cn(
          'text-xs text-right mt-0.5',
          value.length === CBU_DIGITOS ? 'text-green-600' : value.length > 0 ? 'text-red-500' : 'text-gray-400',
        )}
      >
        {value.length}/{CBU_DIGITOS}
      </p>
    </div>
  )
}
