'use client'

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { labelClasses, VENTAS_SELECT_CLASS } from '@/lib/dialog-styles'

interface GuardarReporteDialogProps {
  open: boolean
  inicial: { nombre: string; descripcion: string; compartido: boolean }
  /** Si se está editando uno existente, se puede guardar como nuevo. */
  editando: boolean
  puedeCompartir: boolean
  onClose: () => void
  onGuardar: (datos: { nombre: string; descripcion: string; compartido: boolean }, comoNuevo: boolean) => Promise<void>
}

export function GuardarReporteDialog({
  open,
  inicial,
  editando,
  puedeCompartir,
  onClose,
  onGuardar,
}: GuardarReporteDialogProps) {
  const [nombre, setNombre] = useState(inicial.nombre)
  const [descripcion, setDescripcion] = useState(inicial.descripcion)
  const [compartido, setCompartido] = useState(inicial.compartido)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!open) return
    setNombre(inicial.nombre)
    setDescripcion(inicial.descripcion)
    setCompartido(inicial.compartido)
  }, [open, inicial])

  const guardar = async (comoNuevo: boolean) => {
    if (!nombre.trim()) return
    setGuardando(true)
    try {
      await onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), compartido }, comoNuevo)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">
            {editando ? 'Guardar reporte' : 'Guardar como reporte'}
          </DialogTitle>
          <DialogDescription>
            Se guarda la configuración (agrupación, métricas, filtros y período relativo): cada vez que lo abras se
            recalcula con los datos del momento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Nombre</span>
            <input
              value={nombre}
              maxLength={120}
              onChange={e => setNombre(e.target.value)}
              className={`${VENTAS_SELECT_CLASS} w-full`}
              autoFocus
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClasses}>Descripción (opcional)</span>
            <input
              value={descripcion}
              maxLength={255}
              onChange={e => setDescripcion(e.target.value)}
              className={`${VENTAS_SELECT_CLASS} w-full`}
            />
          </label>
          {puedeCompartir && (
            <label className="flex items-start gap-2 text-sm text-[#1E293B] cursor-pointer">
              <input
                type="checkbox"
                checked={compartido}
                onChange={e => setCompartido(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Compartir con todos los usuarios de Ventas
                <span className="block text-xs text-[#7A93BB]">
                  Cada uno lo ve con las sucursales que tiene asignadas.
                </span>
              </span>
            </label>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={guardando} className="cursor-pointer">
            Cancelar
          </Button>
          {editando && (
            <Button
              variant="outline"
              onClick={() => guardar(true)}
              disabled={guardando || !nombre.trim()}
              className="cursor-pointer"
            >
              Guardar como nuevo
            </Button>
          )}
          <Button
            onClick={() => guardar(false)}
            disabled={guardando || !nombre.trim()}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
