import Link from 'next/link'
import { AlertTriangle, CalendarCheck } from 'lucide-react'
import { formatFecha, formatHaceCuanto, formatRangoFechas, pluralDias } from '@/lib/formatters'
import { toDateOnly } from '@/lib/downloadBlob'
import { urlTraerDias } from '@/lib/ventas-rangos'
import type { CoberturaVentas } from '@/lib/types'

interface VentasCoberturaAvisoProps {
  cobertura: CoberturaVentas | null
  /** Si puede ir a Integraciones a traer los días que faltan. */
  puedeImportar: boolean
}

const MAX_TRAMOS_VISIBLES = 3

/** Deja claro qué días hay importados y si al período elegido le faltan días. */
export function VentasCoberturaAviso({ cobertura, puedeImportar }: VentasCoberturaAvisoProps) {
  if (!cobertura?.desde || !cobertura.hasta) return null

  const faltan = cobertura.diasFaltantesEnPeriodo
  const tramos = cobertura.faltantesEnPeriodo.slice(0, MAX_TRAMOS_VISIBLES)
  const tramosTexto = tramos
    .map(t => (t.desde === t.hasta ? formatFecha(t.desde) : `${formatFecha(t.desde)} al ${formatFecha(t.hasta)}`))
    .join(' · ')
  const hayMas = cobertura.faltantesEnPeriodo.length > MAX_TRAMOS_VISIBLES
  // Días posteriores al último importado (hasta ayer: hoy todavía se está vendiendo).
  const ayer = toDateOnly(new Date(Date.now() - 86_400_000))
  const desdeSiguiente = toDateOnly(new Date(new Date(`${cobertura.hasta}T12:00:00`).getTime() + 86_400_000))
  const atrasado = cobertura.hasta < ayer

  return (
    <div className="mb-4 space-y-2">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#5A6B8C]">
        <CalendarCheck className="w-4 h-4 text-emerald-600" />
        <span>
          Ventas importadas{' '}
          <strong className="text-[#1E293B]">{formatRangoFechas(cobertura.desde, cobertura.hasta)}</strong>
        </span>
        {cobertura.ultimaActualizacion && (
          <span className="text-[#7A93BB]">· actualizado {formatHaceCuanto(cobertura.ultimaActualizacion)}</span>
        )}
        {atrasado && puedeImportar && (
          <Link
            href={urlTraerDias(desdeSiguiente, toDateOnly(new Date()))}
            className="font-semibold text-[#002868] underline"
          >
            Traer desde el {formatFecha(desdeSiguiente)} hasta hoy
          </Link>
        )}
      </p>
      {faltan > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            El período elegido tiene <strong>{pluralDias(faltan)} sin importar</strong>: {tramosTexto}
            {hayMas ? ' y otros' : ''}. Los números de esos días no están incluidos.
          </span>
          {puedeImportar && (
            <Link
              href={urlTraerDias(
                cobertura.faltantesEnPeriodo[0].desde,
                cobertura.faltantesEnPeriodo[cobertura.faltantesEnPeriodo.length - 1].hasta,
              )}
              className="font-semibold underline whitespace-nowrap"
            >
              Traer esos días
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
