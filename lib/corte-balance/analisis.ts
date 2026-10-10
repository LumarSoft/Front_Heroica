import { DESTINO_EXCLUIDO, redondear, totalesPorSeccion } from '@/lib/corte-balance/clasificar'
import type {
  AnalisisCorteBalance,
  ComparativoSeccion,
  CorteBalanceResponse,
  IndicadoresCorte,
  PlantillaCorteBalance,
  ResultadoCorteBalance,
  SeccionCalculada,
  TopProveedor,
} from '@/lib/types'

/** "2026-07", -1 → "2026-06" */
export function sumarMeses(mes: string, delta: number): string {
  const [anio, numero] = mes.split('-').map(Number)
  const d = new Date(anio, numero - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MESES_EVOLUCION = 6
const TOP_PROVEEDORES = 10

function indicadores(secciones: SeccionCalculada[], ventas: number): IndicadoresCorte | null {
  if (ventas <= 0) return null
  const suma = (tipo: 'fijo' | 'variable') =>
    redondear(secciones.filter(s => s.tipoCosto === tipo).reduce((acc, s) => acc + s.total, 0))
  const costosFijos = suma('fijo')
  const costosVariables = suma('variable')
  const margen = 1 - costosVariables / ventas
  const puntoEquilibrio = margen > 0 ? redondear(costosFijos / margen) : null
  return {
    ventas,
    incidencias: secciones.map(s => ({
      id: s.id,
      nombre: s.nombre,
      total: s.total,
      pct: redondear((s.total / ventas) * 100),
      tipoCosto: s.tipoCosto,
    })),
    costosFijos,
    costosVariables,
    margenContribucionPct: redondear(margen * 100),
    puntoEquilibrio,
    coberturaPct: puntoEquilibrio ? redondear((ventas / puntoEquilibrio) * 100) : null,
    diferencia: puntoEquilibrio ? redondear(ventas - puntoEquilibrio) : null,
  }
}

/**
 * Comparativos (con valores del sistema, sin ajustes manuales, para que la
 * comparación entre meses sea pareja) e indicadores sobre ventas (con los
 * importes del reporte, ajustes incluidos).
 */
export function analizarCorte(
  datos: CorteBalanceResponse,
  plantilla: PlantillaCorteBalance,
  resultado: ResultadoCorteBalance,
  secciones: SeccionCalculada[],
  ventas: number,
  incluirSinClasificar: boolean,
): AnalisisCorteBalance {
  const meses = Array.from({ length: MESES_EVOLUCION }, (_, i) => sumarMeses(datos.mes, i - MESES_EVOLUCION + 1))
  const totalesMes = new Map(
    meses.map(m => [
      m,
      m === datos.mes
        ? totalesPorSeccion(datos.movimientos, plantilla)
        : totalesPorSeccion(
            datos.historico.filter(h => h.mes === m),
            plantilla,
          ),
    ]),
  )
  const mesAnterior = sumarMeses(datos.mes, -1)
  const hayDatosAnterior = datos.historico.some(h => h.mes === mesAnterior)

  const comparativo: ComparativoSeccion[] = plantilla.secciones.map(s => {
    const actual = totalesMes.get(datos.mes)?.get(s.id) ?? 0
    const anterior = hayDatosAnterior ? (totalesMes.get(mesAnterior)?.get(s.id) ?? 0) : null
    const variacion = anterior === null ? null : redondear(actual - anterior)
    return {
      id: s.id,
      nombre: s.nombre,
      actual,
      anterior,
      variacion,
      variacionPct: anterior ? redondear(((actual - anterior) / anterior) * 100) : null,
    }
  })

  const series = plantilla.secciones
    .map(s => ({ id: s.id, nombre: s.nombre, valores: meses.map(m => totalesMes.get(m)?.get(s.id) ?? 0) }))
    .filter(s => s.valores.some(v => v > 0))

  // Proveedores y medio de pago: solo lo que entra en el reporte
  const enReporte = datos.movimientos.filter(m => {
    const destino = resultado.destinoPorMovimiento.get(m.id) ?? ''
    return destino !== DESTINO_EXCLUIDO && (destino !== '' || incluirSinClasificar)
  })
  const proveedores = new Map<string, TopProveedor>()
  for (const m of enReporte) {
    const nombre = m.proveedor_nombre ?? m.descripcion_nombre ?? 'Sin proveedor'
    const actual = proveedores.get(nombre) ?? { nombre, total: 0, cantidad: 0 }
    proveedores.set(nombre, { nombre, total: redondear(actual.total + m.monto), cantidad: actual.cantidad + 1 })
  }
  const porMedio = { banco: 0, efectivo: 0 }
  for (const m of enReporte) porMedio[m.medio] = redondear(porMedio[m.medio] + m.monto)

  return {
    mesAnterior,
    comparativo,
    evolucion: { meses, series },
    topProveedores: [...proveedores.values()].sort((a, b) => b.total - a.total).slice(0, TOP_PROVEEDORES),
    porMedio,
    indicadores: indicadores(secciones, ventas),
  }
}
