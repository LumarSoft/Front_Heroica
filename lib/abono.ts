import type { FacturaAbono, MesAbono, TotalesAbono } from '@/lib/types'

export const MESES_ABONO = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** "Octubre 2026" */
export function etiquetaMesAbono(mes: number, anio: number): string {
  return `${MESES_ABONO[mes - 1]} ${anio}`
}

export function totalesDe(facturas: FacturaAbono[]): TotalesAbono {
  const facturado = facturas.reduce((s, f) => s + f.monto, 0)
  const abonado = facturas.filter(f => f.abonada).reduce((s, f) => s + f.monto, 0)
  return { facturado, abonado, adeudado: facturado - abonado }
}

/** Agrupa por mes, en el orden en que llegan (más nuevo primero) */
export function agruparPorMes(facturas: FacturaAbono[]): MesAbono[] {
  const mapa = new Map<string, FacturaAbono[]>()
  for (const f of facturas) {
    const clave = `${f.anio}-${String(f.mes).padStart(2, '0')}`
    mapa.set(clave, [...(mapa.get(clave) ?? []), f])
  }
  return [...mapa.entries()].map(([clave, items]) => ({
    clave,
    mes: items[0].mes,
    anio: items[0].anio,
    facturas: items,
    totales: totalesDe(items),
  }))
}
