'use client'

import { useState } from 'react'
import { ExternalLink, FileImage, FileText, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { openPersonalArchivo } from '@/lib/document-url'
import { estadoVencimiento, formatFecha, isImagen, shortFilename } from '@/lib/personal-documentos'
import type { PersonalArchivo } from '@/lib/types'

interface ArchivoRowProps {
  archivo: PersonalArchivo
  canEliminar: boolean
  onDeleted: (docId: number) => void
  personalId: number
}

export function DocumentoArchivoRow({ archivo, canEliminar, onDeleted, personalId }: ArchivoRowProps) {
  const [deleting, setDeleting] = useState(false)
  const esImg = isImagen(archivo.nombre_original, archivo.url)
  const Icon = esImg ? FileImage : FileText
  const esDirecto = Boolean(archivo.documento_id)

  async function handleDelete() {
    if (!archivo.documento_id) return
    setDeleting(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.PERSONAL.DELETE_DOCUMENTO(personalId, archivo.documento_id), {
        method: 'DELETE',
      })
      const data: { message?: string } = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Error al eliminar')
        return
      }
      toast.success('Documento eliminado')
      onDeleted(archivo.documento_id)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeleting(false)
    }
  }

  async function handleOpen() {
    try {
      await openPersonalArchivo(personalId, archivo.url)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo abrir el archivo')
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F7FA] transition-colors group">
      <Button
        type="button"
        variant="ghost"
        onClick={handleOpen}
        className="h-auto p-0 text-left flex items-center gap-3 flex-1 min-w-0"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            esImg ? 'bg-violet-50 text-violet-600' : 'bg-[#EEF3FF] text-[#002868]'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{archivo.label}</p>
          <p className="text-[11px] text-[#8A8F9C] truncate" title={archivo.nombre_original ?? ''}>
            {shortFilename(archivo.nombre_original)}
          </p>
          <p className="text-[11px] text-[#5A6070] truncate">
            Subido por: {archivo.subido_por_nombre ?? 'No informado'}
          </p>
          {archivo.tipo_doc === 'carnet_manipulacion_alimentos' && archivo.fecha_vencimiento && (
            <p
              className={
                estadoVencimiento(archivo.fecha_vencimiento) === 'Vencido'
                  ? 'text-[11px] text-rose-700'
                  : 'text-[11px] text-amber-700'
              }
            >
              {estadoVencimiento(archivo.fecha_vencimiento)} · vence: {formatFecha(archivo.fecha_vencimiento)}
            </p>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[10px] text-[#9AA0AC]">{formatFecha(archivo.fecha_solicitud)}</span>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700">
            {archivo.estado}
          </span>
        </div>
        <ExternalLink className="w-4 h-4 text-[#C8CCD4] group-hover:text-[#002868] transition-colors shrink-0" />
      </Button>

      {canEliminar && esDirecto && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-50 text-[#C8CCD4] hover:text-rose-500 cursor-pointer shrink-0"
          aria-label="Eliminar documento"
        >
          {deleting ? <LoadingSpinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      )}
    </div>
  )
}
