'use client'

import { useRef, useState } from 'react'
import { FileText, Loader2, Paperclip, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { toast } from 'sonner'

export interface SolicitudArchivoAdjuntoProps {
  label: string
  url: string
  nombre: string
  accept: string
  uploadHint?: string
  onUpload: (url: string, nombre: string) => void
  onRemove: () => void
}

export function SolicitudArchivoAdjunto({
  label,
  url,
  nombre,
  accept,
  uploadHint,
  onUpload,
  onRemove,
}: SolicitudArchivoAdjuntoProps) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch(API_ENDPOINTS.RRHH_SOLICITUDES.UPLOAD_ARCHIVO, {
        method: 'POST',
        body: fd,
        headers: {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al subir archivo')
      onUpload(data.data.url, data.data.nombre_original)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">{label}</Label>
      {uploadHint ? <p className="text-[11px] text-[#8A8F9C]">{uploadHint}</p> : null}
      {url ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] px-3 py-1.5">
          <FileText className="w-3.5 h-3.5 text-[#002868] shrink-0" />
          <span className="text-xs text-[#1A1A1A] truncate flex-1">{nombre}</span>
          <button type="button" onClick={onRemove} className="text-[#8A8F9C] hover:text-rose-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 w-full rounded-lg border border-dashed border-[#C0C8D8] bg-[#F8F9FA] px-3 py-1.5 text-xs text-[#5A6070] hover:border-[#002868] hover:text-[#002868] transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          {uploading ? 'Subiendo...' : 'Adjuntar archivo'}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
    </div>
  )
}
