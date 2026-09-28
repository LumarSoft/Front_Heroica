'use client'

import { Input } from '@/components/ui/input'
import { SolicitudArchivoAdjunto } from './SolicitudArchivoAdjunto'
import type { SolicitudFormState } from './solicitudFormUtils'

interface LicenciaFieldsProps {
  form: SolicitudFormState
  onChange: (patch: Partial<SolicitudFormState>) => void
}

export function LicenciaFields({ form, onChange }: LicenciaFieldsProps) {
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
      <div className="col-span-2">
        <SolicitudArchivoAdjunto
          label="Constancia de licencia (opcional)"
          url={form.licencia_constancia_url}
          nombre={form.licencia_constancia_nombre}
          accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"
          uploadHint="Podés adjuntar una constancia de ART, un certificado u otro comprobante. PDF o imagen, hasta 10 MB."
          onUpload={(url, nombre) => onChange({ licencia_constancia_url: url, licencia_constancia_nombre: nombre })}
          onRemove={() => onChange({ licencia_constancia_url: '', licencia_constancia_nombre: '' })}
        />
      </div>
    </div>
  )
}
