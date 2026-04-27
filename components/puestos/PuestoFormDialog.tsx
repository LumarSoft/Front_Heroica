'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Puesto } from '@/lib/types'

interface PuestoFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (nombre: string) => Promise<void>
  saving: boolean
  initial: Puesto | null
}

export function PuestoFormDialog({ open, onClose, onSave, saving, initial }: PuestoFormDialogProps) {
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    if (!open) return
    setNombre(initial?.nombre ?? '')
  }, [open, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    await onSave(nombre.trim())
  }

  const isEdit = initial !== null

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">
            {isEdit ? 'Editar Puesto' : 'Nuevo Puesto'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isEdit ? 'Modificá el nombre del puesto.' : 'Ingresá el nombre del nuevo puesto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej: Operario, Supervisor..."
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !nombre.trim()}
              className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
