import type { RhSolicitud } from './types'

export function getEstadoSolicitudLabel(solicitud: RhSolicitud): string {
  const pago = solicitud.pago_tesoreria
  if (solicitud.tipo !== 'Adelantos' || solicitud.estado !== 'Aprobada' || !pago) return solicitud.estado
  if (pago.eliminado) return 'Pago eliminado en Tesorería'
  switch (pago.estado) {
    case 'completado':
      return 'Completado'
    case 'aprobado':
      return 'Proyectado en Tesorería'
    case 'rechazado':
      return 'Rechazado en Tesorería'
    default:
      return 'Pendiente de Tesorería'
  }
}
