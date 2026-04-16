'use client'

import { XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RechazarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  motivoRechazo: string
  onMotivoChange: (motivo: string) => void
  onConfirm: () => void
  isSaving: boolean
}

export function RechazarDialog({
  open,
  onOpenChange,
  motivoRechazo,
  onMotivoChange,
  onConfirm,
  isSaving,
}: RechazarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-white border-[#E0E0E0] shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-[#F0F0F0] bg-[#F8F9FA]/50">
          <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-rose-600" strokeWidth={2} />
            </div>
            Rechazar Movimiento
          </DialogTitle>
          <DialogDescription className="text-[#666666] mt-2">
            Explica brevemente por qué se rechaza esta solicitud.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="motivoRechazo" className="text-xs font-bold text-[#5A6070] uppercase tracking-wider">
              Justificación del rechazo
            </Label>
            <Textarea
              id="motivoRechazo"
              value={motivoRechazo}
              onChange={e => onMotivoChange(e.target.value)}
              placeholder="Ej: Monto incorrecto o falta comprobante..."
              rows={3}
              className="rounded-xl border-[#E0E0E0] text-sm focus:border-rose-500 focus:ring-rose-500/10 resize-none"
            />
            <p className="text-[10px] text-[#8A8F9C]">Este mensaje será visible para el empleado en su historial.</p>
          </div>
        </div>
        <DialogFooter className="p-6 bg-[#F8F9FA]/50 border-t border-[#F0F0F0] sm:justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-11 px-6 rounded-xl border-[#E0E0E0] text-[#5A6070] font-semibold hover:bg-white transition-all cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSaving || !motivoRechazo.trim()}
            className="h-11 px-8 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:shadow-none"
          >
            {isSaving ? 'Rechazando...' : 'Confirmar Rechazo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
