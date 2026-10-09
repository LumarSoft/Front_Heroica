import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { OpcionesFiltrosVentas } from '@/lib/types'

const VACIAS: OpcionesFiltrosVentas = {
  sucursales: [],
  categorias: [],
  mediosPago: [],
  canales: [],
  vendedores: [],
  cajas: [],
}

export interface UseVentasOpcionesResult {
  opciones: OpcionesFiltrosVentas
  error: string
}

/** Catálogos de los selectores (sucursales, categorías, medios de pago, canales, vendedores, cajas). */
export function useVentasOpciones(): UseVentasOpcionesResult {
  const [opciones, setOpciones] = useState<OpcionesFiltrosVentas>(VACIAS)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    apiFetch(API_ENDPOINTS.VENTAS.FILTROS)
      .then(async response => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || 'No se pudieron cargar los filtros')
        if (!cancelado) setOpciones({ ...VACIAS, ...(json.data as Partial<OpcionesFiltrosVentas>) })
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : 'No se pudieron cargar los filtros')
      })
    return () => {
      cancelado = true
    }
  }, [])

  return { opciones, error }
}
