'use client'

import { Input } from '@/components/ui/input'
import { SolicitudArchivoAdjunto } from './SolicitudArchivoAdjunto'
import type { SolicitudFormState } from './solicitudFormUtils'

interface SuspensionFieldsProps {
  form: SolicitudFormState
  onChange: (patch: Partial<SolicitudFormState>) => void
}

const ACCEPT_PDF = 'application/pdf,.pdf'

export function SuspensionFields({ form, onChange }: SuspensionFieldsProps) {
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
