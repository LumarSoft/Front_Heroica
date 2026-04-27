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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MESES, YEAR_OPTIONS } from './constants'
import type { EscalaSalarial } from '@/lib/types'

interface EscalaFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<EscalaSalarial, 'id'>) => Promise<void>
  saving: boolean
  initial: EscalaSalarial | null
  defaultMes: number
  defaultAnio: number
}

export function EscalaFormDialog({
  open,
  onClose,
  onSave,
  saving,
  initial,
  defaultMes,
  defaultAnio,
}: EscalaFormDialogProps) {
  const [puesto, setPuesto] = useState('')
  const [sueldoBase, setSueldoBase] = useState('')
  const [valorHora, setValorHora] = useState('')
  const [mes, setMes] = useState(String(defaultMes))
  const [anio, setAnio] = useState(String(defaultAnio))

  useEffect(() => {
    if (!open) return
    if (initial) {
      setPuesto(initial.puesto)
      setSueldoBase(String(initial.sueldo_base))
      setValorHora(initial.valor_hora !== null ? String(initial.valor_hora) : '')
      setMes(String(initial.mes))
      setAnio(String(initial.anio))
    } else {
      setPuesto('')
      setSueldoBase('')
      setValorHora('')
      setMes(String(defaultMes))
      setAnio(String(defaultAnio))
    }
  }, [open, initial, defaultMes, defaultAnio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!puesto.trim() || !sueldoBase) return
    await onSave({
      puesto: puesto.trim(),
      sueldo_base: Number(sueldoBase),
      mes: Number(mes),
      anio: Number(anio),
      valor_hora: valorHora !== '' ? Number(valorHora) : null,
    })
  }

  const isEdit = initial !== null

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#002868]">
            {isEdit ? 'Editar Escala Salarial' : 'Nueva Escala Salarial'}
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            {isEdit ? 'Modificá los datos de la escala.' : 'Completá los datos de la nueva escala.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mes</Label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Año</Label>
                <Select value={anio} onValueChange={setAnio}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="puesto">Puesto</Label>
              <Input
                id="puesto"
                placeholder="Ej: Operario, Supervisor..."
                value={puesto}
                onChange={e => setPuesto(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sueldo">Sueldo Base (ARS)</Label>
                <Input
                  id="sueldo"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Ej: 250000"
                  value={sueldoBase}
                  onChange={e => setSueldoBase(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor_hora">Valor / Hora (ARS)</Label>
                <Input
                  id="valor_hora"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Ej: 1500"
                  value={valorHora}
                  onChange={e => setValorHora(e.target.value)}
                />
              </div>
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
              disabled={saving || !puesto.trim() || !sueldoBase}
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
