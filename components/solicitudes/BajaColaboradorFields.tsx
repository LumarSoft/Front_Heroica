'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { BriefcaseBusiness, Building2, FileStack, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Personal, Puesto, RhIncentivoPremio } from '@/lib/types'
import type { SolicitudFormState } from './solicitudFormUtils'
import { createEmpleadoVacio } from './solicitudFormUtils'
import { SolicitudArchivoAdjunto } from './SolicitudArchivoAdjunto'
import { EmpleadoCard } from './NovedadSueldoFields'
import { MotivoBajaSelector } from './MotivoBajaSelector'

const ACCEPT_PDF = 'application/pdf,.pdf'

interface SectionCardProps {
  title: string
  subtitle?: string
  icon: ReactNode
  children: ReactNode
}

function SectionCard({ title, subtitle, icon, children }: SectionCardProps) {
  return (
    <section className="rounded-xl border border-[#E0E0E0] overflow-hidden bg-white">
      <div className="flex items-start gap-2.5 px-4 py-3 bg-gradient-to-r from-[#F5F7FA] to-[#FAFBFC] border-b border-[#E8EDF4]">
        <span className="mt-0.5 shrink-0 text-[#002868]" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">{title}</h3>
          {subtitle ? <p className="text-[11px] text-[#8A8F9C] mt-1 leading-snug">{subtitle}</p> : null}
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-[#5A6070]">{label}</p>
      <div className="min-h-[2.5rem] rounded-lg border border-[#E8EDF4] bg-[#F8FAFC] px-3 py-2 text-sm text-[#1A1A1A]">
        {value}
      </div>
    </div>
  )
}

interface BajaColaboradorFieldsProps {
  form: SolicitudFormState
  sucursalId: number
  sucursalNombre: string
  personal: Personal[]
  puestos: Puesto[]
  incentivos: RhIncentivoPremio[]
  isEditing?: boolean
  onChange: (patch: Partial<SolicitudFormState>) => void
}

export function BajaColaboradorFields({
  form,
  sucursalId,
  sucursalNombre,
  personal,
  puestos,
  incentivos,
  isEditing = false,
  onChange,
}: BajaColaboradorFieldsProps) {
  const prevColaboradorRef = useRef<string | null>(null)

  const colaborador = form.personal_id !== 'general' ? personal.find(c => String(c.id) === form.personal_id) : undefined

  useEffect(() => {
    function seedLiquidacion(pid: string) {
      if (pid === 'general') {
        onChange({ baja_empleado_liquidacion: null })
        return
      }
      const id = Number(pid)
      const p = personal.find(c => c.id === id)
      if (!p) return
      onChange({ baja_empleado_liquidacion: createEmpleadoVacio(id, p.nombre, p.puesto_id) })
    }

    if (prevColaboradorRef.current === null) {
      prevColaboradorRef.current = form.personal_id
      if (form.personal_id !== 'general' && form.baja_empleado_liquidacion === null) {
        seedLiquidacion(form.personal_id)
      }
      return
    }
    if (prevColaboradorRef.current === form.personal_id) return
    prevColaboradorRef.current = form.personal_id
    seedLiquidacion(form.personal_id)
  }, [form.personal_id, personal, onChange])

  const empLiq = form.baja_empleado_liquidacion

  return (
    <div className="space-y-4">
      <SectionCard
        title="Datos básicos"
        icon={<Building2 className="w-4 h-4" />}
        subtitle="Colaborador y sucursal según RRHH 002"
      >
        <ReadonlyField label="Nombre y apellido" value={colaborador?.nombre ?? 'Seleccione un colaborador arriba'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadonlyField label="Sucursal" value={sucursalNombre || '—'} />
          <ReadonlyField label="Puesto de trabajo" value={colaborador?.puesto_nombre ?? '—'} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Fecha de baja *</Label>
            <Input
              type="date"
              className="h-10 rounded-lg border-[#E0E0E0] bg-white"
              value={form.baja_fecha}
              onChange={e => onChange({ baja_fecha: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#5A6070]">Motivo de baja *</Label>
              <span className="text-[10px] text-[#8A8F9C]">
                Crea, renombra o eliminá motivos directamente desde la lista.
              </span>
            </div>
            <MotivoBajaSelector
              sucursalId={sucursalId}
              value={form.baja_motivo_id}
              onChange={v => onChange({ baja_motivo_id: v })}
            />

            <Label className="text-xs font-semibold text-[#5A6070]">Detalle u observaciones (opcional)</Label>
            <Textarea
              className="min-h-[72px] rounded-lg border-[#E0E0E0] bg-white text-sm"
              placeholder="Detalle objetivo complementario si hace falta."
              value={form.baja_motivo_detalle}
              onChange={e => onChange({ baja_motivo_detalle: e.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Datos laborales"
        subtitle="Misma liquidación que en Novedades de sueldo (horas, incentivos, apercibimiento, ausencias, etc.)"
        icon={<BriefcaseBusiness className="w-4 h-4" />}
      >
        {form.personal_id === 'general' ? (
          <p className="text-sm text-[#8A8F9C] text-center py-2">
            Seleccione un colaborador arriba para completar esta sección.
          </p>
        ) : empLiq ? (
          <EmpleadoCard
            emp={empLiq}
            puestos={puestos}
            incentivos={incentivos}
            onUpdate={patch => onChange({ baja_empleado_liquidacion: { ...empLiq, ...patch } })}
          />
        ) : (
          <p className="text-sm text-[#8A8F9C] text-center py-2">Preparando ficha…</p>
        )}
      </SectionCard>

      <SectionCard title="Documentos adjuntos" subtitle="Escaneados en PDF" icon={<FileStack className="w-4 h-4" />}>
        <SolicitudArchivoAdjunto
          label="Carta documento / telegrama"
          url={form.baja_carta_url}
          nombre={form.baja_carta_nombre}
          accept={ACCEPT_PDF}
          uploadHint="Opcional. Subir PDF escaneado si corresponde."
          onUpload={(url, nombre) => onChange({ baja_carta_url: url, baja_carta_nombre: nombre })}
          onRemove={() => onChange({ baja_carta_url: '', baja_carta_nombre: '' })}
        />
      </SectionCard>

      <div className="flex gap-2 rounded-lg border border-dashed border-[#C9D6E8] bg-[#F8FAFC]/80 px-3 py-2 text-[11px] text-[#5A6070]">
        <User className="w-4 h-4 shrink-0 text-[#002868] mt-0.5" aria-hidden />
        <p>
          {isEditing
            ? 'Las observaciones amplían el contenido formal de carta documento y figuran en la solicitud junto con el nombre del solicitante.'
            : 'Las observaciones de la solicitud se completan más abajo; use ese campo para el texto largo tipo acta/comentarios de RRHH.'}
        </p>
      </div>
    </div>
  )
}
