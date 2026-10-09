'use client'

import { useCallback, useEffect, useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmailsInput, parsearEmails } from './EmailsInput'
import { SaldosTabla, SucursalBloque } from './ResumenSucursalBloque'
import type { ResumenAlcance, ResumenTesoreria } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Moneda = ResumenTesoreria['moneda']
type Alcance = ResumenAlcance
interface ResumenTesoreriaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Sin sucursal (ej. desde el listado de sucursales) el resumen es siempre de todas. */
  sucursalId?: number
  moneda?: Moneda
  alcanceInicial?: Alcance
}

function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: Array<{ valor: T; etiqueta: string }>
  valor: T
  onChange: (valor: T) => void
}) {
  return (
    <div className="inline-flex rounded-lg bg-[#ECEEF1] p-[3px]">
      {opciones.map(opcion => (
        <button
          key={opcion.valor}
          type="button"
          onClick={() => onChange(opcion.valor)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer ${
            valor === opcion.valor ? 'bg-white text-[#002868] shadow-sm' : 'text-[#888] hover:text-[#002868]/70'
          }`}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  )
}

export function ResumenTesoreriaDialog({
  open,
  onOpenChange,
  sucursalId,
  moneda: monedaInicial = 'ARS',
  alcanceInicial = 'sucursal',
}: ResumenTesoreriaDialogProps) {
  const user = useAuthStore(state => state.user)
  const [alcance, setAlcance] = useState<Alcance>(sucursalId ? alcanceInicial : 'todas')
  const [moneda, setMoneda] = useState<Moneda>(monedaInicial)
  const [resumen, setResumen] = useState<ResumenTesoreria | null>(null)
  const [destinatarios, setDestinatarios] = useState<string[]>([])
  const [emailNuevo, setEmailNuevo] = useState('')
  const [comentario, setComentario] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const hoy = new Date()
  const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const sucursalConsulta = alcance === 'todas' || !sucursalId ? 'todas' : sucursalId

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setResumen(null)
    try {
      const response = await apiFetch(
        API_ENDPOINTS.MOVIMIENTOS.GET_RESUMEN_DIARIO(sucursalConsulta, moneda, fechaLocal),
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'No se pudo cargar el resumen')
      setResumen(data.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen')
    } finally {
      setIsLoading(false)
    }
  }, [fechaLocal, moneda, sucursalConsulta])

  useEffect(() => {
    if (!open) return
    setAlcance(sucursalId ? alcanceInicial : 'todas')
    setMoneda(monedaInicial)
    setDestinatarios(user?.email ? [user.email.toLowerCase()] : [])
    setEmailNuevo('')
    setComentario('')
  }, [open, sucursalId, alcanceInicial, monedaInicial, user?.email])

  useEffect(() => {
    if (open) void cargar()
  }, [cargar, open])

  const enviar = async () => {
    const { validos, invalidos } = parsearEmails(emailNuevo)
    if (invalidos.length) {
      toast.error(`Email inválido: ${invalidos.join(', ')}`)
      return
    }
    const lista = [...new Set([...destinatarios, ...validos])]
    if (lista.length === 0) return
    setDestinatarios(lista)
    setEmailNuevo('')
    setIsSending(true)
    setError('')
    try {
      const response = await apiFetch(API_ENDPOINTS.MOVIMIENTOS.EMAIL_RESUMEN_DIARIO, {
        method: 'POST',
        body: JSON.stringify({
          sucursal_id: sucursalConsulta,
          moneda,
          fecha: fechaLocal,
          destinatarios: lista,
          comentario: comentario.trim(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'No se pudo enviar el resumen')
      toast.success(data.message || 'Resumen enviado por email')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el resumen')
    } finally {
      setIsSending(false)
    }
  }

  const titulo =
    resumen?.alcance === 'todas'
      ? 'Todas las sucursales'
      : (resumen?.sucursales[0]?.sucursal ?? 'Resumen de la sucursal')
  const hayDestinatarios = destinatarios.length > 0 || emailNuevo.trim() !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[92vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#002868] flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Resumen diario de tesorería
          </DialogTitle>
          <DialogDescription>
            {resumen
              ? `${titulo} · ${resumen.moneda} · Caja efectivo y Caja banco`
              : 'Movimientos de ayer, hoy y mañana con los saldos de ambas cajas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {sucursalId && (
            <Segmentado<Alcance>
              opciones={[
                { valor: 'sucursal', etiqueta: 'Esta sucursal' },
                { valor: 'todas', etiqueta: 'Todas las sucursales' },
              ]}
              valor={alcance}
              onChange={setAlcance}
            />
          )}
          <Segmentado<Moneda>
            opciones={[
              { valor: 'ARS', etiqueta: 'ARS' },
              { valor: 'USD', etiqueta: 'USD' },
            ]}
            valor={moneda}
            onChange={setMoneda}
          />
        </div>

        {error && <p className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>}
        {isLoading && <p className="py-16 text-center text-sm text-[#666]">Cargando resumen...</p>}
        {resumen && (
          <div className="space-y-8">
            {resumen.alcance === 'todas' && resumen.sucursales.length > 1 && (
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  Consolidado ({resumen.sucursales.length} sucursales)
                </h3>
                <SaldosTabla saldos={resumen.totales} moneda={resumen.moneda} />
              </section>
            )}
            {resumen.sucursales.length === 0 && <p className="text-sm text-[#999]">No hay sucursales para mostrar.</p>}
            {resumen.sucursales.map(sucursal => (
              <div
                key={sucursal.sucursalId}
                className={resumen.alcance === 'todas' ? 'pt-6 border-t-2 border-[#002868]/20' : ''}
              >
                <SucursalBloque sucursal={sucursal} moneda={resumen.moneda} />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <div className="space-y-1.5">
            <Label htmlFor="comentarioResumen">Comentario (opcional, va arriba de todo en el mail)</Label>
            <Textarea
              id="comentarioResumen"
              value={comentario}
              onChange={event => setComentario(event.target.value)}
              maxLength={2000}
              placeholder="Ej.: Ojo con los cheques de mañana en Alto Rosario."
              className="min-h-[64px]"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="space-y-1.5 flex-1 w-full">
              <Label htmlFor="emailResumen">Enviar a</Label>
              <EmailsInput
                id="emailResumen"
                emails={destinatarios}
                onEmailsChange={setDestinatarios}
                pendiente={emailNuevo}
                onPendienteChange={setEmailNuevo}
              />
              <p className="text-[11px] text-[#888]">Escribí un email y presioná Enter o coma para agregar otro.</p>
            </div>
            <Button
              onClick={enviar}
              disabled={!resumen || isSending || !hayDestinatarios}
              className="bg-[#002868] hover:bg-[#003d8f] sm:mb-5"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Enviando...' : 'Enviar resumen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
