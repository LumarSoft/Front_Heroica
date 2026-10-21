// Período contable de un movimiento: el mes al que corresponde, independiente de su fecha.
// Viaja con la API como 'YYYY-MM' y en pantalla se muestra como MM/AA.

export interface PeriodoOption {
  value: string
  label: string
}

export function periodoDeFecha(fecha: string): string {
  return fecha.slice(0, 7)
}

export function formatPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-')
  return anio && mes ? `${mes}/${anio.slice(2)}` : periodo
}

/**
 * Meses del año anterior y del año en curso, en orden cronológico. El año anterior está para
 * poder imputar en enero algo de diciembre. Si el período del movimiento queda fuera de ese
 * rango (un movimiento viejo), se agrega para no perderlo al editar.
 */
export function opcionesPeriodo(periodoActual?: string): PeriodoOption[] {
  const anioActual = new Date().getFullYear()
  const valores: string[] = []
  for (let anio = anioActual - 1; anio <= anioActual; anio++) {
    for (let mes = 1; mes <= 12; mes++) valores.push(`${anio}-${String(mes).padStart(2, '0')}`)
  }
  if (periodoActual && !valores.includes(periodoActual)) {
    valores.push(periodoActual)
    valores.sort()
  }
  return valores.map(value => ({ value, label: formatPeriodo(value) }))
}

/** Al cambiar la fecha, el período la acompaña mientras el usuario no haya elegido otro mes. */
export function periodoAlCambiarFecha(periodo: string, fechaAnterior: string, fechaNueva: string): string {
  if (!fechaNueva) return periodo
  return !periodo || periodo === periodoDeFecha(fechaAnterior) ? periodoDeFecha(fechaNueva) : periodo
}
