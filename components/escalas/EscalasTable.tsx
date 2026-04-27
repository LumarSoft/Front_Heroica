'use client'

import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MESES, formatCurrency } from './constants'
import type { EscalaSalarial } from '@/lib/types'

interface EscalasTableProps {
  escalas: EscalaSalarial[]
  filterMes: number
  filterAnio: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onEdit: (escala: EscalaSalarial) => void
  onDelete: (escala: EscalaSalarial) => void
}

export function EscalasTable({
  escalas,
  filterMes,
  filterAnio,
  onPrevMonth,
  onNextMonth,
  onEdit,
  onDelete,
}: EscalasTableProps) {
  const filtered = escalas.filter(e => e.mes === filterMes && e.anio === filterAnio)

  return (
    <>
      {/* Month navigator */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevMonth}
          className="h-9 w-9 cursor-pointer border-[#D8E3F8] text-[#002868] hover:bg-[#EEF3FF]"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="min-w-[160px] text-center text-base font-semibold text-[#002868]">
          {MESES[filterMes - 1]} {filterAnio}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          className="h-9 w-9 cursor-pointer border-[#D8E3F8] text-[#002868] hover:bg-[#EEF3FF]"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">
                Puesto
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-right">
                Sueldo Base
              </TableHead>
              <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider text-right">
                Valor / Hora
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[#666666] py-16">
                  <p className="font-medium">
                    No hay escalas cargadas para {MESES[filterMes - 1]} {filterAnio}.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(escala => (
                <TableRow
                  key={escala.id}
                  onClick={() => onEdit(escala)}
                  className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50 cursor-pointer"
                >
                  <TableCell className="font-medium text-[#1A1A1A]">{escala.puesto_nombre}</TableCell>
                  <TableCell className="text-right font-semibold text-[#002868]">
                    {formatCurrency(escala.sueldo_base)}
                  </TableCell>
                  <TableCell className="text-right text-[#444]">
                    {escala.valor_hora !== null ? formatCurrency(escala.valor_hora) : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => { e.stopPropagation(); onDelete(escala) }}
                      className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      aria-label="Eliminar escala"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
