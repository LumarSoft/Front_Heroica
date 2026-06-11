'use client'

import { Input } from '@/components/ui/input'
import { MontoInput } from '@/components/ui/monto-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Area, Personal, Puesto, RhIncentivoPremio, Sucursal } from '@/lib/types'
import type { SolicitudFormState } from './solicitudFormUtils'
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
}: SolicitudSpecificFieldsProps) {
  if (form.tipo === 'Altas') {
    return <AltaColaboradorFields form={form} puestos={puestos} sucursalNombre={sucursalNombre} onChange={onChange} />
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

  if (form.tipo === 'Vacaciones') {
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

  if (form.tipo === 'Licencias') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          placeholder="Tipo de licencia"
          value={form.licencia_tipo}
          onChange={event => onChange({ licencia_tipo: event.target.value })}
        />
        <Input
          placeholder="Motivo"
          value={form.licencia_motivo}
          onChange={event => onChange({ licencia_motivo: event.target.value })}
        />
        <Input
          type="date"
          value={form.licencia_desde}
          onChange={event => onChange({ licencia_desde: event.target.value })}
        />
        <Input
          type="date"
          value={form.licencia_hasta}
          onChange={event => onChange({ licencia_hasta: event.target.value })}
        />
      </div>
    )
  }

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

  if (form.tipo === 'Apercibimientos') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          type="date"
          value={form.apercibimiento_fecha}
          onChange={event => onChange({ apercibimiento_fecha: event.target.value })}
        />
        <Select
          value={form.apercibimiento_severidad}
          onValueChange={value =>
            onChange({ apercibimiento_severidad: value as SolicitudFormState['apercibimiento_severidad'] })
          }
        >
          <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Leve">Leve</SelectItem>
            <SelectItem value="Moderada">Moderada</SelectItem>
            <SelectItem value="Grave">Grave</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="col-span-2"
          placeholder="Motivo"
          value={form.apercibimiento_motivo}
          onChange={event => onChange({ apercibimiento_motivo: event.target.value })}
        />
        <div className="col-span-2">
          <SolicitudArchivoAdjunto
            label="Archivo adjunto"
            url={form.apercibimiento_archivo_url}
            nombre={form.apercibimiento_archivo_nombre}
            accept={ACCEPT_PDF}
            uploadHint="Opcional. Subir PDF si corresponde."
            onUpload={(url, nombre) =>
              onChange({ apercibimiento_archivo_url: url, apercibimiento_archivo_nombre: nombre })
            }
            onRemove={() => onChange({ apercibimiento_archivo_url: '', apercibimiento_archivo_nombre: '' })}
          />
        </div>
      </div>
    )
  }

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

  if (form.tipo === 'Suspensiones') {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <Input
          type="date"
          value={form.suspension_fecha_desde}
          onChange={event => onChange({ suspension_fecha_desde: event.target.value })}
        />
        <Input
          type="date"
          value={form.suspension_fecha_hasta}
          onChange={event => onChange({ suspension_fecha_hasta: event.target.value })}
        />
        <Input
          className="col-span-2"
          placeholder="Motivo de la suspensión"
          value={form.suspension_motivo}
          onChange={event => onChange({ suspension_motivo: event.target.value })}
        />
        <div className="col-span-2">
          <SolicitudArchivoAdjunto
            label="Archivo adjunto"
            url={form.suspension_archivo_url}
            nombre={form.suspension_archivo_nombre}
            accept={ACCEPT_PDF}
            uploadHint="Opcional. Subir PDF si corresponde."
            onUpload={(url, nombre) => onChange({ suspension_archivo_url: url, suspension_archivo_nombre: nombre })}
            onRemove={() => onChange({ suspension_archivo_url: '', suspension_archivo_nombre: '' })}
          />
        </div>
      </div>
    )
  }

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
    return (
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6070] mb-1">Nuevo puesto</p>
          <Select
            value={form.cambio_nuevo_puesto_id || 'none'}
            onValueChange={value => onChange({ cambio_nuevo_puesto_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
              <SelectValue placeholder="Sin cambio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin cambio</SelectItem>
              {puestos.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                  <span className="text-[#9AA0AC] ml-1">· {p.area_nombre}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A6070] mb-1">Fecha efectiva *</p>
          <Input
            type="date"
            value={form.cambio_fecha_efectiva}
            onChange={event => onChange({ cambio_fecha_efectiva: event.target.value })}
          />
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
