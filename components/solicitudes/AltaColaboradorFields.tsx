'use client'

import type { ReactNode } from 'react'
import { BriefcaseBusiness, Building2, FileStack, Landmark, ShieldCheck, User } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Puesto } from '@/lib/types'
import { CbuInput } from '@/components/ui/cbu-input'
import { CBU_DIGITOS } from '@/lib/schemas'
import { handleDniChange, handleCuitChange } from '@/lib/validators'
import type { SolicitudFormState } from './solicitudFormUtils'
import { SolicitudArchivoAdjunto } from './SolicitudArchivoAdjunto'

const ACCEPT_PDF = 'application/pdf,.pdf'
const ACCEPT_IMG_PDF = 'application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp'

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

interface AltaColaboradorFieldsProps {
  form: SolicitudFormState
  puestos: Puesto[]
  sucursalNombre: string
  onChange: (patch: Partial<SolicitudFormState>) => void
}

function validarFecha(valor: string, max: string): string | null {
  if (!valor) return null
  const año = new Date(valor).getFullYear()
  if (año < 1900) return 'El año ingresado no es válido.'
  if (valor > max) return 'La fecha no puede ser futura.'
  return null
}

export function AltaColaboradorFields({ form, puestos, sucursalNombre, onChange }: AltaColaboradorFieldsProps) {
  const today = new Date().toISOString().split('T')[0]

  const errorFechaNacimiento = validarFecha(form.alta_fecha_nacimiento, today)
  const errorFechaAltaTemprana = validarFecha(form.alta_fecha_alta_temprana, today)
  const errorFechaInicioCobro = validarFecha(form.alta_fecha_inicio_cobro, today)
  const errorFechaIncorporacion = validarFecha(form.alta_fecha_incorporacion, today)

  return (
    <div className="space-y-4">
      <SectionCard
        title="Datos personales"
        icon={<User className="w-4 h-4" />}
        subtitle="Tal como figura en la ficha RRHH 001"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Nombres y apellidos *</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0] bg-white"
              placeholder="Ej.: Pablo Adrián Salatino"
              value={form.alta_nombre}
              onChange={e => onChange({ alta_nombre: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">DNI *</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0]"
              value={form.alta_dni}
              placeholder="12345678"
              maxLength={8}
              onChange={e => {
                const digits = handleDniChange(e.target.value)
                if (digits !== null) onChange({ alta_dni: digits })
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">CUIL o CUIT *</Label>
            <Input
              placeholder="20-12345678-9"
              className="h-10 rounded-lg border-[#E0E0E0]"
              value={form.alta_cuil}
              maxLength={13}
              onChange={e => {
                const formatted = handleCuitChange(e.target.value)
                if (formatted !== null) onChange({ alta_cuil: formatted })
              }}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Dirección real *</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Calle, número, localidad — provincia"
              value={form.alta_domicilio}
              onChange={e => onChange({ alta_domicilio: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Domicilio según DNI *</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Como figura en el documento"
              value={form.alta_direccion_dni}
              onChange={e => onChange({ alta_direccion_dni: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Fecha de nacimiento *</Label>
            <Input
              type="date"
              max={today}
              className={`h-10 rounded-lg ${errorFechaNacimiento ? 'border-rose-400 focus-visible:ring-rose-300' : 'border-[#E0E0E0]'}`}
              value={form.alta_fecha_nacimiento}
              onChange={e => onChange({ alta_fecha_nacimiento: e.target.value })}
            />
            {errorFechaNacimiento && <p className="text-xs text-rose-500">{errorFechaNacimiento}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Teléfono *</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Ej.: 351 6123456"
              value={form.alta_telefono}
              onChange={e => onChange({ alta_telefono: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Correo electrónico *</Label>
            <Input
              type="email"
              className="h-10 rounded-lg border-[#E0E0E0]"
              value={form.alta_email}
              onChange={e => onChange({ alta_email: e.target.value })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Datos bancarios"
        icon={<Landmark className="w-4 h-4" />}
        subtitle={`Completar solo si el colaborador posee cuenta (CBU o CVU de ${CBU_DIGITOS} dígitos)`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Cuenta bancaria / entidad</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Ej.: Banco Galicia"
              value={form.alta_banco}
              onChange={e => onChange({ alta_banco: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">CBU o CVU</Label>
            <CbuInput
              className="h-10 rounded-lg border-[#E0E0E0]"
              value={form.alta_cbu}
              onChange={cbu => onChange({ alta_cbu: cbu })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Datos laborales"
        subtitle="Coinciden con lo acordado con el colaborador"
        icon={<BriefcaseBusiness className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Condición laboral *</Label>
            <Select
              value={form.alta_condicion_laboral}
              onValueChange={value =>
                onChange({
                  alta_condicion_laboral: value as '1' | '2',
                  ...(value !== '1' ? { alta_fecha_alta_temprana: '' } : {}),
                })
              }
            >
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                <SelectValue placeholder="Seleccione 1 o 2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Condición 1</SelectItem>
                <SelectItem value="2">Condición 2</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-[#8A8F9C] leading-snug">
              Condición contractual interna según política RRHH.
            </p>
          </div>
          {form.alta_condicion_laboral === '1' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#5A6070]">Fecha de alta temprana</Label>
              <Input
                type="date"
                max={today}
                className={`h-10 rounded-lg ${errorFechaAltaTemprana ? 'border-rose-400 focus-visible:ring-rose-300' : 'border-[#E0E0E0]'}`}
                value={form.alta_fecha_alta_temprana}
                onChange={e => onChange({ alta_fecha_alta_temprana: e.target.value })}
              />
              {errorFechaAltaTemprana && <p className="text-xs text-rose-500">{errorFechaAltaTemprana}</p>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Puesto de trabajo *</Label>
            <Select value={form.alta_puesto_id} onValueChange={value => onChange({ alta_puesto_id: value })}>
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm">
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Sucursal</Label>
            <div className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] bg-[#F0F4FA] px-3 h-10 text-sm text-[#1A1A1A]">
              <Building2 className="w-4 h-4 shrink-0 text-[#002868]" />
              <span className="truncate">{sucursalNombre || '—'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Jornada semanal (días) *</Label>
            <Input
              type="number"
              min={1}
              max={7}
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Ej.: 6"
              value={form.alta_jornada_dias_semanales}
              onChange={e => onChange({ alta_jornada_dias_semanales: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Jornada diaria (horas) *</Label>
            <Input
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Ej.: 7 a 8 horas"
              value={form.alta_jornada_horas_diarias}
              onChange={e => onChange({ alta_jornada_horas_diarias: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Propuesta económica ($) *</Label>
            <Input
              type="number"
              min={1}
              step={1000}
              className="h-10 rounded-lg border-[#E0E0E0]"
              placeholder="Ej.: 610000"
              value={form.alta_propuesta_economica}
              onChange={e => onChange({ alta_propuesta_economica: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Fecha de inicio de cobro en oficina *</Label>
            <Input
              type="date"
              max={today}
              className={`h-10 rounded-lg ${errorFechaInicioCobro ? 'border-rose-400 focus-visible:ring-rose-300' : 'border-[#E0E0E0]'}`}
              value={form.alta_fecha_inicio_cobro}
              onChange={e => onChange({ alta_fecha_inicio_cobro: e.target.value })}
            />
            {errorFechaInicioCobro && <p className="text-xs text-rose-500">{errorFechaInicioCobro}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Fecha de inicio relación laboral *</Label>
            <Input
              type="date"
              max={today}
              className={`h-10 rounded-lg ${errorFechaIncorporacion ? 'border-rose-400 focus-visible:ring-rose-300' : 'border-[#E0E0E0]'}`}
              value={form.alta_fecha_incorporacion}
              onChange={e => onChange({ alta_fecha_incorporacion: e.target.value })}
            />
            {errorFechaIncorporacion && <p className="text-xs text-rose-500">{errorFechaIncorporacion}</p>}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Beneficios otorgados *</Label>
            <Textarea
              className="min-h-[72px] rounded-lg border-[#E0E0E0] resize-none"
              placeholder="Ej.: Desayuno o merienda"
              value={form.alta_beneficios}
              onChange={e => onChange({ alta_beneficios: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold text-[#5A6070]">Otras observaciones</Label>
            <Textarea
              className="min-h-[64px] rounded-lg border-[#E0E0E0] resize-none"
              placeholder="Opcional"
              value={form.alta_otras_observaciones}
              onChange={e => onChange({ alta_otras_observaciones: e.target.value })}
            />
          </div>
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[#444] cursor-pointer select-none">
            <Checkbox
              checked={form.alta_periodo_prueba}
              onCheckedChange={checked => onChange({ alta_periodo_prueba: checked === true })}
            />
            Ingresa con período de prueba
          </label>
          {form.alta_periodo_prueba && (
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-[#5A6070]">Duración (días)</Label>
              <Input
                type="number"
                min={1}
                className="h-10 rounded-lg border-[#E0E0E0]"
                value={form.alta_periodo_prueba_dias}
                onChange={e => onChange({ alta_periodo_prueba_dias: e.target.value })}
              />
            </div>
          )}
          <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[#444] cursor-pointer select-none">
            <Checkbox
              checked={form.alta_carnet}
              onCheckedChange={checked => {
                const on = checked === true
                onChange(
                  on
                    ? { alta_carnet: true }
                    : {
                        alta_carnet: false,
                        alta_carnet_archivo_url: '',
                        alta_carnet_archivo_nombre: '',
                        alta_carnet_vencimiento: '',
                      },
                )
              }}
            />
            Posee carnet de manipulación de alimentos
          </label>
          {form.alta_carnet && (
            <div className="sm:col-span-2 rounded-lg border border-[#E8EDF4] bg-[#FAFBFC] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SolicitudArchivoAdjunto
                label="Carnet — archivo adjunto *"
                uploadHint="PDF o imagen"
                accept={ACCEPT_IMG_PDF}
                url={form.alta_carnet_archivo_url}
                nombre={form.alta_carnet_archivo_nombre}
                onUpload={(url, nombre) =>
                  onChange({ alta_carnet_archivo_url: url, alta_carnet_archivo_nombre: nombre })
                }
                onRemove={() => onChange({ alta_carnet_archivo_url: '', alta_carnet_archivo_nombre: '' })}
              />
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#5A6070]">Vencimiento del carnet *</Label>
                <Input
                  type="date"
                  className="h-10 rounded-lg border-[#E0E0E0] bg-white"
                  value={form.alta_carnet_vencimiento}
                  onChange={e => onChange({ alta_carnet_vencimiento: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Documentación adjunta"
        icon={<FileStack className="w-4 h-4" />}
        subtitle="Subir PDF escaneados según checklist; la foto también puede ser imagen JPG o PNG"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SolicitudArchivoAdjunto
            label="DNI (ambos lados)"
            uploadHint="Archivo PDF"
            accept={ACCEPT_PDF}
            url={form.alta_doc_dni_url}
            nombre={form.alta_doc_dni_nombre}
            onUpload={(url, nombre) => onChange({ alta_doc_dni_url: url, alta_doc_dni_nombre: nombre })}
            onRemove={() => onChange({ alta_doc_dni_url: '', alta_doc_dni_nombre: '' })}
          />
          <SolicitudArchivoAdjunto
            label="DDJJ domicilio"
            uploadHint="Archivo PDF"
            accept={ACCEPT_PDF}
            url={form.alta_doc_ddjj_url}
            nombre={form.alta_doc_ddjj_nombre}
            onUpload={(url, nombre) => onChange({ alta_doc_ddjj_url: url, alta_doc_ddjj_nombre: nombre })}
            onRemove={() => onChange({ alta_doc_ddjj_url: '', alta_doc_ddjj_nombre: '' })}
          />
          <SolicitudArchivoAdjunto
            label="Descripción de puesto firmada"
            uploadHint="Archivo PDF"
            accept={ACCEPT_PDF}
            url={form.alta_doc_puesto_url}
            nombre={form.alta_doc_puesto_nombre}
            onUpload={(url, nombre) => onChange({ alta_doc_puesto_url: url, alta_doc_puesto_nombre: nombre })}
            onRemove={() => onChange({ alta_doc_puesto_url: '', alta_doc_puesto_nombre: '' })}
          />
          <SolicitudArchivoAdjunto
            label="Foto del colaborador"
            uploadHint="PDF o imagen JPG / PNG"
            accept={ACCEPT_IMG_PDF}
            url={form.alta_doc_foto_url}
            nombre={form.alta_doc_foto_nombre}
            onUpload={(url, nombre) => onChange({ alta_doc_foto_url: url, alta_doc_foto_nombre: nombre })}
            onRemove={() => onChange({ alta_doc_foto_url: '', alta_doc_foto_nombre: '' })}
          />
          <SolicitudArchivoAdjunto
            label="Normas de convivencia firmadas"
            uploadHint="Archivo PDF"
            accept={ACCEPT_PDF}
            url={form.alta_doc_normas_url}
            nombre={form.alta_doc_normas_nombre}
            onUpload={(url, nombre) => onChange({ alta_doc_normas_url: url, alta_doc_normas_nombre: nombre })}
            onRemove={() => onChange({ alta_doc_normas_url: '', alta_doc_normas_nombre: '' })}
          />
          <SolicitudArchivoAdjunto
            label="Constancia de entrega de uniforme"
            uploadHint="Archivo PDF"
            accept={ACCEPT_PDF}
            url={form.alta_doc_uniforme_url}
            nombre={form.alta_doc_uniforme_nombre}
            onUpload={(url, nombre) => onChange({ alta_doc_uniforme_url: url, alta_doc_uniforme_nombre: nombre })}
            onRemove={() => onChange({ alta_doc_uniforme_url: '', alta_doc_uniforme_nombre: '' })}
          />
        </div>

        <p className="text-[11px] text-[#8A8F9C] flex items-start gap-2 pt-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#002868]" />
          Los datos de esta ficha replican el modelo oficial de alta; la información se guarda junto al legajo cuando la
          solicitud se aprueba.
        </p>
      </SectionCard>
    </div>
  )
}
