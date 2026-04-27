'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Puesto } from '@/lib/types'

interface PuestosTableProps {
  puestos: Puesto[]
  onEdit: (puesto: Puesto) => void
  onDelete: (puesto: Puesto) => void
}

export function PuestosTable({ puestos, onEdit, onDelete }: PuestosTableProps) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA] border-b-2 border-[#E0E0E0]">
            <TableHead className="font-bold text-[#002868] text-xs uppercase tracking-wider">
              Nombre
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {puestos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-[#666666] py-16">
                <p className="font-medium">No hay puestos cargados para esta sucursal.</p>
              </TableCell>
            </TableRow>
          ) : (
            puestos.map(puesto => (
              <TableRow
                key={puesto.id}
                onClick={() => onEdit(puesto)}
                className="hover:bg-[#F8F9FA]/50 transition-colors border-b border-[#E0E0E0]/50 cursor-pointer"
              >
                <TableCell className="font-medium text-[#1A1A1A]">{puesto.nombre}</TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); onDelete(puesto) }}
                    className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    aria-label="Eliminar puesto"
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
  )
}
