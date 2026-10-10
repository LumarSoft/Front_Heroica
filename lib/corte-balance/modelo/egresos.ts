import { COLORES_CATEGORICOS } from '@/lib/corte-balance/modelo/anexo'
import {
  AREA,
  encabezado,
  notaAlPie,
  parrafo,
  tablaConEncabezado,
  tablasDosColumnas,
  texto,
  type Tema,
} from '@/lib/corte-balance/modelo/primitivas'
import { etiquetaPeriodo, formatearImporte } from '@/lib/corte-balance/valores'
import type { AnalisisCorteBalance, CeldaModelo, DiapositivaModelo, SeccionCalculada } from '@/lib/types'

type Moneda = 'ARS' | 'USD'

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const mesCorto = (mes: string) => `${MESES_CORTOS[Number(mes.slice(5, 7)) - 1]} ${mes.slice(2, 4)}`
const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`

export function seccionEgresos(tema: Tema, s: SeccionCalculada, moneda: Moneda): DiapositivaModelo {
  const filas = s.lineas.map(l => ({ etiqueta: l.nombre, valor: formatearImporte(l.importe, moneda) }))
  // Como en el Canva: más de 8 líneas se parten en dos tablas
  const mitad = Math.ceil(filas.length / 2)
  const tablas =
    filas.length > 8
      ? [
          { titulo: '', filas: filas.slice(0, mitad) },
          { titulo: '', filas: filas.slice(mitad) },
        ]
      : [{ titulo: '', filas }]
  const detalle = s.detalle.trim()
  const { elementos, fondo } = tablasDosColumnas(tema, tablas, { ...AREA, h: detalle ? 3.3 : 4.6 })
  const total = texto(
    { x: 5.6, y: fondo + 0.15, w: 7.0, h: 0.55 },
    [{ texto: `Total ${s.nombre} ` }, { texto: formatearImporte(s.total, moneda), negrita: true }],
    { tamano: 20, color: tema.color, alineacion: 'right' },
  )
  const extra = detalle
    ? [
        texto({ x: AREA.x, y: fondo + 0.85, w: 4, h: 0.4 }, 'Detalle', {
          tamano: 16,
          negrita: true,
          color: tema.color,
        }),
        parrafo({ x: AREA.x, y: fondo + 1.25, w: 12, h: 7.3 - fondo - 1.25 }, detalle, 12),
      ]
    : []
  return {
    id: `egresos-${s.id}`,
    nombre: `Egresos · ${s.nombre}`,
    elementos: [...encabezado(tema, 'Anexo Egresos', s.nombre, true), ...elementos, total, ...extra],
  }
}

export function tortaEgresos(tema: Tema, secciones: SeccionCalculada[]): DiapositivaModelo | null {
  const conValor = secciones.filter(s => s.total > 0)
  if (conValor.length === 0) return null
  return {
    id: 'egresos-torta',
    nombre: 'Egresos · Distribución',
    elementos: [
      ...encabezado(tema, 'Anexo Egresos', ''),
      {
        tipo: 'grafico',
        x: 1.2,
        y: 1.3,
        w: 11,
        h: 6,
        grafico: 'torta',
        titulo: 'Distribución de los egresos',
        categorias: conValor.map(s => s.nombre),
        series: [{ nombre: 'Egresos', valores: conValor.map(s => s.total) }],
        colores: COLORES_CATEGORICOS,
        formato: 'moneda',
      },
    ],
  }
}

export function comparativoEgresos(
  tema: Tema,
  a: AnalisisCorteBalance,
  mes: string,
  umbral: number,
  moneda: Moneda,
): DiapositivaModelo | null {
  const filas = a.comparativo.filter(c => c.actual !== 0 || (c.anterior ?? 0) !== 0)
  if (filas.length === 0 || filas.every(c => c.anterior === null)) return null
  const m = (n: number | null) => (n === null ? '—' : formatearImporte(n, moneda))
  const celdaVar = (v: number | null): CeldaModelo => {
    if (v === null) return { texto: '—' }
    if (v >= umbral) return { texto: pct(v), negrita: true, fondo: 'FDE2E2', color: 'B91C1C' }
    if (v <= -umbral) return { texto: pct(v), negrita: true, fondo: 'DCFCE7', color: '15803D' }
    return { texto: pct(v) }
  }
  const totalActual = filas.reduce((s, c) => s + c.actual, 0)
  const totalAnterior = filas.reduce((s, c) => s + (c.anterior ?? 0), 0)
  const cuerpo: CeldaModelo[][] = filas.map(c => [
    { texto: c.nombre, negrita: true },
    { texto: m(c.anterior) },
    { texto: m(c.actual) },
    { texto: m(c.variacion) },
    celdaVar(c.variacionPct),
  ])
  cuerpo.push([
    { texto: 'Total', negrita: true },
    { texto: m(totalAnterior), negrita: true },
    { texto: m(totalActual), negrita: true },
    { texto: m(totalActual - totalAnterior), negrita: true },
    celdaVar(totalAnterior ? ((totalActual - totalAnterior) / totalAnterior) * 100 : null),
  ])
  return {
    id: 'egresos-comparativo',
    nombre: 'Egresos · Comparativo',
    elementos: [
      ...encabezado(tema, 'Anexo Egresos', `Comparativo vs ${etiquetaPeriodo(a.mesAnterior)}`),
      tablaConEncabezado(
        tema,
        { x: AREA.x, y: 1.5, w: 12 },
        [3.2, 2.2, 2.2, 2.2, 1.4],
        ['Sección', etiquetaPeriodo(a.mesAnterior), etiquetaPeriodo(mes), 'Variación', 'Var. %'],
        cuerpo,
        5.3,
      ),
      notaAlPie(`Valores según el sistema (sin ajustes manuales). Se resaltan las variaciones de ±${umbral} % o más.`),
    ],
  }
}

export function evolucionEgresos(tema: Tema, a: AnalisisCorteBalance): DiapositivaModelo | null {
  const mesesConDatos = a.evolucion.meses.filter((_, i) => a.evolucion.series.some(s => s.valores[i] > 0))
  if (mesesConDatos.length < 2) return null
  const desde = a.evolucion.meses.indexOf(mesesConDatos[0])
  return {
    id: 'egresos-evolucion',
    nombre: 'Egresos · Evolución',
    elementos: [
      ...encabezado(tema, 'Anexo Egresos', 'Evolución mensual'),
      {
        tipo: 'grafico',
        x: 0.6,
        y: 1.4,
        w: 12.0,
        h: 5.5,
        grafico: 'barras-apiladas',
        titulo: 'Egresos por sección',
        categorias: a.evolucion.meses.slice(desde).map(mesCorto),
        series: a.evolucion.series.map(s => ({ nombre: s.nombre, valores: s.valores.slice(desde) })),
        colores: COLORES_CATEGORICOS,
        formato: 'moneda',
      },
      notaAlPie('Valores según el sistema (sin ajustes manuales), clasificados con la plantilla actual.'),
    ],
  }
}

export function topProveedores(tema: Tema, a: AnalisisCorteBalance, moneda: Moneda): DiapositivaModelo | null {
  if (a.topProveedores.length === 0) return null
  return {
    id: 'egresos-proveedores',
    nombre: 'Egresos · Principales proveedores',
    elementos: [
      ...encabezado(tema, 'Anexo Egresos', 'Principales proveedores'),
      tablaConEncabezado(
        tema,
        { x: AREA.x, y: 1.6, w: 7.2 },
        [3.6, 1.1, 2.5],
        ['Proveedor / descripción', 'Movs.', 'Total'],
        a.topProveedores.map(p => [
          { texto: p.nombre, negrita: true },
          { texto: String(p.cantidad) },
          { texto: formatearImporte(p.total, moneda) },
        ]),
        5.3,
      ),
      {
        tipo: 'grafico',
        x: 8.1,
        y: 1.6,
        w: 4.7,
        h: 4.6,
        grafico: 'dona',
        titulo: 'Banco vs efectivo',
        categorias: ['Banco', 'Efectivo'],
        series: [{ nombre: 'Medio', valores: [a.porMedio.banco, a.porMedio.efectivo] }],
        colores: [tema.color, tema.claro],
        formato: 'moneda',
      },
    ],
  }
}
