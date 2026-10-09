import Link from 'next/link'
import { CloudDownload } from 'lucide-react'
import { VENTAS_CARD_CLASS } from '@/lib/dialog-styles'

interface VentasSinDatosProps {
  puedeImportar: boolean
}

/** Estado inicial: todavía no se importó ningún día de ventas. */
export function VentasSinDatos({ puedeImportar }: VentasSinDatosProps) {
  return (
    <div className={`${VENTAS_CARD_CLASS} px-6 py-16 flex flex-col items-center text-center`}>
      <span className="mb-4 w-14 h-14 rounded-2xl bg-[#EEF3FF] text-[#002868] flex items-center justify-center">
        <CloudDownload className="w-7 h-7" />
      </span>
      <h2 className="text-lg font-bold text-[#002868]">Todavía no hay ventas importadas</h2>
      <p className="mt-1 max-w-md text-sm text-[#5A6B8C]">
        Las ventas se traen desde Hiopos (HiOffice). Elegí desde qué fecha querés importarlas y el panel se completa
        solo.
      </p>
      {puedeImportar ? (
        <Link
          href="/ventas/integraciones"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#002868] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003d8f]"
        >
          <CloudDownload className="w-4 h-4" />
          Traer ventas
        </Link>
      ) : (
        <p className="mt-4 text-xs text-[#7A93BB]">Pedile a un administrador que importe las ventas.</p>
      )}
    </div>
  )
}
