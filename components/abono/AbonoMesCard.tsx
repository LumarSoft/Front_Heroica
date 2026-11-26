import { CheckCircle2, FileText, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { etiquetaMesAbono } from '@/lib/abono'
import { formatFechaHora, formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { FacturaAbono, MesAbono } from '@/lib/types'

interface Props {
  mes: MesAbono
  enCurso: string | null
  onCambiarEstado: (clave: string, ids: number[], abonada: boolean) => void
  onEliminar: (f: FacturaAbono) => void
  onAbrir: (f: FacturaAbono) => void
}

/** Las facturas de un mes con lo abonado y lo adeudado, y la opción de abonar el mes entero */
export function AbonoMesCard({ mes, enCurso, onCambiarEstado, onEliminar, onAbrir }: Props) {
  const pendientes = mes.facturas.filter(f => !f.abonada)
  const claveMes = `mes-${mes.clave}`

  return (
    <section
      className={cn(
        'rounded-2xl border bg-white shadow-sm',
        pendientes.length > 0 ? 'border-rose-100' : 'border-emerald-100',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">{etiquetaMesAbono(mes.mes, mes.anio)}</h2>
          <p className="text-xs text-[#5A6070]">
            Facturado {formatMonto(mes.totales.facturado)} ·{' '}
            <span className="text-emerald-700">Abonado {formatMonto(mes.totales.abonado)}</span> ·{' '}
            <span className={mes.totales.adeudado > 0 ? 'font-semibold text-rose-700' : ''}>
              Adeudado {formatMonto(mes.totales.adeudado)}
            </span>
          </p>
        </div>
        {pendientes.length > 0 && (
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={enCurso !== null}
            onClick={() =>
              onCambiarEstado(
                claveMes,
                pendientes.map(f => f.id),
                true,
              )
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            {enCurso === claveMes ? 'Marcando…' : 'Marcar mes como abonado'}
          </Button>
        )}
      </div>

      <ul className="divide-y divide-[#F0F0F0]">
        {mes.facturas.map(f => {
          const claveEstado = `estado-${f.id}`
          return (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <button
                type="button"
                onClick={() => onAbrir(f)}
                className="flex min-w-[220px] flex-1 items-start gap-2 text-left cursor-pointer group"
                title="Ver factura"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#002868]" />
                <span className="text-sm">
                  <span className="font-semibold text-[#1A1A1A] group-hover:underline">
                    {f.numero ? `Factura ${f.numero}` : (f.nombre_original ?? 'Factura')}
                  </span>
                  {f.descripcion && <span className="text-[#5A6070]"> · {f.descripcion}</span>}
                  <span className="block text-xs text-[#8A8F9C]">
                    Subida por {f.subido_por_nombre ?? 'desconocido'} el {formatFechaHora(f.created_at)}
                    {f.abonada &&
                      f.abonada_at &&
                      ` · Abonada el ${formatFechaHora(f.abonada_at)}${f.abonada_por_nombre ? ` por ${f.abonada_por_nombre}` : ''}`}
                  </span>
                </span>
              </button>
              <span className="text-sm font-semibold text-[#1A1A1A]">{formatMonto(f.monto)}</span>
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
                  f.abonada
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {f.abonada ? 'Abonada' : 'Pendiente'}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={enCurso !== null}
                onClick={() => onCambiarEstado(claveEstado, [f.id], !f.abonada)}
              >
                {f.abonada ? <Undo2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {f.abonada ? 'Volver a pendiente' : 'Marcar abonada'}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                disabled={enCurso !== null}
                onClick={() => onEliminar(f)}
                title="Eliminar factura"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
