export interface DeudaInterSucursal {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  sucursal_relacionada_nombre?: string
  fecha: string
  descripcion: string | null
  monto: number
  comentarios?: string
  tipo: 'ingreso' | 'egreso'
  moneda?: 'ARS' | 'USD'
}

export interface DeudaAgrupada {
  sucursal: string
  esTercero: boolean
  moneda: 'ARS' | 'USD'
  aCobrar: number
  aPagar: number
  balance: number
  movimientos: DeudaInterSucursal[]
}

/** Préstamo: crédito que esta sucursal otorgó (nos deben). Deuda: lo que esta sucursal debe, a otra sucursal o a un tercero. */
export type FiltroTipoDeuda = 'todos' | 'deudas' | 'prestamos'

export const FILTRO_SUCURSAL_TODAS = '__todas__'
export const FILTRO_SUCURSAL_TERCEROS = '__terceros__'
export const ETIQUETA_TERCEROS = 'Terceros'

export interface FiltrosDeudas {
  tipo: FiltroTipoDeuda
  sucursal: string
}

function sucursalDesdeComentarios(deuda: DeudaInterSucursal): string | undefined {
  const comentarios = deuda.comentarios ?? ''
  const relacion = comentarios.match(/Deuda entre sucursales:\s*(.+?)\s*→\s*(.+?)(?:\.|$)/i)
  if (relacion) {
    const origen = relacion[1].trim()
    const destino = relacion[2].trim()
    return origen === deuda.sucursal_nombre ? destino : origen
  }

  const referencia = comentarios.match(/(?:hacia|recibida de|desde|consumo \(egreso\) a)\s+(.+?)(?:\.|$)/i)
  return referencia?.[1].trim()
}

/** Sucursal contraparte de la deuda, o undefined si es con un tercero. */
export function sucursalRelacionada(deuda: DeudaInterSucursal): string | undefined {
  return deuda.sucursal_relacionada_nombre || sucursalDesdeComentarios(deuda)
}

export function esPrestamo(deuda: DeudaInterSucursal): boolean {
  return deuda.tipo === 'ingreso'
}

export function sucursalesRelacionadas(deudas: DeudaInterSucursal[]): string[] {
  const nombres = new Set<string>()
  for (const deuda of deudas) {
    const sucursal = sucursalRelacionada(deuda)
    if (sucursal) nombres.add(sucursal)
  }
  return Array.from(nombres).sort((a, b) => a.localeCompare(b, 'es'))
}

export function hayDeudasConTerceros(deudas: DeudaInterSucursal[]): boolean {
  return deudas.some(deuda => !sucursalRelacionada(deuda))
}

export function filtrarDeudas(deudas: DeudaInterSucursal[], filtros: FiltrosDeudas): DeudaInterSucursal[] {
  return deudas.filter(deuda => {
    if (filtros.tipo === 'prestamos' && !esPrestamo(deuda)) return false
    if (filtros.tipo === 'deudas' && esPrestamo(deuda)) return false

    if (filtros.sucursal === FILTRO_SUCURSAL_TODAS) return true
    const sucursal = sucursalRelacionada(deuda)
    if (filtros.sucursal === FILTRO_SUCURSAL_TERCEROS) return !sucursal
    return sucursal === filtros.sucursal
  })
}

export function agruparDeudas(deudas: DeudaInterSucursal[]): DeudaAgrupada[] {
  const grupos = new Map<string, DeudaAgrupada>()
  for (const deuda of deudas) {
    const relacionada = sucursalRelacionada(deuda)
    const sucursal = relacionada ?? ETIQUETA_TERCEROS
    const moneda = deuda.moneda ?? 'ARS'
    const key = `${relacionada ? 'suc' : 'ter'}-${sucursal}-${moneda}`
    const grupo = grupos.get(key) ?? {
      sucursal,
      esTercero: !relacionada,
      moneda,
      aCobrar: 0,
      aPagar: 0,
      balance: 0,
      movimientos: [],
    }
    const monto = Math.abs(Number(deuda.monto))
    if (esPrestamo(deuda)) grupo.aCobrar += monto
    else grupo.aPagar += monto
    grupo.balance = grupo.aCobrar - grupo.aPagar
    grupo.movimientos.push(deuda)
    grupos.set(key, grupo)
  }
  return Array.from(grupos.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
}
