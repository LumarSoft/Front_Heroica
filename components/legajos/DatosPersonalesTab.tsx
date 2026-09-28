'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { Personal, Puesto } from '@/lib/types'
import { isValidDni } from '@/lib/validators'
import { DatosPersonalesEdit } from './DatosPersonalesEdit'
import { DatosPersonalesView } from './DatosPersonalesView'
import { buildInitialForm, type DatosPersonalesFormState } from './datosPersonalesForm'

interface DatosPersonalesTabProps {
  personal: Personal
  puestos: Puesto[]
  sucursalNombre: string
  canEditar: boolean
  onUpdate: (updated: Personal) => void
}

interface PersonalUpdateResponse {
  success: boolean
  data?: Personal
  message?: string
}

function validatePostalLocation(
  label: string,
  provincia: string,
  localidad: string,
  codigoPostal: string,
): string | null {
  const hasPostalLocation = Boolean(provincia || localidad.trim() || codigoPostal)
  if (!hasPostalLocation) return null
  if (!provincia || !localidad.trim()) return `Completá la provincia y la localidad de ${label}`
  if (!/^\d{4}$/.test(codigoPostal)) return `El código postal de ${label} debe tener exactamente 4 dígitos`
  return null
}

function validateForm(form: DatosPersonalesFormState): string | null {
  if (!form.nombre.trim()) return 'El nombre es requerido'
  if (!form.dni.trim()) return 'El DNI es requerido'
  if (!isValidDni(form.dni)) return 'El DNI debe tener exactamente 8 dígitos'
  if (!form.puesto_id) return 'El puesto es requerido'
  if (!form.fecha_incorporacion) return 'La fecha de incorporación es requerida'
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Ingresá un email válido'

  const domicilioRealError = validatePostalLocation(
    'la dirección real',
    form.domicilio_real_provincia_codigo,
    form.domicilio_real_localidad,
    form.domicilio_real_codigo_postal,
  )
  if (domicilioRealError) return domicilioRealError
  const domicilioDniError = validatePostalLocation(
    'el domicilio según DNI',
    form.domicilio_dni_provincia_codigo,
    form.domicilio_dni_localidad,
    form.domicilio_dni_codigo_postal,
  )
  if (domicilioDniError) return domicilioDniError
  if (form.carnet_manipulacion_alimentos) {
    if (!form.carnet_archivo && !form.carnet_archivo_nombre) {
      return 'Adjuntá el archivo del carnet de manipulación'
    }
    if (!form.carnet_vencimiento) return 'Indicá la fecha de vencimiento del carnet'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.carnet_vencimiento)) {
      return 'La fecha de vencimiento del carnet no es válida'
    }
    if (form.carnet_archivo && form.carnet_archivo.size > 10 * 1024 * 1024) {
      return 'El archivo del carnet no puede superar los 10 MB'
    }
  }
  if (
    form.condicion_laboral === '1' &&
    form.fecha_alta_temprana &&
    !/^\d{4}-\d{2}-\d{2}$/.test(form.fecha_alta_temprana)
  ) {
    return 'La fecha de alta temprana no es válida'
  }
  return null
}

function buildRequestBody(form: DatosPersonalesFormState, personal: Personal): FormData {
  const body = new FormData()
  body.append('nombre', form.nombre.trim())
  body.append('dni', form.dni.trim())
  body.append('email', form.email.trim())
  body.append('domicilio_real', form.domicilio_real.trim())
  body.append('domicilio_real_provincia_codigo', form.domicilio_real_provincia_codigo)
  body.append('domicilio_real_localidad', form.domicilio_real_localidad.trim())
  body.append('domicilio_real_codigo_postal', form.domicilio_real_codigo_postal)
  body.append('domicilio_dni', form.domicilio_dni.trim())
  body.append('domicilio_dni_provincia_codigo', form.domicilio_dni_provincia_codigo)
  body.append('domicilio_dni_localidad', form.domicilio_dni_localidad.trim())
  body.append('domicilio_dni_codigo_postal', form.domicilio_dni_codigo_postal)
  body.append('puesto_id', String(form.puesto_id))
  body.append('sucursal_id', String(personal.sucursal_id))
  body.append('fecha_incorporacion', form.fecha_incorporacion)
  body.append('periodo_prueba', String(personal.periodo_prueba ?? false))
  body.append('periodo_prueba_dias', personal.periodo_prueba ? String(personal.periodo_prueba_dias ?? 180) : '')
  body.append('carnet_manipulacion_alimentos', String(form.carnet_manipulacion_alimentos))
  body.append('carnet_vencimiento', form.carnet_manipulacion_alimentos ? form.carnet_vencimiento : '')
  body.append('activo', String(form.activo))
  body.append('condicion_laboral', form.condicion_laboral)
  body.append(
    'fecha_alta_temprana',
    form.condicion_laboral === '1' && form.fecha_alta_temprana ? form.fecha_alta_temprana : '',
  )
  if (form.carnet_archivo) body.append('carnet_archivo', form.carnet_archivo)
  return body
}

export function DatosPersonalesTab({
  personal,
  puestos,
  sucursalNombre,
  canEditar,
  onUpdate,
}: DatosPersonalesTabProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<DatosPersonalesFormState>(() => buildInitialForm(personal))

  const handleEdit = () => {
    setForm(buildInitialForm(personal))
    setEditing(true)
  }

  const handleChange = (patch: Partial<DatosPersonalesFormState>) => {
    setForm(previous => ({ ...previous, ...patch }))
  }

  const handleSave = async () => {
    const validationError = validateForm(form)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      const response = await apiFetch(API_ENDPOINTS.PERSONAL.UPDATE(personal.id), {
        method: 'PUT',
        body: buildRequestBody(form, personal),
      })
      const payload = (await response.json()) as PersonalUpdateResponse
      if (!response.ok || !payload.data) {
        toast.error(payload.message || 'Error al guardar los cambios')
        return
      }

      toast.success('Datos actualizados correctamente')
      onUpdate(payload.data)
      setEditing(false)
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <DatosPersonalesEdit
        personal={personal}
        puestos={puestos}
        sucursalNombre={sucursalNombre}
        form={form}
        saving={saving}
        onChange={handleChange}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <DatosPersonalesView
      personal={personal}
      sucursalNombre={sucursalNombre}
      canEditar={canEditar}
      onEdit={handleEdit}
    />
  )
}
