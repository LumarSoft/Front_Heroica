'use client'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
interface Props {
  id: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  disabled?: boolean
  className?: string
  allowEmpty?: boolean
}
export function MovimientoSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className = '',
  allowEmpty = true,
}: Props) {
  return (
    <Select
      value={value || '__empty__'}
      onValueChange={v => onValueChange(v === '__empty__' ? '' : v)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={`w-full bg-white ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value="__empty__">{placeholder}</SelectItem>}
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
