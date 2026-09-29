import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface VentasAlertaIntegracionesProps {
  alertas: string[]
}

/** Aviso en el panel cuando una integración necesita atención. */
export function VentasAlertaIntegraciones({ alertas }: VentasAlertaIntegracionesProps) {
  if (alertas.length === 0) return null

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-amber-800 space-y-1">
        {alertas.map(a => (
          <p key={a}>{a}</p>
        ))}
      </div>
      <Link href="/ventas/integraciones" className="text-sm font-semibold text-amber-800 underline whitespace-nowrap">
        Ver integraciones
      </Link>
    </div>
  )
}
