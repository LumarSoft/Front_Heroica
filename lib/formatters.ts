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

/** Formatea una marca de tiempo para mostrar cuándo se resolvió una solicitud. */
export function formatFechaHora(fechaISO: string): string {
  if (!fechaISO) return '-'
  const fecha = new Date(fechaISO)
  if (Number.isNaN(fecha.getTime())) return formatFecha(fechaISO)

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha)
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

export const TIPO_MOVIMIENTO_COLOR_MAP: Record<string, string> = {
  egreso: 'bg-rose-100 text-rose-800',
  ingreso: 'bg-emerald-100 text-emerald-800',
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

export const SOLICITUD_ESTADO_COLORS: Record<string, string> = {
  Pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  'Pendiente de Tesorería': 'bg-amber-50 text-amber-700 border-amber-200',
  'Proyectado en Tesorería': 'bg-blue-50 text-blue-700 border-blue-200',
  Aprobada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rechazada: 'bg-rose-50 text-rose-600 border-rose-200',
  'Rechazado en Tesorería': 'bg-rose-50 text-rose-600 border-rose-200',
  'Pago eliminado en Tesorería': 'bg-slate-50 text-slate-600 border-slate-200',
  Cancelada: 'bg-slate-50 text-slate-600 border-slate-200',
}

// ─── Ventas ──────────────────────────────────────────────────────────────────

/** Índice 0 = lunes … 6 = domingo (WEEKDAY() de MySQL). */
export const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** '2026-09-14' → '14/09' · '2026-09' → 'Sep 2026'. En semana se muestra el lunes. */
export function formatPeriodoVentas(periodo: string, agrupacion: 'dia' | 'semana' | 'mes'): string {
  const [anio, mes, dia] = periodo.split('-')
  if (agrupacion === 'mes') return `${MESES_CORTO[Number(mes) - 1] ?? mes} ${anio}`
  return agrupacion === 'semana' ? `Sem. ${dia}/${mes}` : `${dia}/${mes}`
}

export function formatCantidad(valor: number, decimales = 0): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: decimales }).format(valor)
}

/** Monto compacto para ejes: $ 1,2 M · $ 350 k. */
export function formatMontoCompacto(valor: number): string {
  return `$ ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(valor)}`
}

/** Variación % entre dos valores; null si no hay base de comparación. */
export function variacionPorcentual(actual: number, anterior: number): number | null {
  if (!anterior) return null
  return ((actual - anterior) / Math.abs(anterior)) * 100
}

/** "del 01/09/2026 al 28/09/2026" · un solo día: "el 01/09/2026". */
export function formatRangoFechas(desde: string, hasta: string): string {
  return desde === hasta ? `el ${formatFecha(desde)}` : `del ${formatFecha(desde)} al ${formatFecha(hasta)}`
}

/** "hace 5 min", "hace 3 h", "ayer", "hace 4 días". */
export function formatHaceCuanto(fechaISO: string): string {
  const minutos = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60_000)
  if (minutos < 1) return 'recién'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return dias === 1 ? 'ayer' : `hace ${dias} días`
}

export function pluralDias(dias: number): string {
  return `${formatCantidad(dias)} ${dias === 1 ? 'día' : 'días'}`
}

export const SINCRONIZACION_ESTADO_LABEL: Record<'en_curso' | 'exitosa' | 'con_observaciones' | 'fallida', string> = {
  en_curso: 'En curso',
  exitosa: 'Completada',
  con_observaciones: 'Completada con avisos',
  fallida: 'Fallida',
}

export const SINCRONIZACION_ESTADO_COLORS: Record<'en_curso' | 'exitosa' | 'con_observaciones' | 'fallida', string> = {
  en_curso: 'bg-blue-50 text-blue-700 border-blue-200',
  exitosa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  con_observaciones: 'bg-amber-50 text-amber-700 border-amber-200',
  fallida: 'bg-rose-50 text-rose-700 border-rose-200',
}
