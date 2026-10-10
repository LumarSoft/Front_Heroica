'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { color, estiloCaja } from '@/lib/corte-balance/vista-previa'
import type { ElementoGrafico } from '@/lib/types'

interface ElementoGraficoPreviewProps {
  grafico: ElementoGrafico
  /** En miniaturas se ocultan ejes, leyendas y etiquetas. */
  miniatura: boolean
}

const compacto = (n: number, formato: ElementoGrafico['formato']) => {
  if (formato === 'porcentaje') return `${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`
  const abs = Math.abs(n)
  const pre = formato === 'moneda' ? '$' : ''
  if (abs >= 1_000_000) return `${pre}${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`
  if (abs >= 1_000) return `${pre}${Math.round(n / 1_000).toLocaleString('es-AR')}k`
  return `${pre}${n.toLocaleString('es-AR', { maximumFractionDigits: 1 })}`
}

export function ElementoGraficoPreview({ grafico: g, miniatura }: ElementoGraficoPreviewProps) {
  const filas = g.categorias.map((categoria, i) => ({
    categoria,
    ...Object.fromEntries(g.series.map(s => [s.nombre, s.valores[i] ?? 0])),
  }))
  const tick = { fontSize: 10, fill: '#4B5563' }
  const leyenda = !miniatura && (g.series.length > 1 || g.grafico === 'torta' || g.grafico === 'dona')
  const formatear = (v: unknown) => compacto(Number(v), g.formato)

  let contenido
  if (g.grafico === 'torta' || g.grafico === 'dona') {
    const serie = g.series[0]
    contenido = (
      <PieChart>
        <Pie
          data={g.categorias.map((name, i) => ({ name, value: serie?.valores[i] ?? 0 }))}
          dataKey="value"
          nameKey="name"
          innerRadius={g.grafico === 'dona' ? '55%' : 0}
          outerRadius="80%"
          isAnimationActive={false}
          // Las porciones de menos del 3 % no llevan etiqueta para que no se encimen
          label={
            miniatura
              ? false
              : ({ percent }) =>
                  (percent ?? 0) < 0.03
                    ? ''
                    : `${((percent ?? 0) * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`
          }
          labelLine={false}
        >
          {g.categorias.map((c, i) => (
            <Cell key={c} fill={color(g.colores[i % g.colores.length])} />
          ))}
        </Pie>
        {leyenda && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            itemSorter={null}
            wrapperStyle={{ fontSize: 11 }}
          />
        )}
      </PieChart>
    )
  } else if (g.grafico === 'lineas') {
    contenido = (
      <LineChart data={filas}>
        {!miniatura && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis dataKey="categoria" tick={tick} hide={miniatura} />
        <YAxis tick={tick} tickFormatter={formatear} hide={miniatura} width={56} />
        {g.series.map((s, i) => (
          <Line
            key={s.nombre}
            dataKey={s.nombre}
            stroke={color(g.colores[i % g.colores.length])}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
        {leyenda && <Legend itemSorter={null} wrapperStyle={{ fontSize: 11 }} />}
      </LineChart>
    )
  } else {
    contenido = (
      <BarChart data={filas}>
        {!miniatura && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />}
        <XAxis dataKey="categoria" tick={tick} hide={miniatura} />
        <YAxis tick={tick} tickFormatter={formatear} hide={miniatura} width={56} />
        {g.series.map((s, i) => (
          <Bar
            key={s.nombre}
            dataKey={s.nombre}
            stackId={g.grafico === 'barras-apiladas' ? 'pila' : undefined}
            fill={color(g.colores[i % g.colores.length])}
            isAnimationActive={false}
          />
        ))}
        {leyenda && <Legend itemSorter={null} wrapperStyle={{ fontSize: 11 }} />}
      </BarChart>
    )
  }

  return (
    // Posición y tamaño salen del modelo (valores dinámicos)
    <div style={estiloCaja(g)} className="flex flex-col">
      {g.titulo && !miniatura && <p className="text-center text-xs font-semibold text-[#6B6B6B]">{g.titulo}</p>}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {contenido}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
