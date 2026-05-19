'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, ClipboardList, Loader2, Pencil, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import type { RhSolicitud } from '@/lib/types'
import { SolicitudDetallesResumen } from './SolicitudDetallesResumen'

interface AprobarSolicitudDialogProps {
  solicitud: RhSolicitud | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  canAprobar: boolean
  canEditar: boolean
  canCancelar: boolean
  onEdit: (solicitud: RhSolicitud) => void
}

export function AprobarSolicitudDialog({
  solicitud,
  open,
  onOpenChange,
  onSuccess,
  canAprobar,
  canEditar,
  canCancelar,
  onEdit,
}: AprobarSolicitudDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')

  useEffect(() => {
    if (!open) {
      setMotivoRechazo('')
      setMotivoCancelacion('')
    }
  }, [open])

  async function handleRequest(url: string, body: Record<string, unknown>, successMessage: string) {
    setIsSubmitting(true)
    try {
      const res = await apiFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al actualizar la solicitud')

      toast.success(successMessage)
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!solicitud) return null

  const isPendiente = solicitud.estado === 'Pendiente'
  const canEditCurrent = canEditar && isPendiente
  const canCancelCurrent = canCancelar && isPendiente

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] bg-gradient-to-br from-[#002868]/5 to-transparent">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Detalle de Solicitud
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5A6070] mt-1">
              Información completa, resolución e historial de la solicitud registrada.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Tipo</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{solicitud.tipo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Sucursal</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{solicitud.sucursal_nombre}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Fecha</p>
              <p className="text-sm font-medium text-[#1A1A1A]">{format(new Date(solicitud.fecha_solicitud), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Estado</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${solicitud.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' : solicitud.estado === 'Aprobada' ? 'bg-emerald-100 text-emerald-700' : solicitud.estado === 'Rechazada' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                {solicitud.estado}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Colaborador</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{solicitud.personal_nombre ? `${solicitud.personal_nombre} #${solicitud.legajo ?? '-'}` : 'General / Sin asignar'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Solicitante</p>
              <p className="text-sm text-[#1A1A1A]">{solicitud.usuario_nombre}</p>
            </div>
          </div>

          {solicitud.detalles && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Datos de la solicitud</p>
              <SolicitudDetallesResumen solicitud={solicitud} />
            </div>
          )}

          {solicitud.observaciones && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Observaciones</p>
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-sm text-[#444]">{solicitud.observaciones}</div>
            </div>
          )}

          {solicitud.motivo_resolucion && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Motivo de resolución</p>
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-sm text-[#444]">{solicitud.motivo_resolucion}</div>
            </div>
          )}

          {isPendiente && canAprobar && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Motivo de rechazo</p>
              <Textarea value={motivoRechazo} onChange={event => setMotivoRechazo(event.target.value)} placeholder="Obligatorio solo si rechazás la solicitud" className="min-h-[90px] resize-none rounded-lg border border-[#E0E0E0]" />
            </div>
          )}

          {isPendiente && canCancelCurrent && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Motivo de cancelación</p>
              <Textarea value={motivoCancelacion} onChange={event => setMotivoCancelacion(event.target.value)} placeholder="Opcional. Si no lo completás, se usará un texto por defecto." className="min-h-[80px] resize-none rounded-lg border border-[#E0E0E0]" />
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Historial</p>
            <div className="space-y-2">
              {(solicitud.historial ?? []).map(item => (
                <div key={item.id} className="rounded-lg border border-[#E0E0E0] bg-[#FAFBFC] px-3 py-2">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{item.evento}</p>
                  <p className="text-xs text-[#5A6070]">{item.usuario_nombre ?? 'Sistema'} · {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  {item.detalle && <p className="text-sm text-[#444] mt-1">{item.detalle}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
          <DialogFooter className="sm:justify-between gap-3">
            <div className="flex gap-3">
              {canEditCurrent && (
                <Button variant="outline" onClick={() => onEdit(solicitud)} className="h-10 px-4 border-[#D8E3F8] text-[#002868]">
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
              {canCancelCurrent && (
                <Button variant="outline" onClick={() => handleRequest(API_ENDPOINTS.RRHH_SOLICITUDES.CANCEL(solicitud.id), { motivo_resolucion: motivoCancelacion.trim() || null }, 'Solicitud cancelada correctamente.')} disabled={isSubmitting} className="h-10 px-4 border-slate-200 text-slate-700">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>

            {canAprobar && isPendiente ? (
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  if (!motivoRechazo.trim()) {
                    toast.error('Ingrese un motivo para rechazar la solicitud.')
                    return
                  }
                  void handleRequest(API_ENDPOINTS.RRHH_SOLICITUDES.UPDATE_ESTADO(solicitud.id), { estado: 'Rechazada', motivo_resolucion: motivoRechazo.trim() }, 'Solicitud rechazada correctamente.')
                }} disabled={isSubmitting} className="h-10 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button onClick={() => void handleRequest(API_ENDPOINTS.RRHH_SOLICITUDES.UPDATE_ESTADO(solicitud.id), { estado: 'Aprobada', motivo_resolucion: null }, 'Solicitud aprobada correctamente.')} disabled={isSubmitting} className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Aprobar
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 border-[#E0E0E0] text-[#5A6070]">
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
