'use client'

import { useCallback, useRef, useState } from 'react'

export type NavDir = 'down' | 'up' | 'right' | 'left' | null

export interface ActiveCell {
  rowId: number
  colKey: string
}

interface UseGridEditParams {
  /** Ids de las filas en el orden en que se muestran */
  rowIds: number[]
  /** Claves de las columnas editables, en orden izquierda→derecha */
  colKeys: string[]
  /** Persiste el cambio de una celda. Devuelve true si se guardó correctamente. */
  onCommit: (rowId: number, colKey: string, value: string) => Promise<boolean>
}

/**
 * Coordina la edición "estilo Excel" de una grilla: qué celda está activa, qué filas se
 * están guardando y la navegación con teclado (Enter/Tab/flechas) entre celdas editables.
 * No sabe nada del render — sólo expone estado y handlers.
 */
export function useGridEdit({ rowIds, colKeys, onCommit }: UseGridEditParams) {
  const [active, setActive] = useState<ActiveCell | null>(null)
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())

  // Refs para leer el estado más reciente dentro de callbacks asíncronos
  const rowIdsRef = useRef(rowIds)
  rowIdsRef.current = rowIds
  const colKeysRef = useRef(colKeys)
  colKeysRef.current = colKeys
  const activeRef = useRef<ActiveCell | null>(active)
  activeRef.current = active

  const start = useCallback((rowId: number, colKey: string) => {
    setActive({ rowId, colKey })
  }, [])

  const cancel = useCallback(() => {
    setActive(null)
  }, [])

  const isSaving = useCallback((rowId: number) => savingIds.has(rowId), [savingIds])

  // Calcula la celda destino a partir de una dirección de navegación
  const nextCell = useCallback((from: ActiveCell, dir: NavDir): ActiveCell | null => {
    if (!dir) return null
    const rows = rowIdsRef.current
    const cols = colKeysRef.current
    const r = rows.indexOf(from.rowId)
    const c = cols.indexOf(from.colKey)
    if (r < 0 || c < 0) return null

    if (dir === 'down') return r + 1 < rows.length ? { rowId: rows[r + 1], colKey: from.colKey } : null
    if (dir === 'up') return r - 1 >= 0 ? { rowId: rows[r - 1], colKey: from.colKey } : null
    if (dir === 'right') {
      if (c + 1 < cols.length) return { rowId: from.rowId, colKey: cols[c + 1] }
      return r + 1 < rows.length ? { rowId: rows[r + 1], colKey: cols[0] } : null
    }
    // left
    if (c - 1 >= 0) return { rowId: from.rowId, colKey: cols[c - 1] }
    return r - 1 >= 0 ? { rowId: rows[r - 1], colKey: cols[cols.length - 1] } : null
  }, [])

  /**
   * Guarda el valor de la celda activa y, si tuvo éxito, salta a la celda indicada por `dir`.
   * Si el guardado falla, la edición permanece abierta para reintentar/corregir.
   */
  const commit = useCallback(
    async (value: string, dir: NavDir) => {
      const cell = activeRef.current
      if (!cell) return
      const { rowId, colKey } = cell

      setSavingIds(prev => new Set(prev).add(rowId))
      let ok = false
      try {
        ok = await onCommit(rowId, colKey, value)
      } finally {
        setSavingIds(prev => {
          const next = new Set(prev)
          next.delete(rowId)
          return next
        })
      }

      if (!ok) return
      // Sólo navegamos si el usuario no movió el foco a otra celda mientras guardábamos
      const stillHere = activeRef.current?.rowId === rowId && activeRef.current?.colKey === colKey
      setActive(stillHere ? nextCell(cell, dir) : activeRef.current)
    },
    [onCommit, nextCell],
  )

  const isActive = useCallback(
    (rowId: number, colKey: string) => active?.rowId === rowId && active?.colKey === colKey,
    [active],
  )

  return { active, isActive, isSaving, start, cancel, commit }
}
