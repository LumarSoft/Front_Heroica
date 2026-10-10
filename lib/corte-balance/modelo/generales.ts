import { ALTO, ANCHO, borde, encabezado, forma, texto, type Tema } from '@/lib/corte-balance/modelo/primitivas'
import type { DiapositivaModelo, OpcionesCorteBalance } from '@/lib/types'

export function portada(tema: Tema, opciones: OpcionesCorteBalance): DiapositivaModelo {
  const franjas: [number, string][] = [
    [8.4, tema.claro],
    [10.0, tema.medio],
    [11.6, tema.oscuro],
  ]
  const base = { color: tema.color }
  return {
    id: 'portada',
    nombre: 'Portada',
    elementos: [
      ...franjas.map(([x, color]) => forma({ x, y: 0, w: ANCHO - x + 0.6, h: ALTO }, color, 0.6)),
      forma({ x: -0.8, y: 0, w: 9.8, h: ALTO }, 'FFFFFF', 0.6),
      texto({ x: 0.55, y: 1.6, w: 8.0, h: 2.8 }, opciones.titulo, {
        ...base,
        tamano: 54,
        negrita: true,
        vertical: 'middle',
      }),
      texto({ x: 1.7, y: 4.85, w: 6.5, h: 0.45 }, opciones.subtitulo, { ...base, tamano: 20, negrita: true }),
      texto({ x: 1.7, y: 5.3, w: 6.5, h: 0.45 }, opciones.periodo, { ...base, tamano: 20 }),
    ],
  }
}

export function separador(tema: Tema, titulo: string, id: string): DiapositivaModelo {
  return {
    id,
    nombre: titulo,
    elementos: [
      borde(tema),
      texto({ x: 0.8, y: 2.5, w: 11, h: 2.4 }, titulo, {
        tamano: 60,
        negrita: true,
        color: tema.color,
        vertical: 'middle',
      }),
    ],
  }
}

export function indice(tema: Tema, capitulos: string[]): DiapositivaModelo {
  const lista = capitulos.map((c, i) => `${String(i + 1).padStart(2, '0')} - ${c}`).join('\n\n')
  return {
    id: 'indice',
    nombre: 'Contenidos',
    elementos: [
      ...encabezado(tema, 'Contenidos', ''),
      texto({ x: 0.9, y: 1.7, w: 10, h: 5 }, lista, { tamano: 24, color: tema.color, vertical: 'top' }),
    ],
  }
}

export function cierre(tema: Tema, opciones: OpcionesCorteBalance): DiapositivaModelo {
  const base = { color: tema.color, alineacion: 'center' as const }
  return {
    id: 'cierre',
    nombre: 'Cierre',
    elementos: [
      borde(tema),
      texto({ x: 1, y: 2.4, w: 11.3, h: 1.6 }, opciones.textoCierre, { ...base, tamano: 64, negrita: true }),
      texto({ x: 1, y: 4.1, w: 11.3, h: 0.6 }, opciones.firmaCierre, { ...base, tamano: 22 }),
    ],
  }
}
