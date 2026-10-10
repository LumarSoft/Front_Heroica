import type ExcelJS from 'exceljs'
import { DESTINO_EXCLUIDO } from '@/lib/corte-balance/clasificar'
import { resolverFila } from '@/lib/corte-balance/formulas'
import { etiquetaPeriodo } from '@/lib/corte-balance/valores'
import type { AnexoManual, DatosExportCorteBalance, FormatoValorReporte } from '@/lib/types'

/**
 * Excel "limpio" del Corte de balance: una hoja por bloque, totales con
 * fórmulas (si editan un importe, el total se recalcula) y el detalle de cada
 * egreso con la línea del reporte a la que fue asignado.
 */

const FORMATOS: Record<FormatoValorReporte, string> = {
  moneda: '"$" #,##0.00;-"$" #,##0.00',
  numero: '#,##0.##',
  porcentaje: '0.00"%"',
  texto: '@',
}

type Hoja = ExcelJS.Worksheet

function titulo(hoja: Hoja, texto: string, subtitulo: string, color: string): void {
  hoja.addRow([texto]).font = { bold: true, size: 14, color: { argb: `FF${color}` } }
  hoja.addRow([subtitulo]).font = { italic: true, color: { argb: 'FF5A6070' } }
  hoja.addRow([])
}

function cabecera(hoja: Hoja, columnas: string[], color: string): void {
  const fila = hoja.addRow(columnas)
  fila.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } }
  })
}

/** Filas de la hoja Egresos donde quedan los totales, para vincularlos desde Balance. */
interface FilasTotales {
  porSeccion: Map<string, number>
  general: number
}

function hojaEgresos(hoja: Hoja, d: DatosExportCorteBalance, color: string, sub: string): FilasTotales {
  hoja.columns = [{ width: 32 }, { width: 30 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 40 }]
  titulo(hoja, 'Anexo Egresos', sub, color)
  cabecera(hoja, ['Sección', 'Línea', 'Calculado (sistema)', 'Ajuste manual', 'Importe reporte', 'Nota'], color)

  const porSeccion = new Map<string, number>()
  for (const s of d.secciones) {
    const desde = hoja.rowCount + 1
    for (const l of s.lineas) {
      const fila = hoja.addRow([s.nombre, l.nombre, l.automatico, l.ajustada ? l.importe : null, null, l.nota])
      fila.getCell(5).value = { formula: `IF(D${fila.number}="",C${fila.number},D${fila.number})`, result: l.importe }
    }
    const hasta = hoja.rowCount
    const total = hoja.addRow([`Total ${s.nombre}`, '', null, null, null, ''])
    total.getCell(5).value = { formula: hasta >= desde ? `SUM(E${desde}:E${hasta})` : '0', result: s.total }
    total.font = { bold: true }
    porSeccion.set(s.id, total.number)
    hoja.addRow([])
  }
  const general = hoja.addRow(['TOTAL EGRESOS', '', null, null, null, ''])
  general.getCell(5).value = {
    formula: porSeccion.size ? [...porSeccion.values()].map(n => `E${n}`).join('+') : '0',
    result: d.balance.egresos,
  }
  general.font = { bold: true, size: 12 }
  hoja.getColumn(3).numFmt = FORMATOS.moneda
  hoja.getColumn(4).numFmt = FORMATOS.moneda
  hoja.getColumn(5).numFmt = FORMATOS.moneda
  hoja.views = [{ state: 'frozen', ySplit: 4 }]
  return { porSeccion, general: general.number }
}

function hojaBalance(hoja: Hoja, d: DatosExportCorteBalance, filas: FilasTotales, color: string, sub: string): void {
  hoja.columns = [{ width: 36 }, { width: 22 }]
  titulo(hoja, 'Balance Mensual', sub, color)
  const b = d.balance
  const ingresos = hoja.addRow(['Ingresos', b.ingresos])
  const egresos = hoja.addRow(['Egresos', null])
  egresos.getCell(2).value = { formula: `Egresos!E${filas.general}`, result: b.egresos }
  const parcial = hoja.addRow(['Resultado parcial', null])
  parcial.getCell(2).value = { formula: `B${ingresos.number}-B${egresos.number}`, result: b.resultadoParcial }
  const pct = hoja.addRow(['Operatividad (%)', b.operatividadPct])
  pct.getCell(2).numFmt = FORMATOS.porcentaje
  const oper = hoja.addRow(['Operatividad', null])
  oper.getCell(2).value = {
    formula: `IF(B${parcial.number}>0,B${parcial.number}*B${pct.number}/100,0)`,
    result: b.operatividad,
  }
  const final = hoja.addRow(['Resultado final', null])
  final.getCell(2).value = { formula: `B${parcial.number}-B${oper.number}`, result: b.resultadoFinal }
  final.font = { bold: true }
  for (const f of [ingresos, egresos, parcial, oper, final]) f.getCell(2).numFmt = FORMATOS.moneda

  hoja.addRow([])
  cabecera(hoja, ['Sección de egresos', 'Total'], color)
  for (const s of d.secciones) {
    const fila = hoja.addRow([s.nombre, null])
    fila.getCell(2).value = { formula: `Egresos!E${filas.porSeccion.get(s.id)}`, result: s.total }
    fila.getCell(2).numFmt = FORMATOS.moneda
  }
}

function hojaMovimientos(libro: ExcelJS.Workbook, d: DatosExportCorteBalance, color: string): void {
  const hoja = libro.addWorksheet('Movimientos')
  const lineas = new Map(d.resultado.secciones.flatMap(s => s.lineas.map(l => [l.id, [s.nombre, l.nombre]])))
  hoja.columns = [
    { header: 'Fecha', width: 12 },
    { header: 'Sección', width: 28 },
    { header: 'Línea', width: 26 },
    { header: 'Categoría', width: 26 },
    { header: 'Subcategoría', width: 26 },
    { header: 'Descripción', width: 28 },
    { header: 'Proveedor', width: 22 },
    { header: 'Medio', width: 10 },
    { header: 'Monto', width: 16 },
    { header: 'Deuda pagada', width: 13 },
    { header: 'Comentarios', width: 40 },
  ]
  hoja.getRow(1).eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } }
  })
  for (const m of d.movimientos) {
    const destino = d.resultado.destinoPorMovimiento.get(m.id) ?? ''
    const [seccion, linea] =
      destino === DESTINO_EXCLUIDO ? ['Excluido', ''] : (lineas.get(destino) ?? ['Sin clasificar', ''])
    const [y, mes, dia] = m.fecha.split('-')
    hoja.addRow([
      `${dia}/${mes}/${y}`,
      seccion,
      linea,
      m.categoria_nombre ?? '',
      m.subcategoria_nombre ?? '',
      m.descripcion_nombre ?? '',
      m.proveedor_nombre ?? '',
      m.medio === 'banco' ? 'Banco' : 'Efectivo',
      m.monto,
      m.es_deuda ? 'Sí' : '',
      m.comentarios ?? '',
    ])
  }
  hoja.getColumn(9).numFmt = FORMATOS.moneda
  hoja.autoFilter = { from: 'A1', to: 'K1' }
  hoja.views = [{ state: 'frozen', ySplit: 1 }]
}

function hojaAnalisis(libro: ExcelJS.Workbook, d: DatosExportCorteBalance, color: string, sub: string): void {
  const hoja = libro.addWorksheet('Análisis')
  hoja.columns = [
    { width: 34 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ]
  const a = d.analisis
  titulo(hoja, 'Análisis del período', sub, color)

  hoja.addRow(['Comparativo vs mes anterior (valores del sistema, sin ajustes manuales)']).font = { bold: true }
  cabecera(hoja, ['Sección', etiquetaPeriodo(a.mesAnterior), etiquetaPeriodo(d.mes), 'Variación', 'Var. %'], color)
  for (const c of a.comparativo) {
    const fila = hoja.addRow([c.nombre, c.anterior, c.actual, c.variacion, c.variacionPct])
    ;[2, 3, 4].forEach(i => (fila.getCell(i).numFmt = FORMATOS.moneda))
    fila.getCell(5).numFmt = FORMATOS.porcentaje
  }
  hoja.addRow([])

  hoja.addRow(['Evolución mensual por sección (valores del sistema)']).font = { bold: true }
  cabecera(hoja, ['Sección', ...a.evolucion.meses.map(etiquetaPeriodo)], color)
  for (const serie of a.evolucion.series) {
    const fila = hoja.addRow([serie.nombre, ...serie.valores])
    serie.valores.forEach((_, i) => (fila.getCell(i + 2).numFmt = FORMATOS.moneda))
  }
  hoja.addRow([])

  hoja.addRow(['Principales proveedores / descripciones']).font = { bold: true }
  cabecera(hoja, ['Proveedor', 'Movimientos', 'Total'], color)
  for (const p of a.topProveedores) hoja.addRow([p.nombre, p.cantidad, p.total]).getCell(3).numFmt = FORMATOS.moneda
  const medio = hoja.addRow(['Pagado por banco', null, a.porMedio.banco])
  const efectivo = hoja.addRow(['Pagado en efectivo', null, a.porMedio.efectivo])
  medio.getCell(3).numFmt = FORMATOS.moneda
  efectivo.getCell(3).numFmt = FORMATOS.moneda
  hoja.addRow([])

  const ind = a.indicadores
  if (!ind) {
    hoja.addRow(['Indicadores: cargá las ventas del período para calcular incidencias y punto de equilibrio.'])
    return
  }
  hoja.addRow(['Incidencia sobre ventas']).font = { bold: true }
  cabecera(hoja, ['Sección', 'Tipo', 'Monto', '% sobre ventas'], color)
  for (const i of ind.incidencias) {
    const fila = hoja.addRow([i.nombre, i.tipoCosto === 'fijo' ? 'Fijo' : 'Variable', i.total, i.pct])
    fila.getCell(3).numFmt = FORMATOS.moneda
    fila.getCell(4).numFmt = FORMATOS.porcentaje
  }
  hoja.addRow([])
  hoja.addRow(['Punto de equilibrio = costos fijos / (1 − costos variables / ventas)']).font = { bold: true }
  const kpis: [string, number | null, string][] = [
    ['Ventas', ind.ventas, FORMATOS.moneda],
    ['Costos fijos', ind.costosFijos, FORMATOS.moneda],
    ['Costos variables', ind.costosVariables, FORMATOS.moneda],
    ['Margen de contribución', ind.margenContribucionPct, FORMATOS.porcentaje],
    ['Punto de equilibrio', ind.puntoEquilibrio, FORMATOS.moneda],
    ['Ventas / equilibrio', ind.coberturaPct, FORMATOS.porcentaje],
    ['Diferencia (ventas − equilibrio)', ind.diferencia, FORMATOS.moneda],
  ]
  for (const [etiqueta, valor, formato] of kpis) hoja.addRow([etiqueta, valor]).getCell(2).numFmt = formato
}

function hojaManual(libro: ExcelJS.Workbook, anexo: AnexoManual, d: DatosExportCorteBalance, color: string): void {
  const hoja = libro.addWorksheet(anexo.titulo.slice(0, 31).replace(/[\\/?*[\]:]/g, '-'))
  hoja.columns = [{ width: 40 }, { width: 24 }]
  titulo(hoja, anexo.titulo, etiquetaPeriodo(d.mes), color)
  for (const dia of anexo.diapositivas.filter(x => x.incluir)) {
    hoja.addRow([dia.subtitulo]).font = { bold: true, size: 12, color: { argb: `FF${color}` } }
    if (dia.texto.trim()) {
      const fila = hoja.addRow([dia.texto.trim()])
      hoja.mergeCells(fila.number, 1, fila.number, 2)
      fila.alignment = { wrapText: true, vertical: 'top' }
      fila.height = Math.min(300, 15 * Math.ceil(dia.texto.length / 70 + dia.texto.split('\n').length))
    }
    for (const t of dia.tablas) {
      if (t.titulo) hoja.addRow([t.titulo]).font = { bold: true, italic: true }
      for (const f of t.filas) {
        const v = resolverFila(f, d.contexto)
        const fila = hoja.addRow([f.etiqueta, f.formato === 'texto' ? v.texto : v.numero])
        fila.getCell(2).numFmt = FORMATOS[f.formato]
      }
    }
    hoja.addRow([])
  }
}

export async function generarExcel(d: DatosExportCorteBalance): Promise<Blob> {
  const { default: ExcelJSLib } = await import('exceljs')
  const libro = new ExcelJSLib.Workbook()
  libro.creator = 'Heroica'
  libro.created = new Date()
  const color = d.borrador.opciones.colorPrincipal.replace('#', '').toUpperCase()
  const sub = `${d.sucursalNombre} · ${etiquetaPeriodo(d.mes)} · ${d.moneda}`

  // Balance va primero pero se completa después, porque referencia los totales de Egresos
  const balance = libro.addWorksheet('Balance')
  const totales = hojaEgresos(libro.addWorksheet('Egresos'), d, color, sub)
  hojaBalance(balance, d, totales, color, sub)
  hojaMovimientos(libro, d, color)
  hojaAnalisis(libro, d, color, sub)
  const { ingresos, rrhh, conclusion } = d.borrador.anexos
  for (const anexo of [ingresos, rrhh, conclusion]) if (anexo.incluir) hojaManual(libro, anexo, d, color)

  const buffer = await libro.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
