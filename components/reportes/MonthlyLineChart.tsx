'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatMonto } from '@/lib/formatters'

export interface MonthlyDataPoint {
  mes: string // 'YYYY-MM'
  ingresos: number
  egresos: number
  resultado: number
}

interface Props {
  data: MonthlyDataPoint[]
  moneda: 'ARS' | 'USD'
}

const MESES_ES: Record<string, string> = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic',
}

function formatMes(mes: string) {
  const [year, month] = mes.split('-')
  return `${MESES_ES[month] ?? month} ${year}`
}

function CustomTooltip({
  active,
  payload,
  label,
  moneda,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  moneda: 'ARS' | 'USD'
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatMonto(entry.value, moneda)}
        </p>
      ))}
    </div>
  )
}

export function MonthlyLineChart({ data, moneda }: Props) {
  if (!data || data.length === 0) {
    return <p className="text-center italic text-slate-400 py-10 text-sm">No hay datos históricos disponibles.</p>
  }

  const chartData = data.map(d => ({
    ...d,
    label: formatMes(d.mes),
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => (moneda === 'USD' ? `$${(v / 1000).toFixed(0)}k` : `$${(v / 1000).toFixed(0)}k`)}
          width={60}
        />
        <Tooltip content={<CustomTooltip moneda={moneda} />} />
        <Legend
          formatter={value => (value === 'ingresos' ? 'Ingresos' : value === 'egresos' ? 'Egresos' : 'Resultado Neto')}
          wrapperStyle={{ fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="ingresos"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#10b981' }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="egresos"
          stroke="#f43f5e"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#f43f5e' }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="resultado"
          stroke="#3b82f6"
          strokeWidth={2.5}
          strokeDasharray="5 3"
          dot={{ r: 4, fill: '#3b82f6' }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
