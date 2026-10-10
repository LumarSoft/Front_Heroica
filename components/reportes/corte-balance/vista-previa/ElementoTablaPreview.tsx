import { color, estiloCaja, familia, pulgadas, puntos } from '@/lib/corte-balance/vista-previa'
import type { ElementoTabla } from '@/lib/types'

interface ElementoTablaPreviewProps {
  tabla: ElementoTabla
  fuente: string
}

export function ElementoTablaPreview({ tabla, fuente }: ElementoTablaPreviewProps) {
  const alto = tabla.altos.reduce((a, b) => a + b, 0)
  const borde = `${puntos(1.5)} solid #000`
  return (
    // Posición, tamaño y tipografía dependen del modelo (valores dinámicos): Tailwind no los puede expresar
    <div style={{ ...estiloCaja({ x: tabla.x, y: tabla.y, w: tabla.w, h: alto }), fontFamily: familia(fuente) }}>
      <table className="h-full w-full table-fixed border-collapse text-[#111111]">
        <colgroup>
          {tabla.anchos.map((a, i) => (
            <col key={i} style={{ width: `${(a / tabla.w) * 100}%` }} />
          ))}
        </colgroup>
        <tbody>
          {tabla.filas.map((fila, i) => (
            <tr key={i} style={{ height: pulgadas(tabla.altos[i] ?? 0.4) }}>
              {fila.map((c, j) => (
                <td
                  key={j}
                  colSpan={c.colspan}
                  className="overflow-hidden px-[0.4cqw] text-center align-middle leading-tight whitespace-pre-line"
                  style={{
                    border: borde,
                    fontSize: puntos(c.tamano ?? tabla.tamano),
                    fontWeight: c.negrita ? 700 : 400,
                    background: c.fondo ? color(c.fondo) : '#fff',
                    color: c.color ? color(c.color) : undefined,
                  }}
                >
                  {c.texto}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
