import type PptxGenJS from 'pptxgenjs'

/**
 * Primitivas de diseño del PPTX del Corte de balance, imitando el Canva:
 * fondo blanco, títulos azules en negrita, tablas de dos columnas con borde
 * negro y una franja azul redondeada en el borde derecho.
 */

export type Slide = PptxGenJS.Slide
export type Pptx = PptxGenJS

export const ANCHO = 13.333
export const ALTO = 7.5

/** Área útil debajo del encabezado. */
export const AREA = { x: 0.6, y: 1.75, w: 12.0, h: 5.35 }

export interface Tema {
  color: string
  claro: string
  medio: string
  oscuro: string
  fuente: string
}

const hex = (n: number) =>
  Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, '0')

/** Mezcla un color con blanco (t > 0) o negro (t < 0). */
function tono(color: string, t: number): string {
  const c = color.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16))
  const destino = t > 0 ? 255 : 0
  const k = Math.abs(t)
  return [r, g, b]
    .map(v => hex(v + (destino - v) * k))
    .join('')
    .toUpperCase()
}

export function crearTema(colorPrincipal: string, fuente: string): Tema {
  const valido = /^#?[0-9a-fA-F]{6}$/.test(colorPrincipal) ? colorPrincipal : '#1B3D8F'
  return {
    color: valido.replace('#', '').toUpperCase(),
    claro: tono(valido, 0.25),
    medio: tono(valido, 0.12),
    oscuro: tono(valido, -0.05),
    fuente,
  }
}

export function decorarBorde(pptx: Pptx, slide: Slide, tema: Tema): void {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: ANCHO - 0.32,
    y: 0,
    w: 0.6,
    h: ALTO,
    rectRadius: 0.3,
    fill: { color: tema.color },
    line: { color: tema.color, width: 0 },
  })
}

export function encabezado(slide: Slide, tema: Tema, titulo: string, subtitulo: string, centrado = false): void {
  slide.addText(titulo, {
    x: 0.45,
    y: 0.3,
    w: 9.5,
    h: 0.9,
    fontFace: tema.fuente,
    fontSize: 34,
    bold: true,
    color: tema.color,
  })
  if (!subtitulo) return
  slide.addText(subtitulo, {
    x: centrado ? 2.5 : 8.2,
    y: centrado ? 1.05 : 0.4,
    w: centrado ? 7.8 : 4.4,
    h: 0.55,
    fontFace: tema.fuente,
    fontSize: centrado ? 20 : 22,
    bold: centrado,
    italic: !centrado,
    underline: centrado ? { style: 'sng' } : undefined,
    color: tema.color,
    align: centrado ? 'center' : 'right',
  })
}

export function textoLibre(
  slide: Slide,
  tema: Tema,
  texto: string,
  caja: { x: number; y: number; w: number; h: number },
  fontSize = 15,
): void {
  slide.addText(texto, {
    ...caja,
    fontFace: tema.fuente,
    fontSize,
    color: '1F2937',
    valign: 'top',
    paraSpaceAfter: 6,
    fit: 'shrink',
  })
}

export interface TablaPptx {
  titulo: string
  filas: { etiqueta: string; valor: string }[]
}

/**
 * Reparte tablas en columnas (la que menos filas tenga recibe la siguiente) y
 * ajusta el alto de fila para que todo entre en el área disponible. Devuelve
 * la coordenada y donde termina la tabla más larga.
 */
export function dibujarTablas(
  slide: Slide,
  tema: Tema,
  tablas: TablaPptx[],
  area: { x: number; y: number; w: number; h: number },
): number {
  const visibles = tablas.filter(t => t.filas.length > 0)
  if (visibles.length === 0) return area.y

  const nCols = visibles.length === 1 ? 1 : visibles.length >= 5 ? 3 : 2
  const columnas: TablaPptx[][] = Array.from({ length: nCols }, () => [])
  const peso = (t: TablaPptx) => t.filas.length + (t.titulo ? 1 : 0)
  for (const t of visibles) {
    const destino = columnas.reduce((min, col) =>
      col.reduce((a, x) => a + peso(x), 0) < min.reduce((a, x) => a + peso(x), 0) ? col : min,
    )
    destino.push(t)
  }

  const gapCol = 0.5
  const anchoCol = (area.w - gapCol * (nCols - 1)) / nCols
  const anchoTabla = Math.min(anchoCol, nCols === 1 ? 6.4 : 5.6)
  let fondo = area.y

  for (const [i, col] of columnas.entries()) {
    const titulos = col.filter(t => t.titulo).length
    const filas = col.reduce((a, t) => a + t.filas.length, 0)
    const disponible = area.h - titulos * 0.5 - (col.length - 1) * 0.3
    const altoFila = Math.max(0.28, Math.min(0.62, disponible / Math.max(filas, 1)))
    const fontSize = altoFila >= 0.5 ? 14 : altoFila >= 0.38 ? 12 : 10
    const x = area.x + i * (anchoCol + gapCol) + (anchoCol - anchoTabla) / 2
    let y = area.y

    for (const t of col) {
      if (t.titulo) {
        slide.addText(t.titulo, {
          x,
          y,
          w: anchoTabla,
          h: 0.45,
          fontFace: tema.fuente,
          fontSize: 18,
          bold: true,
          color: tema.color,
          align: 'center',
        })
        y += 0.5
      }
      slide.addTable(
        t.filas.map(f => [
          { text: f.etiqueta, options: { bold: true, fontSize: fontSize - 1 } },
          { text: f.valor, options: { fontSize } },
        ]),
        {
          x,
          y,
          w: anchoTabla,
          colW: [anchoTabla * 0.54, anchoTabla * 0.46],
          rowH: altoFila,
          fontFace: tema.fuente,
          color: '111111',
          align: 'center',
          valign: 'middle',
          border: { type: 'solid', pt: 1.5, color: '000000' },
          fill: { color: 'FFFFFF' },
        },
      )
      y += t.filas.length * altoFila + 0.3
    }
    fondo = Math.max(fondo, y - 0.3)
  }
  return fondo
}
