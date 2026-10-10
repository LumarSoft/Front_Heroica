// =============================================
// Corte de balance mensual (módulo Reportes)
// =============================================

export type MedioMovimiento = 'banco' | 'efectivo'
export type TipoReglaPlantilla = 'categoria' | 'subcategoria' | 'descripcion'
/** Para el punto de equilibrio: los fijos no dependen del nivel de ventas. */
export type TipoCosto = 'fijo' | 'variable'

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
  tipoCosto: TipoCosto
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

/** Egresos de meses anteriores agrupados (alcanza para clasificarlos con la plantilla). */
export interface MovimientoHistoricoCorte {
  mes: string
  monto: number
  medio: MedioMovimiento
  categoria_id: number | null
  subcategoria_id: number | null
  descripcion_id: number | null
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
  historico: MovimientoHistoricoCorte[]
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
  tipoCosto: TipoCosto
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

/** Cálculo automático de una fila a partir de otras (por id). Solo se usa si la fila está vacía. */
export type FormulaFila =
  | { tipo: 'cociente'; a: string; b: string; porcentaje: boolean }
  | { tipo: 'variacion'; actual: string; anterior: string; porcentaje: boolean }
  | { tipo: 'promedio_diario'; a: string }
  | { tipo: 'suma'; filas: string[] }

export type TipoGraficoTabla = 'ninguno' | 'torta' | 'barras' | 'lineas'

export interface FilaReporte {
  id: string
  etiqueta: string
  formato: FormatoValorReporte
  /** Valor crudo tal como lo escribe el usuario ('' = vacío). */
  valor: string
  /** Si está vacío, se completa con la suma de estas líneas de egresos. */
  lineasVinculadas?: string[]
  formula?: FormulaFila
}

export interface TablaReporte {
  id: string
  titulo: string
  filas: FilaReporte[]
  grafico?: TipoGraficoTabla
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
  incluirComparativo: boolean
  incluirEvolucion: boolean
  incluirTopProveedores: boolean
  incluirIndicadores: boolean
  incluirCascada: boolean
  /** Variación (en %) a partir de la cual se resalta una sección en el comparativo. */
  umbralVariacionPct: number
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

// ── Análisis (comparativos e indicadores) ──────────────────────────────────

export interface ComparativoSeccion {
  id: string
  nombre: string
  actual: number
  anterior: number | null
  variacion: number | null
  variacionPct: number | null
}

export interface EvolucionEgresos {
  meses: string[]
  series: { id: string; nombre: string; valores: number[] }[]
}

export interface TopProveedor {
  nombre: string
  total: number
  cantidad: number
}

export interface IndicadoresCorte {
  ventas: number
  incidencias: { id: string; nombre: string; total: number; pct: number; tipoCosto: TipoCosto }[]
  costosFijos: number
  costosVariables: number
  margenContribucionPct: number
  puntoEquilibrio: number | null
  coberturaPct: number | null
  diferencia: number | null
}

export interface AnalisisCorteBalance {
  mesAnterior: string
  comparativo: ComparativoSeccion[]
  evolucion: EvolucionEgresos
  topProveedores: TopProveedor[]
  porMedio: { banco: number; efectivo: number }
  indicadores: IndicadoresCorte | null
}

// ── Modelo de diapositivas (lo dibujan la vista previa y el PPTX) ───────────
// Coordenadas en pulgadas sobre una diapositiva de 13,333 × 7,5 (16:9).

export interface CajaModelo {
  x: number
  y: number
  w: number
  h: number
}

export interface TramoTexto {
  texto: string
  negrita?: boolean
  color?: string
}

export interface ElementoTexto extends CajaModelo {
  tipo: 'texto'
  tramos: TramoTexto[]
  tamano: number
  color: string
  negrita?: boolean
  cursiva?: boolean
  subrayado?: boolean
  alineacion?: 'left' | 'center' | 'right'
  vertical?: 'top' | 'middle'
}

export interface ElementoForma extends CajaModelo {
  tipo: 'forma'
  color: string
  radio: number
}

export interface CeldaModelo {
  texto: string
  negrita?: boolean
  fondo?: string
  color?: string
  tamano?: number
  colspan?: number
}

export interface ElementoTabla {
  tipo: 'tabla'
  x: number
  y: number
  w: number
  anchos: number[]
  altos: number[]
  filas: CeldaModelo[][]
  tamano: number
}

export type TipoGraficoModelo = 'torta' | 'dona' | 'barras' | 'barras-apiladas' | 'lineas'

export interface ElementoGrafico extends CajaModelo {
  tipo: 'grafico'
  grafico: TipoGraficoModelo
  titulo: string
  categorias: string[]
  series: { nombre: string; valores: number[] }[]
  colores: string[]
  formato: 'moneda' | 'numero' | 'porcentaje'
}

export type ElementoModelo = ElementoTexto | ElementoForma | ElementoTabla | ElementoGrafico

export interface DiapositivaModelo {
  id: string
  /** Para la vista previa: "Anexo Egresos · Gastos Fijos" */
  nombre: string
  elementos: ElementoModelo[]
}

/** Todo lo que necesitan los generadores de PPTX y Excel. */
export interface DatosExportCorteBalance {
  borrador: BorradorCorteBalance
  resultado: ResultadoCorteBalance
  secciones: SeccionCalculada[]
  balance: BalanceCalculado
  contexto: ContextoValores
  movimientos: MovimientoEgresoCorte[]
  analisis: AnalisisCorteBalance
  moneda: 'ARS' | 'USD'
  mes: string
  sucursalNombre: string
}

/** Lo necesario para resolver el valor de una fila manual (vínculos y fórmulas). */
export interface ContextoValores {
  importes: Map<string, number>
  filas: Map<string, FilaReporte>
  diasMes: number
}
