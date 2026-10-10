import {
  AREA,
  COLOR_GRIS,
  encabezado,
  forma,
  notaAlPie,
  tablaConEncabezado,
  tablasDosColumnas,
  texto,
  type Tema,
} from '@/lib/corte-balance/modelo/primitivas'
import { formatearImporte } from '@/lib/corte-balance/valores'
import type {
  BalanceCalculado,
  CeldaModelo,
  DiapositivaModelo,
  ElementoModelo,
  IndicadoresCorte,
  SeccionCalculada,
} from '@/lib/types'

type Moneda = 'ARS' | 'USD'

const COLORES = { ingresos: '9AE07A', egresos: 'FF5A5A', parcial: 'FFDE59', final: '9CC3FF', oper: 'D1D5DB' }

/** "$ 57,6 M" / "$ 834 mil" para etiquetas chicas. */
function importeCorto(n: number, moneda: Moneda): string {
  const signo = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const simbolo = moneda === 'USD' ? 'US$' : '$'
  if (abs >= 1_000_000)
    return `${signo}${simbolo} ${(abs / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`
  if (abs >= 1_000) return `${signo}${simbolo} ${Math.round(abs / 1_000).toLocaleString('es-AR')} mil`
  return `${signo}${simbolo} ${Math.round(abs)}`
}

export function balanceMensual(
  tema: Tema,
  b: BalanceCalculado,
  secciones: SeccionCalculada[],
  moneda: Moneda,
): DiapositivaModelo {
  const m = (n: number) => formatearImporte(n, moneda)
  const bloque = (titulo: string, valor: number, fondo: string): CeldaModelo[] => [
    { texto: `${titulo}\n${m(valor)}`, colspan: 2, fondo, negrita: true, tamano: 18 },
  ]
  const derecha = tablasDosColumnas(
    tema,
    [{ titulo: '', filas: secciones.map(s => ({ etiqueta: s.nombre, valor: m(s.total) })) }],
    { x: 7.1, y: 0.55, w: 5.6, h: 6.6 },
  )
  return {
    id: 'balance',
    nombre: 'Balance mensual',
    elementos: [
      ...encabezado(tema, 'Balance Mensual', ''),
      {
        tipo: 'tabla',
        x: 0.8,
        y: 1.75,
        w: 5.9,
        anchos: [2.95, 2.95],
        altos: [0.95, 0.95, 0.95, 0.65, 0.95],
        tamano: 16,
        filas: [
          bloque('Ingresos', b.ingresos, COLORES.ingresos),
          bloque('Egresos', b.egresos, COLORES.egresos),
          bloque('Resultado parcial', b.resultadoParcial, COLORES.parcial),
          [{ texto: `Operatividad (${b.operatividadPct}%)`, negrita: true, tamano: 14 }, { texto: m(b.operatividad) }],
          bloque('Resultado Final', b.resultadoFinal, COLORES.final),
        ],
      },
      ...derecha.elementos,
    ],
  }
}

/** Cascada: de los ingresos, restando cada sección, al resultado final (dibujada con formas). */
export function cascada(
  tema: Tema,
  b: BalanceCalculado,
  secciones: SeccionCalculada[],
  moneda: Moneda,
): DiapositivaModelo | null {
  if (b.ingresos <= 0) return null
  type Paso = { nombre: string; desde: number; hasta: number; color: string }
  const pasos: Paso[] = [{ nombre: 'Ingresos', desde: 0, hasta: b.ingresos, color: COLORES.ingresos }]
  let acumulado = b.ingresos
  for (const s of secciones.filter(x => x.total !== 0)) {
    pasos.push({ nombre: s.nombre, desde: acumulado, hasta: acumulado - s.total, color: COLORES.egresos })
    acumulado -= s.total
  }
  pasos.push({ nombre: 'Resultado parcial', desde: 0, hasta: b.resultadoParcial, color: COLORES.parcial })
  if (b.operatividad) {
    pasos.push({ nombre: 'Operatividad', desde: b.resultadoParcial, hasta: b.resultadoFinal, color: COLORES.oper })
  }
  pasos.push({ nombre: 'Resultado final', desde: 0, hasta: b.resultadoFinal, color: COLORES.final })

  const valores = pasos.flatMap(p => [p.desde, p.hasta])
  const max = Math.max(...valores)
  const min = Math.min(0, ...valores)
  const top = 1.9
  const alto = 3.9
  const y = (v: number) => top + ((max - v) / (max - min || 1)) * alto
  const ancho = AREA.w / pasos.length
  const elementos: ElementoModelo[] = [
    ...encabezado(tema, 'Balance Mensual', 'Del ingreso al resultado'),
    forma({ x: AREA.x, y: y(0), w: AREA.w, h: 0.015 }, COLOR_GRIS),
  ]
  pasos.forEach((p, i) => {
    const x = AREA.x + i * ancho
    const y1 = y(Math.max(p.desde, p.hasta))
    const h = Math.max(0.02, Math.abs(y(p.desde) - y(p.hasta)))
    const variacion = p.hasta - p.desde
    elementos.push(
      forma({ x: x + ancho * 0.15, y: y1, w: ancho * 0.7, h }, p.color),
      texto(
        { x, y: y1 - 0.32, w: ancho, h: 0.3 },
        importeCorto(i === 0 || p.desde === 0 ? p.hasta : variacion, moneda),
        {
          tamano: 9,
          negrita: true,
          color: '111111',
          alineacion: 'center',
        },
      ),
      texto({ x, y: top + alto + 0.12, w: ancho, h: 0.7 }, p.nombre, {
        tamano: 9,
        color: '374151',
        alineacion: 'center',
        vertical: 'top',
      }),
    )
  })
  return { id: 'balance-cascada', nombre: 'Balance · Cascada', elementos }
}

export function indicadores(tema: Tema, ind: IndicadoresCorte, moneda: Moneda): DiapositivaModelo {
  const m = (n: number) => formatearImporte(n, moneda)
  const p = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`
  const kpis = [
    { etiqueta: 'Ventas del período', valor: m(ind.ventas) },
    { etiqueta: 'Costos fijos', valor: m(ind.costosFijos) },
    { etiqueta: 'Costos variables', valor: m(ind.costosVariables) },
    { etiqueta: 'Margen de contribución', valor: p(ind.margenContribucionPct) },
    { etiqueta: 'Punto de equilibrio', valor: ind.puntoEquilibrio === null ? '—' : m(ind.puntoEquilibrio) },
    { etiqueta: 'Ventas / equilibrio', valor: ind.coberturaPct === null ? '—' : p(ind.coberturaPct) },
    {
      etiqueta:
        ind.diferencia !== null && ind.diferencia < 0 ? 'Faltante para el equilibrio' : 'Superávit sobre el equilibrio',
      valor: ind.diferencia === null ? '—' : m(Math.abs(ind.diferencia)),
    },
  ]
  return {
    id: 'balance-indicadores',
    nombre: 'Balance · Indicadores',
    elementos: [
      ...encabezado(tema, 'Balance Mensual', 'Indicadores'),
      tablaConEncabezado(
        tema,
        { x: AREA.x, y: 1.6, w: 6.6 },
        [3.0, 1.0, 1.5, 1.1],
        ['Sección', 'Tipo', 'Monto', '% ventas'],
        ind.incidencias.map(i => [
          { texto: i.nombre, negrita: true },
          { texto: i.tipoCosto === 'fijo' ? 'Fijo' : 'Variable' },
          { texto: m(i.total) },
          { texto: p(i.pct) },
        ]),
        5.2,
      ),
      ...tablasDosColumnas(tema, [{ titulo: 'Equilibrio', filas: kpis }], { x: 7.6, y: 1.6, w: 5.0, h: 5.0 }).elementos,
      notaAlPie(
        'Punto de equilibrio = costos fijos / (1 − costos variables / ventas). Fijo/variable se define en la plantilla.',
      ),
    ],
  }
}
