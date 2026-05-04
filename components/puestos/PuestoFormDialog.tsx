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
import type { Area, Puesto } from '@/lib/types'

interface PuestoFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (nombre: string, area_id: number) => Promise<void>
  saving: boolean
  initial: Puesto | null
  areas: Area[]
}

export function PuestoFormDialog({ open, onClose, onSave, saving, initial, areas }: PuestoFormDialogProps) {
  const [nombre, setNombre] = useState('')
  const [areaId, setAreaId] = useState<number | ''>('')

  useEffect(() => {
    if (!open) return
    setNombre(initial?.nombre ?? '')
    setAreaId(initial?.area_id ?? '')
  }, [open, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !areaId) return
    await onSave(nombre.trim(), Number(areaId))
  }

  const isEdit = initial !== null
  const canSubmit = nombre.trim() && areaId !== ''

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">
            {isEdit ? 'Editar Puesto' : 'Nuevo Puesto'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isEdit ? 'Modificá los datos del puesto.' : 'Ingresá los datos del nuevo puesto.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-2 space-y-4">
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

            <div className="space-y-1.5">
              <Label htmlFor="area">Área</Label>
              <select
                id="area"
                value={areaId}
                onChange={e => setAreaId(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccioná un área...</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
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
              disabled={saving || !canSubmit}
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
