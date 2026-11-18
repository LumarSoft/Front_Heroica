// Base impositiva: los impuestos que sigue Pau (21/10/2026). Multas, planes de pago e IVA no entran.
// Misma lista que la API (movimientosHelpers.IMPUESTOS_BASE).
export const IMPUESTOS_BASE = [
  'SUSS',
  'Anticipo de Ganancias',
  'DReI',
  'ETUR',
  'Sindicato',
  'Ingresos Brutos',
  'Convenio Multilateral',
] as const

export type Impuesto = (typeof IMPUESTOS_BASE)[number]

/** Opciones del selector "Base impositiva". La opción vacía ("No afecta") la agrega cada selector. */
export const OPCIONES_IMPUESTO: { value: Impuesto; label: string }[] = IMPUESTOS_BASE.map(i => ({ value: i, label: i }))

export function esImpuesto(valor: unknown): valor is Impuesto {
  return (IMPUESTOS_BASE as readonly string[]).includes(String(valor))
}

const palabra = (expr: string) => new RegExp(`(^|[^a-z])(${expr})([^a-z]|$)`)

// Mismas reglas que el ensayo y la migración 034 (consultas/034_ensayo_marcar_impuestos.sql)
const REGLAS: { impuesto: Impuesto; coincide: (n: string) => boolean }[] = [
  { impuesto: 'Convenio Multilateral', coincide: n => n.includes('multilateral') },
  { impuesto: 'Ingresos Brutos', coincide: n => n.includes('ingresos brutos') || palabra('iibb').test(n) },
  { impuesto: 'SUSS', coincide: n => n.includes('suss') },
  { impuesto: 'Anticipo de Ganancias', coincide: n => n.includes('ganancia') },
  { impuesto: 'DReI', coincide: n => palabra('drei').test(n) || n.includes('derecho de registro') },
  { impuesto: 'ETUR', coincide: n => palabra('etur').test(n) },
  { impuesto: 'Sindicato', coincide: n => n.includes('sindicato') || palabra('uthgra').test(n) },
]
const EXCLUIDOS = palabra('multas?|plan(es)? de pago|moratoria|iva')

/** Impuesto que corresponde a una descripción por su nombre, o '' si no es uno de la lista */
export function impuestoSugerido(nombreDescripcion: string | null | undefined): Impuesto | '' {
  const n = (nombreDescripcion ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (!n || EXCLUIDOS.test(n)) return ''
  return REGLAS.find(r => r.coincide(n))?.impuesto ?? ''
}
