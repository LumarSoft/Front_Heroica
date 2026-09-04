import { CheckCircle2, Pencil, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getProvinciaPostalNombre } from '@/lib/codigos-postales'
import type { Personal } from '@/lib/types'
import { DatoPersonalCard } from './DatoPersonalCard'
import { formatFechaDisplay } from './datosPersonalesForm'

interface DatosPersonalesViewProps {
  personal: Personal
  sucursalNombre: string
  canEditar: boolean
  onEdit: () => void
}

export function DatosPersonalesView({ personal, sucursalNombre, canEditar, onEdit }: DatosPersonalesViewProps) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA0AC]">Datos Personales</p>
        {canEditar ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 cursor-pointer border-[#D0D5DD] px-3 text-xs text-[#444] hover:border-[#002868] hover:bg-[#EEF3FF] hover:text-[#002868]"
          >
            <Pencil className="mr-1.5 h-3 w-3" /> Editar
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DatoPersonalCard label="Legajo">
          <span className="font-mono text-sm font-semibold text-[#002868]">#{personal.legajo}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Nombre completo">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.nombre}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="DNI">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.dni}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Email">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.email || '—'}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Dirección real">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.domicilio_real || '—'}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Ubicación postal · Dirección real">
          <span className="text-sm font-medium text-[#1A1A1A]">
            {personal.domicilio_real_localidad && personal.domicilio_real_codigo_postal
              ? `${personal.domicilio_real_localidad}, ${getProvinciaPostalNombre(personal.domicilio_real_provincia_codigo)} · CP ${personal.domicilio_real_codigo_postal}`
              : '—'}
          </span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Domicilio según DNI">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.domicilio_dni || '—'}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Ubicación postal · Domicilio según DNI">
          <span className="text-sm font-medium text-[#1A1A1A]">
            {personal.domicilio_dni_localidad && personal.domicilio_dni_codigo_postal
              ? `${personal.domicilio_dni_localidad}, ${getProvinciaPostalNombre(personal.domicilio_dni_provincia_codigo)} · CP ${personal.domicilio_dni_codigo_postal}`
              : '—'}
          </span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Puesto">
          <span className="text-sm font-medium text-[#1A1A1A]">{personal.puesto_nombre ?? '—'}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Sucursal">
          <span className="text-sm font-medium text-[#1A1A1A]">{sucursalNombre}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Fecha de incorporación">
          <span className="text-sm font-medium text-[#1A1A1A]">{formatFechaDisplay(personal.fecha_incorporacion)}</span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Carnet Manip. Alimentos">
          <div className="flex items-center gap-1.5">
            {personal.carnet_manipulacion_alimentos ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700">Habilitado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 shrink-0 text-[#C8CCD4]" />
                <span className="text-sm text-[#9AA0AC]">No habilitado</span>
              </>
            )}
          </div>
        </DatoPersonalCard>
        <DatoPersonalCard label="Estado">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              personal.activo
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${personal.activo ? 'bg-emerald-500' : 'bg-rose-400'}`} />
            {personal.activo ? 'Activo' : 'Inactivo'}
          </span>
        </DatoPersonalCard>
        <DatoPersonalCard label="Condición laboral">
          <span className="text-sm font-medium text-[#1A1A1A]">
            {personal.condicion_laboral === 1 ? 'Condición 1' : personal.condicion_laboral === 2 ? 'Condición 2' : '—'}
          </span>
        </DatoPersonalCard>
        {personal.condicion_laboral === 1 ? (
          <DatoPersonalCard label="Fecha de alta temprana">
            <span className="text-sm font-medium text-[#1A1A1A]">
              {personal.fecha_alta_temprana ? formatFechaDisplay(personal.fecha_alta_temprana) : '—'}
            </span>
          </DatoPersonalCard>
        ) : null}
      </div>

      <p className="mt-5 text-[10px] text-[#B0B8C4]">
        Alta en el sistema: {formatFechaDisplay(personal.created_at)}
        {personal.updated_at && personal.updated_at !== personal.created_at ? (
          <> · Última modificación: {formatFechaDisplay(personal.updated_at)}</>
        ) : null}
      </p>
    </div>
  )
}
