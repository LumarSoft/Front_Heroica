'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { LABELS_DOCUMENTOS, shortFilename } from '@/lib/personal-documentos'
import type { PersonalArchivo } from '@/lib/types'

interface UploadFormProps {
  personalId: number
  tipoDoc: string
  onUploaded: (archivo: PersonalArchivo) => void
  onCancel: () => void
}

export function DocumentoUploadForm({ personalId, tipoDoc, onUploaded, onCancel }: UploadFormProps) {
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    if (tipoDoc === 'carnet_manipulacion_alimentos' && !fechaVencimiento) {
      toast.error('Indicá la fecha de vencimiento del carnet')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo_doc', tipoDoc)
      if (fechaVencimiento) fd.append('fecha_vencimiento', fechaVencimiento)

      const res = await apiFetch(API_ENDPOINTS.PERSONAL.UPLOAD_DOCUMENTO(personalId), {
        method: 'POST',
        body: fd,
      })
      const data: {
        message?: string
        data?: Pick<PersonalArchivo, 'url' | 'fecha_vencimiento' | 'subido_por_nombre'> & { id: number }
      } = await res.json()
      if (!res.ok || !data.data) {
        toast.error(data.message || 'Error al subir el documento')
        return
      }
      toast.success('Documento adjuntado correctamente')
      onUploaded({
        label: LABELS_DOCUMENTOS[tipoDoc],
        tipo_doc: tipoDoc,
        url: data.data.url,
        nombre_original: file.name,
        solicitud_id: 0,
        solicitud_tipo: 'Legajo',
        fecha_solicitud: new Date().toISOString(),
        estado: 'Aprobada',
        documento_id: data.data.id,
        fecha_vencimiento: data.data.fecha_vencimiento ?? null,
        subido_por_nombre: data.data.subido_por_nombre ?? null,
      })
    } catch {
      toast.error('Error de conexión al subir el documento')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#002868]/20 bg-[#F0F4FF] p-4 space-y-3">
      <p className="text-xs font-semibold text-[#002868] uppercase tracking-wider">Adjuntar documento</p>

      <p className="text-sm font-semibold text-[#1A1A1A]">{LABELS_DOCUMENTOS[tipoDoc]}</p>

      <div>
        <Label className="text-xs text-[#5A6070] font-medium block mb-1">
          Fecha de vencimiento {tipoDoc === 'carnet_manipulacion_alimentos' ? '*' : '(opcional)'}
        </Label>
        <Input
          type="date"
          value={fechaVencimiento}
          onChange={e => setFechaVencimiento(e.target.value)}
          className="w-full text-sm rounded-lg border border-[#E5E9F0] px-3 py-2 outline-none focus:border-[#002868] focus:ring-2 focus:ring-[#002868]/15 transition bg-white"
        />
      </div>

      <div>
        <Label className="text-xs text-[#5A6070] font-medium block mb-1">Archivo (PDF, JPG, PNG — máx. 10 MB)</Label>
        <div
          className="flex items-center gap-2 rounded-lg border border-dashed border-[#C8CCD4] bg-white px-3 py-2 cursor-pointer hover:border-[#002868] transition"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 text-[#9AA0AC] shrink-0" />
          <span className="text-sm text-[#5A6070] truncate flex-1">
            {file ? shortFilename(file.name) : 'Seleccionar archivo…'}
          </span>
        </div>
        <Input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 px-3 text-xs text-[#5A6070] cursor-pointer"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={uploading || !file || (tipoDoc === 'carnet_manipulacion_alimentos' && !fechaVencimiento)}
          className="h-8 px-3 text-xs bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
        >
          {uploading ? <LoadingSpinner className="w-3.5 h-3.5 mr-1.5" /> : null}
          {uploading ? 'Subiendo…' : 'Adjuntar'}
        </Button>
      </div>
    </form>
  )
}
