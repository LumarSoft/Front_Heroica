'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, ClipboardList, Loader2, XCircle } from 'lucide-react'
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
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import type { RhSolicitud } from '@/lib/types'

interface AprobarSolicitudDialogProps {
  solicitud: RhSolicitud | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  canAprobar: boolean
}

export function AprobarSolicitudDialog({
  solicitud,
  open,
  onOpenChange,
  onSuccess,
  canAprobar,
}: AprobarSolicitudDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdateEstado = async (nuevoEstado: 'Aprobada' | 'Rechazada') => {
    if (!solicitud) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.UPDATE_ESTADO(solicitud.id), {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al actualizar estado')

      toast.success(`Solicitud ${nuevoEstado.toLowerCase()} correctamente.`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] bg-gradient-to-br from-[#002868]/5 to-transparent">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#002868] flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Detalle de Solicitud
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5A6070] mt-1">
              Información completa de la solicitud registrada.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Tipo</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">{solicitud.tipo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Fecha</p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {format(new Date(solicitud.fecha_solicitud), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Colaborador</p>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {solicitud.personal_nombre ? (
                  <>
                    {solicitud.personal_nombre} <span className="text-[#888] font-normal">#{solicitud.legajo}</span>
                  </>
                ) : (
                  <span className="italic text-[#888]">General / Sin asignar</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Estado</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                  solicitud.estado === 'Pendiente'
                    ? 'bg-amber-100 text-amber-700'
                    : solicitud.estado === 'Aprobada'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {solicitud.estado}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-1">Solicitante (Usuario)</p>
            <p className="text-sm text-[#1A1A1A]">{solicitud.usuario_nombre}</p>
          </div>

          {solicitud.observaciones && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9AA0AC] mb-2">Observaciones</p>
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E0E0E0] text-sm text-[#444]">
                {solicitud.observaciones}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
          <DialogFooter className="sm:justify-end gap-3">
            {canAprobar && isPendiente ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateEstado('Rechazada')}
                  disabled={isSubmitting}
                  className="h-10 px-4 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleUpdateEstado('Aprobada')}
                  disabled={isSubmitting}
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Aprobar
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-6 border-[#E0E0E0] text-[#5A6070]"
              >
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
