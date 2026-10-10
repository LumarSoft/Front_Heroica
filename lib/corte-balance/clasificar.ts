import { parseInputMonto } from '@/lib/formatters'
import type {
  AjusteLineaCorte,
  BalanceCalculado,
  GrupoEgresosSueltos,
  LineaCalculada,
  MovimientoEgresoCorte,
  PlantillaCorteBalance,
  ReglaPlantilla,
  ResultadoCorteBalance,
} from '@/lib/types'

export const DESTINO_EXCLUIDO = '#excluido'

const ESPECIFICIDAD = { descripcion: 30, subcategoria: 20, categoria: 10 } as const

interface Candidato {
  destino: string
  regla: ReglaPlantilla
  orden: number
  peso: number
}

/** Redondea a centavos para no arrastrar errores de punto flotante en las sumas. */
export const redondear = (n: number) => Math.round(n * 100) / 100

const claveRegla = (r: Pick<ReglaPlantilla, 'tipo' | 'id'>) => `${r.tipo}:${r.id}`

/** Convierte el valor crudo de un input de monto en número (null si está vacío). */
export function aNumero(raw: string): number | null {
  if (!raw || !raw.trim()) return null
  const n = Number(parseInputMonto(raw))
  return Number.isFinite(n) ? n : null
}

function indexarReglas(plantilla: PlantillaCorteBalance): Map<string, Candidato[]> {
  const indice = new Map<string, Candidato[]>()
  let orden = 0
  const agregar = (regla: ReglaPlantilla, destino: string) => {
    const lista = indice.get(claveRegla(regla)) ?? []
    // Filtrar por medio hace la regla más específica que la misma sin filtro
    lista.push({ destino, regla, orden: orden++, peso: ESPECIFICIDAD[regla.tipo] + (regla.medio ? 5 : 0) })
    indice.set(claveRegla(regla), lista)
  }
  for (const seccion of plantilla.secciones) {
    for (const linea of seccion.lineas) linea.reglas.forEach(r => agregar(r, linea.id))
  }
  plantilla.excluidas.forEach(r => agregar(r, DESTINO_EXCLUIDO))
  return indice
}

/**
 * Destino de un movimiento: la regla más específica gana (descripción >
 * subcategoría > categoría; con medio > sin medio). Si empatan, la primera.
 */
type MovimientoClasificable = Pick<
  MovimientoEgresoCorte,
  'medio' | 'categoria_id' | 'subcategoria_id' | 'descripcion_id'
>

function candidatoDe(mov: MovimientoClasificable, indice: Map<string, Candidato[]>): Candidato | null {
  const claves = [
    mov.descripcion_id ? `descripcion:${mov.descripcion_id}` : null,
    mov.subcategoria_id ? `subcategoria:${mov.subcategoria_id}` : null,
    mov.categoria_id ? `categoria:${mov.categoria_id}` : null,
  ]
  let mejor: Candidato | null = null
  for (const clave of claves) {
    if (!clave) continue
    for (const c of indice.get(clave) ?? []) {
      if (c.regla.medio && c.regla.medio !== mov.medio) continue
      if (!mejor || c.peso > mejor.peso || (c.peso === mejor.peso && c.orden < mejor.orden)) mejor = c
    }
  }
  return mejor
}

/** Regla más específica posible para un movimiento suelto (su descripción, si tiene). */
function reglaPropia(m: MovimientoEgresoCorte): ReglaPlantilla | null {
  if (m.descripcion_id) return { tipo: 'descripcion', id: m.descripcion_id, medio: null }
  if (m.subcategoria_id) return { tipo: 'subcategoria', id: m.subcategoria_id, medio: null }
  if (m.categoria_id) return { tipo: 'categoria', id: m.categoria_id, medio: null }
  return null
}

function nombreSegunRegla(m: MovimientoEgresoCorte, regla: ReglaPlantilla | null): string {
  const nombre =
    regla?.tipo === 'categoria'
      ? m.categoria_nombre
      : regla?.tipo === 'subcategoria'
        ? m.subcategoria_nombre
        : m.descripcion_nombre
  return nombre ?? 'Sin categoría ni descripción'
}

/**
 * Agrupa movimientos sueltos por la regla indicada: la que los excluyó o, para
 * los sin clasificar, su propia descripción (o subcategoría/categoría).
 */
function agruparSueltos(
  movs: MovimientoEgresoCorte[],
  reglaDe: (m: MovimientoEgresoCorte) => ReglaPlantilla | null,
): GrupoEgresosSueltos[] {
  const grupos = new Map<string, GrupoEgresosSueltos>()
  for (const m of movs) {
    const regla = reglaDe(m)
    const clave = regla ? `${claveRegla(regla)}:${regla.medio ?? ''}` : 'sin-datos'
    const grupo = grupos.get(clave) ?? {
      clave,
      etiqueta: nombreSegunRegla(m, regla) + (regla?.medio ? ` (${regla.medio})` : ''),
      contexto:
        regla?.tipo === 'descripcion' ? [m.categoria_nombre, m.subcategoria_nombre].filter(Boolean).join(' › ') : '',
      regla,
      total: 0,
      movimientos: [],
    }
    grupo.total = redondear(grupo.total + m.monto)
    grupo.movimientos.push(m)
    grupos.set(clave, grupo)
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total)
}

export function clasificarEgresos(
  movimientos: MovimientoEgresoCorte[],
  plantilla: PlantillaCorteBalance,
  ajustes: Record<string, AjusteLineaCorte>,
): ResultadoCorteBalance {
  const indice = indexarReglas(plantilla)
  const porDestino = new Map<string, MovimientoEgresoCorte[]>()
  const destinoPorMovimiento = new Map<number, string>()
  const reglaExclusion = new Map<number, ReglaPlantilla>()

  for (const mov of movimientos) {
    const candidato = candidatoDe(mov, indice)
    const destino = candidato?.destino ?? ''
    if (candidato && destino === DESTINO_EXCLUIDO) reglaExclusion.set(mov.id, candidato.regla)
    destinoPorMovimiento.set(mov.id, destino)
    porDestino.set(destino, [...(porDestino.get(destino) ?? []), mov])
  }

  const secciones = plantilla.secciones.map(seccion => {
    const lineas = seccion.lineas.map((linea): LineaCalculada => {
      const movs = porDestino.get(linea.id) ?? []
      const automatico = redondear(movs.reduce((acc, m) => acc + m.monto, 0))
      const ajuste = ajustes[linea.id]
      const manual = ajuste ? aNumero(ajuste.valor) : null
      return {
        id: linea.id,
        nombre: linea.nombre,
        automatico,
        importe: manual ?? automatico,
        ajustada: manual !== null,
        nota: ajuste?.nota ?? '',
        movimientos: movs,
      }
    })
    return {
      id: seccion.id,
      nombre: seccion.nombre,
      detalle: seccion.detalle,
      tipoCosto: seccion.tipoCosto,
      lineas,
      total: redondear(lineas.reduce((acc, l) => acc + l.importe, 0)),
    }
  })

  const sinClasificar = agruparSueltos(porDestino.get('') ?? [], reglaPropia)
  const excluidos = agruparSueltos(porDestino.get(DESTINO_EXCLUIDO) ?? [], m => reglaExclusion.get(m.id) ?? null)
  const suma = (gs: GrupoEgresosSueltos[]) => redondear(gs.reduce((acc, g) => acc + g.total, 0))

  return {
    secciones,
    sinClasificar,
    excluidos,
    totalEgresos: redondear(secciones.reduce((acc, s) => acc + s.total, 0)),
    totalSinClasificar: suma(sinClasificar),
    totalExcluido: suma(excluidos),
    destinoPorMovimiento,
  }
}

/**
 * Total del sistema (sin ajustes manuales) por sección, para meses anteriores.
 * Usa las mismas reglas que el mes actual, así la comparación es pareja.
 */
export function totalesPorSeccion(
  movimientos: (MovimientoClasificable & { monto: number })[],
  plantilla: PlantillaCorteBalance,
): Map<string, number> {
  const indice = indexarReglas(plantilla)
  const seccionDeLinea = new Map(plantilla.secciones.flatMap(s => s.lineas.map(l => [l.id, s.id] as const)))
  const totales = new Map(plantilla.secciones.map(s => [s.id, 0]))
  for (const mov of movimientos) {
    const seccionId = seccionDeLinea.get(candidatoDe(mov, indice)?.destino ?? '')
    if (seccionId) totales.set(seccionId, redondear((totales.get(seccionId) ?? 0) + mov.monto))
  }
  return totales
}

export function calcularBalance(ingresos: number, egresos: number, operatividadPct: number): BalanceCalculado {
  const resultadoParcial = redondear(ingresos - egresos)
  // La operatividad solo se descuenta cuando hay resultado positivo
  const operatividad = resultadoParcial > 0 ? redondear((resultadoParcial * operatividadPct) / 100) : 0
  return {
    ingresos,
    egresos,
    resultadoParcial,
    operatividadPct,
    operatividad,
    resultadoFinal: redondear(resultadoParcial - operatividad),
  }
}
