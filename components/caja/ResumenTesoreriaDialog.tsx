'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { formatMonto } from '@/lib/formatters'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface MovimientoResumen {
  id: number
  concepto: string
  comentarios?: string
  monto: number
  tipo: 'ingreso' | 'egreso'
  tipo_movimiento: string
}
interface DiaResumen {
  fecha: string
  movimientos: MovimientoResumen[]
  ingresos: number
  egresos: number
  saldoFinal: number
}
interface Resumen {
  sucursal: string
  moneda: 'ARS' | 'USD'
  dias: DiaResumen[]
}
interface ResumenTesoreriaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: number
  moneda: 'ARS' | 'USD'
}

export function ResumenTesoreriaDialog({ open, onOpenChange, sucursalId, moneda }: ResumenTesoreriaDialogProps) {
  const user = useAuthStore(state => state.user)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [destinatario, setDestinatario] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const hoy = new Date()
  const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.GET_RESUMEN_DIARIO(sucursalId, moneda, fechaLocal))
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'No se pudo cargar el resumen')
      setResumen(data.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen')
    } finally {
      setIsLoading(false)
    }
  }, [fechaLocal, moneda, sucursalId])

  useEffect(() => {
    if (!open) return
    setDestinatario(user?.email ?? '')
    void cargar()
  }, [cargar, open, user?.email])

  const enviar = async () => {
    if (!destinatario.trim()) return
    setIsSending(true)
    setError('')
    try {
      const response = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.EMAIL_RESUMEN_DIARIO, {
        method: 'POST',
        body: JSON.stringify({ sucursal_id: sucursalId, moneda, fecha: fechaLocal, destinatario: destinatario.trim() }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'No se pudo enviar el resumen')
      toast.success('Resumen enviado por email')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el resumen')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[92vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#002868] flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Resumen diario de tesorería
          </DialogTitle>
          <DialogDescription>
            {resumen ? `${resumen.sucursal} · ${resumen.moneda}` : 'Pagos de ayer, hoy y mañana con saldos finales.'}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>}
        {isLoading && <p className="py-16 text-center text-sm text-[#666]">Cargando resumen...</p>}
        {resumen && (
          <div className="grid md:grid-cols-3 gap-3">
            {resumen.dias.map((dia, indice) => (
              <section key={dia.fecha} className="rounded-xl border border-[#E0E0E0] overflow-hidden flex flex-col">
                <div className="p-4 bg-[#002868] text-white">
                  <p className="font-bold text-lg">{['Ayer', 'Hoy', 'Mañana'][indice]}</p>
                  <p className="text-xs text-white/70">{dia.fecha}</p>
                </div>
                <div className="p-4 space-y-3 flex-1 max-h-64 overflow-y-auto">
                  {dia.movimientos.length === 0 && <p className="text-sm text-[#999]">Sin movimientos</p>}
                  {dia.movimientos.map(movimiento => (
                    <div key={movimiento.id} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-medium">{movimiento.concepto || 'Sin concepto'}</span>
                        <b className={movimiento.tipo === 'egreso' ? 'text-rose-700' : 'text-emerald-700'}>
                          {movimiento.tipo === 'egreso' ? '−' : '+'}
                          {formatMonto(Math.abs(movimiento.monto), resumen.moneda)}
                        </b>
                      </div>
                      <span className="text-[11px] text-[#777]">{movimiento.tipo_movimiento}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-[#F8F9FA] border-t text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Ingresos</span>
                    <b className="text-emerald-700">{formatMonto(dia.ingresos, resumen.moneda)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Egresos</span>
                    <b className="text-rose-700">{formatMonto(dia.egresos, resumen.moneda)}</b>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-sm">
                    <span>Saldo final</span>
                    <b>{formatMonto(dia.saldoFinal, resumen.moneda)}</b>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-end gap-3 pt-2 border-t">
          <div className="space-y-1.5 flex-1 w-full">
            <Label htmlFor="emailResumen">Enviar por email</Label>
            <Input
              id="emailResumen"
              type="email"
              value={destinatario}
              onChange={event => setDestinatario(event.target.value)}
              placeholder="destinatario@empresa.com"
            />
          </div>
          <Button
            onClick={enviar}
            disabled={!resumen || isSending || !destinatario.trim()}
            className="bg-[#002868] hover:bg-[#003d8f]"
          >
            <Send className="w-4 h-4" />
            {isSending ? 'Enviando...' : 'Enviar resumen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
