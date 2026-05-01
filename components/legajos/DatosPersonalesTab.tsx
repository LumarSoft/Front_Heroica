'use client'

import { useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Pencil, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { Personal, Puesto } from '@/lib/types'

interface DatosPersonalesTabProps {
  personal: Personal
  puestos: Puesto[]
  sucursalNombre: string
  canEditar: boolean
  onUpdate: (updated: Personal) => void
}

interface FormState {
  nombre: string
  dni: string
  email: string
  puesto_id: number
  fecha_incorporacion: string
  carnet_manipulacion_alimentos: boolean
  activo: boolean
}

function normalizeFecha(fecha: string): string {
  return fecha.split('T')[0]
}

function formatFechaDisplay(fecha: string): string {
  const [year, month, day] = normalizeFecha(fecha).split('-')
  return `${day}/${month}/${year}`
}

function buildInitialForm(personal: Personal): FormState {
  return {
    nombre: personal.nombre,
    dni: personal.dni,
    email: personal.email ?? '',
    puesto_id: personal.puesto_id,
    fecha_incorporacion: normalizeFecha(personal.fecha_incorporacion),
    carnet_manipulacion_alimentos: personal.carnet_manipulacion_alimentos,
    activo: personal.activo,
  }
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function FieldCard({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E9F0] p-4 min-h-[72px] flex flex-col justify-between">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0AC] mb-2">{label}</p>
      <div>{children}</div>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-[#444]">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ─── Modo visualización ───────────────────────────────────────────────────────

function ViewMode({
  personal,
  sucursalNombre,
  canEditar,
  onEdit,
}: {
  personal: Personal
  sucursalNombre: string
  canEditar: boolean
  onEdit: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">Datos Personales</p>
        {canEditar && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 px-3 text-xs border-[#D0D5DD] text-[#444] hover:text-[#002868] hover:border-[#002868] hover:bg-[#EEF3FF] cursor-pointer"
          >
            <Pencil className="w-3 h-3 mr-1.5" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <FieldCard label="Legajo">
          <span className="font-mono text-sm font-semibold text-[#002868]">#{personal.legajo}</span>
        </FieldCard>

        <FieldCard label="Nombre completo">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.nombre}</span>
        </FieldCard>

        <FieldCard label="DNI">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.dni}</span>
        </FieldCard>

        <FieldCard label="Email">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.email || '—'}</span>
        </FieldCard>

        <FieldCard label="Puesto">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.puesto_nombre ?? '—'}</span>
        </FieldCard>

        <FieldCard label="Sucursal">
          <span className="text-sm font-medium text-[#1A1A1A]">{sucursalNombre}</span>
        </FieldCard>

        <FieldCard label="Fecha de incorporación">
          <span className="text-sm font-medium text-[#1A1A1A]">
            {formatFechaDisplay(personal.fecha_incorporacion)}
          </span>
        </FieldCard>

        <FieldCard label="Carnet Manip. Alimentos">
          {personal.carnet_manipulacion_alimentos ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-sm font-medium text-emerald-700">Habilitado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-[#C8CCD4] flex-shrink-0" />
              <span className="text-sm text-[#9AA0AC]">No habilitado</span>
            </div>
          )}
        </FieldCard>

        <FieldCard label="Estado">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
              ${personal.activo
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                ${personal.activo ? 'bg-emerald-500' : 'bg-rose-400'}`}
            />
            {personal.activo ? 'Activo' : 'Inactivo'}
          </span>
        </FieldCard>
      </div>

      <p className="mt-5 text-[10px] text-[#B0B8C4]">
        Alta en el sistema: {formatFechaDisplay(personal.created_at)}
        {personal.updated_at && personal.updated_at !== personal.created_at && (
          <> · Última modificación: {formatFechaDisplay(personal.updated_at)}</>
        )}
      </p>
    </div>
  )
}

// ─── Modo edición ─────────────────────────────────────────────────────────────

function EditMode({
  personal,
  puestos,
  sucursalNombre,
  form,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  personal: Personal
  puestos: Puesto[]
  sucursalNombre: string
  form: FormState
  saving: boolean
  onChange: (patch: Partial<FormState>) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">Editar Datos Personales</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="h-8 px-3 text-xs border-[#D0D5DD] cursor-pointer"
          >
            <X className="w-3 h-3 mr-1.5" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="h-8 px-3 text-xs bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
          >
            <Save className="w-3 h-3 mr-1.5" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Legajo – solo lectura */}
        <FormField label="Legajo">
          <div className="h-9 px-3 rounded-md border border-[#E5E9F0] bg-[#F9FAFB] font-mono text-sm text-[#9AA0AC] flex items-center select-none">
            #{personal.legajo}
          </div>
        </FormField>

        {/* Nombre */}
        <FormField label="Nombre completo" required>
          <Input
            value={form.nombre}
            onChange={e => onChange({ nombre: e.target.value })}
            placeholder="Nombre y apellido"
            maxLength={100}
          />
        </FormField>

        {/* DNI */}
        <FormField label="DNI" required>
          <Input
            value={form.dni}
            onChange={e => onChange({ dni: e.target.value })}
            placeholder="Número de DNI"
            maxLength={20}
          />
        </FormField>

        <FormField label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={e => onChange({ email: e.target.value })}
            placeholder="correo@ejemplo.com"
            maxLength={255}
          />
        </FormField>

        {/* Puesto */}
        <FormField label="Puesto" required>
          <select
            value={form.puesto_id}
            onChange={e => onChange({ puesto_id: Number(e.target.value) })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
          >
            {puestos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </FormField>

        {/* Sucursal – solo lectura */}
        <FormField label="Sucursal">
          <div className="h-9 px-3 rounded-md border border-[#E5E9F0] bg-[#F9FAFB] text-sm text-[#9AA0AC] flex items-center select-none">
            {sucursalNombre}
          </div>
        </FormField>

        {/* Fecha de incorporación */}
        <FormField label="Fecha de incorporación" required>
          <Input
            type="date"
            value={form.fecha_incorporacion}
            onChange={e => onChange({ fecha_incorporacion: e.target.value })}
          />
        </FormField>

        {/* Carnet */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E5E9F0] p-4">
          <Switch
            id="carnet-edit"
            checked={form.carnet_manipulacion_alimentos}
            onCheckedChange={v => onChange({ carnet_manipulacion_alimentos: v })}
          />
          <Label htmlFor="carnet-edit" className="text-sm cursor-pointer select-none">
            Carnet Manip. Alimentos
          </Label>
        </div>

        {/* Estado */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E5E9F0] p-4">
          <Switch
            id="activo-edit"
            checked={form.activo}
            onCheckedChange={v => onChange({ activo: v })}
          />
          <Label htmlFor="activo-edit" className="text-sm cursor-pointer select-none">
            Colaborador activo
          </Label>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-[#B0B8C4]">
        Los campos marcados con <span className="text-rose-500">*</span> son obligatorios.
        El legajo y la sucursal no son editables directamente.
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DatosPersonalesTab({
  personal,
  puestos,
  sucursalNombre,
  canEditar,
  onUpdate,
}: DatosPersonalesTabProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(() => buildInitialForm(personal))

  function handleEdit() {
    setForm(buildInitialForm(personal))
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleChange(patch: Partial<FormState>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    if (!form.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (!form.dni.trim()) {
      toast.error('El DNI es requerido')
      return
    }
    if (!form.puesto_id) {
      toast.error('El puesto es requerido')
      return
    }
    if (!form.fecha_incorporacion) {
      toast.error('La fecha de incorporación es requerida')
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('Ingresá un email válido')
      return
    }

    setSaving(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.PERSONAL.UPDATE(personal.id), {
        method: 'PUT',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          dni: form.dni.trim(),
          email: form.email.trim() || null,
          puesto_id: form.puesto_id,
          sucursal_id: personal.sucursal_id,
          fecha_incorporacion: form.fecha_incorporacion,
          periodo_prueba: personal.periodo_prueba ?? false,
          periodo_prueba_dias: personal.periodo_prueba_dias ?? null,
          carnet_manipulacion_alimentos: form.carnet_manipulacion_alimentos,
          activo: form.activo,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Error al guardar los cambios')
        return
      }

      toast.success('Datos actualizados correctamente')
      onUpdate(data.data)
      setEditing(false)
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <EditMode
        personal={personal}
        puestos={puestos}
        sucursalNombre={sucursalNombre}
        form={form}
        saving={saving}
        onChange={handleChange}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <ViewMode
      personal={personal}
      sucursalNombre={sucursalNombre}
      canEditar={canEditar}
      onEdit={handleEdit}
    />
  )
}
