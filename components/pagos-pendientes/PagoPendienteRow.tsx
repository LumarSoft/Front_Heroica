'use client'

import { Check, Megaphone, User, X } from 'lucide-react'
import { SeguimientoEstadoDetalle } from '@/components/pagos-pendientes/SeguimientoEstadoDetalle'
import { StatusBadge } from '@/components/caja/StatusBadge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  ESTADO_COLOR_MAP,
  formatFecha,
  formatMonto,
  PRIORIDAD_COLOR_MAP,
  TIPO_MOVIMIENTO_COLOR_MAP,
  truncarTexto,
} from '@/lib/formatters'
import type { PagoPendiente } from '@/lib/types'

interface PagoPendienteRowProps {
  pago: PagoPendiente
  activeTab: 'pendientes' | 'historial'
  showAcciones: boolean
  isReadOnly: boolean
  isSelected: boolean
  onToggle: () => void
  onAprobar: (pago: PagoPendiente) => void
  onRechazar: (pago: PagoPendiente) => void
}

export function PagoPendienteRow({
  pago,
  activeTab,
  showAcciones,
  isReadOnly,
  isSelected,
  onToggle,
  onAprobar,
  onRechazar,
}: PagoPendienteRowProps) {
  const comentarios = pago.comentarios || ''
  const tieneNotaSistema = comentarios.includes('[Nota del sistema:')
  const comentarioUsuario = tieneNotaSistema ? comentarios.split('[Nota del sistema:')[0].trim() : comentarios
  const notaSistema = tieneNotaSistema ? comentarios.split('[Nota del sistema:')[1].split(']')[0].trim() : ''
  const tipo = pago.tipo === 'egreso' || (!pago.tipo && Number(pago.monto) < 0) ? 'egreso' : 'ingreso'

  return (
    <TableRow className="border-b border-[#E0E0E0]/50 transition-colors hover:bg-[#F8F9FA]/50">
      {showAcciones && (
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={onToggle} aria-label={`Seleccionar ${pago.concepto}`} />
        </TableCell>
      )}
      <TableCell className="font-medium text-[#1A1A1A]">{formatFecha(pago.fecha)}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-semibold text-[#1A1A1A]">{pago.concepto}</span>
          {tieneNotaSistema ? (
            <div className="mt-1 flex flex-col gap-1.5">
              {comentarioUsuario && (
                <span className="inline-block text-xs text-[#666666]" title={comentarioUsuario}>
                  {truncarTexto(comentarioUsuario)}
                </span>
              )}
              <div className="mt-0.5 flex w-fit max-w-sm items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                <Megaphone className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <span className="whitespace-normal break-words font-medium leading-snug">
                  {truncarTexto(notaSistema)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-[#666666]" title={comentarios}>
              {truncarTexto(comentarios)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {pago.usuario_creador_nombre ? (
          <div className="flex items-center gap-1.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#002868]/10">
              <User className="size-3.5 text-[#002868]" />
            </div>
            <span
              className="max-w-[120px] truncate text-sm font-medium text-[#1A1A1A]"
              title={pago.usuario_creador_nombre}
            >
              {pago.usuario_creador_nombre.split(' ')[0]}
            </span>
          </div>
        ) : (
          <span className="text-sm text-[#999999]">-</span>
        )}
      </TableCell>
      <TableCell
        className={`text-right text-sm font-black ${Number(pago.monto) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
      >
        {formatMonto(Math.abs(Number(pago.monto)))}
      </TableCell>
      <TableCell className="text-center">
        <StatusBadge value={tipo} colorMap={TIPO_MOVIMIENTO_COLOR_MAP} />
      </TableCell>
      <TableCell className="text-center">
        <StatusBadge value={pago.prioridad} colorMap={PRIORIDAD_COLOR_MAP} />
      </TableCell>
      <TableCell className="text-center">
        <StatusBadge value={pago.estado} colorMap={ESTADO_COLOR_MAP} />
      </TableCell>
      {activeTab === 'historial' && (
        <TableCell>
          <SeguimientoEstadoDetalle solicitud={pago} />
        </TableCell>
      )}
      {showAcciones && (
        <TableCell className="text-center">
          {pago.estado === 'pendiente' && (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                onClick={() => !isReadOnly && onAprobar(pago)}
                disabled={isReadOnly}
                title={isReadOnly ? 'Sucursal inactiva' : 'Aprobar pago'}
                className="flex size-8 items-center justify-center rounded-lg border-none bg-emerald-500 p-0 text-white shadow-sm transition-all hover:bg-emerald-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <Check className="size-4" strokeWidth={2.5} />
              </Button>
              <Button
                size="sm"
                onClick={() => !isReadOnly && onRechazar(pago)}
                disabled={isReadOnly}
                title={isReadOnly ? 'Sucursal inactiva' : 'Rechazar pago'}
                className="flex size-8 items-center justify-center rounded-lg border-none bg-rose-500 p-0 text-white shadow-sm transition-all hover:bg-rose-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <X className="size-4" strokeWidth={2.5} />
              </Button>
            </div>
          )}
        </TableCell>
      )}
    </TableRow>
  )
}
