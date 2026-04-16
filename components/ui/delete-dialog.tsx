'use client'

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDialogProps {
  open: boolean
  nombre: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({ open, nombre, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-rose-600">Confirmar Eliminación</DialogTitle>
        </DialogHeader>
        <p className="text-[#666666] text-sm py-2">
          ¿Estás seguro de eliminar <span className="font-semibold text-[#1A1A1A]">&quot;{nombre}&quot;</span>? Esta
          acción no se puede deshacer.
        </p>
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
