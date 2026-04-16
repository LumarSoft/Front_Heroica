import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatMonto } from '@/lib/formatters'
import type { ReportMovimiento } from './types'

// =============================================
// Top descripciones del período agrupadas por su catálogo parametrizable
// (descripcion_nombre > concepto como fallback para datos legados)
// =============================================

interface DescripcionGroup {
  nombre: string
  total: number
  count: number
  categorias: string[]
}

function groupByDescripcion(movimientos: ReportMovimiento[]): DescripcionGroup[] {
  const map = new Map<string, DescripcionGroup>()

  for (const mov of movimientos) {
    const key = mov.descripcion_nombre || mov.concepto || 'Sin descripción'
    const existing = map.get(key)
    const cat = mov.categoria_nombre
    if (existing) {
      existing.total += Math.abs(mov.monto)
      existing.count += 1
      if (cat && !existing.categorias.includes(cat)) existing.categorias.push(cat)
    } else {
      map.set(key, {
        nombre: key,
        total: Math.abs(mov.monto),
        count: 1,
        categorias: cat ? [cat] : [],
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

interface Props {
  ingresos: ReportMovimiento[]
  egresos: ReportMovimiento[]
  moneda: 'ARS' | 'USD'
  limit?: number
}

function RankBadge({ n }: { n: number }) {
  const cls =
    n === 1
      ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
      : n === 2
        ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
        : n === 3
          ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200'
          : 'bg-slate-50 text-slate-400'
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls}`}>
      {n}
    </span>
  )
}

function DescripcionRow({
  group,
  rank,
  max,
  tipo,
  moneda,
}: {
  group: DescripcionGroup
  rank: number
  max: number
  tipo: 'ingreso' | 'egreso'
  moneda: 'ARS' | 'USD'
}) {
  const pct = max > 0 ? (group.total / max) * 100 : 0
  const color = tipo === 'ingreso' ? '#10b981' : '#f43f5e'

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors print:break-inside-avoid">
      <RankBadge n={rank} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{group.nombre}</p>
          <span className="text-xs text-slate-400 font-normal whitespace-nowrap">
            {group.count} mov{group.count !== 1 ? 's.' : '.'}
          </span>
        </div>
        {group.categorias.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {group.categorias.slice(0, 3).map((cat, i) => (
              <span
                key={i}
                className="inline-block text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium"
              >
                {cat}
              </span>
            ))}
            {group.categorias.length > 3 && (
              <span className="text-xs text-slate-400">+{group.categorias.length - 3} más</span>
            )}
          </div>
        )}
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <div className="text-right flex-shrink-0 mt-0.5">
        <p className="text-sm font-bold tabular-nums" style={{ color }}>
          {tipo === 'ingreso' ? '+' : '-'}
          {formatMonto(group.total, moneda)}
        </p>
      </div>
    </div>
  )
}

export function TopConceptosPanel({ ingresos, egresos, moneda, limit = 10 }: Props) {
  const topIngresos = groupByDescripcion(ingresos).slice(0, limit)
  const topEgresos = groupByDescripcion(egresos).slice(0, limit)
  const maxIng = topIngresos[0]?.total ?? 0
  const maxEgr = topEgresos[0]?.total ?? 0
  const totalIng = ingresos.reduce((s, m) => s + Math.abs(m.monto), 0)
  const totalEgr = egresos.reduce((s, m) => s + Math.abs(m.monto), 0)

  return (
    <>
      {/* ─── Vista UI ─── */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-100 bg-emerald-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider">
                Top {topIngresos.length} Descripciones — Ingresos
              </p>
            </div>
            <span className="text-xs text-emerald-600 font-medium">
              {topIngresos.length} de {new Set(ingresos.map(m => m.descripcion_nombre || m.concepto)).size} tipos
            </span>
          </div>
          <div className="p-2 space-y-0.5">
            {topIngresos.length === 0 ? (
              <p className="text-center text-sm text-slate-400 italic py-8">Sin movimientos registrados.</p>
            ) : (
              topIngresos.map((group, i) => (
                <DescripcionRow key={i} group={group} rank={i + 1} max={maxIng} tipo="ingreso" moneda={moneda} />
              ))
            )}
          </div>
          {topIngresos.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Mostrados: {formatMonto(topIngresos.reduce((s, g) => s + g.total, 0), moneda)}
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                Total: {formatMonto(totalIng, moneda)}
              </span>
            </div>
          )}
        </div>

        {/* Egresos */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-rose-100 bg-rose-50">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <p className="text-sm font-bold text-rose-800 uppercase tracking-wider">
                Top {topEgresos.length} Descripciones — Egresos
              </p>
            </div>
            <span className="text-xs text-rose-500 font-medium">
              {topEgresos.length} de {new Set(egresos.map(m => m.descripcion_nombre || m.concepto)).size} tipos
            </span>
          </div>
          <div className="p-2 space-y-0.5">
            {topEgresos.length === 0 ? (
              <p className="text-center text-sm text-slate-400 italic py-8">Sin movimientos registrados.</p>
            ) : (
              topEgresos.map((group, i) => (
                <DescripcionRow key={i} group={group} rank={i + 1} max={maxEgr} tipo="egreso" moneda={moneda} />
              ))
            )}
          </div>
          {topEgresos.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Mostrados: {formatMonto(topEgresos.reduce((s, g) => s + g.total, 0), moneda)}
              </span>
              <span className="text-xs font-bold text-rose-600 tabular-nums">
                Total: {formatMonto(totalEgr, moneda)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Vista impresión ─── */}
      <div className="hidden print:block">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Tabla ingresos */}
          <div>
            <p
              style={{
                fontWeight: 700,
                color: '#059669',
                fontSize: '9pt',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px solid #d1fae5',
              }}
            >
              Top {topIngresos.length} Descripciones — Ingresos
            </p>
            {topIngresos.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '9pt' }}>Sin movimientos.</p>
            ) : (
              <table className="print-table w-full">
                <thead>
                  <tr>
                    <th style={{ width: '6%', textAlign: 'center' }}>#</th>
                    <th className="text-left" style={{ width: '38%' }}>Descripción</th>
                    <th className="text-left" style={{ width: '28%' }}>Categorías</th>
                    <th className="text-right" style={{ width: '10%' }}>Movs.</th>
                    <th className="text-right" style={{ width: '18%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topIngresos.map((group, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: i === 0 ? '#b45309' : '#94a3b8' }}>
                        {i + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{group.nombre}</td>
                      <td style={{ color: '#64748b', fontSize: '8pt' }}>{group.categorias.join(', ') || '—'}</td>
                      <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '8pt' }}>{group.count}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#059669',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        +{formatMonto(group.total, moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ fontWeight: 700 }}>Total ingresos</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMonto(totalIng, moneda)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Tabla egresos */}
          <div>
            <p
              style={{
                fontWeight: 700,
                color: '#e11d48',
                fontSize: '9pt',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                paddingBottom: '4px',
                borderBottom: '1px solid #ffe4e6',
              }}
            >
              Top {topEgresos.length} Descripciones — Egresos
            </p>
            {topEgresos.length === 0 ? (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '9pt' }}>Sin movimientos.</p>
            ) : (
              <table className="print-table w-full">
                <thead>
                  <tr>
                    <th style={{ width: '6%', textAlign: 'center' }}>#</th>
                    <th className="text-left" style={{ width: '38%' }}>Descripción</th>
                    <th className="text-left" style={{ width: '28%' }}>Categorías</th>
                    <th className="text-right" style={{ width: '10%' }}>Movs.</th>
                    <th className="text-right" style={{ width: '18%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topEgresos.map((group, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: i === 0 ? '#b45309' : '#94a3b8' }}>
                        {i + 1}
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{group.nombre}</td>
                      <td style={{ color: '#64748b', fontSize: '8pt' }}>{group.categorias.join(', ') || '—'}</td>
                      <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '8pt' }}>{group.count}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#e11d48',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        -{formatMonto(group.total, moneda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ fontWeight: 700 }}>Total egresos</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#e11d48', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMonto(totalEgr, moneda)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
