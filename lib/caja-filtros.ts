import type { DateRange } from 'react-day-picker'

export type FiltroDeuda = 'todos' | 'solo_deudas' | 'sin_deudas'
export type SaldoTipo = 'real' | 'necesario' | 'combinado'

export interface CajaFiltros {
  dateRange: DateRange | undefined
  bancosFiltro: string[]
  searchText: string
  filtroDeuda: FiltroDeuda
  filtroChequesPendientes: boolean
}

export interface Cursor {
  cursor_fecha: string
  cursor_orden: number
  cursor_id: number
}

export const PAGE_SIZE = 150

function toISODate(d: Date | undefined): string | null {
  if (!d) return null
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildFiltrosQS(f: CajaFiltros): string {
  const p = new URLSearchParams()

  const desde = toISODate(f.dateRange?.from)
  const hasta = toISODate(f.dateRange?.to)
  if (desde) p.set('desde', desde)
  if (hasta) p.set('hasta', hasta)

  const bancos = f.bancosFiltro.map(b => b.trim()).filter(Boolean)
  if (bancos.length > 0) p.set('banco_id', bancos.join(','))

  const q = f.searchText.trim()
  if (q) p.set('q', q)

  if (f.filtroDeuda !== 'todos') p.set('deuda', f.filtroDeuda)
  if (f.filtroChequesPendientes) p.set('cheques_pendientes', 'true')

  const s = p.toString()
  return s ? `&${s}` : ''
}

export function buildPaginaQS(saldo: SaldoTipo, cursor: Cursor | null, limit: number = PAGE_SIZE): string {
  const p = new URLSearchParams({ saldo, limit: String(limit) })
  if (cursor) {
    p.set('cursor_fecha', cursor.cursor_fecha)
    p.set('cursor_orden', String(cursor.cursor_orden))
    p.set('cursor_id', String(cursor.cursor_id))
  }
  return `&${p.toString()}`
}

export function hayFiltrosActivos(f: CajaFiltros): boolean {
  return (
    f.dateRange !== undefined ||
    f.bancosFiltro.length > 0 ||
    f.searchText.trim() !== '' ||
    f.filtroDeuda !== 'todos' ||
    f.filtroChequesPendientes
  )
}
