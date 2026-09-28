'use client'

import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { API_ENDPOINTS } from '@/lib/config'
import { openArchivo } from '@/lib/document-url'
import type { RhSolicitud } from '@/lib/types'
import { SolicitudResumenFilas } from './SolicitudResumenFilas'

interface LicenciaDetallesResumenProps {
  solicitud: RhSolicitud
}

export function LicenciaDetallesResumen({ solicitud }: LicenciaDetallesResumenProps) {
  const detalles = (solicitud.detalles ?? {}) as Record<string, unknown>
  const constancia = solicitud.archivos?.find(archivo => archivo.tipo_doc === 'licencia_constancia')

  async function abrirConstancia() {
    if (!constancia) return
    try {
      await openArchivo(API_ENDPOINTS.RRHH_SOLICITUDES.OPEN_ARCHIVO(solicitud.id), { url: constancia.url })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo abrir la constancia')
    }
  }

  return (
    <div className="space-y-3">
      <SolicitudResumenFilas
        rows={[
          { label: 'Tipo', value: String(detalles.tipo_licencia ?? '-') },
          { label: 'Desde', value: String(detalles.fecha_desde ?? '-') },
          { label: 'Hasta', value: String(detalles.fecha_hasta ?? '-') },
          { label: 'Motivo', value: String(detalles.motivo ?? '-') },
        ]}
      />
      {constancia && (
        <Button
          type="button"
          variant="outline"
          onClick={abrirConstancia}
          className="w-full h-auto justify-start whitespace-normal text-left"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Ver constancia de licencia: {constancia.nombre_original ?? 'Archivo adjunto'}</span>
        </Button>
      )}
    </div>
  )
}
