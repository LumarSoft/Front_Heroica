import type { BorradorCorteBalance, ResultadoCorteBalance, SeccionCalculada } from '@/lib/types'

export const ID_SECCION_OTROS = 'otros-egresos'

/**
 * Secciones de egresos tal como salen en el PPTX/Excel: con el detalle editado
 * para el mes, sin líneas en $0 si así se eligió y, opcionalmente, con una
 * sección "Otros egresos" armada con lo que quedó sin clasificar.
 */
export function seccionesParaExportar(
  resultado: ResultadoCorteBalance,
  borrador: BorradorCorteBalance,
): SeccionCalculada[] {
  const { ocultarLineasEnCero, incluirSinClasificar } = borrador.opciones

  const secciones = resultado.secciones.map(s => ({
    ...s,
    detalle: borrador.detalles[s.id] ?? s.detalle,
    lineas: ocultarLineasEnCero ? s.lineas.filter(l => l.importe !== 0) : s.lineas,
  }))

  if (incluirSinClasificar && resultado.sinClasificar.length > 0) {
    secciones.push({
      id: ID_SECCION_OTROS,
      nombre: 'Otros egresos',
      detalle: borrador.detalles[ID_SECCION_OTROS] ?? '',
      tipoCosto: 'fijo',
      total: resultado.totalSinClasificar,
      lineas: resultado.sinClasificar.map(g => ({
        id: `${ID_SECCION_OTROS}--${g.clave}`,
        nombre: g.etiqueta,
        automatico: g.total,
        importe: g.total,
        ajustada: false,
        nota: '',
        movimientos: g.movimientos,
      })),
    })
  }

  return secciones.filter(s => s.lineas.length > 0 || s.total !== 0)
}
