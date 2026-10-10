import type PptxGenJS from 'pptxgenjs'
import { construirDiapositivas } from '@/lib/corte-balance/modelo/construir'
import type { DatosExportCorteBalance, ElementoGrafico, ElementoModelo } from '@/lib/types'

type Pptx = PptxGenJS
type Slide = PptxGenJS.Slide

const FORMATO_NUMERO: Record<ElementoGrafico['formato'], string> = {
  moneda: '"$" #,##0',
  numero: '#,##0',
  porcentaje: '0.0"%"',
}

function grafico(pptx: Pptx, slide: Slide, g: ElementoGrafico, fuente: string): void {
  const caja = { x: g.x, y: g.y, w: g.w, h: g.h }
  const datos = g.series.map(s => ({ name: s.nombre, labels: g.categorias, values: s.valores }))
  const comun = {
    ...caja,
    showTitle: Boolean(g.titulo),
    title: g.titulo,
    titleFontFace: fuente,
    titleFontSize: 16,
    titleColor: '6B6B6B',
    legendFontFace: fuente,
    legendFontSize: 11,
    chartColors: g.colores,
  }
  if (g.grafico === 'torta' || g.grafico === 'dona') {
    slide.addChart(g.grafico === 'torta' ? pptx.ChartType.pie : pptx.ChartType.doughnut, datos, {
      ...comun,
      showLegend: true,
      legendPos: 'r',
      showPercent: true,
      showValue: false,
      dataLabelColor: 'FFFFFF',
      dataLabelFontSize: 11,
      holeSize: 55,
    })
    return
  }
  const variasSeries = g.series.length > 1
  const ejes = {
    catAxisLabelFontFace: fuente,
    catAxisLabelFontSize: 11,
    valAxisLabelFontSize: 10,
    valAxisLabelFormatCode: FORMATO_NUMERO[g.formato],
    dataLabelFormatCode: FORMATO_NUMERO[g.formato],
    dataLabelFontSize: 9,
    showLegend: variasSeries,
    legendPos: 'b' as const,
    showValue: !variasSeries,
  }
  if (g.grafico === 'lineas') {
    slide.addChart(pptx.ChartType.line, datos, { ...comun, ...ejes, lineDataSymbol: 'circle', lineSize: 2 })
    return
  }
  slide.addChart(pptx.ChartType.bar, datos, {
    ...comun,
    ...ejes,
    barDir: 'col',
    barGrouping: g.grafico === 'barras-apiladas' ? 'stacked' : 'clustered',
    barGapWidthPct: 60,
  })
}

function dibujar(pptx: Pptx, slide: Slide, e: ElementoModelo, fuente: string): void {
  if (e.tipo === 'forma') {
    slide.addShape(e.radio ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
      x: e.x,
      y: e.y,
      w: e.w,
      h: e.h,
      rectRadius: e.radio || undefined,
      fill: { color: e.color },
      line: { color: e.color, width: 0 },
    })
  } else if (e.tipo === 'texto') {
    slide.addText(
      e.tramos.map(t => ({ text: t.texto, options: { bold: t.negrita, color: t.color } })),
      {
        x: e.x,
        y: e.y,
        w: e.w,
        h: e.h,
        fontFace: fuente,
        fontSize: e.tamano,
        color: e.color,
        bold: e.negrita,
        italic: e.cursiva,
        underline: e.subrayado ? { style: 'sng' } : undefined,
        align: e.alineacion ?? 'left',
        valign: e.vertical ?? 'middle',
        fit: e.vertical === 'top' ? 'shrink' : undefined,
        paraSpaceAfter: e.vertical === 'top' ? 6 : undefined,
      },
    )
  } else if (e.tipo === 'tabla') {
    slide.addTable(
      e.filas.map(fila =>
        fila.map(c => ({
          text: c.texto,
          options: {
            bold: c.negrita,
            color: c.color,
            fontSize: c.tamano,
            colspan: c.colspan,
            fill: c.fondo ? { color: c.fondo } : undefined,
          },
        })),
      ),
      {
        x: e.x,
        y: e.y,
        w: e.w,
        colW: e.anchos,
        rowH: e.altos,
        fontFace: fuente,
        fontSize: e.tamano,
        color: '111111',
        align: 'center',
        valign: 'middle',
        border: { type: 'solid', pt: 1.5, color: '000000' },
        fill: { color: 'FFFFFF' },
      },
    )
  } else {
    grafico(pptx, slide, e, fuente)
  }
}

export async function generarPptx(d: DatosExportCorteBalance): Promise<Blob> {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = `${d.borrador.opciones.titulo} - ${d.sucursalNombre}`
  pptx.company = 'Heroica'
  const fuente = d.borrador.opciones.fuente
  for (const diapositiva of construirDiapositivas(d)) {
    const slide = pptx.addSlide()
    slide.background = { color: 'FFFFFF' }
    for (const e of diapositiva.elementos) dibujar(pptx, slide, e, fuente)
  }
  return (await pptx.write({ outputType: 'blob' })) as Blob
}
