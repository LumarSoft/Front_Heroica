'use client'

import { useState } from 'react'
import { ClipboardList, Loader2, Save } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import type { Personal } from '@/lib/types'

interface SolicitudDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: number
  personal: Personal[]
  onSuccess: () => void
}

const TIPOS_OPCIONES = [
  'Altas',
  'Bajas',
  'Novedades de sueldo',
  'Incentivos y premios',
  'Licencias',
  'Vacaciones',
  'Suspensiones',
  'Apercibimientos',
  'Capacitaciones',
  'Pedido de uniforme',
  'Adelantos',
]

interface FormState {
  personal_id: string
  tipo: string
  fecha_solicitud: string
  observaciones: string
}

export function SolicitudDialog({ open, onOpenChange, sucursalId, personal, onSuccess }: SolicitudDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormState>({
    personal_id: 'general',
    tipo: '',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    observaciones: '',
  })

  async function handleSave() {
    if (!form.tipo) {
      setError('Seleccione un tipo de solicitud')
      return
    }
    if (!form.fecha_solicitud) {
      setError('La fecha es obligatoria')
      return
    }

    setIsSubmitting(true)
    setError('')
    
    try {
      const payload = {
        sucursal_id: sucursalId,
        personal_id: form.personal_id === 'general' ? null : Number(form.personal_id),
        tipo: form.tipo,
        fecha_solicitud: form.fecha_solicitud,
        observaciones: form.observaciones,
        detalles: null,
      }

      const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar la solicitud')

      toast.success('La solicitud se ha creado correctamente.')
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setForm({
        personal_id: 'general',
        tipo: '',
        fecha_solicitud: new Date().toISOString().split('T')[0],
        observaciones: '',
      })
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#002868]" />
              Nueva Solicitud
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              Complete los detalles para crear una nueva solicitud.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
              Tipo de Solicitud *
            </Label>
            <Select 
              value={form.tipo} 
              onValueChange={(val) => setForm({ ...form, tipo: val })}
            >
              <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_OPCIONES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Colaborador
              </Label>
              <Select 
                value={form.personal_id} 
                onValueChange={(val) => setForm({ ...form, personal_id: val })}
              >
                <SelectTrigger className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]">
                  <SelectValue placeholder="General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">-- General / Sin asignar --</SelectItem>
                  {personal.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
                Fecha *
              </Label>
              <Input 
                type="date" 
                value={form.fecha_solicitud}
                onChange={e => setForm({ ...form, fecha_solicitud: e.target.value })}
                className="h-10 rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]" 
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider mb-2 block">
              Observaciones (Opcional)
            </Label>
            <Textarea 
              placeholder="Detalles adicionales..."
              className="min-h-[80px] resize-none rounded-lg border border-[#E0E0E0] bg-white text-sm text-[#1A1A1A]"
              value={form.observaciones}
              onChange={e => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC]">
          <DialogFooter className="sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] transition-all"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || !form.tipo}
              className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f] shadow-sm transition-all flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
