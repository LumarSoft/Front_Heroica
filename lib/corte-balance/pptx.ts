import {
  ALTO,
  ANCHO,
  AREA,
  crearTema,
  decorarBorde,
  dibujarTablas,
  encabezado,
  textoLibre,
  type Pptx,
  type TablaPptx,
  type Tema,
} from '@/lib/corte-balance/pptx-base'
import { graficoEgresos, seccionEgresos } from '@/lib/corte-balance/pptx-egresos'
import { formatearImporte, formatearValor, resolverFila } from '@/lib/corte-balance/valores'
import type { AnexoManual, DatosExportCorteBalance } from '@/lib/types'

function portada(pptx: Pptx, tema: Tema, d: DatosExportCorteBalance): void {
  const { opciones } = d.borrador
  const slide = pptx.addSlide()
  const franjas: [number, string][] = [
    [8.4, tema.claro],
    [10.0, tema.medio],
    [11.6, tema.oscuro],
  ]
  for (const [x, color] of franjas) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 0,
      w: ANCHO - x + 0.6,
      h: ALTO,
      rectRadius: 0.6,
      fill: { color },
      line: { color, width: 0 },
    })
  }
  slide.addShape(pptx.ShapeType.roundRect, {
    x: -0.8,
    y: 0,
    w: 9.8,
    h: ALTO,
    rectRadius: 0.6,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF', width: 0 },
  })
  const base = { fontFace: tema.fuente, color: tema.color }
  slide.addText(opciones.titulo, {
    ...base,
    x: 0.55,
    y: 1.6,
    w: 8.0,
    h: 2.8,
    fontSize: 54,
    bold: true,
    valign: 'middle',
  })
  slide.addText(opciones.subtitulo, { ...base, x: 1.7, y: 4.85, w: 6.5, h: 0.45, fontSize: 20, bold: true })
  slide.addText(opciones.periodo, { ...base, x: 1.7, y: 5.3, w: 6.5, h: 0.45, fontSize: 20 })
}

function separador(pptx: Pptx, tema: Tema, titulo: string): void {
  const slide = pptx.addSlide()
  decorarBorde(pptx, slide, tema)
  slide.addText(titulo, {
    x: 0.8,
    y: 2.5,
    w: 11,
    h: 2.4,
    fontFace: tema.fuente,
    fontSize: 60,
    bold: true,
    color: tema.color,
    valign: 'middle',
  })
}

function indice(pptx: Pptx, tema: Tema, capitulos: string[]): void {
  const slide = pptx.addSlide()
  decorarBorde(pptx, slide, tema)
  encabezado(slide, tema, 'Contenidos', '')
  slide.addText(
    capitulos.map((c, i) => ({
      text: `${String(i + 1).padStart(2, '0')} - ${c}`,
      options: { breakLine: true, paraSpaceAfter: 18 },
    })),
    { x: 0.9, y: 1.7, w: 10, h: 5, fontFace: tema.fuente, fontSize: 26, color: tema.color, valign: 'top' },
  )
}

function anexoManual(pptx: Pptx, tema: Tema, anexo: AnexoManual, d: DatosExportCorteBalance): void {
  const { opciones } = d.borrador
  for (const dia of anexo.diapositivas.filter(x => x.incluir)) {
    const slide = pptx.addSlide()
    decorarBorde(pptx, slide, tema)
    encabezado(slide, tema, anexo.titulo, dia.subtitulo)
    const tablas: TablaPptx[] = dia.tablas.map(t => ({
      titulo: t.titulo,
      filas: t.filas.map(f => ({
        etiqueta: f.etiqueta,
        valor: formatearValor(resolverFila(f, d.importes), f.formato, d.moneda, opciones.mostrarVacios),
      })),
    }))
    const texto = dia.texto.trim()
    if (tablas.length === 0) {
      textoLibre(slide, tema, texto, { x: 0.8, y: 1.6, w: 11.6, h: 5.5 }, 18)
    } else if (texto) {
      textoLibre(slide, tema, texto, { x: AREA.x, y: 1.45, w: AREA.w, h: 1.0 }, 14)
      dibujarTablas(slide, tema, tablas, { ...AREA, y: 2.55, h: AREA.h - 0.8 })
    } else {
      dibujarTablas(slide, tema, tablas, AREA)
    }
  }
}

function balance(pptx: Pptx, tema: Tema, d: DatosExportCorteBalance): void {
  const slide = pptx.addSlide()
  decorarBorde(pptx, slide, tema)
  encabezado(slide, tema, 'Balance Mensual', '')
  const m = (n: number) => formatearImporte(n, d.moneda)
  const b = d.balance
  const bloque = (titulo: string, valor: number, color: string) => [
    {
      text: `${titulo}\n${m(valor)}`,
      options: { colspan: 2, fill: { color }, bold: true, fontSize: 18 },
    },
  ]
  slide.addTable(
    [
      bloque('Ingresos', b.ingresos, '9AE07A'),
      bloque('Egresos', b.egresos, 'FF5A5A'),
      bloque('Resultado parcial', b.resultadoParcial, 'FFDE59'),
      [
        { text: `Operatividad (${b.operatividadPct}%)`, options: { bold: true, fontSize: 14 } },
        { text: m(b.operatividad), options: { fontSize: 16 } },
      ],
      bloque('Resultado Final', b.resultadoFinal, '9CC3FF'),
    ],
    {
      x: 0.8,
      y: 1.75,
      w: 5.9,
      colW: [2.95, 2.95],
      rowH: [0.95, 0.95, 0.95, 0.65, 0.95],
      fontFace: tema.fuente,
      color: '111111',
      align: 'center',
      valign: 'middle',
      border: { type: 'solid', pt: 1.5, color: '000000' },
    },
  )
  const filas = d.secciones.map(s => ({ etiqueta: s.nombre, valor: m(s.total) }))
  dibujarTablas(slide, tema, [{ titulo: '', filas }], { x: 7.1, y: 0.55, w: 5.6, h: 6.6 })
}

function cierre(pptx: Pptx, tema: Tema, d: DatosExportCorteBalance): void {
  const slide = pptx.addSlide()
  decorarBorde(pptx, slide, tema)
  const base = { fontFace: tema.fuente, color: tema.color, align: 'center' as const }
  slide.addText(d.borrador.opciones.textoCierre, { ...base, x: 1, y: 2.4, w: 11.3, h: 1.6, fontSize: 64, bold: true })
  slide.addText(d.borrador.opciones.firmaCierre, { ...base, x: 1, y: 4.1, w: 11.3, h: 0.6, fontSize: 22 })
}

export async function generarPptx(d: DatosExportCorteBalance): Promise<Blob> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = `${d.borrador.opciones.titulo} - ${d.sucursalNombre}`
  pptx.company = 'Heroica'

  const { opciones, anexos } = d.borrador
  const tema = crearTema(opciones.colorPrincipal, opciones.fuente)
  const capitulos: { titulo: string; dibujar: () => void }[] = []

  if (anexos.ingresos.incluir) {
    capitulos.push({ titulo: anexos.ingresos.titulo, dibujar: () => anexoManual(pptx, tema, anexos.ingresos, d) })
  }
  if (anexos.rrhh.incluir) {
    capitulos.push({ titulo: anexos.rrhh.titulo, dibujar: () => anexoManual(pptx, tema, anexos.rrhh, d) })
  }
  capitulos.push({
    titulo: 'Anexo Egresos',
    dibujar: () => {
      d.secciones.forEach(s => seccionEgresos(pptx, tema, s, d))
      if (opciones.incluirGraficoEgresos) graficoEgresos(pptx, tema, d.secciones)
    },
  })
  if (opciones.incluirBalance) capitulos.push({ titulo: 'Balance Mensual', dibujar: () => balance(pptx, tema, d) })
  if (anexos.conclusion.incluir) {
    capitulos.push({
      titulo: anexos.conclusion.titulo,
      dibujar: () => anexoManual(pptx, tema, anexos.conclusion, d),
    })
  }

  if (opciones.incluirPortada) portada(pptx, tema, d)
  if (opciones.incluirIndice)
    indice(
      pptx,
      tema,
      capitulos.map(c => c.titulo),
    )
  for (const c of capitulos) {
    if (opciones.incluirSeparadores) separador(pptx, tema, c.titulo)
    c.dibujar()
  }
  if (opciones.incluirCierre) cierre(pptx, tema, d)

  return (await pptx.write({ outputType: 'blob' })) as Blob
}
