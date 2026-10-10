// =============================================
// Corte de balance mensual (módulo Reportes)
// =============================================

export type MedioMovimiento = 'banco' | 'efectivo'
export type TipoReglaPlantilla = 'categoria' | 'subcategoria' | 'descripcion'

/** Una regla suma a la línea los egresos de esa categoría/subcategoría/descripción. */
export interface ReglaPlantilla {
  tipo: TipoReglaPlantilla
  id: number
  medio: MedioMovimiento | null
}

export interface LineaPlantilla {
  id: string
  nombre: string
  reglas: ReglaPlantilla[]
}

export interface SeccionPlantilla {
  id: string
  nombre: string
  detalle: string
  lineas: LineaPlantilla[]
}

export interface PlantillaCorteBalance {
  version: 1
  secciones: SeccionPlantilla[]
  excluidas: ReglaPlantilla[]
  operatividadPct: number
}

export interface MovimientoEgresoCorte {
  id: number
  fecha: string
  monto: number
  medio: MedioMovimiento
  categoria_id: number | null
  categoria_nombre: string | null
  subcategoria_id: number | null
  subcategoria_nombre: string | null
  descripcion_id: number | null
  descripcion_nombre: string | null
  proveedor_nombre: string | null
  comentarios: string | null
  es_deuda: boolean
}

export interface ItemCatalogoCorte {
  id: number
  nombre: string
  categoria_id?: number | null
  subcategoria_id?: number | null
}

export interface CatalogoEgresosCorte {
  categorias: ItemCatalogoCorte[]
  subcategorias: ItemCatalogoCorte[]
  descripciones: ItemCatalogoCorte[]
}

export interface CorteBalanceResponse {
  mes: string
  moneda: 'ARS' | 'USD'
  movimientos: MovimientoEgresoCorte[]
  catalogo: CatalogoEgresosCorte
  plantilla: PlantillaCorteBalance
  plantillaEsPorDefecto: boolean
  plantillaActualizadaEn: string | null
}

// ── Resultado de clasificar los egresos con la plantilla ────────────────────

export interface LineaCalculada {
  id: string
  nombre: string
  /** Lo que suma el sistema según las reglas. */
  automatico: number
  /** Lo que va al reporte: el ajuste manual si existe, si no el automático. */
  importe: number
  ajustada: boolean
  nota: string
  movimientos: MovimientoEgresoCorte[]
}

export interface SeccionCalculada {
  id: string
  nombre: string
  detalle: string
  total: number
  lineas: LineaCalculada[]
}

/** Egresos agrupados por descripción (o subcategoría si no tienen) que no cayeron en ninguna línea. */
export interface GrupoEgresosSueltos {
  clave: string
  etiqueta: string
  contexto: string
  regla: ReglaPlantilla | null
  total: number
  movimientos: MovimientoEgresoCorte[]
}

export interface ResultadoCorteBalance {
  secciones: SeccionCalculada[]
  sinClasificar: GrupoEgresosSueltos[]
  excluidos: GrupoEgresosSueltos[]
  totalEgresos: number
  totalSinClasificar: number
  totalExcluido: number
  /** Línea a la que fue a parar cada movimiento ('' = sin clasificar, '#excluido'). */
  destinoPorMovimiento: Map<number, string>
}

// ── Contenido manual (ingresos, RRHH, conclusión) ───────────────────────────

export type FormatoValorReporte = 'moneda' | 'numero' | 'porcentaje' | 'texto'

export interface FilaReporte {
  id: string
  etiqueta: string
  formato: FormatoValorReporte
  /** Valor crudo tal como lo escribe el usuario ('' = vacío). */
  valor: string
  /** Si está vacío, se completa con la suma de estas líneas de egresos. */
  lineasVinculadas?: string[]
}

export interface TablaReporte {
  id: string
  titulo: string
  filas: FilaReporte[]
}

export interface DiapositivaReporte {
  id: string
  subtitulo: string
  texto: string
  incluir: boolean
  tablas: TablaReporte[]
}

export type ClaveAnexoManual = 'ingresos' | 'rrhh' | 'conclusion'

export interface AnexoManual {
  clave: ClaveAnexoManual
  titulo: string
  incluir: boolean
  diapositivas: DiapositivaReporte[]
}

export type MostrarVacios = 'blanco' | 'guion' | 'cero'

export interface OpcionesCorteBalance {
  titulo: string
  subtitulo: string
  periodo: string
  colorPrincipal: string
  fuente: string
  mostrarVacios: MostrarVacios
  incluirPortada: boolean
  incluirIndice: boolean
  incluirSeparadores: boolean
  incluirGraficoEgresos: boolean
  incluirBalance: boolean
  incluirCierre: boolean
  ocultarLineasEnCero: boolean
  incluirSinClasificar: boolean
  textoCierre: string
  firmaCierre: string
}

export interface AjusteLineaCorte {
  valor: string
  nota: string
}

export interface BorradorCorteBalance {
  version: 1
  opciones: OpcionesCorteBalance
  ajustes: Record<string, AjusteLineaCorte>
  detalles: Record<string, string>
  anexos: Record<ClaveAnexoManual, AnexoManual>
  balance: { ingresos: string; operatividadPct: string }
}

export interface BalanceCalculado {
  ingresos: number
  egresos: number
  resultadoParcial: number
  operatividadPct: number
  operatividad: number
  resultadoFinal: number
}

/** Todo lo que necesitan los generadores de PPTX y Excel. */
export interface DatosExportCorteBalance {
  borrador: BorradorCorteBalance
  resultado: ResultadoCorteBalance
  secciones: SeccionCalculada[]
  balance: BalanceCalculado
  importes: Map<string, number>
  movimientos: MovimientoEgresoCorte[]
  moneda: 'ARS' | 'USD'
  mes: string
  sucursalNombre: string
}
