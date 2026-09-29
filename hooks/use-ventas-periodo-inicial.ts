import { useEffect, useRef } from 'react'
import type { CoberturaVentas, FiltrosVentas } from '@/lib/types'

/**
 * La primera vez que se conoce qué días hay importados, ajusta el período por defecto
 * (últimos 30 días) a ese rango: la primera vista muestra datos reales en vez de
 * advertencias por días que nunca se trajeron. Después, el usuario manda.
 */
export function useVentasPeriodoInicial(
  cobertura: CoberturaVentas | null,
  filtros: FiltrosVentas,
  setFiltro: <K extends keyof FiltrosVentas>(clave: K, valor: FiltrosVentas[K]) => void,
): void {
  const ajustado = useRef(false)

  useEffect(() => {
    if (ajustado.current || !cobertura) return
    ajustado.current = true
    if (!cobertura.desde || !cobertura.hasta) return
    if (filtros.desde < cobertura.desde) setFiltro('desde', cobertura.desde)
    if (filtros.hasta > cobertura.hasta && cobertura.hasta >= filtros.desde) setFiltro('hasta', cobertura.hasta)
  }, [cobertura, filtros.desde, filtros.hasta, setFiltro])
}
