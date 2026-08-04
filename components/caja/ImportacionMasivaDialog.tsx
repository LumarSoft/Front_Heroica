'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { formatMonto } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSidebarStore } from '@/store/sidebarStore'
import { AlertTriangle, CheckCircle2, ChevronDown, FileSpreadsheet, Info, Loader2, Upload, XCircle } from 'lucide-react'

/**
 * Importación masiva de movimientos desde el extracto del banco.
 *
 * Dos pasos deliberados:
 *   1. Se sube el archivo y el servidor devuelve un PREVIEW: qué movimientos va
 *      a crear, qué líneas ignora y por qué. No se escribe nada.
 *   2. Recién si el usuario confirma, se impacta la caja.
 *
 * El archivo se manda de nuevo en el paso 2 (no se guarda en el cliente ni en
 * memoria del servidor): el back recalcula todo y verifica que el hash coincida
 * con el que se previsualizó.
 *
 * NOTA DE LAYOUT: `DialogContent` es un grid, y los hijos de un grid tienen
 * `min-width: auto`, así que cualquier contenido ancho (la tabla) desborda el
 * diálogo horizontalmente. Por eso el contenedor lleva `grid-rows-[auto_1fr_auto]`
 * con `min-h-0`/`min-w-0` en el cuerpo: encabezado y pie quedan fijos, y solo el
 * medio scrollea. Si tocás las clases, verificá que no reaparezca el scroll
 * horizontal con un extracto de un mes completo.
 */

interface MovimientoPropuesto {
  fecha: string
  concepto: string
  descripcion: string
  categoria: string
  subcategoria: string
  monto: number
  tipo: 'ingreso' | 'egreso'
  cantidadFilas: number
  codigosBanco: string[]
}

interface ConceptoIgnorado {
  codigo: string
  nombreBanco: string
  motivo: string
  cantidadFilas: number
  montoTotal: number
}

interface ConceptoSinRegla {
  codigo: string
  conceptoDescripcion: string
  cantidadFilas: number
  montoTotal: number
}

interface Preview {
  adapter: string
  cuentaDetectada: string | null
  archivoHash: string
  fechaDesde: string | null
  fechaHasta: string | null
  filasTotales: number
  filasNuevas: number
  filasOmitidas: number
  filasIgnoradas: number
  movimientos: MovimientoPropuesto[]
  conceptosIgnorados: ConceptoIgnorado[]
  conceptosSinRegla: ConceptoSinRegla[]
  advertencias: string[]
  desglose: {
    netoArchivo: number
    netoImportado: number
    netoIgnorado: number
    netoYaImportado: number
    netoSinRegla: number
  }
  controlSaldo: { esperado: number; calculado: number; cuadra: boolean } | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: number
  onImportado: () => void
}

export function ImportacionMasivaDialog({ open, onOpenChange, sucursalId, onImportado }: Props) {
  // La sidebar mide 256px abierta y 68px colapsada. El diálogo se corre media
  // sidebar hacia la derecha para quedar centrado en el área de contenido en
  // lugar de la ventana, que es lo que hacía que pareciera pegado a la sidebar.
  const sidebarColapsada = useSidebarStore(state => state.collapsed)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [cargando, setCargando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [verIgnorados, setVerIgnorados] = useState(false)
  const [verAvisos, setVerAvisos] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reiniciar = () => {
    setArchivo(null)
    setPreview(null)
    setError(null)
    setCargando(false)
    setConfirmando(false)
    setVerIgnorados(false)
    setVerAvisos(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const cerrar = (abierto: boolean) => {
    if (!abierto) reiniciar()
    onOpenChange(abierto)
  }

  const armarFormData = (file: File) => {
    const fd = new FormData()
    fd.append('archivo', file)
    fd.append('sucursal_id', String(sucursalId))
    // El banco no se manda: el servidor lo deduce del formato del archivo.
    return fd
  }

  const seleccionarArchivo = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx. Exportá el extracto como Excel desde el home banking.')
      return
    }

    setArchivo(file)
    setError(null)
    setPreview(null)
    setCargando(true)

    try {
      const res = await apiFetch(API_ENDPOINTS.IMPORTACION_BANCARIA.PREVIEW, {
        method: 'POST',
        body: armarFormData(file),
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
    }
  }

  const confirmar = async () => {
    if (!archivo || !preview) return
    setConfirmando(true)
    try {
      const fd = armarFormData(archivo)
      fd.append('archivo_hash', preview.archivoHash)

      const res = await apiFetch(API_ENDPOINTS.IMPORTACION_BANCARIA.CONFIRMAR, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.message || 'No se pudo importar.')
        return
      }
      toast.success(data.message)
      onImportado()
      cerrar(false)
    } catch {
      toast.error('Error de red al importar.')
    } finally {
      setConfirmando(false)
    }
  }

  const hayBloqueo = (preview?.conceptosSinRegla.length ?? 0) > 0
  const puedeImportar = preview !== null && !hayBloqueo && preview.movimientos.length > 0

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent
        className={cn(
          'grid max-h-[88vh] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden p-0 sm:max-w-none',
          'w-[calc(100vw-2rem)]',
          // Ancho y centro dependen de cuánto ocupa la sidebar. Las clases van
          // literales (no interpoladas) para que Tailwind las genere.
          sidebarColapsada
            ? 'md:left-[calc(50%+34px)] md:w-[min(58rem,calc(100vw-9rem))]'
            : 'md:left-[calc(50%+128px)] md:w-[min(58rem,calc(100vw-21rem))]',
        )}
        showCloseButton={!confirmando}
      >
        {/* ══ ENCABEZADO (fijo) ═══════════════════════════════════════════ */}
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="text-lg">Importación masiva de movimientos</DialogTitle>
          <DialogDescription>
            {preview
              ? 'Revisá lo que se va a cargar. Nada se guarda hasta que confirmes.'
              : 'Subí el Excel del home banking. Vas a poder revisarlo antes de confirmar.'}
          </DialogDescription>
        </DialogHeader>

        {/* ══ CUERPO (única zona que scrollea) ════════════════════════════ */}
        <div className="min-h-0 min-w-0 overflow-y-auto px-6 py-5">
          {/* ── Paso 1: elegir el archivo. El banco lo deduce el servidor. ── */}
          {!preview && (
            <div>
              <div
                onDragOver={e => {
                  e.preventDefault()
                  setArrastrando(true)
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={e => {
                  e.preventDefault()
                  setArrastrando(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) seleccionarArchivo(file)
                }}
                onClick={() => !cargando && inputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-colors',
                  cargando
                    ? 'cursor-wait border-[#002868]/40 bg-[#F0F4FF]'
                    : arrastrando
                      ? 'cursor-pointer border-[#002868] bg-[#F0F4FF]'
                      : 'cursor-pointer border-[#D8DCE3] hover:border-[#002868]/50 hover:bg-[#FAFBFC]',
                )}
              >
                {cargando ? (
                  <Loader2 className="h-9 w-9 animate-spin text-[#002868]" />
                ) : (
                  <FileSpreadsheet className="h-9 w-9 text-[#9AA0AC]" />
                )}
                <div className="text-center">
                  <p className="font-semibold text-[#1A1A1A]">
                    {cargando ? 'Analizando el extracto…' : 'Arrastrá el archivo o hacé clic para elegirlo'}
                  </p>
                  <p className="mt-0.5 text-sm text-[#666]">
                    Archivo .xlsx del home banking, hasta 15 MB. El banco se detecta solo.
                  </p>
                </div>
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
            </div>
          )}

          {error && (
            <div className="mt-4 flex gap-3 rounded-lg border border-rose-300 bg-rose-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <p className="min-w-0 text-sm whitespace-pre-line text-rose-900">{error}</p>
            </div>
          )}

          {/* ── Paso 2: preview ─────────────────────────────────────────── */}
          {preview && (
            <div className="space-y-5">
              {/* Datos del archivo */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666]">
                <span className="flex min-w-0 items-center gap-1.5 font-medium text-[#1A1A1A]">
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{archivo?.name}</span>
                </span>
                {preview.cuentaDetectada && <span>Cuenta {preview.cuentaDetectada}</span>}
                <span>
                  {preview.fechaDesde === preview.fechaHasta
                    ? preview.fechaDesde
                    : `${preview.fechaDesde} → ${preview.fechaHasta}`}
                </span>
                <span>{preview.filasTotales} líneas</span>
              </div>

              {/* Titular: qué se va a cargar */}
              {puedeImportar && (
                <div className="rounded-xl border-2 border-[#002868]/20 bg-[#F0F4FF] px-5 py-4">
                  <p className="text-xs font-bold tracking-wider text-[#002868]/60 uppercase">Se va a cargar</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl font-bold text-[#002868]">
                      {preview.movimientos.length} movimiento{preview.movimientos.length === 1 ? '' : 's'}
                    </span>
                    <span
                      className={cn(
                        'text-xl font-bold tabular-nums',
                        preview.desglose.netoImportado < 0 ? 'text-rose-600' : 'text-emerald-600',
                      )}
                    >
                      {formatMonto(preview.desglose.netoImportado)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#5A6070]">
                    Consolidados a partir de {preview.filasNuevas} línea(s) del extracto
                    {preview.filasOmitidas > 0 && ` · ${preview.filasOmitidas} ya estaban cargadas`}
                  </p>
                </div>
              )}

              {/* Bloqueante: conceptos sin regla */}
              {hayBloqueo && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4">
                  <div className="flex gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-rose-900">
                        No se puede importar: hay conceptos que el sistema no sabe clasificar
                      </p>
                      <ul className="mt-2 space-y-1 text-rose-800">
                        {preview.conceptosSinRegla.map(c => (
                          <li key={c.codigo} className="break-words">
                            <span className="font-mono text-xs">{c.codigo}</span> — {c.conceptoDescripcion} ·{' '}
                            {c.cantidadFilas} línea(s) · {formatMonto(c.montoTotal)}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-rose-700">
                        Pasale estos códigos al equipo de desarrollo para que los agregue a las reglas del banco.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* El archivo no cuadra contra el banco */}
              {preview.controlSaldo && !preview.controlSaldo.cuadra && (
                <div className="flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-rose-900">El archivo no cuadra contra el saldo del banco</p>
                    <p className="text-rose-800">
                      El banco declara una variación de {formatMonto(preview.controlSaldo.esperado)} y las líneas leídas
                      suman {formatMonto(preview.controlSaldo.calculado)}. Puede estar incompleto o modificado.
                    </p>
                  </div>
                </div>
              )}

              {/* Nada nuevo */}
              {!hayBloqueo && preview.movimientos.length === 0 && (
                <div className="flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <p className="min-w-0 text-sm text-emerald-900">
                    No hay nada nuevo para importar: todas las líneas de este extracto ya estaban cargadas.
                  </p>
                </div>
              )}

              {/* Tabla de movimientos */}
              {preview.movimientos.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-bold text-[#1A1A1A]">Movimientos a crear</h3>
                  <div className="max-h-72 overflow-auto rounded-xl border">
                    <table className="w-full min-w-[40rem] text-sm">
                      <thead className="sticky top-0 z-10 bg-[#F5F6F8] text-xs text-[#5A6070]">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                          <th className="px-3 py-2 text-left font-semibold">Descripción</th>
                          <th className="px-3 py-2 text-left font-semibold">Clasificación</th>
                          <th className="px-3 py-2 text-right font-semibold">Líneas</th>
                          <th className="px-3 py-2 text-right font-semibold">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.movimientos.map((m, i) => (
                          <tr key={i} className="border-t hover:bg-[#FAFBFC]">
                            <td className="px-3 py-2 whitespace-nowrap text-[#5A6070]">{m.fecha}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-[#1A1A1A]">{m.descripcion}</div>
                              <div className="font-mono text-[10px] text-[#9AA0AC]">{m.codigosBanco.join(' · ')}</div>
                            </td>
                            <td className="px-3 py-2 text-xs text-[#5A6070]">
                              {m.categoria}
                              <span className="text-[#C4C9D2]"> › </span>
                              {m.subcategoria}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-[#5A6070]">{m.cantidadFilas}</td>
                            <td
                              className={cn(
                                'px-3 py-2 text-right font-semibold whitespace-nowrap tabular-nums',
                                m.monto < 0 ? 'text-rose-600' : 'text-emerald-600',
                              )}
                            >
                              {formatMonto(m.monto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Ignorados — colapsado por defecto */}
              {preview.conceptosIgnorados.length > 0 && (
                <section className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50">
                  <button
                    type="button"
                    onClick={() => setVerIgnorados(v => !v)}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-amber-100/60"
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-900">
                        {preview.filasIgnoradas} línea(s) NO se van a cargar, por{' '}
                        {formatMonto(preview.desglose.netoIgnorado)}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        Son conceptos que ya se cargan a mano como pagos proyectados. Importarlos los duplicaría, así
                        que la caja no va a coincidir con el saldo del banco.
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 text-amber-700 transition-transform',
                        verIgnorados && 'rotate-180',
                      )}
                    />
                  </button>

                  {verIgnorados && (
                    <div className="border-t border-amber-200 bg-white/60">
                      <table className="w-full text-sm">
                        <tbody>
                          {preview.conceptosIgnorados.map(c => (
                            <tr key={c.codigo} className="border-b border-amber-100 last:border-0">
                              <td className="px-4 py-2.5 align-top">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                  <span className="font-mono text-[11px] text-amber-700">{c.codigo}</span>
                                  <span className="font-medium text-[#1A1A1A]">{c.nombreBanco}</span>
                                </div>
                                <p className="mt-0.5 text-xs text-[#666]">{c.motivo}</p>
                              </td>
                              <td className="px-4 py-2.5 text-right align-top whitespace-nowrap">
                                <div className="font-semibold tabular-nums text-rose-600">
                                  {formatMonto(c.montoTotal)}
                                </div>
                                <div className="text-xs text-[#9AA0AC]">{c.cantidadFilas} línea(s)</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* Avisos técnicos — colapsados */}
              {preview.advertencias.length > 0 && (
                <section className="overflow-hidden rounded-xl border bg-[#FAFBFC]">
                  <button
                    type="button"
                    onClick={() => setVerAvisos(v => !v)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#F0F1F4]"
                  >
                    <Info className="h-4 w-4 shrink-0 text-[#9AA0AC]" />
                    <span className="min-w-0 flex-1 text-sm text-[#5A6070]">
                      {preview.advertencias.length} aviso(s) del procesamiento
                    </span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 text-[#9AA0AC] transition-transform', verAvisos && 'rotate-180')}
                    />
                  </button>
                  {verAvisos && (
                    <ul className="space-y-1.5 border-t px-4 py-3 text-xs text-[#5A6070]">
                      {preview.advertencias.map((a, i) => (
                        <li key={i} className="break-words">
                          • {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          )}
        </div>

        {/* ══ PIE (fijo: los botones siempre visibles) ════════════════════ */}
        {preview && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-[#FAFBFC] px-6 py-4">
            <p className="min-w-0 text-xs text-[#666]">
              Total del extracto {formatMonto(preview.desglose.netoArchivo)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reiniciar} disabled={confirmando}>
                Elegir otro archivo
              </Button>
              <Button
                onClick={confirmar}
                disabled={confirmando || !puedeImportar}
                className="bg-[#002868] hover:bg-[#002868]/90"
              >
                {confirmando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {confirmando ? 'Importando…' : `Importar ${preview.movimientos.length} movimiento(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
