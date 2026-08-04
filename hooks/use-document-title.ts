'use client'

import { useEffect } from 'react'

/** Título por defecto de la app (coincide con la metadata del root layout). */
const TITULO_BASE = 'Heroica — Sistema Administrativo'

/**
 * Ajusta el título de la pestaña mientras el componente está montado y lo
 * restaura al desmontarse. Permite identificar la sucursal de cada ventana
 * cuando se trabaja con varias abiertas en paralelo.
 *
 * Si `titulo` llega vacío (datos todavía cargando) se mantiene el título base.
 */
export function useDocumentTitle(titulo: string | null | undefined): void {
  useEffect(() => {
    const limpio = titulo?.trim()
    document.title = limpio ? `${limpio} — Heroica` : TITULO_BASE

    return () => {
      document.title = TITULO_BASE
    }
  }, [titulo])
}
