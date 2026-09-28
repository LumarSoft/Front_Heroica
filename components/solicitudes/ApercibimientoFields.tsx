'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SolicitudArchivoAdjunto } from './SolicitudArchivoAdjunto'
import type { SolicitudFormState } from './solicitudFormUtils'

interface ApercibimientoFieldsProps {
  form: SolicitudFormState
  onChange: (patch: Partial<SolicitudFormState>) => void
}

const ACCEPT_PDF = 'application/pdf,.pdf'

export function ApercibimientoFields({ form, onChange }: ApercibimientoFieldsProps) {
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
