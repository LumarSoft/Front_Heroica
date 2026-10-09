import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { EstadoIntegracionVentas } from '@/lib/types'

/** Mensajes de alerta de las integraciones (fuente caída, desactualizada o con locales sin sucursal). */
export function useVentasAlertasIntegraciones(habilitado: boolean): string[] {
  const [alertas, setAlertas] = useState<string[]>([])

  useEffect(() => {
    if (!habilitado) return
    let cancelado = false
    apiFetch(API_ENDPOINTS.VENTAS.INTEGRACIONES_ESTADO)
      .then(async response => {
        if (!response.ok) return
        const json = await response.json()
        const mensajes = (json.data as EstadoIntegracionVentas[])
          // Una integración sin credenciales en el servidor no está en uso: no se avisa en el panel.
          .filter(e => e.disponible && e.credenciales)
          .flatMap(e => [
            e.alerta ? `${e.nombre}: ${e.alerta}` : null,
            e.localesSinAsignar > 0
              ? `${e.nombre}: ${e.localesSinAsignar === 1 ? 'un local no se pudo' : `${e.localesSinAsignar} locales no se pudieron`} vincular solo a una sucursal. Elegila una única vez para ver sus ventas por sucursal.`
              : null,
          ])
          .filter((m): m is string => Boolean(m))
        if (!cancelado) setAlertas(mensajes)
      })
      // El aviso es complementario: si falla, el panel sigue funcionando sin él.
      .catch(() => undefined)
    return () => {
      cancelado = true
    }
  }, [habilitado])

  return alertas
}
