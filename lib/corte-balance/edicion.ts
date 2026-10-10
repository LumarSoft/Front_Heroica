import type {
  CatalogoEgresosCorte,
  LineaPlantilla,
  PlantillaCorteBalance,
  ReglaPlantilla,
  SeccionPlantilla,
} from '@/lib/types'

/** Funciones puras para editar la plantilla sin mutar el estado. */

export function mover<T>(lista: T[], indice: number, delta: -1 | 1): T[] {
  const destino = indice + delta
  if (destino < 0 || destino >= lista.length) return lista
  const copia = [...lista]
  ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
  return copia
}

export function reemplazarEn<T>(lista: T[], indice: number, item: T): T[] {
  return lista.map((x, i) => (i === indice ? item : x))
}

export function quitarEn<T>(lista: T[], indice: number): T[] {
  return lista.filter((_, i) => i !== indice)
}

const mismaRegla = (a: ReglaPlantilla, b: ReglaPlantilla) => a.tipo === b.tipo && a.id === b.id && a.medio === b.medio

const sinRegla = (reglas: ReglaPlantilla[], regla: ReglaPlantilla) => reglas.filter(r => !mismaRegla(r, regla))

/** Saca la regla de cualquier línea y de las excluidas. */
function quitarReglaDeTodo(p: PlantillaCorteBalance, regla: ReglaPlantilla): PlantillaCorteBalance {
  return {
    ...p,
    excluidas: sinRegla(p.excluidas, regla),
    secciones: p.secciones.map(s => ({
      ...s,
      lineas: s.lineas.map(l => ({ ...l, reglas: sinRegla(l.reglas, regla) })),
    })),
  }
}

export function asignarReglaALinea(
  p: PlantillaCorteBalance,
  regla: ReglaPlantilla,
  lineaId: string,
): PlantillaCorteBalance {
  const limpia = quitarReglaDeTodo(p, regla)
  return {
    ...limpia,
    secciones: limpia.secciones.map(s => ({
      ...s,
      lineas: s.lineas.map(l => (l.id === lineaId ? { ...l, reglas: [...l.reglas, regla] } : l)),
    })),
  }
}

export function excluirRegla(p: PlantillaCorteBalance, regla: ReglaPlantilla): PlantillaCorteBalance {
  const limpia = quitarReglaDeTodo(p, regla)
  return { ...limpia, excluidas: [...limpia.excluidas, regla] }
}

export function volverAIncluirRegla(p: PlantillaCorteBalance, regla: ReglaPlantilla): PlantillaCorteBalance {
  return { ...p, excluidas: sinRegla(p.excluidas, regla) }
}

export function agregarReglaSiNoExiste(reglas: ReglaPlantilla[], regla: ReglaPlantilla): ReglaPlantilla[] {
  return reglas.some(r => mismaRegla(r, regla)) ? reglas : [...reglas, regla]
}

export function nuevaLinea(nombre = 'Nueva línea'): LineaPlantilla {
  return { id: `linea-${Math.random().toString(36).slice(2, 10)}`, nombre, reglas: [] }
}

export function nuevaSeccion(nombre = 'Nueva sección'): SeccionPlantilla {
  return { id: `seccion-${Math.random().toString(36).slice(2, 10)}`, nombre, detalle: '', lineas: [nuevaLinea()] }
}

const TIPO_ETIQUETA = { categoria: 'Cat.', subcategoria: 'Subcat.', descripcion: 'Desc.' } as const

/** "Desc. Verdulero (efectivo)" — texto legible de una regla para mostrar en chips. */
export function etiquetaRegla(regla: ReglaPlantilla, catalogo: CatalogoEgresosCorte): string {
  const lista =
    regla.tipo === 'categoria'
      ? catalogo.categorias
      : regla.tipo === 'subcategoria'
        ? catalogo.subcategorias
        : catalogo.descripciones
  const item = lista.find(x => x.id === regla.id)
  let nombre = item?.nombre ?? `#${regla.id} (eliminada)`
  if (regla.tipo === 'subcategoria' && item?.categoria_id) {
    const cat = catalogo.categorias.find(c => c.id === item.categoria_id)
    if (cat) nombre = `${cat.nombre} › ${nombre}`
  }
  return `${TIPO_ETIQUETA[regla.tipo]} ${nombre}${regla.medio ? ` (${regla.medio})` : ''}`
}

export interface OpcionLinea {
  value: string
  label: string
}

export function opcionesDeLineas(p: PlantillaCorteBalance): OpcionLinea[] {
  return p.secciones.flatMap(s => s.lineas.map(l => ({ value: l.id, label: `${s.nombre} › ${l.nombre}` })))
}
