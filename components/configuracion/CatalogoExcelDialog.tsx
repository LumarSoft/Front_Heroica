'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileSpreadsheet, Loader2, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AltaExcelBase, BajaExcelBase, PreviewCatalogoExcel } from '@/lib/types'
import { CatalogoExcelPreview } from './CatalogoExcelPreview'

/**
 * Importar el Excel de un catálogo (exportado desde la misma sección).
 *
 * Paso 1: se sube el archivo y la API devuelve la vista previa (no escribe nada).
 * Paso 2: el usuario revisa altas / cambios / unificaciones / bajas y confirma. Se vuelve a
 *         mandar el mismo archivo con `archivo_hash` y `firma` para que la API verifique
 *         que lo que aplica es exactamente lo que se mostró.
 *
 * La importación sincroniza: lo que no está en el archivo se elimina. Por eso, si hay
 * bajas, se pide una confirmación explícita.
 */

export interface CatalogoExcelDialogProps<A extends AltaExcelBase, B extends BajaExcelBase> {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void | Promise<void>
  titulo: string
  endpoints: { preview: string; confirmar: string }
  /** Ayuda del paso 1 (items de una lista) */
  ayuda: React.ReactNode
  detalleAlta: (a: A) => string
  detalleBaja: (b: B) => string
  textoBajas: (cantidad: number) => string
}

export function CatalogoExcelDialog<A extends AltaExcelBase, B extends BajaExcelBase>({
  open,
  onOpenChange,
  onImported,
  titulo,
  endpoints,
  ayuda,
  detalleAlta,
  detalleBaja,
  textoBajas,
}: CatalogoExcelDialogProps<A, B>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewCatalogoExcel<A, B> | null>(null)
  const [cargando, setCargando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aceptaBajas, setAceptaBajas] = useState(false)

  const reset = () => {
    setArchivo(null)
    setPreview(null)
    setError(null)
    setAceptaBajas(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleOpenChange = (value: boolean) => {
    if (aplicando) return
    if (!value) reset()
    onOpenChange(value)
  }

  const formData = (file: File, extra?: Record<string, string>) => {
    const fd = new FormData()
    fd.append('archivo', file)
    for (const [k, v] of Object.entries(extra ?? {})) fd.append(k, v)
    return fd
  }

  const seleccionarArchivo = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx. Usá el Excel exportado desde esta sección.')
      return
    }
    setArchivo(file)
    setPreview(null)
    setError(null)
    setAceptaBajas(false)
    setCargando(true)
    try {
      const res = await apiFetch(endpoints.preview, { method: 'POST', body: formData(file) })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'No se pudo procesar el archivo.')
        return
      }
      setPreview(data.data)
    } catch {
      setError('Error de red al subir el archivo.')
    } finally {
      setCargando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const confirmar = async () => {
    if (!archivo || !preview) return
    setAplicando(true)
    setError(null)
    try {
      const res = await apiFetch(endpoints.confirmar, {
        method: 'POST',
        body: formData(archivo, { archivo_hash: preview.archivo_hash, firma: preview.firma }),
      })
      const data = await res.json()
      if (res.status === 409 && data.data) {
        // El catálogo cambió desde la vista previa: se muestra la nueva para revisar.
        setPreview(data.data)
        setAceptaBajas(false)
        setError(data.message)
        return
      }
      if (!res.ok || !data.success) {
        setError(data.message || 'No se pudo aplicar la importación.')
        return
      }
      toast.success(data.message || 'Importación aplicada')
      await onImported()
      reset()
      onOpenChange(false)
    } catch {
      setError('Error de red al aplicar la importación.')
    } finally {
      setAplicando(false)
    }
  }

  const r = preview?.resumen
  const hayCambios = !!r && r.altas + r.modificaciones + r.bajas + r.unificaciones > 0
  const puedeConfirmar = !!r && r.errores === 0 && hayCambios && (r.bajas === 0 || aceptaBajas) && !aplicando

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0">
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">{titulo}</DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              Subí el Excel exportado con tus cambios. Antes de aplicar vas a ver qué se agrega, qué cambia, qué se
              unifica y qué se elimina.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* ── Paso 1: elegir archivo ── */}
          {!preview && (
            <>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#5A6070]">{ayuda}</ul>
              <div
                role="button"
                tabIndex={0}
                onClick={() => !cargando && inputRef.current?.click()}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !cargando) inputRef.current?.click()
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file && !cargando) seleccionarArchivo(file)
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
                  cargando
                    ? 'cursor-wait border-[#002868]/40 bg-[#F0F4FF]'
                    : 'cursor-pointer border-[#D8DCE3] hover:border-[#002868]/50 hover:bg-[#FAFBFC]',
                )}
              >
                {cargando ? (
                  <Loader2 className="h-9 w-9 animate-spin text-[#002868]" />
                ) : (
                  <FileSpreadsheet className="h-9 w-9 text-[#9AA0AC]" />
                )}
                <p className="font-semibold text-[#1A1A1A] text-center">
                  {cargando ? 'Analizando el archivo…' : 'Arrastrá el archivo o hacé clic para elegirlo'}
                </p>
                <p className="text-sm text-[#666]">Archivo .xlsx, hasta 5 MB.</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) seleccionarArchivo(file)
                  }}
                />
              </div>
            </>
          )}

          {error && (
            <div className="flex gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <p className="min-w-0 text-sm whitespace-pre-line text-rose-900">{error}</p>
            </div>
          )}

          {/* ── Paso 2: vista previa ── */}
          {preview && (
            <CatalogoExcelPreview
              preview={preview}
              nombreArchivo={archivo?.name}
              detalleAlta={detalleAlta}
              detalleBaja={detalleBaja}
              textoBajas={textoBajas}
              aceptaBajas={aceptaBajas}
              onAceptaBajasChange={setAceptaBajas}
            />
          )}
        </div>

        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC] flex flex-wrap justify-end gap-3">
          {preview && (
            <Button
              variant="outline"
              onClick={reset}
              disabled={aplicando}
              className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] mr-auto"
            >
              Elegir otro archivo
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={aplicando}
            className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070]"
          >
            Cancelar
          </Button>
          {preview && (
            <Button
              onClick={confirmar}
              disabled={!puedeConfirmar}
              className="h-10 px-6 rounded-lg bg-[#002868] text-white font-semibold hover:bg-[#003d8f]"
            >
              {aplicando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Aplicando…
                </>
              ) : (
                'Aplicar cambios'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
