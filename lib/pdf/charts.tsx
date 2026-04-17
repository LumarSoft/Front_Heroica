import { View, Svg, Polyline, Line, Rect, Text as SvgText, G, Circle, Path } from '@react-pdf/renderer'
import { pdfColors } from './theme'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}

export function Sparkline({ values, width = 80, height = 18, stroke = pdfColors.brand, fill }: SparklineProps) {
  if (!values || values.length < 2) {
    return (
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={pdfColors.border} strokeWidth={0.8} />
        </Svg>
      </View>
    )
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (values.length - 1)
  const pad = 1.5
  const points = values
    .map((v, i) => {
      const x = i * stepX
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  // Build closed polygon for fill (area chart)
  const areaPoints = fill
    ? `0,${height} ${points} ${width},${height}`
    : null

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {areaPoints && <Polyline points={areaPoints} fill={fill!} stroke="none" />}
        <Polyline points={points} stroke={stroke} strokeWidth={1.2} fill="none" />
      </Svg>
    </View>
  )
}

// ── Bar chart (simple horizontal proportion bar used inside rows) ────────────

interface ProportionBarProps {
  value: number
  total: number
  color?: string
  width?: number
  height?: number
}

export function ProportionBar({ value, total, color = pdfColors.brand, width = 80, height = 5 }: ProportionBarProps) {
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0
  return (
    <View style={{ width, height, backgroundColor: pdfColors.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  )
}

// ── Multi-series bar chart for monthly evolution ─────────────────────────────

export interface MonthlySeriesPoint {
  label: string
  ingresos: number
  egresos: number
  resultado: number
}

interface MonthlyBarChartProps {
  data: MonthlySeriesPoint[]
  width?: number
  height?: number
}

export function MonthlyBarChart({ data, width = 720, height = 180 }: MonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={{ width, height, borderWidth: 0.5, borderColor: pdfColors.border }}>
        <Svg width={width} height={height}>
          <SvgText
            x={width / 2}
            y={height / 2}
            style={{ fontSize: 9, fill: pdfColors.muted, textAnchor: 'middle' }}
          >
            Sin datos disponibles
          </SvgText>
        </Svg>
      </View>
    )
  }

  const padLeft = 44
  const padRight = 10
  const padTop = 10
  const padBottom = 26
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const values = data.flatMap(d => [d.ingresos, d.egresos, d.resultado])
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const range = max - min || 1

  const groupW = plotW / data.length
  const barW = Math.min(10, (groupW * 0.8) / 3)
  const yZero = padTop + ((max - 0) / range) * plotH

  const yToPx = (v: number) => padTop + ((max - v) / range) * plotH

  // Y-axis ticks (5 evenly spaced)
  const ticks = 4
  const tickValues: number[] = []
  for (let i = 0; i <= ticks; i++) {
    tickValues.push(min + (range * i) / ticks)
  }

  const formatTick = (v: number): string => {
    const abs = Math.abs(v)
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`
    return v.toFixed(0)
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Grid lines and Y-axis labels */}
        {tickValues.map((tv, i) => {
          const y = yToPx(tv)
          return (
            <G key={i}>
              <Line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke={pdfColors.border} strokeWidth={0.3} />
              <SvgText
                x={padLeft - 4}
                y={y + 2.5}
                style={{ fontSize: 6.5, fill: pdfColors.muted, textAnchor: 'end' }}
              >
                {formatTick(tv)}
              </SvgText>
            </G>
          )
        })}

        {/* Zero line stronger */}
        <Line x1={padLeft} y1={yZero} x2={padLeft + plotW} y2={yZero} stroke={pdfColors.borderStrong} strokeWidth={0.6} />

        {/* Bars */}
        {data.map((d, i) => {
          const gx = padLeft + groupW * i + groupW / 2
          const series: { value: number; color: string; offset: number }[] = [
            { value: d.ingresos, color: pdfColors.positive, offset: -barW - 1.5 },
            { value: d.egresos, color: pdfColors.negative, offset: 0 },
            { value: d.resultado, color: pdfColors.info, offset: barW + 1.5 },
          ]
          return (
            <G key={i}>
              {series.map((s, j) => {
                const barH = Math.abs((s.value / range) * plotH)
                const y = s.value >= 0 ? yZero - barH : yZero
                return (
                  <Rect
                    key={j}
                    x={gx + s.offset - barW / 2}
                    y={y}
                    width={barW}
                    height={Math.max(barH, 0.6)}
                    fill={s.color}
                  />
                )
              })}
              <SvgText
                x={gx}
                y={height - padBottom + 10}
                style={{ fontSize: 6.5, fill: pdfColors.muted, textAnchor: 'middle' }}
              >
                {d.label}
              </SvgText>
            </G>
          )
        })}

        {/* Legend */}
        <G>
          {[
            { label: 'Ingresos', color: pdfColors.positive, x: padLeft },
            { label: 'Egresos', color: pdfColors.negative, x: padLeft + 60 },
            { label: 'Resultado', color: pdfColors.info, x: padLeft + 120 },
          ].map((l, i) => (
            <G key={i}>
              <Rect x={l.x} y={height - 10} width={6} height={6} fill={l.color} />
              <SvgText
                x={l.x + 9}
                y={height - 4.5}
                style={{ fontSize: 7, fill: pdfColors.muted }}
              >
                {l.label}
              </SvgText>
            </G>
          ))}
        </G>
      </Svg>
    </View>
  )
}

// ── Donut chart for breakdowns (shows top slice) ─────────────────────────────

interface DonutChartProps {
  slices: { label: string; value: number; color: string }[]
  size?: number
}

export function DonutChart({ slices, size = 110 }: DonutChartProps) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (total <= 0) {
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 6} stroke={pdfColors.border} strokeWidth={6} fill="none" />
          <SvgText
            x={size / 2}
            y={size / 2 + 2}
            style={{ fontSize: 7, fill: pdfColors.muted, textAnchor: 'middle' }}
          >
            Sin datos
          </SvgText>
        </Svg>
      </View>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6
  const innerR = r - 10
  let cumulative = 0

  const polarToCartesian = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  })

  const pathFor = (startAngle: number, endAngle: number): string => {
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    const outerStart = polarToCartesian(startAngle, r)
    const outerEnd = polarToCartesian(endAngle, r)
    const innerStart = polarToCartesian(endAngle, innerR)
    const innerEnd = polarToCartesian(startAngle, innerR)
    return [
      `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
      'Z',
    ].join(' ')
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((slice, i) => {
            const fraction = slice.value / total
            const startAngle = -Math.PI / 2 + cumulative * 2 * Math.PI
            cumulative += fraction
            const endAngle = -Math.PI / 2 + cumulative * 2 * Math.PI
            if (fraction <= 0) return null
            if (fraction >= 0.9999) {
              return (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={(r + innerR) / 2}
                  stroke={slice.color}
                  strokeWidth={r - innerR}
                  fill="none"
                />
              )
            }
            return <Path key={i} d={pathFor(startAngle, endAngle)} fill={slice.color} />
          })}
        </G>
      </Svg>
    </View>
  )
}
