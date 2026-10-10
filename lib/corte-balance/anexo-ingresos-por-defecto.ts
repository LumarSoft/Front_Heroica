import {
  conFormula,
  conGrafico,
  diapositiva,
  fila,
  ID_FILA_VENTAS_TOTALES,
  SEMANAS,
  tabla,
  variacionesSemanales,
} from '@/lib/corte-balance/constructores-anexo'
import type { AnexoManual, TablaReporte } from '@/lib/types'

/** Anexo Ingresos como en el Canva, con promedios, porcentajes y variaciones que se calculan solos. */
export function anexoIngresos(): AnexoManual {
  const total = { ...fila('Ventas Totales', 'moneda'), id: ID_FILA_VENTAS_TOTALES }
  const ventas: TablaReporte = {
    ...tabla('Ventas', 'moneda', []),
    filas: [
      total,
      fila('Máximo diario', 'moneda'),
      fila('Mínimo diario', 'moneda'),
      conFormula(fila('Promedio diario', 'moneda'), { tipo: 'promedio_diario', a: total.id }),
    ],
  }
  const facturacion = tabla('Facturación', 'moneda', ['Facturado', 'Comandado', 'IVA a pagar'])
  const [facturado, comandado] = facturacion.filas
  const porcentajes: TablaReporte = {
    ...tabla('', 'porcentaje', []),
    filas: [
      conFormula(fila('% Facturado', 'porcentaje'), {
        tipo: 'cociente',
        a: facturado.id,
        b: total.id,
        porcentaje: true,
      }),
      conFormula(fila('% Comandado', 'porcentaje'), {
        tipo: 'cociente',
        a: comandado.id,
        b: total.id,
        porcentaje: true,
      }),
    ],
  }
  const ventasSemana = conGrafico(tabla('Ventas', 'moneda', SEMANAS), 'barras')
  const tktTotal = fila('TKT totales', 'numero')
  const tkt: TablaReporte = {
    ...tabla('TKT', 'numero', []),
    filas: [
      tktTotal,
      fila('Máximo diario', 'numero'),
      fila('Mínimo diario', 'numero'),
      conFormula(fila('Promedio diario', 'numero'), { tipo: 'promedio_diario', a: tktTotal.id }),
    ],
  }
  const tktSemana = conGrafico(tabla('TKT', 'numero', SEMANAS), 'barras')
  // TKT promedio = ventas de la semana / tickets de la semana
  const promedioSemana: TablaReporte = {
    ...tabla('TKT promedio', 'moneda', []),
    grafico: 'lineas',
    filas: SEMANAS.map((s, i) =>
      conFormula(fila(s, 'moneda'), {
        tipo: 'cociente',
        a: ventasSemana.filas[i].id,
        b: tktSemana.filas[i].id,
        porcentaje: false,
      }),
    ),
  }
  return {
    clave: 'ingresos',
    titulo: 'Anexo Ingresos',
    incluir: true,
    diapositivas: [
      diapositiva('Ventas', [ventas, facturacion, porcentajes]),
      diapositiva('Ventas por forma de pago', [
        conGrafico(tabla('', 'moneda', ['Efectivo', 'QR', 'Tarjetas', 'Pedidos Ya']), 'torta'),
      ]),
      diapositiva('Comportamiento semanal', [ventasSemana]),
      diapositiva('Cantidad de TKT', [tkt]),
      diapositiva('Comportamiento semanal de TKT', [
        tktSemana,
        {
          ...tabla('% de variación semanal', 'porcentaje', []),
          filas: variacionesSemanales(tktSemana, 'porcentaje', true),
        },
      ]),
      diapositiva('TKT promedio', [
        promedioSemana,
        {
          ...tabla('Variación nominal semanal', 'moneda', []),
          filas: variacionesSemanales(promedioSemana, 'moneda', false),
        },
        {
          ...tabla('', 'moneda', []),
          filas: [
            conFormula(fila('TKT promedio mensual', 'moneda'), {
              tipo: 'cociente',
              a: total.id,
              b: tktTotal.id,
              porcentaje: false,
            }),
          ],
        },
      ]),
    ],
  }
}
