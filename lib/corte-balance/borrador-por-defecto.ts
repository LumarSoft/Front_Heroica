import type {
  AnexoManual,
  BorradorCorteBalance,
  DiapositivaReporte,
  FilaReporte,
  FormatoValorReporte,
  OpcionesCorteBalance,
  TablaReporte,
} from '@/lib/types'

/**
 * Contenido inicial de las partes que se cargan a mano, con la misma estructura
 * que el Corte de balance de Julio 2026 hecho en Canva. Todo es editable:
 * se pueden renombrar, agregar o quitar diapositivas, tablas y filas.
 */

export const COLOR_PRINCIPAL_POR_DEFECTO = '#1B3D8F'

/** Fila que se completa sola con la línea de egresos indicada si queda vacía. */
export const ID_FILA_VENTAS_TOTALES = 'ingresos-ventas-total'

export function nuevoId(prefijo: string): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
}

const fila = (etiqueta: string, formato: FormatoValorReporte, lineasVinculadas?: string[]): FilaReporte => ({
  id: nuevoId('fila'),
  etiqueta,
  formato,
  valor: '',
  ...(lineasVinculadas ? { lineasVinculadas } : {}),
})

const tabla = (titulo: string, formato: FormatoValorReporte, etiquetas: string[]): TablaReporte => ({
  id: nuevoId('tabla'),
  titulo,
  filas: etiquetas.map(e => fila(e, formato)),
})

const tablaMixta = (titulo: string, filas: [string, FormatoValorReporte][]): TablaReporte => ({
  id: nuevoId('tabla'),
  titulo,
  filas: filas.map(([etiqueta, formato]) => fila(etiqueta, formato)),
})

const diapositiva = (subtitulo: string, tablas: TablaReporte[], texto = ''): DiapositivaReporte => ({
  id: nuevoId('dia'),
  subtitulo,
  texto,
  incluir: true,
  tablas,
})

const SEMANAS = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']

function anexoIngresos(): AnexoManual {
  const ventas = tabla('Ventas', 'moneda', ['Ventas Totales', 'Máximo diario', 'Mínimo diario', 'Promedio diario'])
  ventas.filas[0].id = ID_FILA_VENTAS_TOTALES
  return {
    clave: 'ingresos',
    titulo: 'Anexo Ingresos',
    incluir: true,
    diapositivas: [
      diapositiva('Ventas', [
        ventas,
        tabla('Facturación', 'moneda', ['Facturado', 'Comandado', 'IVA a pagar']),
        tabla('', 'porcentaje', ['% Facturado', '% Comandado']),
      ]),
      diapositiva('Ventas por forma de pago', [tabla('', 'moneda', ['Efectivo', 'QR', 'Tarjetas', 'Pedidos Ya'])]),
      diapositiva('Comportamiento semanal', [tabla('Ventas', 'moneda', SEMANAS)]),
      diapositiva('Cantidad de TKT', [
        tabla('TKT', 'numero', ['TKT totales', 'Máximo diario', 'Mínimo diario', 'Promedio diario']),
      ]),
      diapositiva('Comportamiento semanal de TKT', [
        tabla('TKT', 'numero', SEMANAS),
        tabla('% de variación semanal', 'porcentaje', SEMANAS.slice(1)),
      ]),
      diapositiva('TKT promedio', [
        tabla('TKT promedio', 'moneda', SEMANAS),
        tabla('Variación nominal semanal', 'moneda', SEMANAS.slice(1)),
        tabla('', 'moneda', ['TKT promedio mensual']),
      ]),
    ],
  }
}

function anexoRrhh(): AnexoManual {
  const vinculo = (sufijo: string) => [`sueldos--${sufijo}`]
  return {
    clave: 'rrhh',
    titulo: 'Anexo Recursos Humanos',
    incluir: true,
    diapositivas: [
      diapositiva('Resumen mensual', [], ''),
      diapositiva('Dotación', [tabla('', 'numero', ['Dotación Total', 'Salón', 'Cocina', 'Pastelería / Laminados'])]),
      diapositiva('Escala Salarial', [
        tabla('', 'moneda', [
          'Runner / Recepción',
          'Limpieza',
          'Caja',
          'Barista',
          'Cocina',
          'Laminador Junior',
          'Panadería',
          'Pastelero Junior',
        ]),
      ]),
      diapositiva('Distribución de la dotación', [
        tabla('Salón', 'numero', ['Caja', 'Franqueros Caja', 'Runners', 'Limpieza', 'Gerente de Salón']),
        tabla('Cocina', 'numero', ['Cocineros', 'Cocinero Referente', 'Gerente de Cocina']),
        tabla('Pastelería / Laminados', 'numero', [
          'Pastelera/Laminadora',
          'Gerente de Panadería',
          'Gerente de Pastelería',
        ]),
      ]),
      diapositiva(
        'Feriados',
        [
          tablaMixta('', [
            ['Colaboradores que trabajaron 2 feriados', 'numero'],
            ['Colaboradores que trabajaron 1 feriado', 'numero'],
            ['Colaboradores que trabajaron 0 feriados', 'numero'],
            ['Costo laboral', 'moneda'],
          ]),
        ],
        'Durante el período se presentaron … feriados:',
      ),
      diapositiva('Horas extras e incentivos', [
        tablaMixta('Horas extras', [
          ['Cantidad total de horas', 'numero'],
          ['Costo laboral', 'moneda'],
        ]),
        tablaMixta('Incentivos', [
          ['Incentivo', 'texto'],
          ['Cumplimiento', 'texto'],
          ['% de cumplimiento', 'porcentaje'],
          ['Costo laboral', 'moneda'],
        ]),
      ]),
      diapositiva('Haberes', [
        {
          id: nuevoId('tabla'),
          titulo: 'Carga Salarial',
          filas: [
            fila('Total carga salarial', 'moneda', [...vinculo('sueldos-bancarios'), ...vinculo('sueldos-efectivo')]),
            fila('Carga en efectivo', 'moneda', vinculo('sueldos-efectivo')),
            fila('Carga en banco', 'moneda', vinculo('sueldos-bancarios')),
          ],
        },
        {
          id: nuevoId('tabla'),
          titulo: 'Cargas Sociales',
          filas: [
            fila('SUSS - 931', 'moneda', vinculo('suss')),
            fila('Aportes Sindicales', 'moneda', vinculo('sindicato')),
            fila('ART', 'moneda', vinculo('art')),
          ],
        },
        {
          id: nuevoId('tabla'),
          titulo: 'Extraordinarios',
          filas: [fila('Liquidaciones finales', 'moneda', vinculo('liquidaciones-finales'))],
        },
      ]),
    ],
  }
}

function anexoConclusion(): AnexoManual {
  return {
    clave: 'conclusion',
    titulo: 'Conclusión',
    incluir: true,
    diapositivas: [diapositiva('Análisis del período', [], ''), diapositiva('Acciones propuestas', [], '')],
  }
}

export function opcionesPorDefecto(sucursalNombre: string, periodo: string): OpcionesCorteBalance {
  return {
    titulo: 'Corte de balance mensual',
    subtitulo: sucursalNombre,
    periodo: `Período ${periodo}`,
    colorPrincipal: COLOR_PRINCIPAL_POR_DEFECTO,
    fuente: 'Inter',
    mostrarVacios: 'blanco',
    incluirPortada: true,
    incluirIndice: true,
    incluirSeparadores: true,
    incluirGraficoEgresos: true,
    incluirBalance: true,
    incluirCierre: true,
    ocultarLineasEnCero: false,
    incluirSinClasificar: false,
    textoCierre: 'Gracias',
    firmaCierre: 'Administración',
  }
}

export function borradorPorDefecto(sucursalNombre: string, periodo: string): BorradorCorteBalance {
  return {
    version: 1,
    opciones: opcionesPorDefecto(sucursalNombre, periodo),
    ajustes: {},
    detalles: {},
    anexos: { ingresos: anexoIngresos(), rrhh: anexoRrhh(), conclusion: anexoConclusion() },
    balance: { ingresos: '', operatividadPct: '' },
  }
}
