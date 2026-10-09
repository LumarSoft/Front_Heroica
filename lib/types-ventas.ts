// Tipos del módulo de Ventas (panel gerencial, reportes e integraciones con Bistrosoft y Hiopos).

export type FuenteVentas = 'bistrosoft' | 'hiopos'

export const NOMBRE_FUENTE_VENTAS: Record<FuenteVentas, string> = { bistrosoft: 'Bistrosoft', hiopos: 'Hiopos' }
export type TipoSincronizacionVentas = 'rango' | 'cambios'
export type AgrupacionVentas = 'dia' | 'semana' | 'mes'
export type ComparacionVentas = 'periodo_anterior' | 'anio_anterior'
export type EstadoSincronizacionVentas = 'en_curso' | 'exitosa' | 'con_observaciones' | 'fallida'
export type OrigenSincronizacionVentas = 'automatica' | 'manual'
export type TipoLineaVenta = 'producto' | 'pago' | 'descuento' | 'caja' | 'otro'

export interface FiltrosVentas {
  desde: string
  hasta: string
  sucursalIds: number[]
  categoria: string
  medioPago: string
  canal: string
  producto: string
  vendedor: string
  caja: string
}

export interface OpcionesFiltrosVentas {
  sucursales: Array<{ id: number; nombre: string }>
  categorias: string[]
  mediosPago: string[]
  canales: string[]
  vendedores: string[]
  cajas: string[]
}

export interface KpisVentas {
  facturacion: number
  cobrado: number
  tickets: number
  unidades: number
  ticketPromedio: number
  descuentos: number
  anuladas: { tickets: number; importe: number }
}

export interface ProductoVendido {
  producto: string
  categoria: string | null
  unidades: number
  facturacion: number
}

export interface PanelVentas {
  kpis: KpisVentas
  /** Días importados del período consultado. */
  periodo: { desde: string; hasta: string; diasConDatos: number; diasTotales: number }
  /** Período contra el que se compara y cuántos de sus días están importados. */
  comparacion: {
    tipo: ComparacionVentas
    desde: string
    hasta: string
    diasConDatos: number
    diasTotales: number
    kpis: KpisVentas
  }
  agrupacion: AgrupacionVentas
  /** null = período sin días importados (hueco en el gráfico, no $0). */
  evolucion: Array<{ periodo: string; facturacion: number | null; tickets: number | null }>
  porSucursal: Array<{
    sucursalId: number | null
    sucursal: string
    facturacion: number
    unidades: number
    tickets: number
    ticketPromedio: number
  }>
  topProductosImporte: ProductoVendido[]
  topProductosUnidades: ProductoVendido[]
  categorias: Array<{ categoria: string; unidades: number; facturacion: number }>
  franjaHoraria: Array<{ hora: number; facturacion: number; tickets: number }>
  /** dia: 0 = lunes … 6 = domingo */
  diaSemana: Array<{ dia: number; facturacion: number; tickets: number; promedioPorJornada: number }>
  mediosPago: Array<{ medioPago: string; importe: number; operaciones: number }>
  canales: Array<{ canal: string; facturacion: number; tickets: number }>
}

export interface OperacionVenta {
  fuente: FuenteVentas
  fecha: string
  transaccionId: string
  fechaHora: string | null
  sucursalId: number | null
  sucursal: string | null
  localExterno: string | null
  total: number
  cobrado: number
  unidades: number
  mediosPago: string | null
  canal: string | null
  /** Serie-número del ticket/factura en HiOffice. */
  documento: string | null
  tipoDocumento: string | null
  vendedor: string | null
  caja: string | null
  anulada: boolean
  observada: boolean
}

export interface PaginacionVentas {
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

export interface LineaOperacionVenta {
  id: number
  tipoLinea: TipoLineaVenta
  productoCodigo: string | null
  productoNombre: string | null
  categoria: string | null
  cantidad: number
  precioUnitario: number | null
  importe: number
  descuento: number
  medioPago: string | null
  canal: string | null
  vendedor: string | null
  caja: string | null
  estadoOrigen: string | null
  anulada: boolean
  fechaHora: string | null
}

export interface EstadoIntegracionVentas {
  fuente: FuenteVentas
  nombre: string
  disponible: boolean
  /** Credenciales de la fuente cargadas en el servidor (BISTROSOFT_* / HIOPOS_*). */
  credenciales: boolean
  /** Lista para sincronizar (Hiopos además necesita el dashboard de exportación). */
  configurada: boolean
  syncAutomatica: boolean
  /** Trae solo lo modificado (filtro Fecha Modificado del dashboard). */
  incremental: boolean
  enCurso: boolean
  ultimaExitosa: string | null
  ultimoEstado: EstadoSincronizacionVentas | null
  localesSinAsignar: number
  alerta: string | null
}

export interface SincronizacionVentas {
  id: number
  fuente: FuenteVentas
  origen: OrigenSincronizacionVentas
  tipo: TipoSincronizacionVentas
  estado: EstadoSincronizacionVentas
  fechaDesde: string
  fechaHasta: string
  paginas: number
  recibidos: number
  importados: number
  observados: number
  rechazados: number
  reemplazados: number
  mensaje: string | null
  iniciadaAt: string
  finalizadaAt: string | null
  usuario: string | null
  /** Días que no estaban importados y días que ya estaban y se actualizaron. */
  diasNuevos: number
  diasActualizados: number
  /** Día que se está procesando (solo en curso). */
  proximoDia: string | null
  diasTotales: number
  /** null si falló y no se sabe hasta dónde llegó. */
  diasProcesados: number | null
}

export interface LocalExternoVentas {
  id: number
  fuente: FuenteVentas
  codigoExterno: string
  nombreExterno: string | null
  sucursalId: number | null
  sucursal: string | null
  /** automatica = vinculado por nombre; manual = lo eligió una persona; null = sin vincular. */
  asignacion: 'automatica' | 'manual' | null
  /** Sucursal más parecida, para confirmar con un clic cuando no hubo coincidencia exacta. */
  sugerencia: { id: number; nombre: string } | null
  ultimaVentaAt: string | null
}

/** Respuesta de /integraciones/procesar (sync bajo demanda). */
export interface ResultadoProcesoVentas {
  /** false si otra invocación ya estaba procesando. */
  ejecutada: boolean
  diasProcesados: number
  lineasImportadas: number
  quedanPendientes: boolean
}

export interface TramoFechas {
  desde: string
  hasta: string
  dias: number
}

/** Qué días de ventas hay importados. */
export interface CoberturaVentas {
  fuente: FuenteVentas
  /** Primer y último día importado (null si todavía no hay datos). */
  desde: string | null
  hasta: string | null
  diasImportados: number
  diasSinVentas: number
  ultimaActualizacion: string | null
  /** Huecos dentro del rango importado. */
  faltantes: TramoFechas[]
  diasFaltantes: number
  /** Días sin importar dentro del período consultado (panel/operaciones). */
  faltantesEnPeriodo: TramoFechas[]
  diasFaltantesEnPeriodo: number
}

// ─── Integración con Hiopos ──────────────────────────────────────────────────

export interface CampoMapeoHiopos {
  campo: string
  etiqueta: string
  ayuda: string
  requerido: boolean
}

export interface FiltroDashboardHiopos {
  attributeId: number
  arithmeticOperator: string
  type: string
}

export interface ColumnaDetectadaHiopos {
  nombre: string
  ejemplos: string[]
}

export interface ConfigHioposVentas {
  credenciales: boolean
  exportationId: string | null
  exportationIdOrigen: 'pantalla' | 'entorno' | null
  attrFechaModificado: number | null
  mapeo: Record<string, string>
  faltantesMapeo: string[]
  columnasDetectadas: ColumnaDetectadaHiopos[]
  filtrosDashboard: FiltroDashboardHiopos[]
  diasPorTramo: number
  watermark: string | null
  verificadoAt: string | null
  ultimoError: string | null
  campos: CampoMapeoHiopos[]
}

export interface DiagnosticoHiopos {
  ok: boolean
  pasos: Array<{ paso: string; ok: boolean; detalle: string }>
  servidor: string | null
  filtros: FiltroDashboardHiopos[]
  attrFechaModificadoSugerido: number | null
  filas: number
  columnas: ColumnaDetectadaHiopos[]
  mapeoUsado: Record<string, string>
  faltantesMapeo: string[]
  documentos: number
  rechazadas: Array<{ motivo: string; cantidad: number }>
  ejemplos: Array<{
    fecha: string
    fechaHora: string | null
    localNombre: string | null
    documento: string | null
    transaccionId: string
    tipoLinea: TipoLineaVenta
    productoNombre: string | null
    categoria: string | null
    cantidad: number
    importe: number
    medioPago: string | null
    vendedor: string | null
  }>
}

// ─── Constructor de reportes ─────────────────────────────────────────────────

export type DimensionReporte =
  | 'sucursal'
  | 'dia'
  | 'semana'
  | 'mes'
  | 'anio'
  | 'dia_semana'
  | 'hora'
  | 'producto'
  | 'categoria'
  | 'medio_pago'
  | 'canal'
  | 'vendedor'
  | 'caja'
  | 'tipo_documento'

export type MetricaReporte =
  | 'facturacion'
  | 'unidades'
  | 'tickets'
  | 'ticket_promedio'
  | 'descuentos'
  | 'precio_promedio'
  | 'unidades_por_ticket'
  | 'participacion'
  | 'promedio_diario'

export type ComparacionReporte = 'ninguna' | 'periodo_anterior' | 'anio_anterior'

export type PeriodoRelativoReporte =
  | 'hoy'
  | 'ayer'
  | 'ultimos_7'
  | 'ultimos_30'
  | 'semana_actual'
  | 'semana_anterior'
  | 'mes_actual'
  | 'mes_anterior'
  | 'anio_actual'

export interface FiltrosReporteVentas {
  sucursal_ids?: number[]
  categoria?: string
  medio_pago?: string
  canal?: string
  producto?: string
  vendedor?: string
  caja?: string
}

export interface ConfigReporteVentas {
  dimensiones: DimensionReporte[]
  metricas: MetricaReporte[]
  comparacion: ComparacionReporte
  orden: { campo: string; direccion: 'asc' | 'desc' }
  limite: number
  periodo: { tipo: 'relativo'; clave: PeriodoRelativoReporte } | { tipo: 'fijo'; desde: string; hasta: string }
  filtros: FiltrosReporteVentas
}

export interface ColumnaReporteVentas {
  clave: string
  etiqueta: string
  tipo: 'dimension' | 'moneda' | 'numero' | 'porcentaje'
}

export interface FilaReporteVentas {
  dimensiones: Record<string, string>
  valores: Record<string, number | null>
  comparado?: Record<string, number | null>
  variacion?: Record<string, number | null>
}

export interface ResultadoReporteVentas {
  columnas: ColumnaReporteVentas[]
  filas: FilaReporteVentas[]
  totales: Record<string, number | null>
  totalesComparados: Record<string, number | null> | null
  variacionTotales: Record<string, number | null> | null
  periodo: { desde: string; hasta: string }
  periodoComparado: { desde: string; hasta: string } | null
  truncado: boolean
  avisos: string[]
}

export interface ReporteGuardadoVentas {
  id: number
  nombre: string
  descripcion: string | null
  config: ConfigReporteVentas
  compartido: boolean
  propio: boolean
  autor: string | null
  actualizadoAt: string
}

export type FrecuenciaEnvioVentas = 'diaria' | 'semanal' | 'mensual'

export interface ReporteProgramadoVentas {
  id: number
  nombre: string
  frecuencia: FrecuenciaEnvioVentas
  diaSemana: number | null
  hora: number
  destinatarios: string[]
  sucursalIds: number[] | null
  reporteGuardadoId: number | null
  reporteNombre: string | null
  activo: boolean
  ultimoEnvioAt: string | null
  ultimoPeriodo: string | null
  ultimoError: string | null
  proximoPeriodo: string
}

// ─── Análisis ────────────────────────────────────────────────────────────────

export type ClaseAbc = 'A' | 'B' | 'C'

export interface ProductoAnalizado {
  producto: string
  codigo: string | null
  categoria: string | null
  facturacion: number
  unidades: number
  tickets: number
  sucursales: number
  precioPromedio: number | null
  participacion: number
  acumulado: number
  clase: ClaseAbc
  penetracion: number | null
  facturacionAnterior: number
  unidadesAnterior: number
  variacionFacturacion: number | null
  variacionUnidades: number | null
}

export interface AnalisisProductosVentas {
  periodo: { desde: string; hasta: string }
  periodoAnterior: { desde: string; hasta: string }
  resumen: {
    productos: number
    facturacion: number
    ticketsTotales: number
    clases: Array<{ clase: ClaseAbc; productos: number; facturacion: number; participacion: number }>
  }
  productos: ProductoAnalizado[]
  enAlza: ProductoAnalizado[]
  enBaja: ProductoAnalizado[]
  nuevos: ProductoAnalizado[]
  sinVentas: Array<{
    producto: string
    categoria: string | null
    unidadesAnterior: number
    facturacionAnterior: number
  }>
  truncado: boolean
}

export interface CeldaMapaCalor {
  /** 0 = lunes … 6 = domingo */
  dia: number
  hora: number
  facturacion: number
  tickets: number
  unidades: number
  promedioFacturacion: number
  promedioTickets: number
}

export interface MapaCalorVentas {
  periodo: { desde: string; hasta: string }
  jornadas: number[]
  celdas: CeldaMapaCalor[]
  porHora: Array<{ hora: number; facturacion: number; tickets: number }>
  pico: CeldaMapaCalor | null
  horaPico: number | null
  sinHora: boolean
}

export interface DesempenioVentas {
  nombre: string
  sucursales: string | null
  facturacion: number
  participacion: number
  tickets: number
  ticketPromedio: number
  unidades: number
  unidadesPorTicket: number
  descuentos: number
  porcentajeDescuento: number
  jornadas: number
  promedioDiario: number
  anuladas: { tickets: number; importe: number }
}

export interface AnalisisVendedoresVentas {
  periodo: { desde: string; hasta: string }
  vendedoresDisponibles: boolean
  cajasDisponibles: boolean
  vendedores: DesempenioVentas[]
  cajas: DesempenioVentas[]
}
