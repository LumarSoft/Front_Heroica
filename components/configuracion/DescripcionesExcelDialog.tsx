'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { cn } from '@/lib/utils'

/**
 * Importar el Excel de descripciones (exportado desde la misma sección).
 *
 * Paso 1: se sube el archivo y la API devuelve la vista previa (no escribe nada).
 * Paso 2: el usuario revisa altas / cambios / bajas y confirma. Se vuelve a mandar
 *         el mismo archivo con `archivo_hash` y `firma` para que la API verifique
 *         que lo que aplica es exactamente lo que se mostró.
 *
 * La importación sincroniza: las descripciones que no están en el archivo se
 * eliminan. Por eso, si hay bajas, se pide una confirmación explícita.
 */

interface MensajeFila {
  fila: number | null
  mensaje: string
}

interface PreviewDescripciones {
  archivo_hash: string
  firma: string
  resumen: {
    filas: number
    altas: number
    modificaciones: number
    bajas: number
    sin_cambios: number
    errores: number
    advertencias: number
  }
  altas: { fila: number; nombre: string; tipo: string; categoria: string; subcategoria: string; activo: boolean }[]
  modificaciones: {
    fila: number
    id: number
    nombre: string
    cambios: { campo: string; antes: string; despues: string }[]
  }[]
  bajas: { id: number; nombre: string; tipo: string; categoria: string; subcategoria: string }[]
  errores: MensajeFila[]
  advertencias: MensajeFila[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void | Promise<void>
}

const vacio = (v: string) => v || '—'

function categoriaTexto(categoria: string, subcategoria: string) {
  if (!categoria) return 'Sin categoría'
  return subcategoria ? `${categoria} › ${subcategoria}` : categoria
}

export function DescripcionesExcelDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewDescripciones | null>(null)
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
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.IMPORTAR_PREVIEW, {
        method: 'POST',
        body: formData(file),
      })
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
      const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.IMPORTAR_CONFIRMAR, {
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
  const hayErrores = !!r && r.errores > 0
  const hayCambios = !!r && r.altas + r.modificaciones + r.bajas > 0
  const puedeConfirmar = !!preview && !hayErrores && hayCambios && (r!.bajas === 0 || aceptaBajas) && !aplicando

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0">
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0]">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
              Importar descripciones desde Excel
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              Subí el Excel exportado con tus cambios. Antes de aplicar vas a ver qué se agrega, qué cambia y qué se
              elimina.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* ── Paso 1: elegir archivo ── */}
          {!preview && (
            <>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#5A6070]">
                <li>Fila sin ID = descripción nueva.</li>
                <li>
                  Fila borrada del Excel = <span className="font-semibold text-rose-600">se elimina</span> del sistema.
                </li>
                <li>No modifiques la columna ID. Categoría y subcategoría tienen que existir.</li>
              </ul>
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
          {preview && r && (
            <>
              <p className="text-xs text-[#8A8F9C]">
                {archivo?.name} · {r.filas} filas
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Contador label="Altas" valor={r.altas} className="text-emerald-700 bg-emerald-50 border-emerald-200" />
                <Contador
                  label="Cambios"
                  valor={r.modificaciones}
                  className="text-[#002868] bg-[#EEF2FF] border-[#C7D2FE]"
                />
                <Contador label="Bajas" valor={r.bajas} className="text-rose-700 bg-rose-50 border-rose-200" />
                <Contador
                  label="Sin cambios"
                  valor={r.sin_cambios}
                  className="text-[#5A6070] bg-gray-50 border-gray-200"
                />
                <Contador
                  label="Errores"
                  valor={r.errores}
                  className={
                    r.errores > 0
                      ? 'text-rose-700 bg-rose-50 border-rose-300'
                      : 'text-[#5A6070] bg-gray-50 border-gray-200'
                  }
                />
              </div>

              {hayErrores && (
                <Bloque
                  titulo={`Errores (${r.errores}) — corregí el Excel y volvé a subirlo. No se aplicó nada.`}
                  icono={<XCircle className="h-4 w-4 text-rose-600" />}
                  className="border-rose-300 bg-rose-50"
                >
                  {preview.errores.map((e, i) => (
                    <li key={i} className="text-sm text-rose-900">
                      {e.fila ? <span className="font-semibold">Fila {e.fila}: </span> : null}
                      {e.mensaje}
                    </li>
                  ))}
                </Bloque>
              )}

              {preview.advertencias.length > 0 && (
                <Bloque
                  titulo={`Advertencias (${preview.advertencias.length})`}
                  icono={<AlertTriangle className="h-4 w-4 text-amber-600" />}
                  className="border-amber-300 bg-amber-50"
                >
                  {preview.advertencias.map((a, i) => (
                    <li key={i} className="text-sm text-amber-900">
                      {a.mensaje}
                    </li>
                  ))}
                </Bloque>
              )}

              {!hayErrores && !hayCambios && (
                <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="text-sm text-emerald-900">
                    El archivo coincide con el sistema: no hay nada para aplicar.
                  </p>
                </div>
              )}

              {preview.altas.length > 0 && (
                <Bloque titulo={`Altas (${preview.altas.length})`} className="border-emerald-200">
                  {preview.altas.map(a => (
                    <li key={a.fila} className="text-sm text-[#1A1A1A]">
                      <span className="font-semibold">{a.nombre}</span>
                      <span className="text-[#8A8F9C]">
                        {' '}
                        · {vacio(a.tipo)} · {categoriaTexto(a.categoria, a.subcategoria)}
                        {!a.activo && ' · Inactiva'}
                      </span>
                    </li>
                  ))}
                </Bloque>
              )}

              {preview.modificaciones.length > 0 && (
                <Bloque titulo={`Cambios (${preview.modificaciones.length})`} className="border-[#C7D2FE]">
                  {preview.modificaciones.map(m => (
                    <li key={m.id} className="text-sm text-[#1A1A1A]">
                      <span className="font-semibold">{m.nombre}</span>
                      <ul className="mt-0.5 space-y-0.5 pl-3">
                        {m.cambios.map(c => (
                          <li key={c.campo} className="flex flex-wrap items-center gap-1 text-xs text-[#5A6070]">
                            <span className="font-medium">{c.campo}:</span>
                            <span className="line-through decoration-rose-400">{vacio(c.antes)}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-[#002868] font-medium">{vacio(c.despues)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </Bloque>
              )}

              {preview.bajas.length > 0 && (
                <Bloque
                  titulo={`Bajas (${preview.bajas.length}) — no están en el archivo y se van a eliminar`}
                  className="border-rose-200"
                >
                  {preview.bajas.map(b => (
                    <li key={b.id} className="text-sm text-[#1A1A1A]">
                      <span className="font-semibold">{b.nombre}</span>
                      <span className="text-[#8A8F9C]">
                        {' '}
                        · {vacio(b.tipo)} · {categoriaTexto(b.categoria, b.subcategoria)}
                      </span>
                    </li>
                  ))}
                </Bloque>
              )}

              {!hayErrores && r.bajas > 0 && (
                <label className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-3 cursor-pointer">
                  <Checkbox
                    checked={aceptaBajas}
                    onCheckedChange={v => setAceptaBajas(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-rose-900">
                    Entiendo que se van a eliminar {r.bajas} {r.bajas === 1 ? 'descripción' : 'descripciones'}. Los
                    movimientos que ya las usan no se modifican.
                  </span>
                </label>
              )}
            </>
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

function Contador({ label, valor, className }: { label: string; valor: number; className: string }) {
  return (
    <div className={cn('rounded-lg border px-3 py-2', className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-xl font-bold">{valor}</p>
    </div>
  )
}

function Bloque({
  titulo,
  icono,
  className,
  children,
}: {
  titulo: string
  icono?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        {icono}
        {titulo}
      </p>
      <ul className="max-h-56 overflow-y-auto space-y-1.5 pr-1">{children}</ul>
    </div>
  )
}
