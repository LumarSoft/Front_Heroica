import { formatPeriodo } from './periodo'
import type { FiltrosBaseImpositiva, MovimientoImpositivo, TotalImpositivo } from './types'

export function filtrosIniciales(): FiltrosBaseImpositiva {
  const anio = new Date().getFullYear()
  return { sucursalId: '', desde: `${anio}-01`, hasta: `${anio}-12`, impuesto: '', estado: 'todos' }
}

/** Totales pendiente / pagado agrupados por sucursal o por período (y moneda) */
export function totalesPor(items: MovimientoImpositivo[], por: 'sucursal' | 'periodo'): TotalImpositivo[] {
  const mapa = new Map<string, TotalImpositivo>()
  for (const m of items) {
    const base = por === 'sucursal' ? m.sucursal_nombre : m.periodo
    const clave = `${base}|${m.moneda}`
    const total = mapa.get(clave) ?? {
      clave,
      etiqueta: por === 'sucursal' ? m.sucursal_nombre : formatPeriodo(m.periodo),
      moneda: m.moneda,
      pendiente: 0,
      pagado: 0,
    }
    if (m.situacion === 'pagado') total.pagado += m.monto
    else total.pendiente += m.monto
    mapa.set(clave, total)
  }
  const lista = Array.from(mapa.values())
  return por === 'sucursal'
    ? lista.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta))
    : lista.sort((a, b) => b.clave.localeCompare(a.clave))
}

const ESTADO_TEXTO: Record<MovimientoImpositivo['estado'], string> = {
  pendiente: 'Pendiente (pago por aprobar)',
  aprobado: 'Pendiente',
  completado: 'Pagado',
}

export function estadoTexto(m: MovimientoImpositivo): string {
  return ESTADO_TEXTO[m.estado]
}

export function cajaTexto(m: MovimientoImpositivo): string {
  return m.tipo_movimiento === 'banco' ? `Banco${m.banco_nombre ? ` · ${m.banco_nombre}` : ''}` : 'Efectivo'
}

/** Excel con lo que se ve en pantalla */
export async function generarExcelBaseImpositiva(items: MovimientoImpositivo[]): Promise<Blob> {
  const { default: ExcelJSLib } = await import('exceljs')
  const libro = new ExcelJSLib.Workbook()
  libro.creator = 'Heroica'
  libro.created = new Date()
  const hoja = libro.addWorksheet('Base impositiva')
  hoja.columns = [
    { header: 'Sucursal', key: 'sucursal', width: 22 },
    { header: 'Período', key: 'periodo', width: 10 },
    { header: 'Impuesto', key: 'impuesto', width: 24 },
    { header: 'Descripción', key: 'descripcion', width: 30 },
    { header: 'Vencimiento', key: 'fecha', width: 13 },
    { header: 'Moneda', key: 'moneda', width: 8 },
    { header: 'Monto', key: 'monto', width: 16 },
    { header: 'Estado', key: 'estado', width: 26 },
    { header: 'Caja / banco', key: 'caja', width: 24 },
  ]
  hoja.getRow(1).font = { bold: true }
  for (const m of items) {
    hoja.addRow({
      sucursal: m.sucursal_nombre,
      periodo: formatPeriodo(m.periodo),
      impuesto: m.impuesto,
      descripcion: m.descripcion_nombre ?? m.concepto,
      fecha: m.fecha ? m.fecha.split('-').reverse().join('/') : '',
      moneda: m.moneda,
      monto: m.monto,
      estado: estadoTexto(m),
      caja: cajaTexto(m),
    })
  }
  hoja.getColumn('monto').numFmt = '#,##0.00'
  const buffer = await libro.xlsx.writeBuffer()
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
