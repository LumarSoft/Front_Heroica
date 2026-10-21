'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FiltroCheques } from '@/lib/types'
import { cn } from '@/lib/utils'

const OPCIONES: { value: FiltroCheques; label: string }[] = [
  { value: 'todos', label: 'Cheques: todos' },
  { value: 'pendientes', label: 'Cheques pendientes' },
  { value: 'cargados', label: 'Cheques cargados' },
  { value: 'rechazados', label: 'Cheques rechazados' },
]

const TONO: Record<FiltroCheques, string> = {
  todos: 'bg-amber-50 text-amber-800 border-amber-200',
  pendientes: 'bg-amber-500 text-white border-amber-500',
  cargados: 'bg-emerald-600 text-white border-emerald-600',
  rechazados: 'bg-rose-600 text-white border-rose-600',
}

interface Props {
  value: FiltroCheques
  onChange: (value: FiltroCheques) => void
}

/** Filtro de la caja banco por estado del cheque / eCheq (pendiente, cargado o rechazado) */
export function ChequesFiltroSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={v => onChange(v as FiltroCheques)}>
      <SelectTrigger
        aria-label="Filtrar por estado del cheque"
        className={cn('h-9 w-[180px] flex-shrink-0 rounded-lg text-xs sm:text-sm font-semibold', TONO[value])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPCIONES.map(opcion => (
          <SelectItem key={opcion.value} value={opcion.value}>
            {opcion.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
