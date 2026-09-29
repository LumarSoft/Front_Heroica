import type { FiltrosVentas, FuenteVentas } from './types-ventas'

/** Query string común a panel, operaciones y exportación. */
export function filtrosVentasQuery(filtros: FiltrosVentas): URLSearchParams {
  const params = new URLSearchParams({ desde: filtros.desde, hasta: filtros.hasta })
  if (filtros.sucursalIds.length > 0) params.set('sucursal_ids', filtros.sucursalIds.join(','))
  if (filtros.categoria) params.set('categoria', filtros.categoria)
  if (filtros.medioPago) params.set('medio_pago', filtros.medioPago)
  if (filtros.canal) params.set('canal', filtros.canal)
  if (filtros.producto) params.set('producto', filtros.producto)
  return params
}

export function createVentasEndpoints(API_URL: string) {
  const base = `${API_URL}/api/ventas`
  return {
    VENTAS: {
      PANEL: (filtros: FiltrosVentas, agrupacion: string, comparacion: string) => {
        const params = filtrosVentasQuery(filtros)
        params.set('agrupacion', agrupacion)
        params.set('comparacion', comparacion)
        return `${base}/panel?${params.toString()}`
      },
      FILTROS: `${base}/filtros`,
      OPERACIONES: (filtros: FiltrosVentas, pagina: number) => {
        const params = filtrosVentasQuery(filtros)
        params.set('pagina', String(pagina))
        return `${base}/operaciones?${params.toString()}`
      },
      DETALLE_OPERACION: (fuente: FuenteVentas, fecha: string, transaccionId: string) =>
        `${base}/operaciones/detalle?${new URLSearchParams({ fuente, fecha, transaccion_id: transaccionId }).toString()}`,
      EXPORTAR: (filtros: FiltrosVentas) => `${base}/exportar?${filtrosVentasQuery(filtros).toString()}`,
      COBERTURA: (desde?: string, hasta?: string) =>
        desde && hasta ? `${base}/cobertura?${new URLSearchParams({ desde, hasta }).toString()}` : `${base}/cobertura`,
      INTEGRACIONES_ESTADO: `${base}/integraciones/estado`,
      SINCRONIZACIONES: `${base}/integraciones/sincronizaciones?limite=50`,
      SINCRONIZAR: `${base}/integraciones/sincronizar`,
      PROCESAR: `${base}/integraciones/procesar`,
      LOCALES: `${base}/integraciones/locales`,
      LOCAL: (id: number) => `${base}/integraciones/locales/${id}`,
    },
  }
}
