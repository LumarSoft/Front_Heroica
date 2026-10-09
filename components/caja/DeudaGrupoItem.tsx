'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFecha, formatMonto } from '@/lib/formatters'
import { esPrestamo, type DeudaAgrupada, type FiltroTipoDeuda } from '@/lib/deudas'

interface DeudaGrupoItemProps {
  grupo: DeudaAgrupada
  tipo: FiltroTipoDeuda
  abierta: boolean
  onToggle: () => void
}

export function DeudaGrupoItem({ grupo, tipo, abierta, onToggle }: DeudaGrupoItemProps) {
  const situacionDeuda = grupo.esTercero ? 'Deuda · debemos' : 'Deuda · le debemos'
  const situacionPrestamo = grupo.esTercero ? 'Préstamo · nos deben' : 'Préstamo · nos debe'

  return (
    <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full h-auto p-4 rounded-none flex justify-between hover:bg-[#F8F9FA]"
      >
        <span className="flex items-center gap-2 font-bold text-[#002868]">
          {abierta ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {grupo.sucursal}
          <span className="text-xs font-medium text-[#8A8F9C]">{grupo.moneda}</span>
        </span>
        <span className="flex gap-5 text-xs">
          {tipo !== 'deudas' && (
            <span className="text-emerald-700">
              A cobrar <b>{formatMonto(grupo.aCobrar, grupo.moneda)}</b>
            </span>
          )}
          {tipo !== 'prestamos' && (
            <span className="text-rose-700">
              A pagar <b>{formatMonto(grupo.aPagar, grupo.moneda)}</b>
            </span>
          )}
          {tipo === 'todos' && (
            <span className={grupo.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
              Neto <b>{formatMonto(Math.abs(grupo.balance), grupo.moneda)}</b>
            </span>
          )}
        </span>
      </Button>
      {abierta && (
        <div className="border-t bg-[#FAFBFC] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-[#5A6070]">
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Descripción</th>
                <th className="text-left p-3">Observaciones</th>
                <th className="text-left p-3">Situación</th>
                <th className="text-right p-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {grupo.movimientos.map(deuda => (
                <tr key={deuda.id} className="border-t border-[#ECEEF1]">
                  <td className="p-3 whitespace-nowrap">{formatFecha(deuda.fecha)}</td>
                  <td className="p-3 font-semibold">{deuda.descripcion || 'Sin descripción'}</td>
                  <td className="p-3 text-xs text-[#777]">{deuda.comentarios || '—'}</td>
                  <td className={`p-3 whitespace-nowrap ${esPrestamo(deuda) ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {esPrestamo(deuda) ? situacionPrestamo : situacionDeuda}
                  </td>
                  <td className="p-3 text-right font-bold">{formatMonto(Math.abs(deuda.monto), grupo.moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
