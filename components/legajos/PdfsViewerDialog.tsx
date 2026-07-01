'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ExternalLink, FileImage, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { PersonalArchivo } from '@/lib/types'

interface PdfsViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personalId: number | null
  personalNombre: string
  faltantes?: string[]
}

const LABELS_FALTANTES: Record<string, string> = {
  dni_frente_dorso: 'DNI (ambos lados)',
  ddjj_domicilio: 'DDJJ de domicilio',
  descripcion_puesto_firmada: 'Descripción de puesto firmada',
  foto_colaborador: 'Foto del colaborador',
  normas_convivencia: 'Normas de convivencia',
  constancia_uniforme: 'Constancia de uniforme',
  carnet_manipulacion_alimentos: 'Carnet de manipulación',
}

function labelFaltante(key: string): string {
  return LABELS_FALTANTES[key] ?? key
}

/** Convierte cualquier representación de fecha (ISO, Date.toString, "YYYY-MM-DD HH:MM:SS") a DD/MM/YYYY. */
function formatFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  const d = fecha instanceof Date ? fecha : new Date(fecha)
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }
  // Fallback para formatos no parseables por Date
  const match = String(fecha).match(/(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  return '—'
}

function isImagen(nombre: string | null, url: string): boolean {
  const candidato = (nombre || url).toLowerCase()
  return /\.(jpe?g|png|webp|gif|heic)(\?|$)/.test(candidato)
}

function shortFilename(name: string | null, max = 60): string {
  if (!name) return 'archivo.pdf'
  if (name.length <= max) return name
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  const base = name.slice(0, name.length - ext.length)
  const keep = Math.max(8, max - ext.length - 1)
  return `${base.slice(0, keep)}…${ext}`
}

export function PdfsViewerDialog({ open, onOpenChange, personalId, personalNombre, faltantes }: PdfsViewerDialogProps) {
  const [archivos, setArchivos] = useState<PersonalArchivo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || personalId == null) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await apiFetch(API_ENDPOINTS.PERSONAL.GET_ARCHIVOS(personalId as number))
        const data = await res.json()
        if (!cancelled) {
          if (!res.ok) {
            toast.error(data.message || 'No se pudieron cargar los archivos')
            setArchivos([])
          } else {
            setArchivos(Array.isArray(data.data) ? (data.data as PersonalArchivo[]) : [])
          }
        }
      } catch {
        if (!cancelled) {
          toast.error('Error al cargar los archivos')
          setArchivos([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, personalId])

  const grupos = useMemo(() => {
    const map = new Map<string, PersonalArchivo[]>()
    for (const a of archivos) {
      const list = map.get(a.solicitud_tipo) ?? []
      list.push(a)
      map.set(a.solicitud_tipo, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Altas') return -1
      if (b === 'Altas') return 1
      return a.localeCompare(b, 'es')
    })
  }, [archivos])

  const hayFaltantes = (faltantes ?? []).length > 0
  const total = archivos.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header fijo */}
        <DialogHeader className="px-5 py-4 border-b border-[#E8EDF4] shrink-0">
          <DialogTitle className="text-base font-semibold text-[#002868] truncate pr-8">
            Documentos de {personalNombre}
          </DialogTitle>
          <p className="text-xs text-[#8A8F9C] mt-0.5">
            {loading
              ? 'Cargando…'
              : total === 0
                ? 'Sin archivos cargados'
                : `${total} archivo${total === 1 ? '' : 's'} cargado${total === 1 ? '' : 's'}`}
          </p>
        </DialogHeader>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {hayFaltantes && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-rose-800 mb-1">
                    Faltan {faltantes!.length} documento{faltantes!.length === 1 ? '' : 's'} en la solicitud de alta
                  </p>
                  <ul className="text-xs text-rose-700 space-y-0.5">
                    {faltantes!.map(f => (
                      <li key={f} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                        <span className="truncate">{labelFaltante(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-[#8A8F9C]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando archivos…
            </div>
          ) : archivos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E0E0E0] py-10 text-center">
              <FileText className="w-8 h-8 mx-auto text-[#C8CCD4] mb-2" />
              <p className="text-sm text-[#8A8F9C]">Este colaborador no tiene archivos adjuntos.</p>
            </div>
          ) : (
            grupos.map(([tipo, items]) => (
              <section key={tipo} className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#002868]">{tipo}</p>
                  <span className="text-[10px] font-semibold text-[#8A8F9C] bg-[#F0F4FA] px-1.5 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="rounded-xl border border-[#E0E0E0] overflow-hidden divide-y divide-[#F0F2F5] bg-white">
                  {items.map((a, idx) => {
                    const esImg = isImagen(a.nombre_original, a.url)
                    const Icon = esImg ? FileImage : FileText
                    return (
                      <a
                        key={`${a.solicitud_id}-${a.tipo_doc}-${idx}`}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F7FA] transition-colors group"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            esImg ? 'bg-violet-50 text-violet-600' : 'bg-[#EEF3FF] text-[#002868]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{a.label}</p>
                          <p className="text-[11px] text-[#8A8F9C] truncate" title={a.nombre_original ?? ''}>
                            {shortFilename(a.nombre_original)}
                          </p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[10px] text-[#9AA0AC]">{formatFecha(a.fecha_solicitud)}</span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                              a.estado === 'Aprobada'
                                ? 'bg-emerald-50 text-emerald-700'
                                : a.estado === 'Pendiente'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-[#F5F7FA] text-[#8A8F9C]'
                            }`}
                          >
                            {a.estado}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-[#C8CCD4] group-hover:text-[#002868] transition-colors shrink-0" />
                      </a>
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
