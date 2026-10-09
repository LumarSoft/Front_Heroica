import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { formatRangoFechas, pluralDias } from '@/lib/formatters'
import type { EstadoIntegracionVentas, FuenteVentas, ResultadoProcesoVentas, SincronizacionVentas } from '@/lib/types'

// Mientras hay una sincronización en curso se consulta el avance cada 5 s: una
// corrida de muchos días se procesa por tramos y puede tardar unos minutos.
const POLLING_MS = 5_000
// En Vercel nada corre en segundo plano: mientras esta pantalla esté abierta y haya
// corridas en curso, se le pide a la API que las avance (cada llamada procesa ~40 s).
const PAUSA_ENTRE_TRAMOS_MS = 2_000

export interface UseVentasIntegracionesResult {
  estados: EstadoIntegracionVentas[]
  sincronizaciones: SincronizacionVentas[]
  isLoading: boolean
  error: string
  hayEnCurso: boolean
  isSincronizando: boolean
  sincronizar: (fuente: FuenteVentas, desde: string, hasta: string) => Promise<boolean>
}

function avisarFin(s: SincronizacionVentas): void {
  const rango = formatRangoFechas(s.fechaDesde, s.fechaHasta)
  if (s.estado === 'fallida') {
    toast.error(`La importación ${rango} no terminó: ${s.mensaje ?? 'error de la fuente'}`)
    return
  }
  const partes = [
    s.diasNuevos > 0 ? `${pluralDias(s.diasNuevos)} ${s.diasNuevos === 1 ? 'nuevo' : 'nuevos'}` : null,
    s.diasActualizados > 0
      ? `${pluralDias(s.diasActualizados)} ${s.diasActualizados === 1 ? 'actualizado' : 'actualizados'}`
      : null,
  ].filter(Boolean)
  toast.success(`Ventas ${rango} importadas`, { description: partes.join(' · ') || undefined })
}

/** `onCorridaFinalizada` se llama cuando una sincronización en curso termina. */
export function useVentasIntegraciones(onCorridaFinalizada?: () => void): UseVentasIntegracionesResult {
  const [estados, setEstados] = useState<EstadoIntegracionVentas[]>([])
  const [sincronizaciones, setSincronizaciones] = useState<SincronizacionVentas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSincronizando, setIsSincronizando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const [resEstado, resHistorial] = await Promise.all([
        apiFetch(API_ENDPOINTS.VENTAS.INTEGRACIONES_ESTADO, { cache: 'no-store' }),
        apiFetch(API_ENDPOINTS.VENTAS.SINCRONIZACIONES, { cache: 'no-store' }),
      ])
      const [jsonEstado, jsonHistorial] = await Promise.all([resEstado.json(), resHistorial.json()])
      if (!resEstado.ok) throw new Error(jsonEstado.message || 'Error al consultar las integraciones')
      if (!resHistorial.ok) throw new Error(jsonHistorial.message || 'Error al consultar el historial')
      setEstados(jsonEstado.data as EstadoIntegracionVentas[])
      setSincronizaciones(jsonHistorial.data as SincronizacionVentas[])
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al consultar las integraciones')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const hayEnCurso = useMemo(
    () => estados.some(e => e.enCurso) || sincronizaciones.some(s => s.estado === 'en_curso'),
    [estados, sincronizaciones],
  )

  // Aviso al terminar cada importación: qué días trajo y cómo salió.
  const estadosPrevios = useRef(new Map<number, SincronizacionVentas['estado']>())
  useEffect(() => {
    for (const s of sincronizaciones) {
      const previo = estadosPrevios.current.get(s.id)
      if (previo === 'en_curso' && s.estado !== 'en_curso') avisarFin(s)
      estadosPrevios.current.set(s.id, s.estado)
    }
  }, [sincronizaciones])

  const habiaEnCurso = useRef(false)
  useEffect(() => {
    if (habiaEnCurso.current && !hayEnCurso) onCorridaFinalizada?.()
    habiaEnCurso.current = hayEnCurso
  }, [hayEnCurso, onCorridaFinalizada])

  useEffect(() => {
    if (!hayEnCurso) return
    const timer = setInterval(() => void cargar(), POLLING_MS)
    return () => clearInterval(timer)
  }, [hayEnCurso, cargar])

  useEffect(() => {
    if (!hayEnCurso) return
    let activo = true
    const impulsar = async () => {
      while (activo) {
        try {
          const response = await apiFetch(API_ENDPOINTS.VENTAS.PROCESAR, { method: 'POST' })
          const json = await response.json()
          const resultado = json.data as ResultadoProcesoVentas | undefined
          if (!response.ok || !resultado?.quedanPendientes) break
        } catch {
          break
        }
        await new Promise(resolve => setTimeout(resolve, PAUSA_ENTRE_TRAMOS_MS))
      }
      if (activo) await cargar()
    }
    void impulsar()
    return () => {
      activo = false
    }
  }, [hayEnCurso, cargar])

  const sincronizar = useCallback(
    async (fuente: FuenteVentas, desde: string, hasta: string) => {
      setIsSincronizando(true)
      try {
        const response = await apiFetch(API_ENDPOINTS.VENTAS.SINCRONIZAR, {
          method: 'POST',
          body: JSON.stringify({ fuente, desde, hasta }),
        })
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudo iniciar la sincronización')
        toast.success('Importación iniciada. Podés seguir el avance en la lista de importaciones.')
        await cargar()
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo iniciar la sincronización')
        return false
      } finally {
        setIsSincronizando(false)
      }
    },
    [cargar],
  )

  return { estados, sincronizaciones, isLoading, error, hayEnCurso, isSincronizando, sincronizar }
}
