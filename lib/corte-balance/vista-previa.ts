import type { CSSProperties } from 'react'
import type { CajaModelo } from '@/lib/types'
import { ALTO, ANCHO } from '@/lib/corte-balance/modelo/primitivas'

/*
 * Conversión de las coordenadas del modelo (pulgadas, puntos) a CSS para la
 * vista previa. El contenedor de la diapositiva es un container query
 * (`@container`), así que 100cqw = ancho de la diapositiva y todo escala junto.
 */

/** Pulgadas → unidades cqw. */
export const pulgadas = (n: number) => `${(n / ANCHO) * 100}cqw`

/** Puntos tipográficos → unidades cqw (1 pt = 1/72 in). */
export const puntos = (n: number) => pulgadas(n / 72)

export const color = (hex: string) => `#${hex}`

/** La fuente elegida puede no estar instalada: se cae a una sans-serif, como hacen PowerPoint y Canva. */
export const familia = (fuente: string) => `"${fuente}", ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`

export function estiloCaja(caja: CajaModelo): CSSProperties {
  return {
    position: 'absolute',
    left: `${(caja.x / ANCHO) * 100}%`,
    top: `${(caja.y / ALTO) * 100}%`,
    width: `${(caja.w / ANCHO) * 100}%`,
    height: `${(caja.h / ALTO) * 100}%`,
  }
}
