'use client'

import { Receipt } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorBanner } from '@/components/ui/error-banner'
import { ContentLoadingSpinner } from '@/components/ui/loading-spinner'
import { useOperacionVentaDetalle } from '@/hooks/use-operacion-venta-detalle'
import { formatCantidad, formatFecha, formatMonto } from '@/lib/formatters'
import type { OperacionVenta } from '@/lib/types'
import { OperacionVentaLineas } from './OperacionVentaLineas'

interface OperacionVentaDetalleDialogProps {
  operacion: OperacionVenta | null
  onClose: () => void
}

export function OperacionVentaDetalleDialog({ operacion, onClose }: OperacionVentaDetalleDialogProps) {
  const { lineas, isLoading, error } = useOperacionVentaDetalle(operacion)

  return (
    <Dialog open={operacion !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] bg-white border-[#E0E0E0] shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-[#F0F0F0] bg-[#F8F9FA]/50">
          <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#002868]/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#002868]" />
            </span>
            Operación {operacion?.transaccionId}
          </DialogTitle>
          {operacion && (
            <DialogDescription className="text-[#666666] mt-2">
              {formatFecha(operacion.fecha)}
              {operacion.fechaHora ? ` · ${operacion.fechaHora.slice(11, 16)} h` : ''} ·{' '}
              {operacion.sucursal ?? `${operacion.localExterno ?? 'Local'} (sin asignar)`} · Bistrosoft
              {operacion.anulada ? ' · Anulada' : ''}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <ErrorBanner error={error} />
          {isLoading ? <ContentLoadingSpinner /> : <OperacionVentaLineas lineas={lineas} />}
        </div>
        {operacion && (
          <div className="px-6 py-4 border-t border-[#F0F0F0] flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
            <span className="text-[#5A6B8C]">
              Unidades: <strong className="text-[#1E293B]">{formatCantidad(operacion.unidades, 2)}</strong>
            </span>
            <span className="text-[#5A6B8C]">
              Total productos: <strong className="text-[#1E293B]">{formatMonto(operacion.total)}</strong>
            </span>
            <span className="text-[#5A6B8C]">
              Cobrado: <strong className="text-[#1E293B]">{formatMonto(operacion.cobrado)}</strong>
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
