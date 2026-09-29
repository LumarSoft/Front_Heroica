'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { VENTAS_EJE_COLOR, VENTAS_GRID_COLOR, VENTAS_SERIE_COLOR } from '@/lib/dialog-styles'
import { formatMontoCompacto } from '@/lib/formatters'
import { VentasEmptyChart } from './VentasEmptyChart'
import { VentasTooltip } from './VentasTooltip'

export interface ColumnaVentas {
  etiqueta: string
  valor: number
  facturacion: number
  tickets: number
  promedioPorJornada?: number
}

interface VentasColumnasChartProps {
  data: ColumnaVentas[]
  /** Muestra el promedio por jornada en el tooltip (día de la semana). */
  mostrarPromedio?: boolean
  altura?: number
}

/** Columnas de una sola serie (franja horaria, día de la semana). */
export function VentasColumnasChart({ data, mostrarPromedio = false, altura = 260 }: VentasColumnasChartProps) {
  if (data.length === 0) return <VentasEmptyChart altura={altura} />

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke={VENTAS_GRID_COLOR} />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: VENTAS_EJE_COLOR }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: VENTAS_EJE_COLOR }}
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={v => formatMontoCompacto(Number(v))}
        />
        <Tooltip content={<VentasTooltip mostrarPromedio={mostrarPromedio} />} cursor={{ fill: '#F1F5FD' }} />
        <Bar dataKey="valor" fill={VENTAS_SERIE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
