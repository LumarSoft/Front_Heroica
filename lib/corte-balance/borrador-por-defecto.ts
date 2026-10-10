import { anexoIngresos } from '@/lib/corte-balance/anexo-ingresos-por-defecto'
import {
  conFormula,
  conGrafico,
  diapositiva,
  fila,
  nuevoId,
  tabla,
  tablaMixta,
} from '@/lib/corte-balance/constructores-anexo'
import type { AnexoManual, BorradorCorteBalance, DiapositivaReporte, OpcionesCorteBalance } from '@/lib/types'

export { ID_FILA_VENTAS_TOTALES, nuevoId } from '@/lib/corte-balance/constructores-anexo'

/**
 * Contenido inicial de las partes que se cargan a mano, con la misma estructura
 * que el Corte de balance de Julio 2026 hecho en Canva. Todo es editable:
 * se pueden renombrar, agregar o quitar diapositivas, tablas y filas.
 */

export const COLOR_PRINCIPAL_POR_DEFECTO = '#1B3D8F'

function dotacion(): DiapositivaReporte {
  const porArea = conGrafico(tabla('Por área', 'numero', ['Salón', 'Cocina', 'Pastelería / Laminados']), 'torta')
  const total = conFormula(fila('Dotación Total', 'numero'), { tipo: 'suma', filas: porArea.filas.map(f => f.id) })
  return diapositiva('Dotación', [{ ...tabla('', 'numero', []), filas: [total] }, porArea])
}

function anexoRrhh(): AnexoManual {
  const vinculo = (sufijo: string) => [`sueldos--${sufijo}`]
  return {
    clave: 'rrhh',
    titulo: 'Anexo Recursos Humanos',
    incluir: true,
    diapositivas: [
      diapositiva('Resumen mensual', [], ''),
      dotacion(),
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
    incluirComparativo: true,
    incluirEvolucion: true,
    incluirTopProveedores: true,
    incluirIndicadores: true,
    incluirCascada: true,
    umbralVariacionPct: 10,
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
