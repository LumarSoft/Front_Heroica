import { aNumero, calcularBalance, redondear } from '@/lib/corte-balance/clasificar'
import { ID_FILA_VENTAS_TOTALES } from '@/lib/corte-balance/borrador-por-defecto'
import type {
  BalanceCalculado,
  BorradorCorteBalance,
  DiapositivaReporte,
  FilaReporte,
  FormatoValorReporte,
  MostrarVacios,
  PlantillaCorteBalance,
  ResultadoCorteBalance,
} from '@/lib/types'

const MESES = [
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

/** "2026-07" → "Julio 2026" */
export function etiquetaPeriodo(mes: string): string {
  const [anio, numero] = mes.split('-').map(Number)
  return `${MESES[numero - 1] ?? ''} ${anio}`
}

export function importesPorLinea(resultado: ResultadoCorteBalance): Map<string, number> {
  return new Map(resultado.secciones.flatMap(s => s.lineas.map(l => [l.id, l.importe] as const)))
}

export interface ValorResuelto {
  numero: number | null
  texto: string
  /** true si el valor salió de las líneas de egresos vinculadas (no lo escribió el usuario). */
  automatico: boolean
}

export function resolverFila(fila: FilaReporte, importes: Map<string, number>): ValorResuelto {
  if (fila.formato === 'texto') return { numero: null, texto: fila.valor.trim(), automatico: false }
  const manual = aNumero(fila.valor)
  if (manual !== null) return { numero: manual, texto: '', automatico: false }
  const vinculadas = (fila.lineasVinculadas ?? []).filter(id => importes.has(id))
  if (vinculadas.length === 0) return { numero: null, texto: '', automatico: false }
  const numero = redondear(vinculadas.reduce((acc, id) => acc + (importes.get(id) ?? 0), 0))
  return { numero, texto: '', automatico: true }
}

const numeroAR = (n: number, decimales: number) =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n)

export function formatearImporte(n: number, moneda: 'ARS' | 'USD'): string {
  const signo = n < 0 ? '-' : ''
  return `${signo}${moneda === 'USD' ? 'US$' : '$'} ${numeroAR(Math.abs(n), 2)}`
}

export function formatearValor(
  valor: ValorResuelto,
  formato: FormatoValorReporte,
  moneda: 'ARS' | 'USD',
  mostrarVacios: MostrarVacios,
): string {
  if (formato === 'texto') return valor.texto || (mostrarVacios === 'guion' ? '—' : '')
  if (valor.numero === null) {
    if (mostrarVacios === 'blanco') return ''
    if (mostrarVacios === 'guion') return '—'
  }
  const n = valor.numero ?? 0
  if (formato === 'moneda') return formatearImporte(n, moneda)
  if (formato === 'porcentaje') return `${numeroAR(n, 2)} %`
  return numeroAR(n, Number.isInteger(n) ? 0 : 2)
}

export function diapositivaVacia(dia: DiapositivaReporte, importes: Map<string, number>): boolean {
  if (dia.texto.trim()) return false
  return dia.tablas.every(t =>
    t.filas.every(f => {
      const v = resolverFila(f, importes)
      return v.numero === null && !v.texto
    }),
  )
}

/** Ingresos del balance: el valor escrito en Balance o, si está vacío, "Ventas Totales" del anexo. */
export function ingresosDelBalance(borrador: BorradorCorteBalance, importes: Map<string, number>): number | null {
  const manual = aNumero(borrador.balance.ingresos)
  if (manual !== null) return manual
  const filaVentas = borrador.anexos.ingresos.diapositivas
    .flatMap(d => d.tablas.flatMap(t => t.filas))
    .find(f => f.id === ID_FILA_VENTAS_TOTALES)
  return filaVentas ? resolverFila(filaVentas, importes).numero : null
}

export function balanceDelBorrador(
  borrador: BorradorCorteBalance,
  resultado: ResultadoCorteBalance,
  plantilla: PlantillaCorteBalance,
): BalanceCalculado {
  const importes = importesPorLinea(resultado)
  const egresos = redondear(
    resultado.totalEgresos + (borrador.opciones.incluirSinClasificar ? resultado.totalSinClasificar : 0),
  )
  const pct = aNumero(borrador.balance.operatividadPct) ?? plantilla.operatividadPct
  return calcularBalance(ingresosDelBalance(borrador, importes) ?? 0, egresos, pct)
}

/** Nombre de archivo seguro: "Corte_de_balance_Heroica_Florida_2026-07" */
export function nombreArchivo(sucursal: string, mes: string): string {
  const base = `Corte de balance ${sucursal} ${mes}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '_')
  return base.replace(/_+/g, '_').replace(/(^_|_$)/g, '')
}
