'use client'

import { useEffect, useState } from 'react'
import { Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatFecha, formatMonto } from '@/lib/formatters'
import type { Transaction } from '@/lib/types'

interface Props {
  transaction: Transaction | null
  isSaving: boolean
  onClose: () => void
  onConfirm: (motivo: string) => void
}

/**
 * Confirma marcar (o desmarcar) el cheque / eCheq de un movimiento como rechazado.
 * La marca es solo una etiqueta: el movimiento sigue en el mismo saldo.
 */
export function ChequeRechazadoDialog({ transaction, isSaving, onClose, onConfirm }: Props) {
  const [motivo, setMotivo] = useState('')
  const quitando = Boolean(transaction?.cheque_rechazado)

  useEffect(() => {
    if (transaction) setMotivo('')
  }, [transaction])

  return (
    <Dialog open={transaction !== null} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#1A1A1A]">
            <Ban className="h-5 w-5 text-rose-600" />
            {quitando ? 'Quitar marca de rechazado' : 'Marcar cheque como rechazado'}
          </DialogTitle>
          <DialogDescription>
            {quitando
              ? 'El cheque vuelve a verse como cargado o pendiente según tenga número.'
              : 'El movimiento queda marcado en rojo y no cambia de saldo: el pago sigue pendiente.'}
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] p-3 text-sm text-[#444444]">
            <p className="font-semibold text-[#1A1A1A]">{transaction.descripcion_nombre || transaction.concepto}</p>
            <p>
              {formatFecha(transaction.fecha)} · {formatMonto(transaction.monto)} · {transaction.medio_pago_nombre}
              {transaction.numero_cheque ? ` N° ${transaction.numero_cheque}` : ''}
            </p>
            {quitando && transaction.cheque_rechazo_motivo && (
              <p className="mt-1 text-rose-700">Motivo: {transaction.cheque_rechazo_motivo}</p>
            )}
          </div>
        )}

        {!quitando && (
          <div className="space-y-1.5">
            <Label htmlFor="motivo-rechazo" className="text-sm font-semibold text-[#1A1A1A]">
              Motivo (opcional)
            </Label>
            <Textarea
              id="motivo-rechazo"
              value={motivo}
              maxLength={255}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej.: rechazado por falta de fondos"
              className="min-h-[72px]"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(motivo)}
            disabled={isSaving}
            className={quitando ? 'bg-[#002868] hover:bg-[#003d8f]' : 'bg-rose-600 hover:bg-rose-700'}
          >
            {isSaving ? 'Guardando...' : quitando ? 'Quitar marca' : 'Marcar como rechazado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
