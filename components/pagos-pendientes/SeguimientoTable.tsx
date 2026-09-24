import { StatusBadge } from '@/components/caja/StatusBadge'
import { SeguimientoEstadoDetalle } from '@/components/pagos-pendientes/SeguimientoEstadoDetalle'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ESTADO_COLOR_MAP, formatFecha, formatMonto, truncarTexto } from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

interface SeguimientoTableProps {
  solicitudes: PagoPendiente[]
}

export function SeguimientoTable({ solicitudes }: SeguimientoTableProps) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-[#E0E0E0] bg-[#F8F9FA] hover:bg-[#F8F9FA]">
            <TableHead className="text-xs font-bold uppercase tracking-wider text-[#002868]">Fecha</TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-[#002868]">Solicitud</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-[#002868]">
              Monto
            </TableHead>
            <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-[#002868]">
              Estado
            </TableHead>
            <TableHead className="text-xs font-bold uppercase tracking-wider text-[#002868]">Seguimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitudes.map(solicitud => (
            <TableRow
              key={solicitud.id}
              className="border-b border-[#E0E0E0]/60 transition-colors hover:bg-[#F8F9FA]/70"
            >
              <TableCell className="whitespace-nowrap font-medium text-[#1A1A1A]">
                {formatFecha(solicitud.fecha)}
              </TableCell>
              <TableCell className="max-w-sm">
                <p className="font-semibold text-[#1A1A1A]">{solicitud.concepto || 'Sin concepto'}</p>
                <p className="mt-0.5 text-xs text-[#666666]" title={solicitud.comentarios || ''}>
                  {truncarTexto(solicitud.comentarios, 80)}
                </p>
              </TableCell>
              <TableCell className="whitespace-nowrap text-right text-sm font-black text-rose-700">
                {formatMonto(Math.abs(solicitud.monto), solicitud.moneda)}
              </TableCell>
              <TableCell className="text-center">
                <StatusBadge value={solicitud.estado} colorMap={ESTADO_COLOR_MAP} />
              </TableCell>
              <TableCell>
                <SeguimientoEstadoDetalle solicitud={solicitud} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
