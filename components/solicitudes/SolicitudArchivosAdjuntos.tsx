'use client'

import { useRef, useState } from 'react'
import { FileText, Loader2, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { subirArchivoSolicitud } from '@/lib/solicitud-archivo-upload'
import type { SolicitudArchivoForm } from '@/lib/types'

interface SolicitudArchivosAdjuntosProps {
  label: string
  archivos: SolicitudArchivoForm[]
  accept: string
  uploadHint?: string
  maxArchivos?: number
  onChange: (archivos: SolicitudArchivoForm[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function SolicitudArchivosAdjuntos({
  label,
  archivos,
  accept,
  uploadHint,
  maxArchivos = 5,
  onChange,
  onUploadingChange,
}: SolicitudArchivosAdjuntosProps) {
  const [cantidadSubiendo, setCantidadSubiendo] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const archivosRef = useRef(archivos)
  archivosRef.current = archivos

  async function handleFiles(files: FileList) {
    const disponibles = Math.max(0, maxArchivos - archivosRef.current.length)
    const seleccionados = Array.from(files).slice(0, disponibles)

    if (files.length > disponibles) {
      toast.info(`Podés adjuntar hasta ${maxArchivos} archivos en este ítem.`)
    }
    if (seleccionados.length === 0) return

    setCantidadSubiendo(seleccionados.length)
    onUploadingChange?.(true)
    try {
      const resultados = await Promise.allSettled(seleccionados.map(file => subirArchivoSolicitud(file)))
      const subidos = resultados.flatMap(resultado =>
        resultado.status === 'fulfilled' ? [{ url: resultado.value.url, nombre: resultado.value.nombre }] : [],
      )
      const fallidos = resultados.length - subidos.length

      if (subidos.length > 0) onChange([...archivosRef.current, ...subidos])
      if (fallidos > 0) {
        toast.error(
          `${fallidos} archivo${fallidos === 1 ? '' : 's'} no se pudo${fallidos === 1 ? '' : 'ieron'} subir. Podés intentarlo nuevamente.`,
        )
      }
    } finally {
      setCantidadSubiendo(0)
      onUploadingChange?.(false)
    }
  }

  const completo = archivos.length >= maxArchivos

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs font-semibold text-[#5A6070] uppercase tracking-wider">{label}</Label>
        {uploadHint ? <p className="text-[11px] text-[#8A8F9C]">{uploadHint}</p> : null}
      </div>

      {archivos.length > 0 ? (
        <div className="space-y-1.5">
          {archivos.map((archivo, index) => (
            <div
              key={`${archivo.url}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] px-3 py-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#002868] shrink-0" />
              <span className="text-xs text-[#1A1A1A] truncate flex-1" title={archivo.nombre}>
                {archivo.nombre}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={cantidadSubiendo > 0}
                onClick={() => onChange(archivos.filter((_, itemIndex) => itemIndex !== index))}
                className="size-6 text-[#8A8F9C] hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Quitar ${archivo.nombre}`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {!completo ? (
        <Button
          type="button"
          variant="outline"
          disabled={cantidadSubiendo > 0}
          onClick={() => inputRef.current?.click()}
          className="h-auto min-h-8 w-full justify-start border-dashed border-[#C0C8D8] bg-[#F8F9FA] px-3 py-1.5 text-xs font-normal text-[#5A6070] hover:border-[#002868] hover:text-[#002868]"
        >
          {cantidadSubiendo > 0 ? <Loader2 className="animate-spin" /> : <Paperclip />}
          {cantidadSubiendo > 0
            ? `Subiendo ${cantidadSubiendo} archivo${cantidadSubiendo === 1 ? '' : 's'}...`
            : archivos.length > 0
              ? `Agregar archivos (${archivos.length}/${maxArchivos})`
              : `Adjuntar archivos (máx. ${maxArchivos})`}
        </Button>
      ) : (
        <p className="text-[11px] font-medium text-emerald-700">Máximo de {maxArchivos} archivos alcanzado.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={event => {
          const files = event.target.files
          if (files) void handleFiles(files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
