import { Save, X } from 'lucide-react'
import { CodigoPostalSelector } from '@/components/CodigoPostalSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Personal, Puesto } from '@/lib/types'
import { handleDniChange } from '@/lib/validators'
import { CampoDatoPersonal } from './CampoDatoPersonal'
import { CarnetManipulacionEditFields } from './CarnetManipulacionEditFields'
import type { DatosPersonalesFormState } from './datosPersonalesForm'

interface DatosPersonalesEditProps {
  personal: Personal
  puestos: Puesto[]
  sucursalNombre: string
  form: DatosPersonalesFormState
  saving: boolean
  onChange: (patch: Partial<DatosPersonalesFormState>) => void
  onSave: () => void
  onCancel: () => void
}

export function DatosPersonalesEdit({
  personal,
  puestos,
  sucursalNombre,
  form,
  saving,
  onChange,
  onSave,
  onCancel,
}: DatosPersonalesEditProps) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">Editar Datos Personales</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
            className="h-8 cursor-pointer border-[#D0D5DD] px-3 text-xs"
          >
            <X className="mr-1.5 h-3 w-3" /> Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="h-8 cursor-pointer bg-[#002868] px-3 text-xs text-white hover:bg-[#003d8f]"
          >
            <Save className="mr-1.5 h-3 w-3" /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CampoDatoPersonal label="Legajo">
          <div className="flex h-9 select-none items-center rounded-md border border-[#E5E9F0] bg-[#F9FAFB] px-3 font-mono text-sm text-[#9AA0AC]">
            #{personal.legajo}
          </div>
        </CampoDatoPersonal>
        <CampoDatoPersonal label="Nombre completo" required>
          <Input
            value={form.nombre}
            onChange={event => onChange({ nombre: event.target.value })}
            placeholder="Nombre y apellido"
            maxLength={100}
          />
        </CampoDatoPersonal>
        <CampoDatoPersonal label="DNI" required>
          <Input
            value={form.dni}
            onChange={event => {
              const digits = handleDniChange(event.target.value)
              if (digits !== null) onChange({ dni: digits })
            }}
            placeholder="12345678"
            maxLength={8}
          />
        </CampoDatoPersonal>
        <CampoDatoPersonal label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={event => onChange({ email: event.target.value })}
            placeholder="correo@ejemplo.com"
            maxLength={255}
          />
        </CampoDatoPersonal>

        <div className="sm:col-span-2 lg:col-span-3">
          <CampoDatoPersonal label="Dirección real">
            <Input
              value={form.domicilio_real}
              onChange={event => onChange({ domicilio_real: event.target.value })}
              placeholder="Calle y número"
            />
          </CampoDatoPersonal>
        </div>
        <CodigoPostalSelector
          title="Código postal de la dirección real"
          provinciaCodigo={form.domicilio_real_provincia_codigo}
          localidad={form.domicilio_real_localidad}
          codigoPostal={form.domicilio_real_codigo_postal}
          onChange={value =>
            onChange({
              domicilio_real_provincia_codigo: value.provinciaCodigo,
              domicilio_real_localidad: value.localidad,
              domicilio_real_codigo_postal: value.codigoPostal,
            })
          }
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <CampoDatoPersonal label="Domicilio según DNI">
            <Input
              value={form.domicilio_dni}
              onChange={event => onChange({ domicilio_dni: event.target.value })}
              placeholder="Como figura en el documento"
            />
          </CampoDatoPersonal>
        </div>
        <CodigoPostalSelector
          title="Código postal del domicilio según DNI"
          provinciaCodigo={form.domicilio_dni_provincia_codigo}
          localidad={form.domicilio_dni_localidad}
          codigoPostal={form.domicilio_dni_codigo_postal}
          onChange={value =>
            onChange({
              domicilio_dni_provincia_codigo: value.provinciaCodigo,
              domicilio_dni_localidad: value.localidad,
              domicilio_dni_codigo_postal: value.codigoPostal,
            })
          }
        />

        <CampoDatoPersonal label="Puesto" required>
          <Select value={String(form.puesto_id)} onValueChange={value => onChange({ puesto_id: Number(value) })}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Seleccioná un puesto" />
            </SelectTrigger>
            <SelectContent>
              {personal.puesto_id && !puestos.some(puesto => puesto.id === personal.puesto_id) ? (
                <SelectItem value={String(personal.puesto_id)}>
                  {personal.puesto_nombre
                    ? `${personal.puesto_nombre} (actual)`
                    : `Puesto #${personal.puesto_id} (actual)`}
                </SelectItem>
              ) : null}
              {puestos.map(puesto => (
                <SelectItem key={puesto.id} value={String(puesto.id)}>
                  {puesto.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CampoDatoPersonal>
        <CampoDatoPersonal label="Sucursal">
          <div className="flex h-9 select-none items-center rounded-md border border-[#E5E9F0] bg-[#F9FAFB] px-3 text-sm text-[#9AA0AC]">
            {sucursalNombre}
          </div>
        </CampoDatoPersonal>
        <CampoDatoPersonal label="Fecha de incorporación" required>
          <Input
            type="date"
            value={form.fecha_incorporacion}
            onChange={event => onChange({ fecha_incorporacion: event.target.value })}
          />
        </CampoDatoPersonal>

        <div className="flex items-center gap-3 rounded-xl border border-[#E5E9F0] bg-white p-4">
          <Switch
            id="carnet-edit"
            checked={form.carnet_manipulacion_alimentos}
            onCheckedChange={value =>
              onChange(
                value
                  ? { carnet_manipulacion_alimentos: true }
                  : {
                      carnet_manipulacion_alimentos: false,
                      carnet_archivo: null,
                      carnet_archivo_nombre: '',
                      carnet_vencimiento: '',
                    },
              )
            }
          />
          <Label htmlFor="carnet-edit" className="cursor-pointer select-none text-sm">
            Carnet Manip. Alimentos
          </Label>
        </div>
        {form.carnet_manipulacion_alimentos ? (
          <CarnetManipulacionEditFields
            archivoActual={form.carnet_archivo_nombre}
            archivoSeleccionado={form.carnet_archivo}
            vencimiento={form.carnet_vencimiento}
            onArchivoChange={file => onChange({ carnet_archivo: file })}
            onVencimientoChange={value => onChange({ carnet_vencimiento: value })}
          />
        ) : null}
        <div className="flex items-center gap-3 rounded-xl border border-[#E5E9F0] bg-white p-4">
          <Switch id="activo-edit" checked={form.activo} onCheckedChange={value => onChange({ activo: value })} />
          <Label htmlFor="activo-edit" className="cursor-pointer select-none text-sm">
            Colaborador activo
          </Label>
        </div>
        <CampoDatoPersonal label="Condición laboral">
          <Select
            value={form.condicion_laboral || 'sin-definir'}
            onValueChange={value => {
              const condicion = value === 'sin-definir' ? '' : (value as '1' | '2')
              onChange({
                condicion_laboral: condicion,
                ...(condicion !== '1' ? { fecha_alta_temprana: '' } : {}),
              })
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Sin definir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin-definir">Sin definir</SelectItem>
              <SelectItem value="1">Condición 1</SelectItem>
              <SelectItem value="2">Condición 2</SelectItem>
            </SelectContent>
          </Select>
        </CampoDatoPersonal>
        {form.condicion_laboral === '1' ? (
          <CampoDatoPersonal label="Fecha de alta temprana">
            <Input
              type="date"
              value={form.fecha_alta_temprana}
              onChange={event => onChange({ fecha_alta_temprana: event.target.value })}
            />
          </CampoDatoPersonal>
        ) : null}
      </div>

      <p className="mt-4 text-[10px] text-[#B0B8C4]">
        Los campos marcados con <span className="text-rose-500">*</span> son obligatorios. El legajo y la sucursal no
        son editables directamente.
      </p>
    </div>
  )
}
