'use client'

import { useMemo } from 'react'
import { formatCantidad, formatMonto, formatMontoCompacto } from '@/lib/formatters'
import type { MapaCalorVentas as MapaCalorDatos } from '@/lib/types'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface MapaCalorVentasProps {
  data: MapaCalorDatos
  metrica: 'facturacion' | 'tickets'
}

/**
 * Grilla día de la semana × hora con el promedio por jornada (un martes con 4 martes
 * importados se divide por 4). Un solo tono: más intenso = más ventas.
 */
export function MapaCalorVentas({ data, metrica }: MapaCalorVentasProps) {
  const { horas, porCelda, maximo } = useMemo(() => {
    const conDatos = data.celdas.map(c => c.hora)
    const desde = conDatos.length ? Math.min(...conDatos) : 8
    const hasta = conDatos.length ? Math.max(...conDatos) : 22
    const mapa = new Map(data.celdas.map(c => [`${c.dia}-${c.hora}`, c]))
    const valores = data.celdas.map(c => (metrica === 'facturacion' ? c.promedioFacturacion : c.promedioTickets))
    return {
      horas: Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i),
      porCelda: mapa,
      maximo: Math.max(...valores, 0),
    }
  }, [data, metrica])

  if (data.sinHora) {
    return (
      <p className="py-10 text-center text-sm text-[#7A93BB]">
        Las ventas importadas no traen la hora de los tickets. En Hiopos, agregá la columna “Hora” al dashboard de
        HiOffice para ver el mapa.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-separate" style={{ borderSpacing: 3 }}>
        <thead>
          <tr>
            <th />
            {horas.map(h => (
              <th key={h} className="text-[11px] font-semibold text-[#7A93BB] w-12 text-center">
                {String(h).padStart(2, '0')}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIAS.map((dia, d) => (
            <tr key={dia}>
              <th className="pr-3 text-left text-xs font-semibold text-[#5A6B8C] whitespace-nowrap">
                {dia}
                <span className="block text-[10px] font-normal text-[#9AAACC]">
                  {data.jornadas[d] ? `${data.jornadas[d]} ${data.jornadas[d] === 1 ? 'día' : 'días'}` : 'sin datos'}
                </span>
              </th>
              {horas.map(h => {
                const celda = porCelda.get(`${d}-${h}`)
                const valor = celda
                  ? metrica === 'facturacion'
                    ? celda.promedioFacturacion
                    : celda.promedioTickets
                  : 0
                const intensidad = maximo > 0 ? valor / maximo : 0
                const esPico = data.pico && data.pico.dia === d && data.pico.hora === h
                return (
                  <td
                    key={h}
                    title={
                      celda
                        ? `${dia} ${String(h).padStart(2, '0')}:00 · promedio ${formatMonto(celda.promedioFacturacion)} y ${formatCantidad(celda.promedioTickets, 1)} tickets por jornada (total ${formatMonto(celda.facturacion)})`
                        : `${dia} ${String(h).padStart(2, '0')}:00 · sin ventas`
                    }
                    className="w-12 h-10 rounded-md text-center align-middle text-[10px] font-semibold tabular-nums"
                    style={{
                      backgroundColor: celda ? `rgba(47, 91, 189, ${0.08 + intensidad * 0.92})` : '#F5F7FC',
                      color: intensidad > 0.55 ? '#fff' : '#002868',
                      outline: esPico ? '2px solid #F59E0B' : undefined,
                    }}
                  >
                    {celda && valor > 0
                      ? metrica === 'facturacion'
                        ? formatMontoCompacto(valor).replace('$ ', '')
                        : formatCantidad(valor, 0)
                      : ''}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
