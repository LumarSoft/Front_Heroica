// =============================================
// Funciones utilitarias de formateo compartidas
// =============================================

/**
 * Formatea una fecha ISO a formato dd/mm/aaaa
 */
export function formatFecha(fechaISO: string): string {
  if (!fechaISO) return '-'
  // Si viene completa con hora, nos quedamos con la porción de fecha 'YYYY-MM-DD'
  const datePart = fechaISO.includes('T') ? fechaISO.split('T')[0] : fechaISO
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return fechaISO // Fallback si el formato no es el esperado
  return `${day}/${month}/${year.substring(0, 4)}`
}

/**
 * Formatea un monto numérico a formato de moneda (ARS o USD)
 */
export function formatMonto(monto: number | string, moneda: 'ARS' | 'USD' = 'ARS'): string {
  const montoNum = typeof monto === 'string' ? parseFloat(monto) : monto
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
  }).format(Math.abs(montoNum))

  return montoNum < 0 ? `-${formatted}` : formatted
}

/**
 * Calcula el total de un array de transacciones
 */
export function calcularTotal(transactions: { monto: number | string }[]): number {
  return transactions.reduce((sum, t) => {
    const monto = typeof t.monto === 'string' ? parseFloat(t.monto) : t.monto
    return sum + monto
  }, 0)
}

/**
 * Trunca un texto a la cantidad de caracteres indicada y agrega "..."
 */
export function truncarTexto(texto: string | null | undefined, max = 50): string {
  if (!texto) return '-'
  return texto.length > max ? `${texto.slice(0, max)}...` : texto
}

/** Mapa de colores para badges de estado */
export const ESTADO_COLOR_MAP: Record<string, string> = {
  completado: 'bg-emerald-100 text-emerald-800',
  aprobado: 'bg-blue-100 text-blue-800',
  rechazado: 'bg-rose-100 text-rose-800',
  pendiente: 'bg-amber-100 text-amber-800',
}

/** Mapa de colores para badges de prioridad */
export const PRIORIDAD_COLOR_MAP: Record<string, string> = {
  alta: 'bg-rose-100 text-rose-800',
  media: 'bg-amber-100 text-amber-800',
  baja: 'bg-gray-100 text-gray-800',
}

/**
 * Devuelve clases CSS para el badge de estado
 */
export function getEstadoColor(estado: string): string {
  return ESTADO_COLOR_MAP[estado] ?? 'bg-gray-100 text-gray-800'
}

/**
 * Devuelve clases CSS para el badge de prioridad
 */
export function getPrioridadColor(prioridad: string): string {
  return PRIORIDAD_COLOR_MAP[prioridad] ?? 'bg-gray-100 text-gray-800'
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Normaliza lo que escribe el usuario a un número "crudo" apto para parseFloat ("1234.56").
 *
 * Acepta indistintamente punto o coma como separador decimal: se toma el último separador
 * escrito y se decide por la cantidad de dígitos que lo siguen (los montos tienen como
 * máximo 2 decimales):
 *   - 0, 1 o 2 dígitos  → es el separador decimal   ("1234.5" / "1234,5" → 1234.5)
 *   - 3 o más dígitos   → es separador de miles     ("1.000" → 1000, "1.0005" → 10005)
 * El resto de los separadores siempre se descartan (agrupación de miles).
 */
export function parseInputMonto(value: string): string {
  if (!value) return ''

  // Quedarse sólo con dígitos y separadores (descarta $, espacios, letras, etc.)
  let clean = value.replace(/[^0-9.,]/g, '')
  if (!clean) return ''

  const lastSep = Math.max(clean.lastIndexOf('.'), clean.lastIndexOf(','))
  // Lo que sigue al último separador son siempre dígitos (no puede haber otro separador)
  const decimales = lastSep === -1 ? '' : clean.slice(lastSep + 1)

  if (lastSep !== -1 && decimales.length <= 2) {
    const entero = clean.slice(0, lastSep).replace(/[.,]/g, '')
    clean = `${entero}.${decimales}`
  } else {
    clean = clean.replace(/[.,]/g, '')
  }

  // Si empieza por punto, añadir el cero inicial
  if (clean.startsWith('.')) clean = '0' + clean

  return clean
}

/**
 * Convierte un valor numérico/cadena puro (ej: "1000.5") a un formato visible (ej: "1.000,5")
 * Mantiene la coma final si el usuario recién la escribió.
 */
export function formatInputMonto(value: string | number): string {
  if (value === null || value === undefined || value === '') return ''

  const strValue = value.toString()
  const [integerPart, decimalPart] = strValue.split('.')

  // Aplicar separador de miles a la parte entera
  const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0'

  // Retornar con coma decimal si existe parte decimal o si el string original termina en punto
  if (decimalPart !== undefined) {
    return `${formattedInteger},${decimalPart}`
  }

  return formattedInteger
}
