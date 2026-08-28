'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { openArchivo } from '@/lib/document-url'
import { DeleteDialog } from '@/components/ui/delete-dialog'

interface ReciboSueldo {
  id: number
  mes: number
  anio: number
  nombre_original: string | null
  subido_por_nombre: string | null
  created_at: string
}

interface RecibosSueldoTabProps {
  personalId: number
  canEditar: boolean
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function RecibosSueldoTab({ personalId, canEditar }: RecibosSueldoTabProps) {
  const today = new Date()
  const [recibosAnio, setRecibosAnio] = useState<ReciboSueldo[]>([])
  const [mes, setMes] = useState(today.getMonth() + 1)
  const [anio, setAnio] = useState(today.getFullYear())
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [reciboAEliminar, setReciboAEliminar] = useState<ReciboSueldo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function cargarRecibos() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ anio: String(anio) })
      const response = await apiFetch(`${API_ENDPOINTS.PERSONAL.GET_RECIBOS_SUELDO(personalId)}?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'No se pudieron cargar los recibos')
      setRecibosAnio(Array.isArray(data.data) ? (data.data as ReciboSueldo[]) : [])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los recibos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRecibos()
  }, [personalId, anio])

  const anios = useMemo(() => Array.from({ length: 6 }, (_, index) => today.getFullYear() - index), [today])
  const recibos = useMemo(() => recibosAnio.filter(recibo => recibo.mes === mes), [recibosAnio, mes])

  function getEstadoMes(numeroMes: number): string {
    const yaPaso = anio < today.getFullYear() || (anio === today.getFullYear() && numeroMes < today.getMonth() + 1)
    if (!yaPaso) return 'border-[#D8E3F8] bg-white text-[#5A6070] hover:bg-[#EEF3FF]'
    return recibosAnio.some(recibo => recibo.mes === numeroMes)
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
      : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
  }

  async function abrir(recibo: ReciboSueldo) {
    try {
      await openArchivo(API_ENDPOINTS.PERSONAL.OPEN_RECIBO_SUELDO(personalId, recibo.id))
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudo abrir el recibo')
    }
  }

  async function subir() {
    if (!archivo) return
    setUploading(true)
    try {
      const data = new FormData()
      data.append('file', archivo)
      data.append('mes', String(mes))
      data.append('anio', String(anio))
      const response = await apiFetch(API_ENDPOINTS.PERSONAL.UPLOAD_RECIBO_SUELDO(personalId), {
        method: 'POST',
        body: data,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'No se pudo subir el recibo')
      setArchivo(null)
      toast.success('Recibo cargado correctamente')
      await cargarRecibos()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudo subir el recibo')
    } finally {
      setUploading(false)
    }
  }

  async function eliminar() {
    if (!reciboAEliminar) return
    try {
      const response = await apiFetch(API_ENDPOINTS.PERSONAL.DELETE_RECIBO_SUELDO(personalId, reciboAEliminar.id), {
        method: 'DELETE',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'No se pudo eliminar el recibo')
      setRecibosAnio(prev => prev.filter(recibo => recibo.id !== reciboAEliminar.id))
      setReciboAEliminar(null)
      toast.success('Recibo eliminado')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el recibo')
    }
  }

  function reciboItem(recibo: ReciboSueldo, titulo: string) {
    return (
      <div key={recibo.id} className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => abrir(recibo)}
          className="flex-1 h-auto justify-start p-4"
        >
          <FileText className="mr-3 h-5 w-5" />
          <span className="text-left">
            <span className="block">{titulo}</span>
            <span className="text-xs font-normal">Subido por {recibo.subido_por_nombre ?? 'No informado'}</span>
          </span>
        </Button>
        {canEditar && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setReciboAEliminar(recibo)}
            className="self-center text-rose-600 hover:bg-rose-50"
            aria-label="Eliminar recibo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E0E0E0] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#002868]">Período</p>
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MESES.map((nombre, index) => (
            <Button
              key={nombre}
              type="button"
              variant="outline"
              onClick={() => setMes(index + 1)}
              className={`text-xs ${getEstadoMes(index + 1)} ${mes === index + 1 ? 'ring-2 ring-[#002868] ring-offset-1' : ''}`}
            >
              {nombre.slice(0, 3)}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 items-center">
          <span className="text-xs font-semibold text-[#5A6070]">Año:</span>
          <select
            value={anio}
            onChange={event => setAnio(Number(event.target.value))}
            className="h-9 rounded-lg border border-[#D8E3F8] px-3 text-sm"
          >
            {anios.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canEditar && (
        <div className="rounded-xl border border-[#002868]/20 bg-[#F0F4FF] p-4 flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={event => setArchivo(event.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="bg-white">
            <Upload className="mr-2 h-4 w-4" /> {archivo?.name ?? 'Seleccionar recibo'}
          </Button>
          <Button type="button" disabled={!archivo || uploading} onClick={subir} className="bg-[#002868] text-white">
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Subir recibo de {MESES[mes - 1]} {anio}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-[#8A8F9C]">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
          Cargando recibos…
        </div>
      ) : recibos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E0E0E0] py-12 text-center text-sm text-[#8A8F9C]">
          No hay recibos para {MESES[mes - 1]} de {anio}.
        </div>
      ) : recibos.length === 1 ? (
        reciboItem(recibos[0], `Ver recibo de ${MESES[mes - 1]} ${anio}`)
      ) : (
        <div className="space-y-2">
          {recibos.map((recibo, index) =>
            reciboItem(recibo, `Recibo ${index + 1}: ${recibo.nombre_original ?? 'Sin nombre'}`),
          )}
        </div>
      )}
      <DeleteDialog
        open={reciboAEliminar !== null}
        nombre={reciboAEliminar?.nombre_original ?? 'este recibo'}
        onConfirm={eliminar}
        onCancel={() => setReciboAEliminar(null)}
      />
    </div>
  )
}
