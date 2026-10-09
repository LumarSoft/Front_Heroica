import { useCallback, useEffect, useMemo, useState } from 'react'
import { toDateOnly } from '@/lib/downloadBlob'
import type { FiltrosVentas } from '@/lib/types'

const DEBOUNCE_MS = 400

function filtrosIniciales(): FiltrosVentas {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(hoy.getDate() - 29)
  return {
    desde: toDateOnly(desde),
    hasta: toDateOnly(hoy),
    sucursalIds: [],
    categoria: '',
    medioPago: '',
    canal: '',
    producto: '',
    vendedor: '',
    caja: '',
  }
}

export interface UseVentasFiltrosResult {
  /** Lo que el usuario está editando (inputs). */
  filtros: FiltrosVentas
  /** Versión con debounce: es la que dispara las consultas a la API. */
  filtrosAplicados: FiltrosVentas
  rangoValido: boolean
  setFiltro: <K extends keyof FiltrosVentas>(clave: K, valor: FiltrosVentas[K]) => void
  limpiar: () => void
}

export function useVentasFiltros(): UseVentasFiltrosResult {
  const [filtros, setFiltros] = useState<FiltrosVentas>(filtrosIniciales)
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosVentas>(filtros)

  useEffect(() => {
    const timer = setTimeout(() => setFiltrosAplicados(filtros), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [filtros])

  const setFiltro = useCallback(<K extends keyof FiltrosVentas>(clave: K, valor: FiltrosVentas[K]) => {
    setFiltros(prev => ({ ...prev, [clave]: valor }))
  }, [])

  const limpiar = useCallback(() => setFiltros(filtrosIniciales()), [])

  const rangoValido = useMemo(
    () => Boolean(filtrosAplicados.desde && filtrosAplicados.hasta && filtrosAplicados.desde <= filtrosAplicados.hasta),
    [filtrosAplicados.desde, filtrosAplicados.hasta],
  )

  return { filtros, filtrosAplicados, rangoValido, setFiltro, limpiar }
}
