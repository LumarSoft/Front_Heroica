import Link from 'next/link'
import { CalendarX2, CloudDownload } from 'lucide-react'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'
import { formatRangoFechas } from '@/lib/formatters'
import { urlTraerDias } from '@/lib/ventas-rangos'

interface VentasPeriodoSinImportarProps {
  desde: string
  hasta: string
  puedeImportar: boolean
}

/**
 * El período elegido no tiene ningún día importado: se dice eso en vez de mostrar
 * indicadores en $0, que se leerían como "no se vendió nada".
 */
export function VentasPeriodoSinImportar({ desde, hasta, puedeImportar }: VentasPeriodoSinImportarProps) {
  return (
    <div className={`${VENTAS_CARD_CLASS} px-6 py-14 flex flex-col items-center text-center`}>
      <span className="mb-4 w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <CalendarX2 className="w-7 h-7" />
      </span>
      <h2 className="text-lg font-bold text-[#002868]">No hay ventas importadas {formatRangoFechas(desde, hasta)}</h2>
      <p className="mt-1 max-w-md text-sm text-[#5A6B8C]">
        Esos días todavía no se trajeron de Hiopos, por eso no hay números para mostrar.
      </p>
      {puedeImportar && (
        <Link
          href={urlTraerDias(desde, hasta)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#002868] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003d8f]"
        >
          <CloudDownload className="w-4 h-4" />
          Traer esos días
        </Link>
      )}
    </div>
  )
}
