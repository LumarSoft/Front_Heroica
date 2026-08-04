'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { ExportAlcanceCaja, ExportExcelOpciones, ExportTipoMovimiento, ExportTipoSaldo } from '@/lib/types'

interface OpcionRadio<T extends string> {
  valor: T
  label: string
}

interface ColumnaOpcionesProps<T extends string> {
  titulo: string
  name: string
  opciones: readonly OpcionRadio<T>[]
  seleccion: T
  onChange: (valor: T) => void
}

function ColumnaOpciones<T extends string>({ titulo, name, opciones, seleccion, onChange }: ColumnaOpcionesProps<T>) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7A93BB] mb-2">{titulo}</p>
      <div className="space-y-2">
        {opciones.map(opcion => (
          <label
            key={opcion.valor}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${seleccion === opcion.valor ? 'border-[#002868] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <input
              type="radio"
              name={name}
              value={opcion.valor}
              checked={seleccion === opcion.valor}
              onChange={() => onChange(opcion.valor)}
              className="accent-[#002868]"
            />
            <span className="font-medium text-sm text-gray-700">{opcion.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const OPCIONES_TIPO: readonly OpcionRadio<ExportTipoMovimiento>[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'ingresos', label: 'Solo Ingresos' },
  { valor: 'egresos', label: 'Solo Egresos' },
]

const OPCIONES_SALDO: readonly OpcionRadio<ExportTipoSaldo>[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'saldo_real', label: 'Saldo Real' },
  { valor: 'saldo_necesario', label: 'Saldo Necesario' },
]

interface ExportExcelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cajaActual: 'efectivo' | 'banco'
  onConfirm: (opciones: ExportExcelOpciones) => void
}

export function ExportExcelDialog({ open, onOpenChange, cajaActual, onConfirm }: ExportExcelDialogProps) {
  const [tipo, setTipo] = useState<ExportTipoMovimiento>('todos')
  const [saldo, setSaldo] = useState<ExportTipoSaldo>('todos')
  const [caja, setCaja] = useState<ExportAlcanceCaja>('actual')

  const opcionesCaja: readonly OpcionRadio<ExportAlcanceCaja>[] = [
    { valor: 'actual', label: cajaActual === 'efectivo' ? 'Solo Efectivo' : 'Solo Banco' },
    { valor: 'ambas', label: 'Ambas Cajas' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#002868] text-xl">Exportar Excel</DialogTitle>
          <DialogDescription>Elegí qué movimientos exportar</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
          <ColumnaOpciones
            titulo="Tipo"
            name="exportTipo"
            opciones={OPCIONES_TIPO}
            seleccion={tipo}
            onChange={setTipo}
          />
          <ColumnaOpciones
            titulo="Saldo"
            name="exportSaldo"
            opciones={OPCIONES_SALDO}
            seleccion={saldo}
            onChange={setSaldo}
          />
          <ColumnaOpciones
            titulo="Caja"
            name="exportCaja"
            opciones={opcionesCaja}
            seleccion={caja}
            onChange={setCaja}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm({ tipo, saldo, caja })}
            className="bg-[#002868] hover:bg-[#003d8f] text-white"
          >
            Exportar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
