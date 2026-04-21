import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Tarea } from './types'

interface DeleteDialogProps {
  tarea: Tarea | null
  onClose: () => void
  onConfirm: () => Promise<void>
  deleting: boolean
}

export function DeleteDialog({ tarea, onClose, onConfirm, deleting }: DeleteDialogProps) {
  return (
    <Dialog open={!!tarea} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-rose-600">Eliminar Tarea</DialogTitle>
          <DialogDescription className="text-slate-500">Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        {tarea && (
          <div className="py-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-semibold text-slate-800 text-sm">{tarea.titulo}</p>
              {tarea.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tarea.descripcion}</p>}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={deleting}
            className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
          >
            {deleting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando...
              </span>
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
