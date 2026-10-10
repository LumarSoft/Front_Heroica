import type { CajaModelo, ElementoForma, ElementoModelo, ElementoTabla, ElementoTexto } from '@/lib/types'

/**
 * Primitivas del diseño (imitando el Canva): fondo blanco, títulos azules en
 * negrita, tablas con borde negro y una franja redondeada en el borde derecho.
 * Coordenadas en pulgadas sobre 13,333 × 7,5.
 */

export const ANCHO = 13.333
export const ALTO = 7.5

/** Área útil debajo del encabezado. */
export const AREA = { x: 0.6, y: 1.75, w: 12.0, h: 5.35 }

export const COLOR_TEXTO = '1F2937'
export const COLOR_GRIS = '6B7280'

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
export function tono(color: string, t: number): string {
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

export const forma = (caja: CajaModelo, color: string, radio = 0): ElementoForma => ({
  tipo: 'forma',
  ...caja,
  color,
  radio,
})

export const texto = (
  caja: CajaModelo,
  contenido: string | ElementoTexto['tramos'],
  opciones: Omit<ElementoTexto, 'tipo' | 'tramos' | keyof CajaModelo>,
): ElementoTexto => ({
  tipo: 'texto',
  ...caja,
  tramos: typeof contenido === 'string' ? [{ texto: contenido }] : contenido,
  ...opciones,
})

export const borde = (tema: Tema): ElementoForma => forma({ x: ANCHO - 0.32, y: 0, w: 0.6, h: ALTO }, tema.color, 0.3)

export function encabezado(tema: Tema, titulo: string, subtitulo: string, centrado = false): ElementoModelo[] {
  const elementos: ElementoModelo[] = [
    borde(tema),
    texto({ x: 0.45, y: 0.3, w: 9.5, h: 0.9 }, titulo, { tamano: 34, negrita: true, color: tema.color }),
  ]
  if (subtitulo) {
    elementos.push(
      centrado
        ? texto({ x: 2.5, y: 1.05, w: 7.8, h: 0.55 }, subtitulo, {
            tamano: 20,
            negrita: true,
            subrayado: true,
            color: tema.color,
            alineacion: 'center',
          })
        : texto({ x: 7.6, y: 0.4, w: 5.0, h: 0.55 }, subtitulo, {
            // Los subtítulos largos se achican para entrar en una línea
            tamano: subtitulo.length > 26 ? 18 : 22,
            cursiva: true,
            color: tema.color,
            alineacion: 'right',
          }),
    )
  }
  return elementos
}

export const parrafo = (caja: CajaModelo, contenido: string, tamano = 15): ElementoTexto =>
  texto(caja, contenido, { tamano, color: COLOR_TEXTO, vertical: 'top' })

export const notaAlPie = (contenido: string): ElementoTexto =>
  texto({ x: AREA.x, y: 7.0, w: 12, h: 0.35 }, contenido, { tamano: 10, cursiva: true, color: COLOR_GRIS })

export interface TablaDosColumnas {
  titulo: string
  filas: { etiqueta: string; valor: string }[]
}

/**
 * Reparte tablas etiqueta/valor en columnas (la que menos filas tenga recibe
 * la siguiente) y ajusta el alto de fila para que todo entre en el área.
 * Devuelve los elementos y la coordenada y donde termina la tabla más larga.
 */
export function tablasDosColumnas(
  tema: Tema,
  tablas: TablaDosColumnas[],
  area: CajaModelo,
): { elementos: ElementoModelo[]; fondo: number } {
  const visibles = tablas.filter(t => t.filas.length > 0)
  const elementos: ElementoModelo[] = []
  if (visibles.length === 0) return { elementos, fondo: area.y }

  // En áreas angostas (al lado de un gráfico) va una sola columna
  const nCols = visibles.length === 1 || area.w < 7 ? 1 : visibles.length >= 5 && area.w > 9 ? 3 : 2
  const columnas: TablaDosColumnas[][] = Array.from({ length: nCols }, () => [])
  const peso = (col: TablaDosColumnas[]) => col.reduce((a, t) => a + t.filas.length + (t.titulo ? 1 : 0), 0)
  for (const t of visibles) columnas.reduce((min, col) => (peso(col) < peso(min) ? col : min)).push(t)

  const gapCol = 0.5
  const anchoCol = (area.w - gapCol * (nCols - 1)) / nCols
  const anchoTabla = Math.min(anchoCol, nCols === 1 ? 6.4 : 5.6)
  let fondo = area.y

  for (const [i, col] of columnas.entries()) {
    const titulos = col.filter(t => t.titulo).length
    const filas = col.reduce((a, t) => a + t.filas.length, 0)
    const disponible = area.h - titulos * 0.5 - (col.length - 1) * 0.3
    const altoFila = Math.max(0.28, Math.min(0.62, disponible / Math.max(filas, 1)))
    const tamano = altoFila >= 0.5 ? 14 : altoFila >= 0.38 ? 12 : 10
    const x = area.x + i * (anchoCol + gapCol) + (anchoCol - anchoTabla) / 2
    let y = area.y

    for (const t of col) {
      if (t.titulo) {
        elementos.push(
          texto({ x, y, w: anchoTabla, h: 0.45 }, t.titulo, {
            tamano: 18,
            negrita: true,
            color: tema.color,
            alineacion: 'center',
          }),
        )
        y += 0.5
      }
      const tabla: ElementoTabla = {
        tipo: 'tabla',
        x,
        y,
        w: anchoTabla,
        anchos: [anchoTabla * 0.54, anchoTabla * 0.46],
        altos: t.filas.map(() => altoFila),
        filas: t.filas.map(f => [{ texto: f.etiqueta, negrita: true, tamano: tamano - 1 }, { texto: f.valor }]),
        tamano,
      }
      elementos.push(tabla)
      y += t.filas.length * altoFila + 0.3
    }
    fondo = Math.max(fondo, y - 0.3)
  }
  return { elementos, fondo }
}

/** Tabla con encabezado de color (comparativos, rankings). */
export function tablaConEncabezado(
  tema: Tema,
  caja: { x: number; y: number; w: number },
  anchos: number[],
  encabezados: string[],
  filas: ElementoTabla['filas'],
  altoMax: number,
): ElementoTabla {
  const total = anchos.reduce((a, b) => a + b, 0)
  const alto = Math.max(0.3, Math.min(0.5, altoMax / (filas.length + 1)))
  return {
    tipo: 'tabla',
    ...caja,
    anchos: anchos.map(a => (a / total) * caja.w),
    altos: [alto, ...filas.map(() => alto)],
    filas: [encabezados.map(e => ({ texto: e, negrita: true, fondo: tema.color, color: 'FFFFFF' })), ...filas],
    tamano: alto >= 0.42 ? 12 : 10,
  }
}
