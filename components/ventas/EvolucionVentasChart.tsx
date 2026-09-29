'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { VENTAS_EJE_COLOR, VENTAS_GRID_COLOR, VENTAS_SERIE_COLOR } from '@/lib/dialog-styles'
import { formatMontoCompacto, formatPeriodoVentas } from '@/lib/formatters'
import type { AgrupacionVentas, PanelVentas } from '@/lib/types'
import { VentasEmptyChart } from './VentasEmptyChart'
import { VentasTooltip } from './VentasTooltip'

interface EvolucionVentasChartProps {
  data: PanelVentas['evolucion']
  agrupacion: AgrupacionVentas
}

const ALTURA = 280

export function EvolucionVentasChart({ data, agrupacion }: EvolucionVentasChartProps) {
  const puntos = useMemo(
    () => data.map(d => ({ ...d, etiqueta: formatPeriodoVentas(d.periodo, agrupacion) })),
    [data, agrupacion],
  )

  if (puntos.length === 0) return <VentasEmptyChart altura={ALTURA} />

  return (
    <ResponsiveContainer width="100%" height={ALTURA}>
      <AreaChart data={puntos} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="ventasEvolucionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VENTAS_SERIE_COLOR} stopOpacity={0.25} />
            <stop offset="100%" stopColor={VENTAS_SERIE_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={VENTAS_GRID_COLOR} />
        <XAxis
          dataKey="etiqueta"
          tick={{ fontSize: 12, fill: VENTAS_EJE_COLOR }}
          tickLine={false}
          axisLine={false}
          minTickGap={16}
        />
        <YAxis
          tick={{ fontSize: 12, fill: VENTAS_EJE_COLOR }}
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={v => formatMontoCompacto(Number(v))}
        />
        <Tooltip content={<VentasTooltip />} cursor={{ stroke: VENTAS_EJE_COLOR, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="facturacion"
          name="Facturación"
          stroke={VENTAS_SERIE_COLOR}
          strokeWidth={2}
          fill="url(#ventasEvolucionFill)"
          activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
          dot={puntos.length === 1 ? { r: 4 } : false}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
