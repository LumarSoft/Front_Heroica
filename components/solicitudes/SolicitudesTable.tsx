'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { RhSolicitud } from '@/lib/types'

interface SolicitudesTableProps {
  solicitudes: RhSolicitud[]
  onSelect: (solicitud: RhSolicitud) => void
}

function formatFecha(fecha: string) {
  try {
    const [year, month, day] = fecha.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  } catch {
    return fecha
  }
}

export function SolicitudesTable({ solicitudes, onSelect }: SolicitudesTableProps) {
  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Aprobada':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Rechazada':
        return 'bg-rose-50 text-rose-600 border-rose-200'
      case 'Cancelada':
        return 'bg-slate-50 text-slate-600 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getTipoLabel = (tipo: string) => {
    return tipo
  }

  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider w-32">
              Fecha
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">
              Tipo
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden sm:table-cell">
              Colaborador
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden md:table-cell">
              Solicitante
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitudes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[#666666] py-16">
                <p className="font-medium">No se encontraron solicitudes.</p>
              </TableCell>
            </TableRow>
          ) : (
            solicitudes.map(solicitud => (
              <TableRow
                key={solicitud.id}
                onClick={() => onSelect(solicitud)}
                className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50 cursor-pointer"
              >
                <TableCell className="text-[#666666] font-medium">
                  {formatFecha(solicitud.fecha_solicitud)}
                </TableCell>
                <TableCell className="font-semibold text-[#1A1A1A]">
                  {getTipoLabel(solicitud.tipo)}
                </TableCell>
                <TableCell className="text-[#444] hidden sm:table-cell">
                  {solicitud.personal_nombre ? (
                    <div className="flex flex-col">
                      <span>{solicitud.personal_nombre}</span>
                      <span className="text-xs text-slate-400">#{solicitud.legajo}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">General</span>
                  )}
                </TableCell>
                <TableCell className="text-[#666666] hidden md:table-cell">
                  {solicitud.usuario_nombre}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getEstadoClasses(
                      solicitud.estado,
                    )}`}
                  >
                    {solicitud.estado}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
