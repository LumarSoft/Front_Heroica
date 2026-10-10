import { aNumero, redondear } from '@/lib/corte-balance/clasificar'
import type { BorradorCorteBalance, ContextoValores, FilaReporte, FormulaFila } from '@/lib/types'

export interface ValorResuelto {
  numero: number | null
  texto: string
  /** true si el valor no lo escribió el usuario (salió de egresos vinculados o de una fórmula). */
  automatico: boolean
}

export function crearContexto(
  borrador: BorradorCorteBalance,
  importes: Map<string, number>,
  mes: string,
): ContextoValores {
  const [anio, numero] = mes.split('-').map(Number)
  const filas = new Map<string, FilaReporte>()
  for (const anexo of Object.values(borrador.anexos)) {
    for (const d of anexo.diapositivas) for (const t of d.tablas) for (const f of t.filas) filas.set(f.id, f)
  }
  return { importes, filas, diasMes: new Date(anio, numero, 0).getDate() }
}

function calcular(formula: FormulaFila, valorDe: (id: string) => number | null, diasMes: number): number | null {
  if (formula.tipo === 'suma') {
    const valores = formula.filas.map(valorDe).filter((v): v is number => v !== null)
    return valores.length ? valores.reduce((a, b) => a + b, 0) : null
  }
  if (formula.tipo === 'promedio_diario') {
    const a = valorDe(formula.a)
    return a === null ? null : a / diasMes
  }
  if (formula.tipo === 'cociente') {
    const a = valorDe(formula.a)
    const b = valorDe(formula.b)
    if (a === null || !b) return null
    return formula.porcentaje ? (a / b) * 100 : a / b
  }
  const actual = valorDe(formula.actual)
  const anterior = valorDe(formula.anterior)
  if (actual === null || anterior === null) return null
  if (!formula.porcentaje) return actual - anterior
  return anterior ? ((actual - anterior) / anterior) * 100 : null
}

/**
 * Valor de una fila: lo escrito por el usuario, si no la fórmula, si no la
 * suma de las líneas de egresos vinculadas. Las referencias circulares dan vacío.
 */
export function resolverFila(fila: FilaReporte, ctx: ContextoValores, visitando = new Set<string>()): ValorResuelto {
  if (fila.formato === 'texto') return { numero: null, texto: fila.valor.trim(), automatico: false }
  const manual = aNumero(fila.valor)
  if (manual !== null) return { numero: manual, texto: '', automatico: false }

  if (fila.formula && !visitando.has(fila.id)) {
    visitando.add(fila.id)
    const valorDe = (id: string) => {
      const otra = ctx.filas.get(id)
      return otra ? resolverFila(otra, ctx, visitando).numero : null
    }
    const n = calcular(fila.formula, valorDe, ctx.diasMes)
    visitando.delete(fila.id)
    if (n !== null && Number.isFinite(n)) return { numero: redondear(n), texto: '', automatico: true }
  }

  const vinculadas = (fila.lineasVinculadas ?? []).filter(id => ctx.importes.has(id))
  if (vinculadas.length === 0) return { numero: null, texto: '', automatico: false }
  const numero = redondear(vinculadas.reduce((acc, id) => acc + (ctx.importes.get(id) ?? 0), 0))
  return { numero, texto: '', automatico: true }
}
