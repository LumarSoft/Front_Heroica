'use client'

import { Input } from '@/components/ui/input'
import type { SolicitudFormState } from './solicitudFormUtils'

interface VacacionesFieldsProps {
  form: SolicitudFormState
  onChange: (patch: Partial<SolicitudFormState>) => void
}

export function VacacionesFields({ form, onChange }: VacacionesFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
      <Input
        type="date"
        value={form.vacaciones_desde}
        onChange={event => onChange({ vacaciones_desde: event.target.value })}
      />
      <Input
        type="date"
        value={form.vacaciones_hasta}
        onChange={event => onChange({ vacaciones_hasta: event.target.value })}
      />
      <Input
        type="number"
        placeholder="Cantidad de días"
        value={form.vacaciones_dias}
        onChange={event => onChange({ vacaciones_dias: event.target.value })}
      />
    </div>
  )
}
