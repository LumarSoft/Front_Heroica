'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { MESES } from './constants'
import type { Sucursal } from '@/lib/types'

interface EscalaCopyDialogProps {
  open: boolean
  onClose: () => void
  onCopy: (destinoIds: number[]) => Promise<void>
  copying: boolean
  origenSucursalId: number
  mes: number
  anio: number
}

export function EscalaCopyDialog({
  open,
  onClose,
  onCopy,
  copying,
  origenSucursalId,
  mes,
  anio,
}: EscalaCopyDialogProps) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    if (!open) return
    setSelected([])
    apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL)
      .then(r => r.json())
      .then(d => {
        const all: Sucursal[] = d.data ?? d
        setSucursales(all.filter(s => s.id !== origenSucursalId && s.activo))
      })
      .catch(() => setSucursales([]))
  }, [open, origenSucursalId])

  const toggle = (id: number) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    if (selected.length === sucursales.length) setSelected([])
    else setSelected(sucursales.map(s => s.id))
  }

  const handleConfirm = async () => {
    if (selected.length === 0) return
    await onCopy(selected)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">Aplicar a otras sucursales</DialogTitle>
          <DialogDescription className="text-slate-500">
            Se copiarán las escalas de {MESES[mes - 1]} {anio} a las sucursales seleccionadas. Si ya tienen escalas para
            ese período, serán reemplazadas.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-1 max-h-64 overflow-y-auto">
          {sucursales.length === 0 ? (
            <p className="text-sm text-[#9AA0AC] text-center py-4">No hay otras sucursales disponibles</p>
          ) : (
            <>
              <div
                className="flex items-center gap-3 px-2 py-2 mb-1 border-b border-slate-100 cursor-pointer rounded-md hover:bg-slate-50 select-none"
                onClick={toggleAll}
              >
                <Checkbox
                  checked={selected.length === sucursales.length && sucursales.length > 0}
                  className="pointer-events-none"
                />
                <span className="text-sm font-semibold text-[#002868]">Seleccionar todas</span>
              </div>
              {sucursales.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-2 py-2 cursor-pointer rounded-md hover:bg-slate-50 select-none"
                  onClick={() => toggle(s.id)}
                >
                  <Checkbox checked={selected.includes(s.id)} className="pointer-events-none" />
                  <span className="text-sm text-[#1A1A1A]">{s.nombre}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={copying} className="cursor-pointer">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={copying || selected.length === 0}
            className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white"
          >
            {copying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : (
              `Aplicar a ${selected.length > 0 ? selected.length : ''} sucursal${selected.length !== 1 ? 'es' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
