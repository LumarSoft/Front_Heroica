'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { openArchivo } from '@/lib/document-url'
import { agruparPorMes } from '@/lib/abono'
import type {
  ApiRespuesta,
  FacturaAbono,
  FacturasAbonoRespuesta,
  HistorialAbono,
  NuevaFacturaAbono,
  TotalesAbono,
} from '@/lib/types'

const TOTALES_VACIOS: TotalesAbono = { facturado: 0, abonado: 0, adeudado: 0 }

async function leer<T>(res: Response, mensaje: string): Promise<T> {
  const data: ApiRespuesta<T> = await res.json()
  if (!res.ok || !data.success || data.data === undefined) throw new Error(data.message || mensaje)
  return data.data
}

/** Datos de Abono del sistema: facturas por mes, totales, historial y sus acciones */
export function useAbonoSistema() {
  const [facturas, setFacturas] = useState<FacturaAbono[]>([])
  const [totales, setTotales] = useState<TotalesAbono>(TOTALES_VACIOS)
  const [historial, setHistorial] = useState<HistorialAbono[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  /** Clave de la acción en curso (ej. "estado-12", "mes-2026-10", "eliminar-3") */
  const [enCurso, setEnCurso] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [resFacturas, resHistorial] = await Promise.all([
        apiFetch(API_ENDPOINTS.ABONO.FACTURAS, { cache: 'no-store' }),
        apiFetch(API_ENDPOINTS.ABONO.HISTORIAL, { cache: 'no-store' }),
      ])
      const datos = await leer<FacturasAbonoRespuesta>(resFacturas, 'No se pudieron cargar las facturas')
      setFacturas(datos.facturas)
      setTotales(datos.totales)
      setHistorial(await leer<HistorialAbono[]>(resHistorial, 'No se pudo cargar el historial'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el abono del sistema')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const meses = useMemo(() => agruparPorMes(facturas), [facturas])

  /** Corre una acción, avisa el resultado y recarga facturas e historial */
  const ejecutar = useCallback(
    async (clave: string, accion: () => Promise<Response>, ok: string, fallo: string): Promise<boolean> => {
      setEnCurso(clave)
      try {
        await leer<unknown>(await accion(), fallo)
        toast.success(ok)
        await cargar()
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : fallo)
        return false
      } finally {
        setEnCurso(null)
      }
    },
    [cargar],
  )

  const subir = useCallback(
    (nueva: NuevaFacturaAbono) => {
      const fd = new FormData()
      fd.append('file', nueva.archivo)
      fd.append('mes', String(nueva.mes))
      fd.append('anio', String(nueva.anio))
      fd.append('monto', nueva.monto)
      fd.append('numero', nueva.numero)
      fd.append('descripcion', nueva.descripcion)
      return ejecutar(
        'subir',
        () => apiFetch(API_ENDPOINTS.ABONO.FACTURAS, { method: 'POST', body: fd }),
        'Factura subida',
        'No se pudo subir la factura',
      )
    },
    [ejecutar],
  )

  const cambiarEstado = useCallback(
    (clave: string, ids: number[], abonada: boolean) =>
      ejecutar(
        clave,
        () => apiFetch(API_ENDPOINTS.ABONO.ESTADO, { method: 'PATCH', body: JSON.stringify({ ids, abonada }) }),
        abonada ? 'Marcado como abonado' : 'Marcado como pendiente',
        'No se pudo cambiar el estado',
      ),
    [ejecutar],
  )

  const eliminar = useCallback(
    (f: FacturaAbono) =>
      ejecutar(
        `eliminar-${f.id}`,
        () => apiFetch(API_ENDPOINTS.ABONO.DELETE(f.id), { method: 'DELETE' }),
        'Factura eliminada',
        'No se pudo eliminar la factura',
      ),
    [ejecutar],
  )

  const abrir = useCallback(async (f: FacturaAbono) => {
    try {
      await openArchivo(API_ENDPOINTS.ABONO.ABRIR(f.id))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo abrir la factura')
    }
  }, [])

  return { meses, totales, historial, isLoading, error, enCurso, cargar, subir, cambiarEstado, eliminar, abrir }
}
