'use client'

import { formatMonto } from '@/lib/formatters'
import type { CategoryDataPoint } from './MonthlyCategoryBarChart'

// =============================================
// Comparativo de categorías: mes actual vs mes anterior vs promedio 6 meses
// =============================================

const MESES_ES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

function formatMesLabel(mes: string): string {
  const [year, month] = mes.split('-')
  return `${MESES_ES[month] ?? month} '${year.slice(2)}`
}

function prevMonth(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nMonthsBefore(mes: string, n: number): string {
  const [year, month] = mes.split('-').map(Number)
  const d = new Date(year, month - 1 - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface RowData {
  cat: string
  current: number
  prev: number
  avg6: number
  deltaVsPrev: number | null
  deltaVsAvg: number | null
}

interface Props {
  categoryData: CategoryDataPoint[]
  currentMonth: string
  moneda: 'ARS' | 'USD'
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null)
    return <span className="text-slate-300 text-xs font-mono">—</span>
  const positive = delta >= 0
  const sign = positive ? '+' : ''
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold tabular-nums ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
    >
      {sign}{delta.toFixed(1)}%
    </span>
  )
}

export function ComparativoCategoriaPanel({ categoryData, currentMonth, moneda }: Props) {
  const prevMes = prevMonth(currentMonth)
  const last6Months = Array.from({ length: 6 }, (_, i) => nMonthsBefore(currentMonth, i + 1))

  // Construir matrix: { categoria -> { mes -> total } }
  const matrix: Record<string, Record<string, number>> = {}
  categoryData.forEach(({ mes, categoria, total }) => {
    if (!matrix[categoria]) matrix[categoria] = {}
    matrix[categoria][mes] = (matrix[categoria][mes] ?? 0) + total
  })

  const rows: RowData[] = Object.entries(matrix)
    .map(([cat, byMes]) => {
      const current = byMes[currentMonth] ?? 0
      const prev = byMes[prevMes] ?? 0
      const vals6 = last6Months.map(m => byMes[m] ?? 0).filter(v => v > 0)
      const avg6 = vals6.length > 0 ? vals6.reduce((a, b) => a + b, 0) / vals6.length : 0
      const deltaVsPrev = prev > 0 ? ((current - prev) / prev) * 100 : null
      const deltaVsAvg = avg6 > 0 ? ((current - avg6) / avg6) * 100 : null
      return { cat, current, prev, avg6, deltaVsPrev, deltaVsAvg }
    })
    .filter(r => r.current > 0 || r.prev > 0)
    .sort((a, b) => b.current - a.current)

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 flex items-center justify-center">
        <p className="text-slate-400 text-sm italic">
          No hay datos históricos suficientes para mostrar el comparativo.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ─── Vista UI ─── */}
      <div className="print:hidden bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200 min-w-[140px]">
                  Categoría
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  {formatMesLabel(currentMonth)}{' '}
                  <span className="text-indigo-400 font-normal normal-case">(actual)</span>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  {formatMesLabel(prevMes)}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider min-w-[100px]">
                  Δ vs ant.
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  Prom. 6 meses
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider min-w-[100px]">
                  Δ vs prom.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 truncate max-w-[160px]" title={row.cat}>
                    {row.cat}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 tabular-nums">
                    {row.current > 0 ? formatMonto(row.current, moneda) : <span className="text-slate-300 font-normal">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                    {row.prev > 0 ? formatMonto(row.prev, moneda) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeltaBadge delta={row.deltaVsPrev} />
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 tabular-nums text-xs">
                    {row.avg6 > 0 ? formatMonto(row.avg6, moneda) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeltaBadge delta={row.deltaVsAvg} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="px-4 py-2.5 font-bold text-slate-600 text-xs uppercase tracking-wider sticky left-0 bg-slate-50 border-r border-slate-200">
                  Totales
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-800 tabular-nums">
                  {formatMonto(rows.reduce((s, r) => s + r.current, 0), moneda)}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-500 tabular-nums">
                  {formatMonto(rows.reduce((s, r) => s + r.prev, 0), moneda)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── Vista impresión ─── */}
      <div className="hidden print:block">
        <table className="print-table w-full">
          <thead>
            <tr>
              <th className="text-left" style={{ width: '22%' }}>Categoría</th>
              <th className="text-right" style={{ width: '16%' }}>{formatMesLabel(currentMonth)} (actual)</th>
              <th className="text-right" style={{ width: '16%' }}>{formatMesLabel(prevMes)} (ant.)</th>
              <th className="text-right" style={{ width: '10%' }}>Δ vs ant.</th>
              <th className="text-right" style={{ width: '16%' }}>Prom. 6 meses</th>
              <th className="text-right" style={{ width: '10%' }}>Δ vs prom.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: '#1e293b' }}>{row.cat}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {row.current > 0 ? formatMonto(row.current, moneda) : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {row.prev > 0 ? formatMonto(row.prev, moneda) : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {row.deltaVsPrev !== null ? (
                    <span
                      style={{
                        fontWeight: 700,
                        color: row.deltaVsPrev >= 0 ? '#059669' : '#e11d48',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {row.deltaVsPrev > 0 ? '+' : ''}
                      {row.deltaVsPrev.toFixed(1)}%
                    </span>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>—</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', color: '#94a3b8', fontVariantNumeric: 'tabular-nums', fontSize: '8pt' }}>
                  {row.avg6 > 0 ? formatMonto(row.avg6, moneda) : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {row.deltaVsAvg !== null ? (
                    <span
                      style={{
                        fontWeight: 700,
                        color: row.deltaVsAvg >= 0 ? '#059669' : '#e11d48',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {row.deltaVsAvg > 0 ? '+' : ''}
                      {row.deltaVsAvg.toFixed(1)}%
                    </span>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontWeight: 700 }}>Totales</td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {formatMonto(rows.reduce((s, r) => s + r.current, 0), moneda)}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#64748b' }}>
                {formatMonto(rows.reduce((s, r) => s + r.prev, 0), moneda)}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
