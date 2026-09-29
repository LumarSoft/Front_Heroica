import Link from 'next/link'
import { AlertTriangle, ArrowLeftRight, Info } from 'lucide-react'
import { formatRangoFechas } from '@/lib/formatters'
import { urlTraerDias } from '@/lib/ventas-rangos'
import type { PanelVentas } from '@/lib/types'

interface VentasComparacionInfoProps {
  comparacion: PanelVentas['comparacion']
  puedeImportar: boolean
}

/**
 * Explica contra qué se comparan los indicadores. Si el período comparado no está
 * importado (ej. "vs. año anterior" sin datos de hace un año), lo dice en vez de
 * mostrar caídas del 100% que no son reales.
 */
export function VentasComparacionInfo({ comparacion: c, puedeImportar }: VentasComparacionInfoProps) {
  const rango = formatRangoFechas(c.desde, c.hasta)
  const contra = c.tipo === 'anio_anterior' ? 'el mismo período del año anterior' : 'el período anterior'
  const enlace = puedeImportar && (
    <Link href={urlTraerDias(c.desde, c.hasta)} className="font-semibold underline whitespace-nowrap">
      Traer esos días
    </Link>
  )

  if (c.diasConDatos === 0) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#5A6B8C]">
        <Info className="w-4 h-4 text-[#7A93BB]" />
        <span>
          No se puede comparar contra {contra}: no hay ventas importadas {rango}.
        </span>
        {enlace}
      </p>
    )
  }

  if (c.diasConDatos < c.diasTotales) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4" />
        <span>
          Comparación parcial: de {contra} ({rango}) solo hay {c.diasConDatos} de {c.diasTotales} días importados. Las
          variaciones pueden no ser representativas.
        </span>
        {enlace}
      </p>
    )
  }

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-[#5A6B8C]">
      <ArrowLeftRight className="w-4 h-4 text-[#7A93BB]" />
      Las variaciones comparan contra las ventas {rango}.
    </p>
  )
}
