'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { selectClasses, labelClasses, inputClasses } from '@/lib/dialog-styles'
import { API_ENDPOINTS, API_URL } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import type { Transaction, SelectOption } from '@/lib/types'
import { ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner' // using sonner since it's what hook uses

interface Sucursal {
  id: number
  nombre: string
  activo: boolean
}

interface MoverMovimientoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  currentSucursalId: number
  onSuccess: () => void
  bancosExternos?: SelectOption[]
  mediosPagoExternos?: SelectOption[]
}

export function MoverMovimientoDialog({
  open,
  onOpenChange,
  transaction,
  currentSucursalId,
  onSuccess,
  bancosExternos = [],
  mediosPagoExternos = [],
}: MoverMovimientoDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(false)

  const [formData, setFormData] = useState({
    destino_sucursal_id: '',
    destino_tipo_movimiento: '',
    destino_saldo: '',
    banco_id: '',
    medio_pago_id: '',
    numero_cheque: '',
    banco: '',
    cuenta: '',
    cbu: '',
    tipo_operacion: '',
    nota_descripcion: '',
    es_credito: false,
  })

  // Checkbox is only valid/visible if destination branch is different from origin branch
  const isDifferentSucursal =
    formData.destino_sucursal_id !== '' && formData.destino_sucursal_id !== currentSucursalId.toString()

  useEffect(() => {
    if (open) {
      setIsLoadingSucursales(true)
      apiFetch(API_ENDPOINTS.SUCURSALES.GET_ALL)
        .then(r => r.json())
        .then(d => {
          if (d.success) setSucursales(d.data.filter((s: Sucursal) => s.activo))
        })
        .finally(() => setIsLoadingSucursales(false))

      setFormData({
        destino_sucursal_id: currentSucursalId.toString(),
        destino_tipo_movimiento: transaction?.tipo_movimiento === 'efectivo' ? 'banco' : 'efectivo',
        destino_saldo: transaction?.estado === 'completado' ? 'saldo_real' : 'saldo_necesario',
        banco_id: transaction?.banco_id?.toString() || '',
        medio_pago_id: transaction?.medio_pago_id?.toString() || '',
        numero_cheque: transaction?.numero_cheque || '',
        banco: transaction?.banco || '',
        cuenta: transaction?.cuenta || '',
        cbu: transaction?.cbu || '',
        tipo_operacion: transaction?.tipo_operacion || '',
        nota_descripcion: `Movido desde ${transaction?.tipo_movimiento === 'efectivo' ? 'Efectivo' : 'Banco'}`,
        es_credito: false,
      })
    }
  }, [open, transaction, currentSucursalId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData(prev => ({ ...prev, [e.target.name]: value }))
  }

  const handleSave = async () => {
    if (!transaction) return
    if (!formData.destino_sucursal_id || !formData.destino_tipo_movimiento || !formData.destino_saldo) {
      toast.error('Faltan datos obligatorios.')
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch(`${API_URL}/api/movimientos/${transaction.id}/mover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Movimiento movido correctamente.')
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(data.message || 'Error al mover movimiento.')
      }
    } catch (error) {
      toast.error('Error de red al mover.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!transaction) return null

  const isDestinoBanco = formData.destino_tipo_movimiento === 'banco'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              </div>
              Mover Movimiento
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-2">
              Mueve este registro hacia otra sucursal o caja.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label className={labelClasses}>Sucursal Destino</Label>
            <select
              name="destino_sucursal_id"
              value={formData.destino_sucursal_id}
              onChange={handleInputChange}
              className={selectClasses}
              disabled={isLoadingSucursales}
            >
              <option value="">Seleccione sucursal</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className={labelClasses}>Caja Destino</Label>
              <select
                name="destino_tipo_movimiento"
                value={formData.destino_tipo_movimiento}
                onChange={handleInputChange}
                className={selectClasses}
              >
                <option value="efectivo">Efectivo</option>
                <option value="banco">Banco</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClasses}>Saldo Destino</Label>
              <select
                name="destino_saldo"
                value={formData.destino_saldo}
                onChange={handleInputChange}
                className={selectClasses}
              >
                <option value="saldo_real">Saldo Real (Completado)</option>
                <option value="saldo_necesario">Saldo Necesario</option>
              </select>
            </div>
          </div>

          {isDestinoBanco && (
            <div className="space-y-4 mt-4 p-4 bg-[#F8F9FA] rounded-md border border-[#E0E0E0]">
              <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest">Datos Bancarios</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Banco</Label>
                  <select
                    name="banco_id"
                    value={formData.banco_id}
                    onChange={handleInputChange}
                    className={selectClasses}
                  >
                    <option value="">Seleccione banco</option>
                    {bancosExternos.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Medio de Pago</Label>
                  <select
                    name="medio_pago_id"
                    value={formData.medio_pago_id}
                    onChange={handleInputChange}
                    className={selectClasses}
                  >
                    <option value="">Seleccione medio</option>
                    {mediosPagoExternos.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(() => {
                const selectedMedio = mediosPagoExternos.find(m => m.id.toString() === formData.medio_pago_id)
                const isCheque = selectedMedio && /cheque|echeq/i.test(selectedMedio.nombre)
                return isCheque ? (
                  <div className="space-y-1.5">
                    <Label className={labelClasses}>N° de Cheque</Label>
                    <Input
                      name="numero_cheque"
                      value={formData.numero_cheque}
                      onChange={handleInputChange}
                      placeholder="Ej: 00012345"
                      className={inputClasses}
                    />
                  </div>
                ) : null
              })()}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className={labelClasses}>Nota de Movimiento (se anexa a Descripción)</Label>
            <Input
              name="nota_descripcion"
              value={formData.nota_descripcion}
              onChange={handleInputChange}
              className={inputClasses}
            />
          </div>

          {isDifferentSucursal && (
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] cursor-pointer hover:bg-[#F0F2F5] transition-colors">
                <input
                  type="checkbox"
                  name="es_credito"
                  checked={formData.es_credito}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-[#C0C0C0] text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#1A1A1A]">Es Crédito</span>
                  <span className="text-xs text-[#666666]">
                    Genera automáticamente las contrapartes de deuda en ambas sucursales.
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
          <DialogFooter className="sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] hover:border-[#C0C0C0] transition-all cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Mover'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
