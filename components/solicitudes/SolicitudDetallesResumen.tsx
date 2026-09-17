'use client'

import { AltaDetallesResumen } from './AltaDetallesResumen'
import { NovedadDetallesResumen } from './NovedadDetallesResumen'
import { BajaDetallesResumen } from './BajaDetallesResumen'
import type { RhSolicitud } from '@/lib/types'
import { SolicitudResumenFilas } from './SolicitudResumenFilas'
import { AdelantoDetallesResumen } from './AdelantoDetallesResumen'
import { LicenciaDetallesResumen } from './LicenciaDetallesResumen'
import { formatCurrency } from '@/lib/solicitud-resumen'

interface SolicitudDetallesResumenProps {
  solicitud: RhSolicitud
}

export function SolicitudDetallesResumen({ solicitud }: SolicitudDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>

  if (solicitud.tipo === 'Altas') return <AltaDetallesResumen solicitud={solicitud} />

  if (solicitud.tipo === 'Bajas') return <BajaDetallesResumen solicitud={solicitud} />

  if (solicitud.tipo === 'Vacaciones') {
    return (
      <SolicitudResumenFilas
        rows={[
          { label: 'Desde', value: String(detalles.fecha_desde ?? '-') },
          { label: 'Hasta', value: String(detalles.fecha_hasta ?? '-') },
          { label: 'Días', value: String(detalles.cantidad_dias ?? '-') },
        ]}
      />
    )
  }

  if (solicitud.tipo === 'Adelantos') return <AdelantoDetallesResumen solicitud={solicitud} />

  if (solicitud.tipo === 'Licencias') return <LicenciaDetallesResumen solicitud={solicitud} />

  if (solicitud.tipo === 'Novedades de sueldo') return <NovedadDetallesResumen solicitud={solicitud} />

  if (solicitud.tipo === 'Apercibimientos') {
    const adjArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'apercibimiento_adjunto')
    const adjLegacy = detalles.archivo_adjunto as { url?: string } | undefined
    const adjUrl = adjArchivo?.url ?? adjLegacy?.url
    return (
      <div className="space-y-3">
        {
          <SolicitudResumenFilas
            rows={[
              { label: 'Fecha', value: String(detalles.fecha ?? '-') },
              { label: 'Severidad', value: String(detalles.severidad ?? '-') },
              { label: 'Motivo', value: String(detalles.motivo ?? '-') },
            ]}
          />
        }
        {adjUrl ? (
          <a
            href={adjUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#002868] underline font-medium"
          >
            Abrir archivo adjunto
          </a>
        ) : null}
      </div>
    )
  }

  if (solicitud.tipo === 'Suspensiones') {
    const adjArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'suspension_adjunto')
    const adjLegacy = detalles.archivo_adjunto as { url?: string } | undefined
    const adjUrl = adjArchivo?.url ?? adjLegacy?.url
    return (
      <div className="space-y-3">
        {
          <SolicitudResumenFilas
            rows={[
              { label: 'Desde', value: String(detalles.fecha_desde ?? '-') },
              { label: 'Hasta', value: String(detalles.fecha_hasta ?? '-') },
              { label: 'Motivo', value: String(detalles.motivo ?? '-') },
            ]}
          />
        }
        {adjUrl ? (
          <a
            href={adjUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#002868] underline font-medium"
          >
            Abrir archivo adjunto
          </a>
        ) : null}
      </div>
    )
  }

  if (solicitud.tipo === 'Descuentos') {
    return (
      <SolicitudResumenFilas
        rows={[
          { label: 'Fecha', value: String(detalles.fecha ?? '-') },
          { label: 'Monto', value: formatCurrency(detalles.monto) },
          { label: 'Motivo', value: String(detalles.motivo ?? '-') },
        ]}
      />
    )
  }

  if (solicitud.tipo === 'Horas extras') {
    return (
      <SolicitudResumenFilas
        rows={[
          { label: 'Fecha', value: String(detalles.fecha ?? '-') },
          { label: 'Horas', value: String(detalles.cantidad_horas ?? '-') },
          ...(detalles.valor_hora != null ? [{ label: 'Valor hora', value: formatCurrency(detalles.valor_hora) }] : []),
          ...(detalles.descripcion ? [{ label: 'Descripción', value: String(detalles.descripcion) }] : []),
        ]}
      />
    )
  }

  if (solicitud.tipo === 'Incentivos y premios') {
    const adjArchivo = solicitud.archivos?.find(a => a.tipo_doc === 'incentivo_adjunto')
    const adjLegacy = detalles.archivo_adjunto as { url?: string } | undefined
    const adjUrl = adjArchivo?.url ?? adjLegacy?.url
    return (
      <div className="space-y-3">
        {
          <SolicitudResumenFilas
            rows={[
              { label: 'Fecha', value: String(detalles.fecha ?? '-') },
              { label: 'Descripción', value: String(detalles.descripcion ?? '-') },
              ...(detalles.monto != null ? [{ label: 'Monto', value: formatCurrency(detalles.monto) }] : []),
            ]}
          />
        }
        {adjUrl ? (
          <a
            href={adjUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#002868] underline font-medium"
          >
            Abrir archivo adjunto
          </a>
        ) : null}
      </div>
    )
  }

  if (solicitud.tipo === 'Cambio de puesto/sucursal') {
    const dash = (value: unknown): string => {
      if (value == null) return '—'
      const text = String(value).trim()
      return text.length > 0 ? text : '—'
    }
    return (
      <SolicitudResumenFilas
        rows={[
          { label: 'Fecha efectiva', value: dash(detalles.fecha_efectiva) },
          { label: 'Nuevo puesto (ID)', value: dash(detalles.puesto_id_nuevo) },
          { label: 'Nueva sucursal (ID)', value: dash(detalles.sucursal_id_nueva) },
          { label: 'Motivo', value: dash(detalles.motivo) },
        ]}
      />
    )
  }

  if (!solicitud.detalles) return null

  return (
    <pre className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-xs text-[#444] whitespace-pre-wrap">
      {JSON.stringify(solicitud.detalles, null, 2)}
    </pre>
  )
}
