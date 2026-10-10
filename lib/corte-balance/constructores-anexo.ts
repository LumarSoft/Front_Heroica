import type {
  DiapositivaReporte,
  FilaReporte,
  FormatoValorReporte,
  FormulaFila,
  TablaReporte,
  TipoGraficoTabla,
} from '@/lib/types'

/** Ayudas para armar el contenido por defecto de los anexos manuales. */

/** Fila que se completa sola con la línea de egresos indicada si queda vacía. */
export const ID_FILA_VENTAS_TOTALES = 'ingresos-ventas-total'

export function nuevoId(prefijo: string): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
}

export const fila = (etiqueta: string, formato: FormatoValorReporte, lineasVinculadas?: string[]): FilaReporte => ({
  id: nuevoId('fila'),
  etiqueta,
  formato,
  valor: '',
  ...(lineasVinculadas ? { lineasVinculadas } : {}),
})

export const tabla = (titulo: string, formato: FormatoValorReporte, etiquetas: string[]): TablaReporte => ({
  id: nuevoId('tabla'),
  titulo,
  filas: etiquetas.map(e => fila(e, formato)),
})

export const tablaMixta = (titulo: string, filas: [string, FormatoValorReporte][]): TablaReporte => ({
  id: nuevoId('tabla'),
  titulo,
  filas: filas.map(([etiqueta, formato]) => fila(etiqueta, formato)),
})

export const diapositiva = (subtitulo: string, tablas: TablaReporte[], texto = ''): DiapositivaReporte => ({
  id: nuevoId('dia'),
  subtitulo,
  texto,
  incluir: true,
  tablas,
})

export const SEMANAS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']

export const conGrafico = (t: TablaReporte, grafico: TipoGraficoTabla): TablaReporte => ({ ...t, grafico })

export const conFormula = (f: FilaReporte, formula: FormulaFila): FilaReporte => ({ ...f, formula })

/** Fórmula de variación de cada semana contra la anterior (Semana 2 vs 1, …). */
export const variacionesSemanales = (base: TablaReporte, formato: FormatoValorReporte, porcentaje: boolean) =>
  base.filas.slice(1).map((f, i) =>
    conFormula(fila(f.etiqueta, formato), {
      tipo: 'variacion',
      actual: f.id,
      anterior: base.filas[i].id,
      porcentaje,
    }),
  )
