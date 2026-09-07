export interface DeudaInterSucursal {
  id: number
  sucursal_id: number
  sucursal_nombre: string
  sucursal_relacionada_nombre?: string
  fecha: string
  concepto: string
  monto: number
  comentarios?: string
  tipo: 'ingreso' | 'egreso'
  moneda?: 'ARS' | 'USD'
}

export interface DeudaAgrupada {
  sucursal: string
  moneda: 'ARS' | 'USD'
  aCobrar: number
  aPagar: number
  balance: number
  movimientos: DeudaInterSucursal[]
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

export function agruparDeudas(deudas: DeudaInterSucursal[]): DeudaAgrupada[] {
  const grupos = new Map<string, DeudaAgrupada>()
  for (const deuda of deudas) {
    const sucursal = deuda.sucursal_relacionada_nombre || sucursalDesdeComentarios(deuda)
    if (!sucursal) continue
    const moneda = deuda.moneda ?? 'ARS'
    const key = `${sucursal}-${moneda}`
    const grupo = grupos.get(key) ?? { sucursal, moneda, aCobrar: 0, aPagar: 0, balance: 0, movimientos: [] }
    const monto = Math.abs(Number(deuda.monto))
    if (deuda.tipo === 'ingreso') grupo.aCobrar += monto
    else grupo.aPagar += monto
    grupo.balance = grupo.aCobrar - grupo.aPagar
    grupo.movimientos.push(deuda)
    grupos.set(key, grupo)
  }
  return Array.from(grupos.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
}
