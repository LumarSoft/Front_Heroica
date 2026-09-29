'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface TraerDesdeUrlProps {
  onRango: (desde: string, hasta: string) => void
}

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Lee ?traer_desde=&traer_hasta= (enlaces "Traer esos días" del panel) y abre el
 * diálogo de importación con ese rango. Va en su propio componente porque
 * useSearchParams necesita un Suspense alrededor.
 */
export function TraerDesdeUrl({ onRango }: TraerDesdeUrlProps) {
  const params = useSearchParams()
  const desde = params.get('traer_desde')
  const hasta = params.get('traer_hasta')

  useEffect(() => {
    if (desde && hasta && FECHA_RE.test(desde) && FECHA_RE.test(hasta) && desde <= hasta) onRango(desde, hasta)
  }, [desde, hasta, onRango])

  return null
}
