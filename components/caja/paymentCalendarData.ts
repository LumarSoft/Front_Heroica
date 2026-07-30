import type { Transaction } from '@/lib/types'
import type { DayData } from '@/components/caja/PaymentCalendarCells'

/** Devuelve la parte YYYY-MM-DD de una fecha ISO (con o sin hora). */
export function toISODatePart(fecha: string | undefined): string | null {
  if (!fecha) return null
  return fecha.includes('T') ? fecha.split('T')[0] : fecha
}

interface BuildDayMapOptions {
  /**
   * Cuando es true, todo egreso con fecha anterior a `hoyISO` que sigue sin pasarse a
   * saldo real se reagrupa en el día actual (un cheque que vencía ayer y no se pagó
   * suma al total de hoy).
   */
  agruparVencidos?: boolean
  /** Fecha actual en formato YYYY-MM-DD. */
  hoyISO: string
}

/**
 * Agrupa los movimientos por fecha ISO acumulando egresos, ingresos y los vencidos
 * reagrupados en el día actual.
 */
export function buildDayMap(transactions: Transaction[], { agruparVencidos, hoyISO }: BuildDayMapOptions) {
  const map = new Map<string, DayData>()

  for (const t of transactions) {
    const datePart = toISODatePart(t.fecha)
    if (!datePart) continue

    const esVencido = Boolean(agruparVencidos) && t.tipo === 'egreso' && datePart < hoyISO
    const key = esVencido ? hoyISO : datePart

    const existing = map.get(key) ?? { egresos: 0, ingresos: 0, items: [], egresosVencidos: 0, cantidadVencidos: 0 }
    const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : (t.monto ?? 0)
    const montoAbs = Math.abs(monto)

    if (t.tipo === 'egreso') {
      existing.egresos += montoAbs
    } else {
      existing.ingresos += montoAbs
    }

    if (esVencido) {
      existing.egresosVencidos += montoAbs
      existing.cantidadVencidos += 1
    }

    existing.items.push(t)
    map.set(key, existing)
  }

  // El día actual puede mezclar movimientos de fechas anteriores: ordenarlos cronológicamente
  const hoyData = map.get(hoyISO)
  if (hoyData && hoyData.cantidadVencidos > 0) {
    hoyData.items.sort((a, b) => (toISODatePart(a.fecha) ?? '').localeCompare(toISODatePart(b.fecha) ?? ''))
  }

  return map
}
