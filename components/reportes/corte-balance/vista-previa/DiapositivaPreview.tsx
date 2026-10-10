import { ElementoGraficoPreview } from '@/components/reportes/corte-balance/vista-previa/ElementoGraficoPreview'
import { ElementoTablaPreview } from '@/components/reportes/corte-balance/vista-previa/ElementoTablaPreview'
import { color, estiloCaja, familia, pulgadas, puntos } from '@/lib/corte-balance/vista-previa'
import type { DiapositivaModelo } from '@/lib/types'

interface DiapositivaPreviewProps {
  diapositiva: DiapositivaModelo
  fuente: string
  miniatura?: boolean
}

const JUSTIFICAR = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

/** Dibuja en HTML el mismo modelo que se escribe en el PPTX. */
export function DiapositivaPreview({ diapositiva, fuente, miniatura = false }: DiapositivaPreviewProps) {
  return (
    <div className="@container relative aspect-video w-full overflow-hidden bg-white shadow-sm ring-1 ring-[#E0E0E0]">
      {diapositiva.elementos.map((e, i) => {
        if (e.tipo === 'forma') {
          return (
            <div
              key={i}
              // Geometría y color salen del modelo (valores dinámicos)
              style={{ ...estiloCaja(e), background: color(e.color), borderRadius: pulgadas(e.radio) }}
            />
          )
        }
        if (e.tipo === 'texto') {
          return (
            <div
              key={i}
              className="flex overflow-hidden leading-tight whitespace-pre-line"
              // Tipografía y posición salen del modelo (valores dinámicos)
              style={{
                ...estiloCaja(e),
                fontFamily: familia(fuente),
                fontSize: puntos(e.tamano),
                color: color(e.color),
                fontWeight: e.negrita ? 700 : 400,
                fontStyle: e.cursiva ? 'italic' : 'normal',
                textDecoration: e.subrayado ? 'underline' : 'none',
                alignItems: e.vertical === 'top' ? 'flex-start' : 'center',
                justifyContent: JUSTIFICAR[e.alineacion ?? 'left'],
                textAlign: e.alineacion ?? 'left',
              }}
            >
              <span>
                {e.tramos.map((t, j) => (
                  <span
                    key={j}
                    // Color/peso por tramo, dinámico
                    style={{ fontWeight: t.negrita ? 700 : undefined, color: t.color ? color(t.color) : undefined }}
                  >
                    {t.texto}
                  </span>
                ))}
              </span>
            </div>
          )
        }
        if (e.tipo === 'tabla') return <ElementoTablaPreview key={i} tabla={e} fuente={fuente} />
        return <ElementoGraficoPreview key={i} grafico={e} miniatura={miniatura} />
      })}
    </div>
  )
}
