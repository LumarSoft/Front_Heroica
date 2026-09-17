'use client'

import type { RhSolicitud } from '@/lib/types'
import { SolicitudResumenFilas } from './SolicitudResumenFilas'
import { formatCurrency } from '@/lib/solicitud-resumen'
import { getProvinciaPostalNombre } from '@/lib/codigos-postales'

interface AltaDetallesResumenProps {
  solicitud: RhSolicitud
}

export function AltaDetallesResumen({ solicitud }: AltaDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>
  // Archivos desde tabla; fallback a JSON para registros anteriores a RH-60
  const archivosTabla = solicitud.archivos ?? []
  const adjLegacy = detalles.adjuntos as Record<string, { url?: string; nombre_original?: string } | null> | undefined
  const carnetAdjLegacy = detalles.carnet_adjunto as { url?: string } | undefined
  const tieneAdj = (k: string) => archivosTabla.some(a => a.tipo_doc === k) || Boolean(adjLegacy?.[k]?.url)
  const tieneCarnetArchivo =
    archivosTabla.some(a => a.tipo_doc === 'carnet_manipulacion_alimentos') || Boolean(carnetAdjLegacy?.url)
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos personales</p>
        {
          <SolicitudResumenFilas
            rows={[
              { label: 'Nombres y apellidos', value: String(detalles.nombre ?? '-') },
              { label: 'DNI', value: String(detalles.dni ?? '-') },
              { label: 'CUIL / CUIT', value: String(detalles.cuil ?? '-') },
              { label: 'Domicilio real', value: String(detalles.domicilio ?? '-') },
              {
                label: 'CP dirección real',
                value:
                  detalles.domicilio_real_localidad && detalles.domicilio_real_codigo_postal
                    ? `${String(detalles.domicilio_real_localidad)}, ${getProvinciaPostalNombre(String(detalles.domicilio_real_provincia_codigo ?? ''))} · CP ${String(detalles.domicilio_real_codigo_postal)}`
                    : '-',
              },
              { label: 'Domicilio en DNI', value: detalles.domicilio_dni ? String(detalles.domicilio_dni) : '-' },
              {
                label: 'CP domicilio en DNI',
                value:
                  detalles.domicilio_dni_localidad && detalles.domicilio_dni_codigo_postal
                    ? `${String(detalles.domicilio_dni_localidad)}, ${getProvinciaPostalNombre(String(detalles.domicilio_dni_provincia_codigo ?? ''))} · CP ${String(detalles.domicilio_dni_codigo_postal)}`
                    : '-',
              },
              { label: 'Fecha de nacimiento', value: String(detalles.fecha_nacimiento ?? '-') },
              { label: 'Teléfono', value: String(detalles.telefono ?? '-') },
              { label: 'Correo electrónico', value: String(detalles.email ?? '-') },
            ]}
          />
        }
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos bancarios</p>
        {
          <SolicitudResumenFilas
            rows={[
              { label: 'Entidad', value: detalles.banco ? String(detalles.banco) : '-' },
              { label: 'CBU / CVU', value: detalles.cbu ? String(detalles.cbu) : '-' },
            ]}
          />
        }
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Datos laborales</p>
        {
          <SolicitudResumenFilas
            rows={[
              {
                label: 'Puesto',
                value: detalles.puesto_nombre
                  ? String(detalles.puesto_nombre)
                  : detalles.puesto_id
                    ? `ID ${String(detalles.puesto_id)}`
                    : '-',
              },
              {
                label: 'Condición laboral',
                value:
                  detalles.condicion_laboral === 1 || detalles.condicion_laboral === 2
                    ? String(detalles.condicion_laboral)
                    : '-',
              },
              ...(detalles.condicion_laboral === 1 && detalles.fecha_alta_temprana
                ? [{ label: 'Alta temprana', value: String(detalles.fecha_alta_temprana) }]
                : []),
              { label: 'Inicio relación laboral', value: String(detalles.fecha_incorporacion ?? '-') },
              { label: 'Inicio cobro en oficina', value: String(detalles.fecha_inicio_cobro_oficina ?? '-') },
              {
                label: 'Jornada',
                value:
                  detalles.jornada_semanal_dias != null && detalles.jornada_diaria_horas_texto
                    ? `${detalles.jornada_semanal_dias} días/semana · ${detalles.jornada_diaria_horas_texto}`
                    : '-',
              },
              {
                label: 'Propuesta económica',
                value: formatCurrency(detalles.propuesta_economica),
              },
              { label: 'Beneficios', value: detalles.beneficios ? String(detalles.beneficios) : '-' },
              {
                label: 'Período de prueba',
                value: detalles.periodo_prueba === true ? `${String(detalles.periodo_prueba_dias ?? '')} días` : 'No',
              },
              {
                label: 'Carnet manip.',
                value:
                  detalles.carnet_manipulacion_alimentos === true
                    ? `Sí · vence ${String(detalles.carnet_fecha_vencimiento ?? '—')}`
                    : 'No',
              },
            ]}
          />
        }
      </div>
      {detalles.otras_observaciones_alta ? (
        <div className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Otras observaciones</p>
          <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{String(detalles.otras_observaciones_alta)}</p>
        </div>
      ) : null}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868] mb-2">Documentación</p>
        <div className="flex flex-wrap gap-2">
          {[
            ['dni_frente_dorso', 'DNI'],
            ['ddjj_domicilio', 'DDJJ dom.'],
            ['descripcion_puesto_firmada', 'Desc. puesto'],
            ['foto_colaborador', 'Foto'],
            ['normas_convivencia', 'Normas conv.'],
            ['constancia_uniforme', 'Constancia uniforme'],
          ].map(([key, short]) => (
            <span
              key={key}
              className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
                tieneAdj(key)
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-[#F8F9FA] text-[#9AA0AC] border-[#E0E0E0]'
              }`}
            >
              {short}
            </span>
          ))}
          {detalles.carnet_manipulacion_alimentos === true ? (
            <span
              className={`text-[10px] px-2 py-1 rounded-full font-medium border ${
                tieneCarnetArchivo
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-[#F8F9FA] text-[#9AA0AC] border-[#E0E0E0]'
              }`}
            >
              Carnet
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
