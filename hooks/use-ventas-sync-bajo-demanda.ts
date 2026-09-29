import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { ResultadoProcesoVentas } from '@/lib/types'

/**
 * En Vercel no hay procesos de fondo: al abrir el panel se le pide a la API que
 * sincronice si los datos quedaron viejos (la API decide si corresponde y respeta
 * el candado). Devuelve un contador que sube cuando entraron ventas nuevas, para
 * que el panel vuelva a consultar.
 */
export function useVentasSyncBajoDemanda(habilitado: boolean): number {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!habilitado) return
    let cancelado = false
    apiFetch(API_ENDPOINTS.VENTAS.PROCESAR, { method: 'POST' })
      .then(async response => {
        if (!response.ok) return
        const json = await response.json()
        const resultado = json.data as ResultadoProcesoVentas
        if (!cancelado && resultado.lineasImportadas > 0) setVersion(v => v + 1)
      })
      // Es una mejora oportunista: si falla, el panel muestra lo ya importado.
      .catch(() => undefined)
    return () => {
      cancelado = true
    }
  }, [habilitado])

  return version
}
