'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Puesto } from '@/lib/types'
import type { SolicitudFormState } from './solicitudFormUtils'

interface SolicitudSpecificFieldsProps {
  form: SolicitudFormState
  puestos: Puesto[]
  onChange: (patch: Partial<SolicitudFormState>) => void
}

export function SolicitudSpecificFields({ form, puestos, onChange }: SolicitudSpecificFieldsProps) {
  if (form.tipo === 'Altas') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input placeholder="Nombre del colaborador" value={form.alta_nombre} onChange={event => onChange({ alta_nombre: event.target.value })} />
        <Input placeholder="DNI" value={form.alta_dni} onChange={event => onChange({ alta_dni: event.target.value })} />
        <Select value={form.alta_puesto_id} onValueChange={value => onChange({ alta_puesto_id: value })}>
          <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
            <SelectValue placeholder="Seleccione un puesto" />
          </SelectTrigger>
          <SelectContent>
            {puestos.map(puesto => (
              <SelectItem key={puesto.id} value={puesto.id.toString()}>
                {puesto.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={form.alta_fecha_incorporacion} onChange={event => onChange({ alta_fecha_incorporacion: event.target.value })} />
        <label className="col-span-2 flex items-center gap-2 text-sm text-[#444]">
          <Checkbox checked={form.alta_carnet} onCheckedChange={checked => onChange({ alta_carnet: checked === true })} />
          Posee carnet de manipulación de alimentos
        </label>
      </div>
    )
  }

  if (form.tipo === 'Bajas') {
    return (
      <div className="rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4 space-y-4">
        <Input placeholder="Motivo de la baja" value={form.baja_motivo} onChange={event => onChange({ baja_motivo: event.target.value })} />
        <Input type="date" value={form.baja_fecha} onChange={event => onChange({ baja_fecha: event.target.value })} />
      </div>
    )
  }

  if (form.tipo === 'Vacaciones') {
    return (
      <div className="grid grid-cols-3 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input type="date" value={form.vacaciones_desde} onChange={event => onChange({ vacaciones_desde: event.target.value })} />
        <Input type="date" value={form.vacaciones_hasta} onChange={event => onChange({ vacaciones_hasta: event.target.value })} />
        <Input type="number" placeholder="Cantidad de días" value={form.vacaciones_dias} onChange={event => onChange({ vacaciones_dias: event.target.value })} />
      </div>
    )
  }

  if (form.tipo === 'Licencias') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input placeholder="Tipo de licencia" value={form.licencia_tipo} onChange={event => onChange({ licencia_tipo: event.target.value })} />
        <Input placeholder="Motivo" value={form.licencia_motivo} onChange={event => onChange({ licencia_motivo: event.target.value })} />
        <Input type="date" value={form.licencia_desde} onChange={event => onChange({ licencia_desde: event.target.value })} />
        <Input type="date" value={form.licencia_hasta} onChange={event => onChange({ licencia_hasta: event.target.value })} />
      </div>
    )
  }

  if (form.tipo === 'Novedades de sueldo') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input type="number" placeholder="Sueldo actual" value={form.sueldo_actual} onChange={event => onChange({ sueldo_actual: event.target.value })} />
        <Input type="number" placeholder="Sueldo nuevo" value={form.sueldo_nuevo} onChange={event => onChange({ sueldo_nuevo: event.target.value })} />
        <Input type="date" value={form.sueldo_vigencia} onChange={event => onChange({ sueldo_vigencia: event.target.value })} />
        <Input placeholder="Motivo" value={form.sueldo_motivo} onChange={event => onChange({ sueldo_motivo: event.target.value })} />
      </div>
    )
  }

  if (form.tipo === 'Apercibimientos') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input type="date" value={form.apercibimiento_fecha} onChange={event => onChange({ apercibimiento_fecha: event.target.value })} />
        <Select value={form.apercibimiento_severidad} onValueChange={value => onChange({ apercibimiento_severidad: value as SolicitudFormState['apercibimiento_severidad'] })}>
          <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Leve">Leve</SelectItem>
            <SelectItem value="Moderada">Moderada</SelectItem>
            <SelectItem value="Grave">Grave</SelectItem>
          </SelectContent>
        </Select>
        <Input className="col-span-2" placeholder="Motivo" value={form.apercibimiento_motivo} onChange={event => onChange({ apercibimiento_motivo: event.target.value })} />
      </div>
    )
  }

  if (form.tipo === 'Descuentos') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input type="date" value={form.descuento_fecha} onChange={event => onChange({ descuento_fecha: event.target.value })} />
        <Input type="number" placeholder="Monto ($)" min={0} value={form.descuento_monto} onChange={event => onChange({ descuento_monto: event.target.value })} />
        <Input className="col-span-2" placeholder="Motivo del descuento" value={form.descuento_motivo} onChange={event => onChange({ descuento_motivo: event.target.value })} />
      </div>
    )
  }

  if (form.tipo === 'Horas extras') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input type="date" value={form.horas_extras_fecha} onChange={event => onChange({ horas_extras_fecha: event.target.value })} />
        <Input type="number" placeholder="Cantidad de horas" min={0} step={0.5} value={form.horas_extras_cantidad} onChange={event => onChange({ horas_extras_cantidad: event.target.value })} />
        <Input type="number" placeholder="Valor por hora (opcional)" min={0} value={form.horas_extras_valor_hora} onChange={event => onChange({ horas_extras_valor_hora: event.target.value })} />
        <Input placeholder="Descripción (opcional)" value={form.horas_extras_descripcion} onChange={event => onChange({ horas_extras_descripcion: event.target.value })} />
      </div>
    )
  }

  return null
}
