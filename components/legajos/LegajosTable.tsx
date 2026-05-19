'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Personal } from '@/lib/types'

interface LegajosTableProps {
  personal: Personal[]
  onSelect: (persona: Personal) => void
}

function formatFecha(fecha: string) {
  const [year, month, day] = fecha.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export function LegajosTable({ personal, onSelect }: LegajosTableProps) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider w-24">
              Legajo
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">
              Nombre
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden sm:table-cell">
              DNI
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden md:table-cell">
              Puesto
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider hidden lg:table-cell">
              Incorporación
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center hidden sm:table-cell">
              Carnet
            </TableHead>
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-center">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {personal.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-[#666666] py-16">
                <p className="font-medium">No se encontraron colaboradores con los filtros aplicados.</p>
              </TableCell>
            </TableRow>
          ) : (
            personal.map(persona => (
              <TableRow
                key={persona.id}
                onClick={() => onSelect(persona)}
                className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50 cursor-pointer"
              >
                <TableCell className="font-mono text-sm text-[#666666]">
                  #{persona.legajo}
                </TableCell>
                <TableCell className="font-semibold text-[#1A1A1A]">
                  {persona.nombre}
                </TableCell>
                <TableCell className="text-[#444] hidden sm:table-cell">
                  {persona.dni}
                </TableCell>
                <TableCell className="text-[#444] hidden md:table-cell">
                  {persona.puesto_nombre ?? '—'}
                </TableCell>
                <TableCell className="text-[#666666] hidden lg:table-cell">
                  {formatFecha(persona.fecha_incorporacion)}
                </TableCell>
                <TableCell className="text-center hidden sm:table-cell">
                  {persona.carnet_manipulacion_alimentos ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#D0D0D0] mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border
                      ${persona.activo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                  >
                    {persona.activo ? 'Activo' : 'Inactivo'}
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
