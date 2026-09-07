'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { SelectOption } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AprobarMasivoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cantidad: number
  isSaving: boolean
  onConfirm: (datos: {
    tipo_caja: 'efectivo' | 'banco'
    banco_id?: number
    medio_pago_id?: number
    numero_cheque?: string
  }) => void
}

export function AprobarMasivoDialog({ open, onOpenChange, cantidad, isSaving, onConfirm }: AprobarMasivoDialogProps) {
  const [tipoCaja, setTipoCaja] = useState<'efectivo' | 'banco'>('efectivo')
  const [bancoId, setBancoId] = useState('')
  const [medioPagoId, setMedioPagoId] = useState('')
  const [numeroCheque, setNumeroCheque] = useState('')
  const [bancos, setBancos] = useState<SelectOption[]>([])
  const [medios, setMedios] = useState<SelectOption[]>([])

  useEffect(() => {
    if (!open) return
    void Promise.all([
      apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL).then(res => res.json()),
      apiFetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL).then(res => res.json()),
    ]).then(([bancosData, mediosData]) => {
      setBancos(bancosData.data ?? [])
      setMedios(mediosData.data ?? [])
    })
  }, [open])

  const bancoIncompleto = tipoCaja === 'banco' && (!bancoId || !medioPagoId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#002868]">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Aprobar {cantidad} pagos
          </DialogTitle>
          <DialogDescription>
            La caja y los datos bancarios elegidos se aplicarán a toda la selección.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Caja de destino</Label>
            <Select value={tipoCaja} onValueChange={value => setTipoCaja(value as 'efectivo' | 'banco')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Caja efectivo</SelectItem>
                <SelectItem value="banco">Caja banco</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tipoCaja === 'banco' && (
            <>
              <div className="space-y-2">
                <Label>Banco *</Label>
                <Select value={bancoId} onValueChange={setBancoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {bancos.map(item => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Medio de pago *</Label>
                <Select value={medioPagoId} onValueChange={setMedioPagoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar medio" />
                  </SelectTrigger>
                  <SelectContent>
                    {medios.map(item => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroChequeMasivo">N° de cheque / eCheq (opcional)</Label>
                <Input
                  id="numeroChequeMasivo"
                  value={numeroCheque}
                  onChange={event => setNumeroCheque(event.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onConfirm({
                tipo_caja: tipoCaja,
                banco_id: bancoId ? Number(bancoId) : undefined,
                medio_pago_id: medioPagoId ? Number(medioPagoId) : undefined,
                numero_cheque: numeroCheque.trim() || undefined,
              })
            }
            disabled={isSaving || bancoIncompleto}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? 'Aprobando...' : 'Aprobar selección'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
