import { resolverFila } from '@/lib/corte-balance/formulas'
import { AREA, encabezado, parrafo, tablasDosColumnas, type Tema } from '@/lib/corte-balance/modelo/primitivas'
import { formatearValor } from '@/lib/corte-balance/valores'
import type {
  AnexoManual,
  ContextoValores,
  DiapositivaModelo,
  ElementoGrafico,
  ElementoModelo,
  OpcionesCorteBalance,
  TablaReporte,
} from '@/lib/types'

export const COLORES_CATEGORICOS = [
  '4285F4',
  'EA4335',
  'FBBC04',
  '34A853',
  'FF6D01',
  '46BDC6',
  '7BAAF7',
  'F07B72',
  'FCD04F',
  '71C287',
  '9334E6',
  'B0B0B0',
]

/** Gráfico de una tabla (torta, barras o líneas) si tiene al menos un valor. */
function graficoDeTabla(
  t: TablaReporte,
  ctx: ContextoValores,
  tema: Tema,
  caja: { x: number; y: number; w: number; h: number },
): ElementoGrafico | null {
  if (!t.grafico || t.grafico === 'ninguno') return null
  const numericas = t.filas.filter(f => f.formato !== 'texto')
  const valores = numericas.map(f => resolverFila(f, ctx).numero ?? 0)
  if (!valores.some(v => v !== 0)) return null
  const formato = numericas[0]?.formato
  return {
    tipo: 'grafico',
    ...caja,
    grafico: t.grafico,
    titulo: t.titulo,
    categorias: numericas.map(f => f.etiqueta),
    series: [{ nombre: t.titulo || 'Valor', valores }],
    colores: t.grafico === 'torta' ? COLORES_CATEGORICOS : [tema.color],
    formato: formato === 'moneda' || formato === 'porcentaje' ? formato : 'numero',
  }
}

export function diapositivasAnexo(
  tema: Tema,
  anexo: AnexoManual,
  ctx: ContextoValores,
  opciones: OpcionesCorteBalance,
  moneda: 'ARS' | 'USD',
): DiapositivaModelo[] {
  return anexo.diapositivas
    .filter(d => d.incluir)
    .map(d => {
      const elementos: ElementoModelo[] = encabezado(tema, anexo.titulo, d.subtitulo)
      const tablas = d.tablas.map(t => ({
        titulo: t.titulo,
        filas: t.filas.map(f => ({
          etiqueta: f.etiqueta,
          valor: formatearValor(resolverFila(f, ctx), f.formato, moneda, opciones.mostrarVacios),
        })),
      }))
      const textoLibre = d.texto.trim()
      let area = { ...AREA }

      if (tablas.length === 0) {
        elementos.push(parrafo({ x: 0.8, y: 1.6, w: 11.6, h: 5.5 }, textoLibre, 18))
        return { id: d.id, nombre: `${anexo.titulo} · ${d.subtitulo}`, elementos }
      }
      if (textoLibre) {
        elementos.push(parrafo({ x: AREA.x, y: 1.45, w: AREA.w, h: 1.0 }, textoLibre, 14))
        area = { ...AREA, y: 2.55, h: AREA.h - 0.8 }
      }

      // Con gráficos: tablas a la izquierda, gráficos apilados a la derecha
      const conGrafico = d.tablas.filter(t => t.grafico && t.grafico !== 'ninguno')
      const altoGrafico = area.h / Math.max(conGrafico.length, 1)
      const graficos = conGrafico
        .map((t, i) =>
          graficoDeTabla(t, ctx, tema, { x: 6.6, y: area.y + i * altoGrafico, w: 6.1, h: altoGrafico - 0.1 }),
        )
        .filter((g): g is ElementoGrafico => g !== null)
      const areaTablas = graficos.length ? { ...area, w: 5.6 } : area

      elementos.push(...tablasDosColumnas(tema, tablas, areaTablas).elementos, ...graficos)
      return { id: d.id, nombre: `${anexo.titulo} · ${d.subtitulo}`, elementos }
    })
}
