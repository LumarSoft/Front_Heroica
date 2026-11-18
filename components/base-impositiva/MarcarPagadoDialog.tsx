'use client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatMonto } from '@/lib/formatters'
import { formatPeriodo } from '@/lib/periodo'
import type { MovimientoImpositivo } from '@/lib/types'

interface Props {
  movimiento: MovimientoImpositivo | null
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmación de "Marcar pagado": pasa el movimiento a Saldo real, como desde la caja */
export function MarcarPagadoDialog({ movimiento, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={movimiento !== null} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>¿Marcar como pagado?</DialogTitle>
          <DialogDescription>
            {movimiento && (
              <>
                {movimiento.impuesto} {formatPeriodo(movimiento.periodo)} de {movimiento.sucursal_nombre} por{' '}
                {formatMonto(movimiento.monto, movimiento.moneda)}. Pasa a Saldo real de la caja{' '}
                {movimiento.tipo_movimiento === 'banco' ? 'banco' : 'efectivo'}, igual que al completarlo desde la caja.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700">
            Marcar pagado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
