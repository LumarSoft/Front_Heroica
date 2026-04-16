import { formatMonto } from '@/lib/formatters'
import type { ReportBreakdownItem } from './types'

// =============================================
// Indicadores de Salud Financiera:
//  · Concentración de ingresos y egresos por categoría
//  · Ratio de solvencia (créditos / deudas)
// =============================================

const CHART_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#8884d8', '#82ca9d', '#ffc658', '#a4de6c',
]

// ── Helpers de riesgo ──────────────────────────────────────────────────────

type RiskLevel = 'low' | 'medium' | 'high'

function concentracionRisk(topPct: number): {
  level: RiskLevel
  label: string
  color: string
  bg: string
  border: string
  text: string
} {
  if (topPct < 40)
    return { level: 'low', label: 'Baja concentración', color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' }
  if (topPct < 65)
    return { level: 'medium', label: 'Concentración moderada', color: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }
  return { level: 'high', label: 'Alta concentración', color: '#dc2626', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' }
}

function solvenciaInfo(ratio: number, deudas: number): {
  label: string
  desc: string
  color: string
  bg: string
  text: string
  border: string
} {
  if (deudas === 0)
    return { label: 'Sin deudas', desc: 'No hay deudas registradas actualmente', color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
  if (ratio > 2)
    return { label: 'Excelente', desc: 'Los créditos más que duplican las deudas', color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
  if (ratio > 1)
    return { label: 'Positiva', desc: 'Los créditos cubren la totalidad de las deudas', color: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' }
  if (ratio > 0.5)
    return { label: 'Neutra', desc: 'Los créditos cubren parcialmente las deudas', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
  return { label: 'Riesgo de liquidez', desc: 'Las deudas superan con creces los créditos', color: '#dc2626', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
}

// ── Sub-componente: barras de concentración (solo UI) ───────────────────────

function ConcentracionBars({
  breakdown,
  total,
  colorStart,
}: {
  breakdown: ReportBreakdownItem[]
  total: number
  colorStart: number
}) {
  const sorted = [...breakdown].sort((a, b) => b.value - a.value).slice(0, 6)
  if (sorted.length === 0)
    return <p className="text-sm text-slate-400 italic text-center py-4">Sin categorías registradas.</p>

  return (
    <div className="space-y-2.5">
      {sorted.map((cat, i) => {
        const pct = total > 0 ? (cat.value / total) * 100 : 0
        const color = CHART_COLORS[(i + colorStart) % CHART_COLORS.length]
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{cat.name}</span>
              </span>
              <span className="text-xs font-bold text-slate-800 tabular-nums ml-2 flex-shrink-0">
                {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
      {breakdown.length > 6 && (
        <p className="text-xs text-slate-400 italic text-right">
          + {breakdown.length - 6} categorías más
        </p>
      )}
    </div>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  ingresosBreakdown: ReportBreakdownItem[]
  egresosBreakdown: ReportBreakdownItem[]
  creditos: number
  deudas: number
  totalIngresos: number
  totalEgresos: number
  moneda: 'ARS' | 'USD'
}

// ── Componente principal ────────────────────────────────────────────────────

export function SaludFinancieraPanel({
  ingresosBreakdown,
  egresosBreakdown,
  creditos,
  deudas,
  totalIngresos,
  totalEgresos,
  moneda,
}: Props) {
  const sortedIng = [...ingresosBreakdown].sort((a, b) => b.value - a.value)
  const sortedEgr = [...egresosBreakdown].sort((a, b) => b.value - a.value)

  const topIngPct = totalIngresos > 0 && sortedIng[0] ? (sortedIng[0].value / totalIngresos) * 100 : 0
  const topEgrPct = totalEgresos > 0 && sortedEgr[0] ? (sortedEgr[0].value / totalEgresos) * 100 : 0

  const ingConc = concentracionRisk(topIngPct)
  const egrConc = concentracionRisk(topEgrPct)

  const ratio = deudas > 0 ? creditos / deudas : 0
  const solv = solvenciaInfo(ratio, deudas)

  // Gauge fill: clamp ratio a 0-3 para llenar barra (100% = ratio ≥ 3)
  const gaugeFill = Math.min((ratio / 3) * 100, 100)

  return (
    <>
      {/* ─── Vista UI ─── */}
      <div className="print:hidden space-y-6">

        {/* Concentración */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingresos */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`px-5 py-3.5 border-b ${ingConc.border} ${ingConc.bg} flex items-center justify-between`}>
              <p className={`text-sm font-bold uppercase tracking-wider ${ingConc.text}`}>
                Concentración de Ingresos
              </p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ingConc.border} ${ingConc.bg} ${ingConc.text}`}>
                {ingConc.label}
              </span>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400 mb-3">
                La categoría principal representa{' '}
                <strong className={ingConc.text}>{topIngPct.toFixed(1)}%</strong> del total de ingresos.
              </p>
              <ConcentracionBars breakdown={sortedIng} total={totalIngresos} colorStart={0} />
            </div>
          </div>

          {/* Egresos */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`px-5 py-3.5 border-b ${egrConc.border} ${egrConc.bg} flex items-center justify-between`}>
              <p className={`text-sm font-bold uppercase tracking-wider ${egrConc.text}`}>
                Concentración de Egresos
              </p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${egrConc.border} ${egrConc.bg} ${egrConc.text}`}>
                {egrConc.label}
              </span>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400 mb-3">
                La categoría principal representa{' '}
                <strong className={egrConc.text}>{topEgrPct.toFixed(1)}%</strong> del total de egresos.
              </p>
              <ConcentracionBars breakdown={sortedEgr} total={totalEgresos} colorStart={4} />
            </div>
          </div>
        </div>

        {/* Solvencia */}
        <div className={`rounded-xl border ${solv.border} ${solv.bg} p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Número grande */}
            <div className="text-center sm:text-left min-w-[140px]">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Ratio de Solvencia
              </p>
              <p className="text-6xl font-black tabular-nums leading-none" style={{ color: solv.color }}>
                {deudas > 0 ? ratio.toFixed(2) : '—'}
              </p>
              <p className={`text-base font-bold mt-2 ${solv.text}`}>{solv.label}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{solv.desc}</p>
            </div>

            {/* Barra gauge + montos */}
            <div className="flex-1 w-full space-y-4">
              {/* Gauge */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Créditos / Deudas</span>
                  <span>{deudas > 0 ? `${ratio.toFixed(2)}x` : '—'}</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${gaugeFill}%`, backgroundColor: solv.color }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-300 mt-0.5">
                  <span>0x</span>
                  <span>1x</span>
                  <span>2x</span>
                  <span>3x+</span>
                </div>
              </div>

              {/* Tarjetas créditos / deudas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 rounded-lg p-4 border border-white/60">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Créditos a cobrar
                  </p>
                  <p className="text-lg font-extrabold text-indigo-600 tabular-nums">
                    {formatMonto(creditos, moneda)}
                  </p>
                </div>
                <div className="bg-white/70 rounded-lg p-4 border border-white/60">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Deudas a pagar
                  </p>
                  <p className="text-lg font-extrabold text-orange-600 tabular-nums">
                    {formatMonto(deudas, moneda)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Vista impresión ─── */}
      <div className="hidden print:block">
        {/* Concentración en dos columnas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
          {/* Ingresos */}
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: '9pt',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
              }}
            >
              Concentración de Ingresos —{' '}
              <span style={{ color: ingConc.color }}>{ingConc.label}</span>
            </p>
            <p style={{ fontSize: '8pt', color: '#64748b', marginBottom: '6px' }}>
              Categoría principal: <strong>{sortedIng[0]?.name ?? '—'}</strong> representa{' '}
              <strong style={{ color: ingConc.color }}>{topIngPct.toFixed(1)}%</strong> del total.
            </p>
            <table className="print-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Categoría</th>
                  <th className="text-right">% del total</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {sortedIng.map((cat, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#1e293b' : '#475569' }}>
                      {cat.name}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#64748b' }}>
                      {totalIngresos > 0 ? ((cat.value / totalIngresos) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#059669', fontWeight: 600 }}>
                      {formatMonto(cat.value, moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Egresos */}
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: '9pt',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px solid #e2e8f0',
                color: '#475569',
              }}
            >
              Concentración de Egresos —{' '}
              <span style={{ color: egrConc.color }}>{egrConc.label}</span>
            </p>
            <p style={{ fontSize: '8pt', color: '#64748b', marginBottom: '6px' }}>
              Categoría principal: <strong>{sortedEgr[0]?.name ?? '—'}</strong> representa{' '}
              <strong style={{ color: egrConc.color }}>{topEgrPct.toFixed(1)}%</strong> del total.
            </p>
            <table className="print-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Categoría</th>
                  <th className="text-right">% del total</th>
                  <th className="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {sortedEgr.map((cat, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#1e293b' : '#475569' }}>
                      {cat.name}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#64748b' }}>
                      {totalEgresos > 0 ? ((cat.value / totalEgresos) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#e11d48', fontWeight: 600 }}>
                      {formatMonto(cat.value, moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Solvencia */}
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: '8pt', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '4px' }}>
              Ratio de Solvencia (Créditos / Deudas)
            </p>
            <p style={{ fontSize: '28pt', fontWeight: 800, color: solv.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {deudas > 0 ? ratio.toFixed(2) : '—'}
            </p>
            <p style={{ fontSize: '10pt', fontWeight: 700, color: solv.color, marginTop: '3px' }}>{solv.label}</p>
            <p style={{ fontSize: '8pt', color: '#64748b', marginTop: '2px' }}>{solv.desc}</p>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '8pt', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>
                Créditos a cobrar
              </p>
              <p style={{ fontSize: '13pt', fontWeight: 700, color: '#4f46e5', fontVariantNumeric: 'tabular-nums' }}>
                {formatMonto(creditos, moneda)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '8pt', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>
                Deudas a pagar
              </p>
              <p style={{ fontSize: '13pt', fontWeight: 700, color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                {formatMonto(deudas, moneda)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
