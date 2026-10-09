import { formatCantidad, formatMonto } from './formatters'
import type {
  ColumnaReporteVentas,
  ConfigReporteVentas,
  DimensionReporte,
  MetricaReporte,
  PeriodoRelativoReporte,
} from './types-ventas'

export const DIMENSIONES_REPORTE: Array<{
  clave: DimensionReporte
  etiqueta: string
  grupo: 'Tiempo' | 'Dónde y quién' | 'Qué' | 'Cómo'
  soloPago?: boolean
  deProducto?: boolean
}> = [
  { clave: 'dia', etiqueta: 'Día', grupo: 'Tiempo' },
  { clave: 'semana', etiqueta: 'Semana', grupo: 'Tiempo' },
  { clave: 'mes', etiqueta: 'Mes', grupo: 'Tiempo' },
  { clave: 'anio', etiqueta: 'Año', grupo: 'Tiempo' },
  { clave: 'dia_semana', etiqueta: 'Día de la semana', grupo: 'Tiempo' },
  { clave: 'hora', etiqueta: 'Hora', grupo: 'Tiempo' },
  { clave: 'sucursal', etiqueta: 'Sucursal', grupo: 'Dónde y quién' },
  { clave: 'vendedor', etiqueta: 'Vendedor', grupo: 'Dónde y quién' },
  { clave: 'caja', etiqueta: 'Caja', grupo: 'Dónde y quién' },
  { clave: 'producto', etiqueta: 'Producto', grupo: 'Qué', deProducto: true },
  { clave: 'categoria', etiqueta: 'Familia', grupo: 'Qué', deProducto: true },
  { clave: 'medio_pago', etiqueta: 'Medio de pago', grupo: 'Cómo', soloPago: true },
  { clave: 'canal', etiqueta: 'Canal', grupo: 'Cómo' },
  { clave: 'tipo_documento', etiqueta: 'Tipo de documento', grupo: 'Cómo' },
]

export const METRICAS_REPORTE: Array<{ clave: MetricaReporte; etiqueta: string; ayuda: string; deProducto?: boolean }> =
  [
    { clave: 'facturacion', etiqueta: 'Facturación', ayuda: 'Total vendido (neto de descuentos).' },
    { clave: 'tickets', etiqueta: 'Tickets', ayuda: 'Cantidad de ventas.' },
    { clave: 'ticket_promedio', etiqueta: 'Ticket promedio', ayuda: 'Facturación / tickets.' },
    { clave: 'unidades', etiqueta: 'Unidades', ayuda: 'Productos vendidos.', deProducto: true },
    {
      clave: 'unidades_por_ticket',
      etiqueta: 'Unidades por ticket',
      ayuda: 'Cuántos productos lleva cada venta.',
      deProducto: true,
    },
    { clave: 'precio_promedio', etiqueta: 'Precio promedio', ayuda: 'Facturación / unidades.', deProducto: true },
    { clave: 'descuentos', etiqueta: 'Descuentos', ayuda: 'Importe descontado.', deProducto: true },
    { clave: 'participacion', etiqueta: '% del total', ayuda: 'Parte de la facturación total.' },
    { clave: 'promedio_diario', etiqueta: 'Promedio por día', ayuda: 'Facturación / días con ventas.' },
  ]

export const PERIODOS_REPORTE: Array<{ clave: PeriodoRelativoReporte; etiqueta: string }> = [
  { clave: 'hoy', etiqueta: 'Hoy' },
  { clave: 'ayer', etiqueta: 'Ayer' },
  { clave: 'ultimos_7', etiqueta: 'Últimos 7 días' },
  { clave: 'ultimos_30', etiqueta: 'Últimos 30 días' },
  { clave: 'semana_actual', etiqueta: 'Esta semana' },
  { clave: 'semana_anterior', etiqueta: 'Semana pasada' },
  { clave: 'mes_actual', etiqueta: 'Este mes' },
  { clave: 'mes_anterior', etiqueta: 'Mes pasado' },
  { clave: 'anio_actual', etiqueta: 'Este año' },
]

export const CONFIG_INICIAL: ConfigReporteVentas = {
  dimensiones: ['sucursal'],
  metricas: ['facturacion', 'tickets', 'ticket_promedio', 'participacion'],
  comparacion: 'periodo_anterior',
  orden: { campo: 'facturacion', direccion: 'desc' },
  limite: 500,
  periodo: { tipo: 'relativo', clave: 'ultimos_30' },
  filtros: {},
}

/** Reportes listos para usar: un clic y se arma. */
export const PLANTILLAS_REPORTE: Array<{
  id: string
  nombre: string
  descripcion: string
  config: Partial<ConfigReporteVentas>
}> = [
  {
    id: 'sucursales',
    nombre: 'Ranking de sucursales',
    descripcion: 'Quién vende más y cómo viene contra el período anterior.',
    config: {
      dimensiones: ['sucursal'],
      metricas: ['facturacion', 'tickets', 'ticket_promedio', 'participacion'],
      comparacion: 'periodo_anterior',
    },
  },
  {
    id: 'sucursal-mes',
    nombre: 'Evolución mensual por sucursal',
    descripcion: 'Facturación de cada sucursal mes a mes.',
    config: {
      dimensiones: ['mes', 'sucursal'],
      metricas: ['facturacion', 'tickets', 'ticket_promedio'],
      comparacion: 'ninguna',
      periodo: { tipo: 'relativo', clave: 'anio_actual' },
      orden: { campo: 'mes', direccion: 'asc' },
    },
  },
  {
    id: 'familias-sucursal',
    nombre: 'Familias por sucursal',
    descripcion: 'Qué se vende en cada local: panadería, cafetería, pastelería…',
    config: {
      dimensiones: ['sucursal', 'categoria'],
      metricas: ['facturacion', 'unidades', 'participacion'],
      comparacion: 'periodo_anterior',
    },
  },
  {
    id: 'top-productos',
    nombre: 'Top productos',
    descripcion: 'Los 50 productos que más facturan, con precio promedio.',
    config: {
      dimensiones: ['producto'],
      metricas: ['facturacion', 'unidades', 'precio_promedio', 'participacion'],
      comparacion: 'periodo_anterior',
      limite: 50,
    },
  },
  {
    id: 'medios-pago',
    nombre: 'Medios de pago por sucursal',
    descripcion: 'Efectivo, tarjetas y billeteras en cada local (útil para arqueos).',
    config: {
      dimensiones: ['sucursal', 'medio_pago'],
      metricas: ['facturacion', 'tickets', 'participacion'],
      comparacion: 'ninguna',
    },
  },
  {
    id: 'vendedores',
    nombre: 'Ranking de vendedores',
    descripcion: 'Facturación, ticket promedio y venta sugerida por vendedor.',
    config: {
      dimensiones: ['vendedor'],
      metricas: ['facturacion', 'tickets', 'ticket_promedio', 'unidades_por_ticket', 'promedio_diario'],
      comparacion: 'periodo_anterior',
    },
  },
  {
    id: 'franjas',
    nombre: 'Ventas por franja horaria',
    descripcion: 'Cuánto se vende en cada hora del día, en promedio.',
    config: {
      dimensiones: ['hora'],
      metricas: ['facturacion', 'tickets', 'promedio_diario', 'participacion'],
      comparacion: 'periodo_anterior',
      orden: { campo: 'hora', direccion: 'asc' },
    },
  },
  {
    id: 'diario',
    nombre: 'Cierre diario por sucursal',
    descripcion: 'Una fila por día y sucursal: ideal para controlar con los arqueos.',
    config: {
      dimensiones: ['dia', 'sucursal'],
      metricas: ['facturacion', 'tickets', 'ticket_promedio'],
      comparacion: 'ninguna',
      periodo: { tipo: 'relativo', clave: 'mes_actual' },
      orden: { campo: 'dia', direccion: 'desc' },
    },
  },
]

export function aplicarPlantilla(
  base: ConfigReporteVentas,
  plantilla: Partial<ConfigReporteVentas>,
): ConfigReporteVentas {
  const dimensiones = plantilla.dimensiones ?? base.dimensiones
  const metricas = plantilla.metricas ?? base.metricas
  return {
    ...base,
    ...plantilla,
    dimensiones,
    metricas,
    orden: plantilla.orden ?? { campo: metricas[0], direccion: 'desc' },
    limite: plantilla.limite ?? 500,
    periodo: plantilla.periodo ?? base.periodo,
    filtros: base.filtros,
  }
}

export function formatValorReporte(tipo: ColumnaReporteVentas['tipo'], valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  if (tipo === 'moneda') return formatMonto(valor)
  if (tipo === 'porcentaje') return `${valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`
  return formatCantidad(valor, 2)
}

/** Etiqueta legible de un valor de dimensión (fechas en formato local). */
export function formatDimension(clave: string, valor: string): string {
  if ((clave === 'dia' || clave === 'semana') && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split('-')
    return clave === 'semana' ? `Semana del ${d}/${m}/${a}` : `${d}/${m}/${a}`
  }
  if (clave === 'mes' && /^\d{4}-\d{2}$/.test(valor)) {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]
    return `${meses[Number(valor.slice(5)) - 1]} ${valor.slice(0, 4)}`
  }
  return valor
}
