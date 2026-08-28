'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ExternalLink, FileImage, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { openPersonalArchivo } from '@/lib/document-url'
import type { PersonalArchivo } from '@/lib/types'

const LABELS_FALTANTES: Record<string, string> = {
  dni_frente_dorso: 'DNI (ambos lados)',
  ddjj_domicilio: 'DDJJ de domicilio',
  descripcion_puesto_firmada: 'Descripción de puesto firmada',
  foto_colaborador: 'Foto del colaborador',
  normas_convivencia: 'Normas de convivencia',
  constancia_uniforme: 'Constancia de uniforme',
  carnet_manipulacion_alimentos: 'Carnet de manipulación',
}

const TIPOS_DOCUMENTOS = [
  'dni_frente_dorso',
  'ddjj_domicilio',
  'descripcion_puesto_firmada',
  'foto_colaborador',
  'normas_convivencia',
  'constancia_uniforme',
] as const

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) {
    const m = String(fecha).match(/(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return '—'
  }
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function isImagen(nombre: string | null, url: string): boolean {
  return /\.(jpe?g|png|webp|gif|heic)(\?|$)/i.test(nombre || url)
}

function shortFilename(name: string | null, max = 55): string {
  if (!name) return 'archivo'
  if (name.length <= max) return name
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const keep = Math.max(8, max - ext.length - 1)
  return `${name.slice(0, keep)}…${ext}`
}

function estadoVencimiento(fecha: string | null | undefined): string | null {
  if (!fecha) return null
  const dias = Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000)
  if (dias < 0) return 'Vencido'
  if (dias <= 30) return 'Próximo a vencer'
  return 'Vigente'
}

// ─── Upload Form ──────────────────────────────────────────────────────────────

interface UploadFormProps {
  personalId: number
  tipoDoc: string
  onUploaded: (archivo: PersonalArchivo) => void
  onCancel: () => void
}

function UploadForm({ personalId, tipoDoc, onUploaded, onCancel }: UploadFormProps) {
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
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.message || 'Error al subir el documento')
        return
      }
      toast.success('Documento adjuntado correctamente')
      onUploaded({
        label: LABELS_FALTANTES[tipoDoc],
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

      <p className="text-sm font-semibold text-[#1A1A1A]">{LABELS_FALTANTES[tipoDoc]}</p>

      <div>
        <label className="text-xs text-[#5A6070] font-medium block mb-1">Fecha de vencimiento (opcional)</label>
        <input
          type="date"
          value={fechaVencimiento}
          onChange={e => setFechaVencimiento(e.target.value)}
          className="w-full text-sm rounded-lg border border-[#E5E9F0] px-3 py-2 outline-none focus:border-[#002868] focus:ring-2 focus:ring-[#002868]/15 transition bg-white"
        />
      </div>

      <div>
        <label className="text-xs text-[#5A6070] font-medium block mb-1">Archivo (PDF, JPG, PNG — máx. 10 MB)</label>
        <div
          className="flex items-center gap-2 rounded-lg border border-dashed border-[#C8CCD4] bg-white px-3 py-2 cursor-pointer hover:border-[#002868] transition"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 text-[#9AA0AC] shrink-0" />
          <span className="text-sm text-[#5A6070] truncate flex-1">
            {file ? shortFilename(file.name) : 'Seleccionar archivo…'}
          </span>
        </div>
        <input
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
          disabled={uploading || !file}
          className="h-8 px-3 text-xs bg-[#002868] hover:bg-[#003d8f] text-white cursor-pointer"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
          {uploading ? 'Subiendo…' : 'Adjuntar'}
        </Button>
      </div>
    </form>
  )
}

// ─── Archivo Row ──────────────────────────────────────────────────────────────

interface ArchivoRowProps {
  archivo: PersonalArchivo
  canEliminar: boolean
  onDeleted: (docId: number) => void
  personalId: number
}

function ArchivoRow({ archivo, canEliminar, onDeleted, personalId }: ArchivoRowProps) {
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
      const data = await res.json()
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
      <button type="button" onClick={handleOpen} className="flex items-center gap-3 flex-1 min-w-0">
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
          {archivo.fecha_vencimiento && (
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
      </button>

      {canEliminar && esDirecto && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-50 text-[#C8CCD4] hover:text-rose-500 cursor-pointer shrink-0"
          aria-label="Eliminar documento"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface DocumentosTabProps {
  personalId: number
  canEditar: boolean
  requiereCarnet?: boolean
  faltantes?: string[]
}

export function DocumentosTab({ personalId, canEditar, requiereCarnet = false, faltantes = [] }: DocumentosTabProps) {
  const [archivos, setArchivos] = useState<PersonalArchivo[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch(API_ENDPOINTS.PERSONAL.GET_ARCHIVOS(personalId))
        const data = await res.json()
        if (!cancelled) setArchivos(Array.isArray(data.data) ? data.data : [])
      } catch {
        if (!cancelled) toast.error('Error al cargar documentos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [personalId])

  const grupos = useMemo(() => {
    const map = new Map<string, PersonalArchivo[]>()
    for (const a of archivos) {
      const list = map.get(a.solicitud_tipo) ?? []
      list.push(a)
      map.set(a.solicitud_tipo, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Legajo') return -1
      if (b === 'Legajo') return 1
      if (a === 'Altas') return -1
      if (b === 'Altas') return 1
      return a.localeCompare(b, 'es')
    })
  }, [archivos])

  const tiposRequeridos = requiereCarnet ? [...TIPOS_DOCUMENTOS, 'carnet_manipulacion_alimentos'] : TIPOS_DOCUMENTOS
  const archivosPorTipo = useMemo(() => {
    const map = new Map<string, PersonalArchivo>()
    for (const archivo of archivos) {
      const actual = map.get(archivo.tipo_doc)
      if (!actual || new Date(archivo.fecha_solicitud).getTime() > new Date(actual.fecha_solicitud).getTime())
        map.set(archivo.tipo_doc, archivo)
    }
    return map
  }, [archivos])

  function handleUploaded(archivo: PersonalArchivo) {
    setArchivos(prev => [archivo, ...prev])
    setTipoSeleccionado(null)
  }

  function handleDeleted(docId: number) {
    setArchivos(prev => prev.filter(a => a.documento_id !== docId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-sm text-[#8A8F9C]">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando documentos…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alertas de faltantes */}
      {faltantes.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-rose-800 mb-1">
                Faltan {faltantes.length} documento{faltantes.length === 1 ? '' : 's'} del alta
              </p>
              <ul className="text-xs text-rose-700 space-y-0.5">
                {faltantes.map(f => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                    {LABELS_FALTANTES[f] ?? f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-4 py-3 bg-[#FAFBFC] border-b border-[#F0F2F5]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#002868]">Documentación requerida</p>
          <p className="mt-0.5 text-[11px] text-[#8A8F9C]">
            Completá los mismos documentos solicitados al dar de alta al colaborador.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {tiposRequeridos.map(tipo => {
            const archivo = archivosPorTipo.get(tipo)
            return (
              <div key={tipo} className="rounded-lg border border-[#E0E0E0] p-3">
                <p className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide">{LABELS_FALTANTES[tipo]}</p>
                {archivo ? (
                  <ArchivoRow
                    archivo={archivo}
                    canEliminar={canEditar}
                    onDeleted={handleDeleted}
                    personalId={personalId}
                  />
                ) : canEditar ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTipoSeleccionado(tipo)}
                    className="mt-2 w-full justify-start border-dashed text-[#5A6070] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2" /> Adjuntar archivo
                  </Button>
                ) : (
                  <p className="mt-2 text-xs text-rose-600">Pendiente de adjuntar</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {tipoSeleccionado && (
        <UploadForm
          personalId={personalId}
          tipoDoc={tipoSeleccionado}
          onUploaded={handleUploaded}
          onCancel={() => setTipoSeleccionado(null)}
        />
      )}

      {/* Lista de documentos */}
      {archivos.length > 0 && (
        <section className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#002868]">
              Historial completo de documentos
            </p>
            <p className="mt-0.5 text-[11px] text-[#8A8F9C]">
              Incluye todos los archivos cargados, incluso versiones anteriores.
            </p>
          </div>
          {grupos.map(([tipo, items]) => (
            <div key={tipo} className="bg-white rounded-xl border border-[#E0E0E0] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F0F2F5] bg-[#FAFBFC]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868]">{tipo}</p>
                <span className="text-[10px] font-semibold text-[#8A8F9C] bg-[#F0F4FA] px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="divide-y divide-[#F0F2F5]">
                {items.map((a, idx) => (
                  <ArchivoRow
                    key={`${a.solicitud_tipo}-${a.documento_id ?? a.solicitud_id}-${idx}`}
                    archivo={a}
                    canEliminar={canEditar}
                    onDeleted={handleDeleted}
                    personalId={personalId}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Leyenda */}
      {archivos.length > 0 && (
        <p className="text-[11px] text-[#B0B8C4] text-center">
          Los documentos del alta provienen de solicitudes. Solo los adjuntos directos pueden eliminarse desde acá.
        </p>
      )}
    </div>
  )
}
