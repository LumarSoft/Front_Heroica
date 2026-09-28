'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { DocumentoArchivoRow } from './DocumentoArchivoRow'
import { DocumentoUploadForm } from './DocumentoUploadForm'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { LABELS_DOCUMENTOS, TIPOS_DOCUMENTOS } from '@/lib/personal-documentos'
import type { PersonalArchivo } from '@/lib/types'

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
        const data: { data?: PersonalArchivo[] } = await res.json()
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
        <LoadingSpinner className="w-5 h-5" />
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
                    {LABELS_DOCUMENTOS[f] ?? f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-[#E0E0E0] overflow-hidden">
        <div className="px-4 py-3 bg-[#FAFBFC] border-b border-[#F0F2F5]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#002868]">Documentación del legajo</p>
          <p className="mt-0.5 text-[11px] text-[#8A8F9C]">
            Adjuntá los documentos del colaborador, incluida la constancia de alta.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {tiposRequeridos.map(tipo => {
            const archivo = archivosPorTipo.get(tipo)
            return (
              <div key={tipo} className="rounded-lg border border-[#E0E0E0] p-3">
                <p className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide">
                  {LABELS_DOCUMENTOS[tipo]}
                </p>
                {archivo ? (
                  <DocumentoArchivoRow
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
        <DocumentoUploadForm
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
                  <DocumentoArchivoRow
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
