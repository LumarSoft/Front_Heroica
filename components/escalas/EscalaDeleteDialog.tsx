'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { EscalaSalarial } from '@/lib/types'

interface EscalaDeleteDialogProps {
  target: EscalaSalarial | null
  onClose: () => void
  onConfirm: () => Promise<void>
  deleting: boolean
}

export function EscalaDeleteDialog({ target, onClose, onConfirm, deleting }: EscalaDeleteDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1A1A1A]">Eliminar Escala</DialogTitle>
          <DialogDescription className="text-slate-500">
            ¿Estás seguro que querés eliminar el puesto{' '}
            <span className="font-semibold text-[#1A1A1A]">{target?.puesto}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
          >
            {deleting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Eliminando...</>
              : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
