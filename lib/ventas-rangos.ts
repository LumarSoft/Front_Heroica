import { toDateOnly } from './downloadBlob'
import type { CoberturaVentas } from './types-ventas'

export interface RangoRapido {
  id: string
  label: string
  desde: string
  hasta: string
}

/** Segundos aproximados por día: Hiopos exporta varios días por consulta. */
const SEGUNDOS_POR_DIA = 2

function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d
}

/** Atajos para elegir qué traer de Hiopos. */
export function rangosRapidos(cobertura: CoberturaVentas | null): RangoRapido[] {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const finMesAnterior = sumarDias(inicioMes, -1)

  const rangos: RangoRapido[] = []
  if (cobertura?.faltantes.length) {
    const primero = cobertura.faltantes[0]
    const ultimo = cobertura.faltantes[cobertura.faltantes.length - 1]
    rangos.push({ id: 'faltantes', label: 'Completar días faltantes', desde: primero.desde, hasta: ultimo.hasta })
  }
  if (cobertura?.hasta && cobertura.hasta < toDateOnly(hoy)) {
    const siguiente = new Date(`${cobertura.hasta}T12:00:00`)
    rangos.push({
      id: 'ponerse-al-dia',
      label: 'Ponerse al día',
      desde: toDateOnly(sumarDias(siguiente, 1)),
      hasta: toDateOnly(hoy),
    })
  }
  rangos.push(
    { id: 'ayer-hoy', label: 'Ayer y hoy', desde: toDateOnly(sumarDias(hoy, -1)), hasta: toDateOnly(hoy) },
    { id: '7-dias', label: 'Últimos 7 días', desde: toDateOnly(sumarDias(hoy, -6)), hasta: toDateOnly(hoy) },
    { id: 'este-mes', label: 'Este mes', desde: toDateOnly(inicioMes), hasta: toDateOnly(hoy) },
    {
      id: 'mes-anterior',
      label: 'Mes anterior',
      desde: toDateOnly(inicioMesAnterior),
      hasta: toDateOnly(finMesAnterior),
    },
    { id: '3-meses', label: 'Últimos 3 meses', desde: toDateOnly(sumarDias(hoy, -89)), hasta: toDateOnly(hoy) },
  )
  return rangos
}

export function cantidadDias(desde: string, hasta: string): number {
  if (!desde || !hasta || desde > hasta) return 0
  return Math.round((Date.parse(`${hasta}T12:00:00`) - Date.parse(`${desde}T12:00:00`)) / 86_400_000) + 1
}

/** "menos de 1 minuto", "unos 3 minutos", "cerca de 1 h 10 min". */
export function tiempoEstimado(dias: number): string {
  const minutos = Math.ceil((dias * SEGUNDOS_POR_DIA) / 60)
  if (minutos <= 1) return 'menos de 1 minuto'
  if (minutos < 60) return `unos ${minutos} minutos`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `cerca de ${h} h${m ? ` ${m} min` : ''}`
}

function superposicion(a: string, b: string, c: string, d: string): number {
  const desde = a > c ? a : c
  const hasta = b < d ? b : d
  return cantidadDias(desde, hasta)
}

/** Cuántos días del rango ya están importados, según la cobertura. */
export function diasYaImportados(cobertura: CoberturaVentas | null, desde: string, hasta: string): number {
  if (!cobertura?.desde || !cobertura.hasta) return 0
  const dentro = superposicion(desde, hasta, cobertura.desde, cobertura.hasta)
  const huecos = cobertura.faltantes.reduce((acc, t) => acc + superposicion(desde, hasta, t.desde, t.hasta), 0)
  return Math.max(dentro - huecos, 0)
}

/** Atajos de período para los filtros del panel. */
export function periodosRapidos(): RangoRapido[] {
  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  return [
    { id: 'hoy', label: 'Hoy', desde: toDateOnly(hoy), hasta: toDateOnly(hoy) },
    { id: 'ayer', label: 'Ayer', desde: toDateOnly(sumarDias(hoy, -1)), hasta: toDateOnly(sumarDias(hoy, -1)) },
    { id: '7-dias', label: '7 días', desde: toDateOnly(sumarDias(hoy, -6)), hasta: toDateOnly(hoy) },
    { id: '30-dias', label: '30 días', desde: toDateOnly(sumarDias(hoy, -29)), hasta: toDateOnly(hoy) },
    { id: 'este-mes', label: 'Este mes', desde: toDateOnly(inicioMes), hasta: toDateOnly(hoy) },
    {
      id: 'mes-anterior',
      label: 'Mes anterior',
      desde: toDateOnly(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
      hasta: toDateOnly(sumarDias(inicioMes, -1)),
    },
  ]
}

/** Link a Integraciones con el diálogo de importación abierto en ese rango. */
export function urlTraerDias(desde: string, hasta: string): string {
  return `/ventas/integraciones?${new URLSearchParams({ traer_desde: desde, traer_hasta: hasta }).toString()}`
}
