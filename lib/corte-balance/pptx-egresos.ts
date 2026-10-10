import {
  AREA,
  decorarBorde,
  dibujarTablas,
  encabezado,
  textoLibre,
  type Pptx,
  type TablaPptx,
  type Tema,
} from '@/lib/corte-balance/pptx-base'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type { DatosExportCorteBalance, SeccionCalculada } from '@/lib/types'

// Paleta categórica para la torta de egresos (similar al gráfico del Canva)
const COLORES_TORTA = [
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

export function seccionEgresos(pptx: Pptx, tema: Tema, s: SeccionCalculada, d: DatosExportCorteBalance): void {
  const slide = pptx.addSlide()
  decorarBorde(pptx, slide, tema)
  encabezado(slide, tema, 'Anexo Egresos', s.nombre, true)
  const filas = s.lineas.map(l => ({ etiqueta: l.nombre, valor: formatearImporte(l.importe, d.moneda) }))
  // Como en el Canva: más de 8 líneas se parten en dos tablas
  const tablas: TablaPptx[] =
    filas.length > 8
      ? [
          { titulo: '', filas: filas.slice(0, Math.ceil(filas.length / 2)) },
          { titulo: '', filas: filas.slice(Math.ceil(filas.length / 2)) },
        ]
      : [{ titulo: '', filas }]
  const detalle = s.detalle.trim()
  const altoTablas = detalle ? 3.3 : 4.6
  const fondo = dibujarTablas(slide, tema, tablas, { ...AREA, h: altoTablas })
  slide.addText(
    [
      { text: `Total ${s.nombre} `, options: { color: tema.color } },
      { text: formatearImporte(s.total, d.moneda), options: { color: tema.color, bold: true } },
    ],
    { x: 5.6, y: fondo + 0.15, w: 7.0, h: 0.55, fontFace: tema.fuente, fontSize: 20, align: 'right' },
  )
  if (detalle) {
    const yDetalle = fondo + 0.85
    slide.addText('Detalle', {
      x: AREA.x,
      y: yDetalle,
      w: 4,
      h: 0.4,
      fontFace: tema.fuente,
      fontSize: 16,
      bold: true,
      color: tema.color,
    })
    textoLibre(slide, tema, detalle, { x: AREA.x, y: yDetalle + 0.4, w: 12, h: 7.3 - yDetalle - 0.4 }, 12)
  }
}

export function graficoEgresos(pptx: Pptx, tema: Tema, secciones: SeccionCalculada[]): void {
  const conValor = secciones.filter(s => s.total > 0)
  if (conValor.length === 0) return
  const slide = pptx.addSlide()
  decorarBorde(pptx, slide, tema)
  encabezado(slide, tema, 'Anexo Egresos', '')
  slide.addChart(
    pptx.ChartType.pie,
    [
      {
        name: 'Egresos',
        labels: conValor.map(s => s.nombre),
        values: conValor.map(s => Math.round(s.total * 100) / 100),
      },
    ],
    {
      x: 1.2,
      y: 1.3,
      w: 11,
      h: 6,
      showTitle: true,
      title: 'Distribución de los egresos',
      titleFontFace: tema.fuente,
      titleFontSize: 22,
      titleColor: '6B6B6B',
      showLegend: true,
      legendPos: 'r',
      legendFontFace: tema.fuente,
      legendFontSize: 12,
      showPercent: true,
      showValue: false,
      dataLabelColor: 'FFFFFF',
      dataLabelFontSize: 11,
      chartColors: COLORES_TORTA,
    },
  )
}
