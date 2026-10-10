import { diapositivasAnexo } from '@/lib/corte-balance/modelo/anexo'
import { balanceMensual, cascada, indicadores } from '@/lib/corte-balance/modelo/balance'
import {
  comparativoEgresos,
  evolucionEgresos,
  seccionEgresos,
  topProveedores,
  tortaEgresos,
} from '@/lib/corte-balance/modelo/egresos'
import { cierre, indice, portada, separador } from '@/lib/corte-balance/modelo/generales'
import { crearTema } from '@/lib/corte-balance/modelo/primitivas'
import type { DatosExportCorteBalance, DiapositivaModelo } from '@/lib/types'

const presentes = (lista: (DiapositivaModelo | null)[]) => lista.filter((d): d is DiapositivaModelo => d !== null)

/**
 * Arma todas las diapositivas del Corte de balance según las opciones. El
 * mismo modelo lo dibuja la vista previa y lo escribe el PPTX.
 */
export function construirDiapositivas(d: DatosExportCorteBalance): DiapositivaModelo[] {
  const { opciones, anexos } = d.borrador
  const tema = crearTema(opciones.colorPrincipal, opciones.fuente)
  const capitulos: { titulo: string; diapositivas: DiapositivaModelo[] }[] = []
  const manual = (clave: 'ingresos' | 'rrhh' | 'conclusion') =>
    diapositivasAnexo(tema, anexos[clave], d.contexto, opciones, d.moneda)

  if (anexos.ingresos.incluir) capitulos.push({ titulo: anexos.ingresos.titulo, diapositivas: manual('ingresos') })
  if (anexos.rrhh.incluir) capitulos.push({ titulo: anexos.rrhh.titulo, diapositivas: manual('rrhh') })
  capitulos.push({
    titulo: 'Anexo Egresos',
    diapositivas: presentes([
      ...d.secciones.map(s => seccionEgresos(tema, s, d.moneda)),
      opciones.incluirGraficoEgresos ? tortaEgresos(tema, d.secciones) : null,
      opciones.incluirComparativo
        ? comparativoEgresos(tema, d.analisis, d.mes, opciones.umbralVariacionPct, d.moneda)
        : null,
      opciones.incluirEvolucion ? evolucionEgresos(tema, d.analisis) : null,
      opciones.incluirTopProveedores ? topProveedores(tema, d.analisis, d.moneda) : null,
    ]),
  })
  if (opciones.incluirBalance || opciones.incluirCascada || opciones.incluirIndicadores) {
    capitulos.push({
      titulo: 'Balance Mensual',
      diapositivas: presentes([
        opciones.incluirBalance ? balanceMensual(tema, d.balance, d.secciones, d.moneda) : null,
        opciones.incluirCascada ? cascada(tema, d.balance, d.secciones, d.moneda) : null,
        opciones.incluirIndicadores && d.analisis.indicadores
          ? indicadores(tema, d.analisis.indicadores, d.moneda)
          : null,
      ]),
    })
  }
  if (anexos.conclusion.incluir) {
    capitulos.push({ titulo: anexos.conclusion.titulo, diapositivas: manual('conclusion') })
  }

  const conContenido = capitulos.filter(c => c.diapositivas.length > 0)
  const resultado: DiapositivaModelo[] = []
  if (opciones.incluirPortada) resultado.push(portada(tema, opciones))
  if (opciones.incluirIndice)
    resultado.push(
      indice(
        tema,
        conContenido.map(c => c.titulo),
      ),
    )
  conContenido.forEach((c, i) => {
    if (opciones.incluirSeparadores) resultado.push(separador(tema, c.titulo, `separador-${i}`))
    resultado.push(...c.diapositivas)
  })
  if (opciones.incluirCierre) resultado.push(cierre(tema, opciones))
  return resultado
}
