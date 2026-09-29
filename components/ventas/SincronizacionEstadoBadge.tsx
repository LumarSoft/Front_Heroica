import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { SINCRONIZACION_ESTADO_COLORS, SINCRONIZACION_ESTADO_LABEL } from '@/lib/formatters'
import type { EstadoSincronizacionVentas } from '@/lib/types'

const ICONOS = {
  en_curso: Loader2,
  exitosa: CheckCircle2,
  con_observaciones: AlertTriangle,
  fallida: XCircle,
} as const

export function SincronizacionEstadoBadge({ estado }: { estado: EstadoSincronizacionVentas }) {
  const Icono = ICONOS[estado]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${SINCRONIZACION_ESTADO_COLORS[estado]}`}
    >
      <Icono className={`w-3.5 h-3.5 ${estado === 'en_curso' ? 'animate-spin' : ''}`} />
      {SINCRONIZACION_ESTADO_LABEL[estado]}
    </span>
  )
}
