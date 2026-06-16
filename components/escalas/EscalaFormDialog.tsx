'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MontoInput } from '@/components/ui/monto-input'
import { formatInputMonto } from '@/lib/formatters'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import { MESES, YEAR_OPTIONS } from './constants'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import type { EscalaSalarial, Puesto } from '@/lib/types'

type TipoCalculo = 'fijo' | 'por_hora'

interface EscalaFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<EscalaSalarial, 'id' | 'puesto_nombre'>) => Promise<void>
  saving: boolean
  initial: EscalaSalarial | null
  defaultMes: number
  defaultAnio: number
  sucursalId: number
}

export function EscalaFormDialog({
  open,
  onClose,
  onSave,
  saving,
  initial,
  defaultMes,
  defaultAnio,
  sucursalId,
}: EscalaFormDialogProps) {
  const [tipoCalculo, setTipoCalculo] = useState<TipoCalculo>('fijo')
  const [puestoId, setPuestoId] = useState('')
  const [sueldoBase, setSueldoBase] = useState('')
  const [valorHoraManual, setValorHoraManual] = useState('')
  const [mes, setMes] = useState(String(defaultMes))
  const [anio, setAnio] = useState(String(defaultAnio))
  const [puestos, setPuestos] = useState<Puesto[]>([])

  const valorHoraCalculado = sueldoBase !== '' ? Number(sueldoBase) / 26 / 8 : null
  const sueldoBaseCalculado = valorHoraManual !== '' ? Number(valorHoraManual) * 26 * 8 : null

  useEffect(() => {
    if (!open) return
    apiFetch(API_ENDPOINTS.PUESTOS.GET_ALL)
      .then(r => r.json())
      .then(d => setPuestos(d.data ?? d))
      .catch(() => setPuestos([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (initial) {
      setPuestoId(String(initial.puesto_id))
      setMes(String(initial.mes))
      setAnio(String(initial.anio))

      if (initial.valor_hora !== null) {
        const esperado = initial.sueldo_base / 26 / 8
        if (Math.abs(initial.valor_hora - esperado) > 0.01) {
          setTipoCalculo('por_hora')
          setValorHoraManual(String(initial.valor_hora))
          setSueldoBase('')
        } else {
          setTipoCalculo('fijo')
          setSueldoBase(String(initial.sueldo_base))
          setValorHoraManual('')
        }
      } else {
        setTipoCalculo('fijo')
        setSueldoBase(String(initial.sueldo_base))
        setValorHoraManual('')
      }
    } else {
      setTipoCalculo('fijo')
      setPuestoId('')
      setSueldoBase('')
      setValorHoraManual('')
      setMes(String(defaultMes))
      setAnio(String(defaultAnio))
    }
  }, [open, initial, defaultMes, defaultAnio])

  const handleTipoCalculo = (tipo: TipoCalculo) => {
    setTipoCalculo(tipo)
    setSueldoBase('')
    setValorHoraManual('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!puestoId) return
    if (tipoCalculo === 'fijo') {
      if (!sueldoBase) return
      await onSave({
        sucursal_id: sucursalId,
        puesto_id: Number(puestoId),
        sueldo_base: Number(sueldoBase),
        mes: Number(mes),
        anio: Number(anio),
        valor_hora: valorHoraCalculado,
      })
    } else {
      if (!valorHoraManual) return
      await onSave({
        sucursal_id: sucursalId,
        puesto_id: Number(puestoId),
        sueldo_base: sueldoBaseCalculado ?? 0,
        mes: Number(mes),
        anio: Number(anio),
        valor_hora: Number(valorHoraManual),
      })
    }
  }

  const isEdit = initial !== null
  const isSubmitDisabled = saving || !puestoId || (tipoCalculo === 'fijo' ? !sueldoBase : !valorHoraManual)

  const puestosOptions = puestos.map(p => ({ value: String(p.id), label: p.nombre }))

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#F0F2F5] shrink-0">
          <DialogTitle className="text-base font-semibold text-[#002868]">
            {isEdit ? 'Editar Escala Salarial' : 'Nueva Escala Salarial'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#5A6070]">Mes</Label>
                <Select value={mes} onValueChange={setMes}>
                  <SelectTrigger className="h-8 text-sm cursor-pointer">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#5A6070]">Año</Label>
                <Select value={anio} onValueChange={setAnio}>
                  <SelectTrigger className="h-8 text-sm cursor-pointer">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map(y => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#5A6070]">Puesto</Label>
              <Combobox
                options={puestosOptions}
                value={puestoId}
                onChange={setPuestoId}
                placeholder="Seleccioná un puesto..."
                searchPlaceholder="Buscar puesto..."
                emptyText="No se encontró el puesto"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#5A6070]">Tipo de cálculo</Label>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 w-fit">
                <button
                  type="button"
                  onClick={() => handleTipoCalculo('fijo')}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    tipoCalculo === 'fijo'
                      ? 'bg-[#002868] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 cursor-pointer',
                  )}
                >
                  Fijo
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoCalculo('por_hora')}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    tipoCalculo === 'por_hora'
                      ? 'bg-[#002868] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 cursor-pointer',
                  )}
                >
                  Por Hora
                </button>
              </div>
            </div>

            {tipoCalculo === 'fijo' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sueldo" className="text-xs font-medium text-[#5A6070]">
                    Sueldo Base (ARS)
                  </Label>
                  <MontoInput
                    id="sueldo"
                    placeholder="Ej: 250.000"
                    value={sueldoBase}
                    onChange={setSueldoBase}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valor_hora" className="text-xs font-medium text-[#5A6070]">
                    Valor / Hora (ARS)
                  </Label>
                  <Input
                    id="valor_hora"
                    readOnly
                    tabIndex={-1}
                    value={valorHoraCalculado !== null ? formatInputMonto(valorHoraCalculado.toFixed(2)) : '—'}
                    className="h-8 text-sm bg-[#F5F5F5] text-[#5A6070] cursor-default select-none"
                  />
                  <p className="text-[10px] text-[#9AA0AC]">Sueldo ÷ 26 días ÷ 8 hs</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="valor_hora_manual" className="text-xs font-medium text-[#5A6070]">
                  Valor / Hora (ARS)
                </Label>
                <MontoInput
                  id="valor_hora_manual"
                  placeholder="Ej: 1.201,92"
                  value={valorHoraManual}
                  onChange={setValorHoraManual}
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#F0F2F5] shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitDisabled}
              className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
