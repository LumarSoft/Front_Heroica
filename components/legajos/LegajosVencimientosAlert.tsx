import { AlertTriangle } from 'lucide-react'
import type { Personal } from '@/lib/types'

interface LegajosVencimientosAlertProps {
  personal: Personal[]
}

function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function descripcionDias(dias: number): string {
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${dias === -1 ? '' : 's'}`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${dias} día${dias === 1 ? '' : 's'}`
}

export function LegajosVencimientosAlert({ personal }: LegajosVencimientosAlertProps) {
  const vencimientos = personal.flatMap(persona =>
    (persona.vencimientos_proximos ?? []).map(vencimiento => ({ persona, vencimiento })),
  )

  if (vencimientos.length === 0) return null

  return (
    <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            {vencimientos.length} vencimiento{vencimientos.length === 1 ? '' : 's'} de documentos para revisar
          </p>
          <p className="mt-0.5 text-xs text-amber-800">Se muestran los documentos vencidos y los próximos a vencer.</p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {vencimientos.map(({ persona, vencimiento }) => (
              <li key={`${persona.id}-${vencimiento.tipo}-${vencimiento.label}`}>
                <span className="font-semibold">{persona.nombre}:</span> {vencimiento.label} ·{' '}
                {descripcionDias(vencimiento.dias_restantes)} ({formatFecha(vencimiento.fecha_vencimiento)})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
