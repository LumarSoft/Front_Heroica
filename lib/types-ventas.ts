// Tipos del módulo de Ventas (panel gerencial + integraciones Bistrosoft/Hiopos).

export type FuenteVentas = 'bistrosoft' | 'hiopos'
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
}

export interface OpcionesFiltrosVentas {
  sucursales: Array<{ id: number; nombre: string }>
  categorias: string[]
  mediosPago: string[]
  canales: string[]
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
  estadoOrigen: string | null
  anulada: boolean
  fechaHora: string | null
}

export interface EstadoIntegracionVentas {
  fuente: FuenteVentas
  nombre: string
  disponible: boolean
  configurada: boolean
  syncAutomatica: boolean
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
