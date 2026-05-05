'use client'

import { useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { toast } from 'sonner'
import type { Area, Personal, Puesto, RhIncentivoPremio } from '@/lib/types'
import { type EmpleadoNovedadData, type SolicitudFormState, createEmpleadoVacio } from './solicitudFormUtils'

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const currentYear = new Date().getFullYear()
const ANIOS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => ({
  value: String(y),
  label: String(y),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function SiNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[true, false].map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
            value === v
              ? 'bg-[#002868] text-white border-[#002868]'
              : 'bg-white text-[#5A6070] border-[#E0E0E0] hover:border-[#002868]'
          }`}
        >
          {v ? 'Sí' : 'No'}
        </button>
      ))}
    </div>
  )
}

interface SubSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string
  badgeColor?: string
}

function SubSection({ title, icon, children, badge, badgeColor = 'bg-rose-100 text-rose-700' }: SubSectionProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-[#E8EDF4] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between w-full px-3 py-2.5 bg-[#F5F7FA] hover:bg-[#EEF3FF] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[#002868]">{icon}</span>
          <span className="text-xs font-semibold text-[#1A1A1A]">{title}</span>
          {badge && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}>{badge}</span>}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#5A6070] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-3 py-3 border-t border-[#E8EDF4] bg-white space-y-3">{children}</div>}
    </div>
  )
}

interface FileFieldProps {
  label: string
  url: string
  nombre: string
  onUpload: (url: string, nombre: string) => void
  onRemove: () => void
}

function FileField({ label, url, nombre, onUpload, onRemove }: FileFieldProps) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.UPLOAD_ARCHIVO, {
        method: 'POST',
        body: fd,
        headers: {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al subir archivo')
      onUpload(data.data.url, data.data.nombre_original)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">{label}</Label>
      {url ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] px-3 py-1.5">
          <FileText className="w-3.5 h-3.5 text-[#002868] shrink-0" />
          <span className="text-xs text-[#1A1A1A] truncate flex-1">{nombre}</span>
          <button type="button" onClick={onRemove} className="text-[#8A8F9C] hover:text-rose-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 w-full rounded-lg border border-dashed border-[#C0C8D8] bg-[#F8F9FA] px-3 py-1.5 text-xs text-[#5A6070] hover:border-[#002868] hover:text-[#002868] transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          {uploading ? 'Subiendo...' : 'Adjuntar PDF'}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}

// ── Tarjeta de empleado ───────────────────────────────────────────────────────

interface EmpleadoCardProps {
  emp: EmpleadoNovedadData
  puestos: Puesto[]
  incentivos: RhIncentivoPremio[]
  onUpdate: (patch: Partial<EmpleadoNovedadData>) => void
  onRemove: () => void
}

function EmpleadoCard({ emp, puestos, incentivos, onUpdate, onRemove }: EmpleadoCardProps) {
  const [open, setOpen] = useState(true)

  function toggleIncentivo(id: number, nombre: string, aplica: boolean) {
    const existing = emp.incentivos.find(i => i.incentivo_id === id)
    onUpdate({
      incentivos: existing
        ? emp.incentivos.map(i => (i.incentivo_id === id ? { ...i, aplica } : i))
        : [...emp.incentivos, { incentivo_id: id, nombre, aplica }],
    })
  }

  const badges = [
    emp.apercibimiento && 'Apercibimiento',
    emp.suspension && 'Suspensión',
    emp.descuento && 'Descuento',
    emp.aus_just_tiene && 'Aus. Just.',
    emp.tardanzas_tiene && 'Tardanza',
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-[#D8E3F8] bg-white overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[#EEF3FF]">
        <button
          type="button"
          onClick={() => setOpen(p => !p)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <User className="w-4 h-4 text-[#002868] shrink-0" />
          <span className="text-sm font-semibold text-[#002868] truncate">{emp.personal_nombre}</span>
          {badges.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {emp.apercibimiento && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Aperc.</span>
              )}
              {emp.suspension && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Susp.</span>
              )}
              {emp.descuento && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">Desc.</span>
              )}
              {emp.aus_just_tiene && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Aus. Just.</span>
              )}
              {emp.tardanzas_tiene && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Tard.</span>
              )}
            </div>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#5A6070] ml-auto shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-[#8A8F9C] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Contenido expandible */}
      {open && (
        <div className="px-3 py-3 space-y-2">
          {/* Cambio de puesto */}
          <SubSection
            title="Cambio de Puesto"
            icon={<User className="w-3.5 h-3.5" />}
            badge={emp.cambio_puesto ? 'Sí' : undefined}
            badgeColor="bg-indigo-100 text-indigo-700"
          >
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Hubo cambio de puesto?
              </Label>
              <SiNoToggle value={emp.cambio_puesto} onChange={v => onUpdate({ cambio_puesto: v })} />
            </div>
            {emp.cambio_puesto && (
              <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-indigo-200">
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Nuevo puesto *</Label>
                  <Select value={emp.nuevo_puesto_id} onValueChange={v => onUpdate({ nuevo_puesto_id: v })}>
                    <SelectTrigger className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                      <SelectValue placeholder="Seleccione un puesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {puestos.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Fecha de alta del cambio</Label>
                  <Input
                    type="date"
                    value={emp.fecha_alta_puesto}
                    onChange={e => onUpdate({ fecha_alta_puesto: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                  />
                </div>
              </div>
            )}
          </SubSection>

          {/* Horas */}
          <SubSection title="Horas Trabajadas" icon={<Clock className="w-3.5 h-3.5" />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A6070] mb-1 block">Horas trabajadas</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="0"
                    value={emp.horas_trabajadas}
                    onChange={e => onUpdate({ horas_trabajadas: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8F9C]">hs</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#5A6070] mb-1 block">Horas en feriados</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="0"
                    value={emp.horas_feriados}
                    onChange={e => onUpdate({ horas_feriados: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8F9C]">hs</span>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Horas extras autorizadas?
              </Label>
              <SiNoToggle
                value={emp.horas_extras_autorizadas}
                onChange={v => onUpdate({ horas_extras_autorizadas: v })}
              />
            </div>
            {emp.horas_extras_autorizadas && (
              <div className="pl-2 border-l-2 border-[#002868]/20">
                <Label className="text-xs text-[#5A6070] mb-1 block">Cantidad de horas extras</Label>
                <div className="relative w-36">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    placeholder="0"
                    value={emp.horas_extras_cantidad}
                    onChange={e => onUpdate({ horas_extras_cantidad: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8F9C]">hs</span>
                </div>
              </div>
            )}
          </SubSection>

          {/* Incentivos */}
          <SubSection title="Incentivos" icon={<Star className="w-3.5 h-3.5" />}>
            {incentivos.length === 0 ? (
              <p className="text-xs text-[#8A8F9C] italic">No hay incentivos registrados.</p>
            ) : (
              <div className="space-y-1.5">
                {incentivos.map(inc => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between rounded-lg border border-[#E0E0E0] px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#1A1A1A]">{inc.nombre}</p>
                      <p className="text-[10px] text-[#8A8F9C]">{inc.tipo}</p>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={emp.incentivos.find(i => i.incentivo_id === inc.id)?.aplica ?? false}
                        onCheckedChange={checked => toggleIncentivo(inc.id, inc.nombre, checked === true)}
                      />
                      <span className="text-xs text-[#5A6070]">Aplica</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </SubSection>

          {/* Apercibimiento */}
          <SubSection
            title="Apercibimiento"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            badge={emp.apercibimiento ? 'Sí' : undefined}
            badgeColor="bg-amber-100 text-amber-700"
          >
            <p className="text-[10px] text-[#8A8F9C] bg-amber-50 border border-amber-100 rounded px-2 py-1">
              Al tercer apercibimiento corresponde una suspensión.
            </p>
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Hubo apercibimiento?
              </Label>
              <SiNoToggle value={emp.apercibimiento} onChange={v => onUpdate({ apercibimiento: v })} />
            </div>
            {emp.apercibimiento && (
              <div className="space-y-2 pl-2 border-l-2 border-amber-200">
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Motivo *</Label>
                  <Input
                    placeholder="Motivo del apercibimiento"
                    value={emp.apercibimiento_motivo}
                    onChange={e => onUpdate({ apercibimiento_motivo: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                  />
                </div>
                <FileField
                  label="Documento adjunto (PDF)"
                  url={emp.apercibimiento_archivo_url}
                  nombre={emp.apercibimiento_archivo_nombre}
                  onUpload={(url, nombre) =>
                    onUpdate({ apercibimiento_archivo_url: url, apercibimiento_archivo_nombre: nombre })
                  }
                  onRemove={() => onUpdate({ apercibimiento_archivo_url: '', apercibimiento_archivo_nombre: '' })}
                />
              </div>
            )}
          </SubSection>

          {/* Suspensión */}
          <SubSection
            title="Suspensión"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            badge={emp.suspension ? 'Sí' : undefined}
            badgeColor="bg-rose-100 text-rose-700"
          >
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Hubo suspensión?
              </Label>
              <SiNoToggle value={emp.suspension} onChange={v => onUpdate({ suspension: v })} />
            </div>
            {emp.suspension && (
              <div className="space-y-2 pl-2 border-l-2 border-rose-200">
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Motivo *</Label>
                  <Input
                    placeholder="Motivo de la suspensión"
                    value={emp.suspension_motivo}
                    onChange={e => onUpdate({ suspension_motivo: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                  />
                </div>
                <FileField
                  label="Documento adjunto (PDF)"
                  url={emp.suspension_archivo_url}
                  nombre={emp.suspension_archivo_nombre}
                  onUpload={(url, nombre) =>
                    onUpdate({ suspension_archivo_url: url, suspension_archivo_nombre: nombre })
                  }
                  onRemove={() => onUpdate({ suspension_archivo_url: '', suspension_archivo_nombre: '' })}
                />
              </div>
            )}
          </SubSection>

          {/* Descuentos */}
          <SubSection
            title="Descuentos"
            icon={<DollarSign className="w-3.5 h-3.5" />}
            badge={emp.descuento ? 'Sí' : undefined}
            badgeColor="bg-orange-100 text-orange-700"
          >
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Hay descuento?
              </Label>
              <SiNoToggle value={emp.descuento} onChange={v => onUpdate({ descuento: v })} />
            </div>
            {emp.descuento && (
              <div className="space-y-2 pl-2 border-l-2 border-orange-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#5A6070] mb-1 block">Monto *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0"
                      value={emp.descuento_monto}
                      onChange={e => onUpdate({ descuento_monto: e.target.value })}
                      className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#5A6070] mb-1 block">Motivo *</Label>
                    <Input
                      placeholder="Motivo del descuento"
                      value={emp.descuento_motivo}
                      onChange={e => onUpdate({ descuento_motivo: e.target.value })}
                      className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </SubSection>

          {/* Ausencias justificadas */}
          <SubSection
            title="Ausencias Justificadas"
            icon={<FileText className="w-3.5 h-3.5" />}
            badge={emp.aus_just_tiene ? 'Sí' : undefined}
            badgeColor="bg-purple-100 text-purple-700"
          >
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Hubo ausencias justificadas?
              </Label>
              <SiNoToggle value={emp.aus_just_tiene} onChange={v => onUpdate({ aus_just_tiene: v })} />
            </div>
            {emp.aus_just_tiene && (
              <div className="space-y-2 pl-2 border-l-2 border-purple-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#5A6070] mb-1 block">Cantidad *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={emp.aus_just_cantidad}
                      onChange={e => onUpdate({ aus_just_cantidad: e.target.value })}
                      className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#5A6070] mb-1 block">Unidad</Label>
                    <Select
                      value={emp.aus_just_unidad}
                      onValueChange={v => onUpdate({ aus_just_unidad: v as 'horas' | 'minutos' })}
                    >
                      <SelectTrigger className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horas">Horas</SelectItem>
                        <SelectItem value="minutos">Minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Motivo / Explicación</Label>
                  <Input
                    placeholder="Motivo de la ausencia"
                    value={emp.aus_just_motivo}
                    onChange={e => onUpdate({ aus_just_motivo: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                  />
                </div>
              </div>
            )}
          </SubSection>

          {/* Ausencias injustificadas */}
          <SubSection
            title="Ausencias Injustificadas"
            icon={<FileText className="w-3.5 h-3.5" />}
            badge={emp.aus_injust_cantidad ? 'Sí' : undefined}
            badgeColor="bg-red-100 text-red-700"
          >
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Cantidad</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="0"
                    value={emp.aus_injust_cantidad}
                    onChange={e => onUpdate({ aus_injust_cantidad: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Unidad</Label>
                  <Select
                    value={emp.aus_injust_unidad}
                    onValueChange={v => onUpdate({ aus_injust_unidad: v as 'horas' | 'minutos' })}
                  >
                    <SelectTrigger className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="minutos">Minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Label className="text-xs text-[#5A6070] mb-1 block">Motivo</Label>
              <Input
                placeholder="Motivo de la ausencia injustificada"
                value={emp.aus_injust_motivo}
                onChange={e => onUpdate({ aus_injust_motivo: e.target.value })}
                className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
              />
            </div>
          </SubSection>

          {/* Tardanzas */}
          <SubSection
            title="Tardanzas"
            icon={<Clock className="w-3.5 h-3.5" />}
            badge={emp.tardanzas_tiene ? 'Sí' : undefined}
            badgeColor="bg-blue-100 text-blue-700"
          >
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                ¿Hubo tardanzas?
              </Label>
              <SiNoToggle value={emp.tardanzas_tiene} onChange={v => onUpdate({ tardanzas_tiene: v })} />
            </div>
            {emp.tardanzas_tiene && (
              <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#5A6070] mb-1 block">Cantidad *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="0"
                      value={emp.tardanzas_cantidad}
                      onChange={e => onUpdate({ tardanzas_cantidad: e.target.value })}
                      className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#5A6070] mb-1 block">Unidad</Label>
                    <Select
                      value={emp.tardanzas_unidad}
                      onValueChange={v => onUpdate({ tardanzas_unidad: v as 'horas' | 'minutos' })}
                    >
                      <SelectTrigger className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horas">Horas</SelectItem>
                        <SelectItem value="minutos">Minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#5A6070] mb-1 block">Motivo / Explicación</Label>
                  <Input
                    placeholder="Motivo de la tardanza"
                    value={emp.tardanzas_motivo}
                    onChange={e => onUpdate({ tardanzas_motivo: e.target.value })}
                    className="h-9 rounded-lg border border-[#E0E0E0] bg-white text-sm"
                  />
                </div>
              </div>
            )}
          </SubSection>

          {/* Observaciones del empleado */}
          <SubSection title="Observaciones" icon={<MessageSquare className="w-3.5 h-3.5" />}>
            <Textarea
              placeholder="Observaciones adicionales del empleado..."
              className="min-h-[60px] resize-none rounded-lg border border-[#E0E0E0] bg-white text-sm"
              value={emp.observaciones}
              onChange={e => onUpdate({ observaciones: e.target.value })}
            />
          </SubSection>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface NovedadSueldoFieldsProps {
  form: SolicitudFormState
  areas: Area[]
  puestos: Puesto[]
  incentivos: RhIncentivoPremio[]
  personal: Personal[]
  onChange: (patch: Partial<SolicitudFormState>) => void
}

export function NovedadSueldoFields({
  form,
  areas,
  puestos,
  incentivos,
  personal,
  onChange,
}: NovedadSueldoFieldsProps) {
  const [selectedPersonalId, setSelectedPersonalId] = useState('')

  // Empleados del área seleccionada que aún no fueron agregados
  const areaId = Number(form.nov_area_id)
  const puestosDeArea = new Set(areaId ? puestos.filter(p => p.area_id === areaId).map(p => p.id) : [])
  const agregadosIds = new Set(form.nov_empleados.map(e => e.personal_id))
  const disponibles = personal.filter(p => p.activo && puestosDeArea.has(p.puesto_id) && !agregadosIds.has(p.id))

  function agregarEmpleado() {
    if (!selectedPersonalId) return
    const emp = personal.find(p => p.id === Number(selectedPersonalId))
    if (!emp) return
    onChange({ nov_empleados: [...form.nov_empleados, createEmpleadoVacio(emp.id, emp.nombre)] })
    setSelectedPersonalId('')
  }

  function actualizarEmpleado(idx: number, patch: Partial<EmpleadoNovedadData>) {
    onChange({ nov_empleados: form.nov_empleados.map((e, i) => (i === idx ? { ...e, ...patch } : e)) })
  }

  function eliminarEmpleado(idx: number) {
    onChange({ nov_empleados: form.nov_empleados.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-3">
      {/* Header: Área y Período */}
      <div className="rounded-xl border border-[#E0E0E0] bg-[#F8F9FA] p-4 space-y-3">
        <p className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">Área y Período</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3 sm:col-span-1">
            <Label className="text-xs text-[#5A6070] mb-1 block">Área *</Label>
            <Select value={form.nov_area_id} onValueChange={v => onChange({ nov_area_id: v, nov_empleados: [] })}>
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                <SelectValue placeholder="Seleccione un área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map(a => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#5A6070] mb-1 block">Mes *</Label>
            <Select value={form.nov_mes} onValueChange={v => onChange({ nov_mes: v })}>
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[#5A6070] mb-1 block">Año *</Label>
            <Select value={form.nov_anio} onValueChange={v => onChange({ nov_anio: v })}>
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {ANIOS.map(a => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sección empleados */}
      <div className="rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-4 py-3 bg-[#F8F9FA] border-b border-[#E0E0E0]">
          <p className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#002868]" />
            Empleados
            {form.nov_empleados.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#002868] text-white text-[10px] font-bold">
                {form.nov_empleados.length}
              </span>
            )}
          </p>
        </div>

        <div className="p-4 space-y-3">
          {/* Selector para agregar empleado */}
          <div className="flex gap-2">
            <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId} disabled={!form.nov_area_id}>
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm flex-1">
                <SelectValue
                  placeholder={
                    !form.nov_area_id
                      ? 'Seleccione un área primero'
                      : disponibles.length === 0
                        ? 'No hay empleados disponibles'
                        : 'Seleccionar empleado activo...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {disponibles.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={agregarEmpleado}
              disabled={!selectedPersonalId}
              className="h-10 px-4 rounded-lg bg-[#002868] text-white hover:bg-[#003d8f] shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </Button>
          </div>

          {/* Lista de empleados agregados */}
          {form.nov_empleados.length === 0 && (
            <p className="text-center text-xs text-[#8A8F9C] py-3">
              {!form.nov_area_id
                ? 'Seleccione un área para poder agregar empleados.'
                : 'Aún no se agregaron empleados.'}
            </p>
          )}
          {form.nov_empleados.map((emp, idx) => (
            <EmpleadoCard
              key={emp.personal_id}
              emp={emp}
              puestos={puestos}
              incentivos={incentivos}
              onUpdate={patch => actualizarEmpleado(idx, patch)}
              onRemove={() => eliminarEmpleado(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
