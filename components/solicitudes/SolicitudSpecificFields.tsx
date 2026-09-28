'use client'

import { VacacionesFields } from './VacacionesFields'
import { DateDMY } from './DateDMY'
import { Input } from '@/components/ui/input'
import { MontoInput } from '@/components/ui/monto-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import type { Area, Personal, Puesto, RhIncentivoPremio, Sucursal } from '@/lib/types'
import type { SolicitudFormState } from './solicitudFormUtils'
import { ApercibimientoFields } from './ApercibimientoFields'
import { SuspensionFields } from './SuspensionFields'
import { LicenciaFields } from './LicenciaFields'
import { AltaColaboradorFields } from './AltaColaboradorFields'
import { BajaColaboradorFields } from './BajaColaboradorFields'
import { NovedadSueldoFields } from './NovedadSueldoFields'
import { SolicitudArchivoAdjunto } from './SolicitudArchivoAdjunto'

const ACCEPT_PDF = 'application/pdf,.pdf'

interface SolicitudSpecificFieldsProps {
  form: SolicitudFormState
  sucursalId: number
  puestos: Puesto[]
  sucursalNombre?: string
  areas?: Area[]
  incentivos?: RhIncentivoPremio[]
  personal?: Personal[]
  sucursales?: Sucursal[]
  isEditing?: boolean
  onChange: (patch: Partial<SolicitudFormState>) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function SolicitudSpecificFields({
  form,
  sucursalId,
  puestos,
  sucursalNombre = '',
  areas = [],
  incentivos = [],
  personal = [],
  sucursales = [],
  isEditing = false,
  onChange,
  onUploadingChange,
}: SolicitudSpecificFieldsProps) {
  if (form.tipo === 'Altas') {
    return (
      <AltaColaboradorFields
        form={form}
        puestos={puestos}
        sucursalNombre={sucursalNombre}
        onChange={onChange}
        onUploadingChange={onUploadingChange}
      />
    )
  }

  if (form.tipo === 'Bajas') {
    return (
      <BajaColaboradorFields
        form={form}
        sucursalId={sucursalId}
        sucursalNombre={sucursalNombre}
        personal={personal}
        puestos={puestos}
        incentivos={incentivos}
        isEditing={isEditing}
        onChange={onChange}
      />
    )
  }

  if (form.tipo === 'Vacaciones') return <VacacionesFields form={form} onChange={onChange} />

  if (form.tipo === 'Licencias') return <LicenciaFields form={form} onChange={onChange} />

  if (form.tipo === 'Novedades de sueldo') {
    return (
      <NovedadSueldoFields
        form={form}
        areas={areas}
        puestos={puestos}
        incentivos={incentivos}
        personal={personal}
        onChange={onChange}
      />
    )
  }

  if (form.tipo === 'Apercibimientos') return <ApercibimientoFields form={form} onChange={onChange} />

  if (form.tipo === 'Descuentos') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          type="date"
          value={form.descuento_fecha}
          onChange={event => onChange({ descuento_fecha: event.target.value })}
        />
        <MontoInput placeholder="Monto" value={form.descuento_monto} onChange={v => onChange({ descuento_monto: v })} />
        <Input
          className="col-span-2"
          placeholder="Motivo del descuento"
          value={form.descuento_motivo}
          onChange={event => onChange({ descuento_motivo: event.target.value })}
        />
      </div>
    )
  }

  if (form.tipo === 'Horas extras') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          type="date"
          value={form.horas_extras_fecha}
          onChange={event => onChange({ horas_extras_fecha: event.target.value })}
        />
        <Input
          type="number"
          placeholder="Cantidad de horas"
          min={0}
          step={0.5}
          value={form.horas_extras_cantidad}
          onChange={event => onChange({ horas_extras_cantidad: event.target.value })}
        />
        <MontoInput
          placeholder="Valor por hora (opcional)"
          value={form.horas_extras_valor_hora}
          onChange={v => onChange({ horas_extras_valor_hora: v })}
        />
        <Input
          placeholder="Descripción (opcional)"
          value={form.horas_extras_descripcion}
          onChange={event => onChange({ horas_extras_descripcion: event.target.value })}
        />
      </div>
    )
  }

  if (form.tipo === 'Suspensiones') return <SuspensionFields form={form} onChange={onChange} />

  if (form.tipo === 'Capacitaciones') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          className="col-span-2"
          placeholder="Tema de la capacitación"
          value={form.capacitacion_tema}
          onChange={event => onChange({ capacitacion_tema: event.target.value })}
        />
        <Input
          type="date"
          value={form.capacitacion_fecha}
          onChange={event => onChange({ capacitacion_fecha: event.target.value })}
        />
        <Input
          placeholder="Descripción (opcional)"
          value={form.capacitacion_descripcion}
          onChange={event => onChange({ capacitacion_descripcion: event.target.value })}
        />
      </div>
    )
  }

  if (form.tipo === 'Pedido de uniforme') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          placeholder="Talle"
          value={form.uniforme_talle}
          onChange={event => onChange({ uniforme_talle: event.target.value })}
        />
        <Input
          placeholder="Items solicitados (ej.: remera, pantalón)"
          value={form.uniforme_items}
          onChange={event => onChange({ uniforme_items: event.target.value })}
        />
      </div>
    )
  }

  if (form.tipo === 'Adelantos') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <MontoInput placeholder="Monto" value={form.adelanto_monto} onChange={v => onChange({ adelanto_monto: v })} />
        <Input
          type="date"
          value={form.adelanto_fecha}
          onChange={event => onChange({ adelanto_fecha: event.target.value })}
        />
        <Input
          className="col-span-2"
          placeholder="Motivo del adelanto"
          value={form.adelanto_motivo}
          onChange={event => onChange({ adelanto_motivo: event.target.value })}
        />
      </div>
    )
  }

  if (form.tipo === 'Incentivos y premios') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          className="col-span-2"
          placeholder="Descripción del incentivo o premio"
          value={form.incentivo_descripcion}
          onChange={event => onChange({ incentivo_descripcion: event.target.value })}
        />
        <Input
          type="date"
          value={form.incentivo_fecha}
          onChange={event => onChange({ incentivo_fecha: event.target.value })}
        />
        <MontoInput
          placeholder="Monto (opcional)"
          value={form.incentivo_monto}
          onChange={v => onChange({ incentivo_monto: v })}
        />
        <div className="col-span-2">
          <SolicitudArchivoAdjunto
            label="Archivo adjunto"
            url={form.incentivo_archivo_url}
            nombre={form.incentivo_archivo_nombre}
            accept={ACCEPT_PDF}
            uploadHint="Opcional. Subir PDF si corresponde."
            onUpload={(url, nombre) => onChange({ incentivo_archivo_url: url, incentivo_archivo_nombre: nombre })}
            onRemove={() => onChange({ incentivo_archivo_url: '', incentivo_archivo_nombre: '' })}
          />
        </div>
      </div>
    )
  }

  if (form.tipo === 'Cambio de puesto/sucursal') {
    const sucursalesDestino = sucursales.filter(s => s.activo && s.id !== sucursalId)
    const puestosOptions = [
      { value: 'none', label: 'Sin cambio' },
      ...puestos.map(p => ({ value: String(p.id), label: `${p.nombre} · ${p.area_nombre}` })),
    ]
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6070] mb-1">Nuevo puesto</p>
          <Combobox
            options={puestosOptions}
            value={form.cambio_nuevo_puesto_id || 'none'}
            onChange={value => onChange({ cambio_nuevo_puesto_id: value === 'none' ? '' : value })}
            placeholder="Sin cambio"
            searchPlaceholder="Buscar puesto..."
            emptyText="No se encontró el puesto"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6070] mb-1">Nueva sucursal</p>
          <Select
            value={form.cambio_nueva_sucursal_id || 'none'}
            onValueChange={value => onChange({ cambio_nueva_sucursal_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
              <SelectValue placeholder="Sin cambio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cambio</SelectItem>
              {sucursalesDestino.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6070] mb-1">Fecha efectiva *</p>
          <DateDMY value={form.cambio_fecha_efectiva} onChange={v => onChange({ cambio_fecha_efectiva: v })} />
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6070] mb-1">Motivo (opcional)</p>
          <Input
            placeholder="Motivo del cambio"
            value={form.cambio_motivo}
            onChange={event => onChange({ cambio_motivo: event.target.value })}
          />
        </div>
      </div>
    )
  }

  return null
}
