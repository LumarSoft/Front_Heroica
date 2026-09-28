import type { EmpleadoNovedadData } from '@/lib/types'

const todayStr = new Date().toISOString().split('T')[0]
export function parseEmpleadosFromDetalles(raw: unknown[]): EmpleadoNovedadData[] {
  return raw.map((e: unknown) => {
    const row = e as Record<string, unknown>
    const aperc = (row.apercibimiento ?? {}) as Record<string, unknown>
    const susp = (row.suspension ?? {}) as Record<string, unknown>
    const desc = (row.descuento ?? {}) as Record<string, unknown>
    const ausJ = (row.ausencias_justificadas ?? {}) as Record<string, unknown>
    const ausI = (row.ausencias_injustificadas ?? {}) as Record<string, unknown>
    const tard = (row.tardanzas ?? {}) as Record<string, unknown>
    return {
      personal_id: Number(row.personal_id),
      personal_nombre: String(row.personal_nombre ?? ''),
      puesto_id: row.puesto_id != null ? Number(row.puesto_id) : null,
      cambio_puesto: Boolean(row.cambio_puesto),
      nuevo_puesto_id: row.nuevo_puesto_id ? String(row.nuevo_puesto_id) : '',
      fecha_alta_puesto: String(row.fecha_alta_puesto ?? todayStr),
      horas_trabajadas: row.horas_trabajadas != null ? String(row.horas_trabajadas) : '',
      horas_feriados: row.horas_feriados != null ? String(row.horas_feriados) : '',
      horas_extras_autorizadas: Boolean(row.horas_extras_autorizadas),
      horas_extras_cantidad: row.horas_extras_cantidad != null ? String(row.horas_extras_cantidad) : '',
      incentivos: Array.isArray(row.incentivos) ? row.incentivos : [],
      apercibimiento: Boolean(aperc.tiene),
      apercibimiento_motivo: String(aperc.motivo ?? ''),
      apercibimiento_archivo_url: String(aperc.archivo_url ?? ''),
      apercibimiento_archivo_nombre: String(aperc.archivo_nombre ?? ''),
      suspension: Boolean(susp.tiene),
      suspension_motivo: String(susp.motivo ?? ''),
      suspension_archivo_url: String(susp.archivo_url ?? ''),
      suspension_archivo_nombre: String(susp.archivo_nombre ?? ''),
      descuento: Boolean(desc.tiene),
      descuento_monto: desc.monto != null ? String(desc.monto) : '',
      descuento_motivo: String(desc.motivo ?? ''),
      aus_just_tiene: Boolean(ausJ.tiene),
      aus_just_cantidad: ausJ.cantidad != null ? String(ausJ.cantidad) : '',
      aus_just_unidad: (ausJ.unidad ?? 'horas') as 'horas' | 'minutos',
      aus_just_motivo: String(ausJ.motivo ?? ''),
      aus_injust_cantidad: ausI.cantidad != null ? String(ausI.cantidad) : '',
      aus_injust_unidad: (ausI.unidad ?? 'horas') as 'horas' | 'minutos',
      aus_injust_motivo: String(ausI.motivo ?? ''),
      observaciones: String(row.observaciones ?? ''),
      tardanzas_tiene: Boolean(tard.tiene),
      tardanzas_cantidad: tard.cantidad != null ? String(tard.cantidad) : '',
      tardanzas_unidad: (tard.unidad ?? 'horas') as 'horas' | 'minutos',
      tardanzas_motivo: String(tard.motivo ?? ''),
    }
  })
}

export function readAdjuntoIndividual(
  detalles: Record<string, unknown>,
  slotKey: string,
): { url: string; nombre: string } {
  const slot = detalles[slotKey] as Record<string, unknown> | null | undefined
  if (!slot || typeof slot !== 'object' || typeof slot.url !== 'string' || !slot.url.trim()) {
    return { url: '', nombre: '' }
  }
  const nombre_original =
    typeof slot.nombre_original === 'string' && slot.nombre_original.trim() ? slot.nombre_original.trim() : ''
  return { url: String(slot.url).trim(), nombre: nombre_original }
}

export function readAltaAdjuntoSlot(detalles: Record<string, unknown>, key: string): { url: string; nombre: string } {
  const adjuntos = detalles.adjuntos as Record<string, { url?: string; nombre_original?: string } | null> | undefined
  const slot = adjuntos?.[key]
  if (!slot?.url) return { url: '', nombre: '' }
  return {
    url: String(slot.url),
    nombre: slot.nombre_original ? String(slot.nombre_original) : '',
  }
}
