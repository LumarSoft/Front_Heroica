import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { formatMonto } from '@/lib/formatters'
import type { ReportBreakdownItem, PieTooltipProps } from './types'

// =============================================
// Tooltip personalizado para gráficos de torta
// =============================================

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c']

function CustomPieTooltip({ active, payload }: PieTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-slate-800">{item.name}</p>
        <p className="text-slate-600">{formatMonto(item.value, (payload[0] as any).payload.moneda)}</p>
      </div>
    )
  }
  return null
}

// =============================================
// Fila con barra de progreso para distribución
// =============================================

function DistributionRow({
  item,
  index,
  total,
  color,
  isClickable,
  isBack = false,
  onClick,
  moneda,
}: {
  item: ReportBreakdownItem
  index: number
  total: number
  color: string
  isClickable: boolean
  isBack?: boolean
  onClick?: () => void
  moneda?: 'ARS' | 'USD'
}) {
  const pct = total > 0 ? (item.value / total) * 100 : 0

  return (
    <div
      className={`group rounded-lg p-3 transition-all duration-150 print:break-inside-avoid ${isClickable ? 'cursor-pointer hover:bg-slate-100 active:scale-[0.99]' : ''}`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span
            className={`text-sm font-medium text-slate-700 truncate ${isClickable ? 'group-hover:text-slate-900' : ''}`}
          >
            {item.name}
            {isClickable && !isBack && (
              <span className="ml-1 text-xs text-slate-400 group-hover:text-slate-500">▸</span>
            )}
            {isClickable && isBack && <span className="ml-1 text-xs text-slate-400 group-hover:text-slate-500">↩</span>}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-xs font-mono text-slate-500 w-10 text-right">{pct.toFixed(1)}%</span>
          <span className="text-sm font-bold text-slate-800 w-28 text-right tabular-nums">
            {formatMonto(item.value, moneda)}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// =============================================
// Breadcrumb para drill-down de categorías
// =============================================

function DrillDownBreadcrumb({
  root,
  selected,
  onBack,
  colorClass,
}: {
  root: string
  selected: string | null
  onBack: () => void
  colorClass: string
}) {
  if (!selected) return null
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-1">
      <button
        onClick={onBack}
        className={`font-medium underline underline-offset-2 decoration-dotted transition-colors ${colorClass}`}
      >
        {root}
      </button>
      <span className="text-slate-400">›</span>
      <span className="font-semibold text-slate-800">{selected}</span>
    </nav>
  )
}

// =============================================
// Panel de desglose con gráfico de torta + lista
// =============================================

interface BreakdownPanelProps {
  breakdownData: ReportBreakdownItem[]
  currentData: ReportBreakdownItem[]
  currentTotal: number
  selectedCategory: string | null
  onSliceClick: (name: string) => void
  onBack: () => void
  colorOffset: number
  emptyMessage: string
  valueColorClass: string
  drillDownRoot?: string
  drillDownColorClass?: string
  moneda?: 'ARS' | 'USD'
}

export function BreakdownPanel({
  breakdownData,
  currentData,
  currentTotal,
  selectedCategory,
  onSliceClick,
  onBack,
  colorOffset,
  emptyMessage,
  valueColorClass,
  drillDownRoot = 'Todas las categorías',
  drillDownColorClass = 'text-slate-600 hover:text-slate-700',
  moneda = 'ARS',
}: BreakdownPanelProps) {
  // Agregar moneda a los datos para que el tooltip la pueda leer
  const chartData = breakdownData.map(d => ({ ...d, moneda }))

  return (
    <>
      <DrillDownBreadcrumb
        root={drillDownRoot}
        selected={selectedCategory}
        onBack={onBack}
        colorClass={drillDownColorClass}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {/* Pie */}
        <div className="h-72 flex items-center justify-center">
          {breakdownData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value">
                  {breakdownData.map((entry, index) => {
                    const color = COLORS[(index + colorOffset) % COLORS.length]
                    const isSelected = selectedCategory === entry.name
                    const isDimmed = selectedCategory && !isSelected
                    const hasSubs = (entry.subcategorias?.length ?? 0) > 0
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isDimmed ? '#E5E7EB' : color}
                        stroke={isSelected ? '#1e293b' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                        style={{
                          cursor: hasSubs ? 'pointer' : 'default',
                          transition: 'opacity 0.2s',
                          opacity: isDimmed ? 0.5 : 1,
                        }}
                        onClick={() => hasSubs && onSliceClick(entry.name)}
                      />
                    )
                  })}
                </Pie>
                <RechartsTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm">{emptyMessage}</p>
          )}
        </div>

        {/* List */}
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            {selectedCategory ? `Subcategorías de "${selectedCategory}"` : 'Por categoría — clic para desglosar ▸'}
          </p>
          <div className="space-y-1 overflow-auto max-h-64 print:overflow-visible print:max-h-none pr-1">
            {currentData.map((item, i) => {
              const color = selectedCategory
                ? COLORS[(breakdownData.findIndex(c => c.name === selectedCategory) + colorOffset) % COLORS.length]
                : COLORS[(i + colorOffset) % COLORS.length]
              const isClickable = !selectedCategory && (item.subcategorias?.length ?? 0) > 0
              return (
                <DistributionRow
                  key={i}
                  item={item}
                  index={i}
                  total={currentTotal}
                  color={color}
                  isClickable={isClickable}
                  onClick={() => onSliceClick(item.name)}
                  moneda={moneda}
                />
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center px-3">
            {selectedCategory ? (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                Volver a categorías
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            )}
            <span className={`text-base font-extrabold tabular-nums ${valueColorClass}`}>
              {formatMonto(currentTotal, moneda)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
