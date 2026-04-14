import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// =============================================
// Tarjeta de resumen — diseño profesional
// =============================================

const accentMap: Record<
  string,
  {
    iconBg: string;
    iconText: string;
    valueText: string;
    deltaBg: string;
    deltaText: string;
    topBar: string;
  }
> = {
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    valueText: 'text-slate-800',
    deltaBg: 'bg-emerald-50',
    deltaText: 'text-emerald-700',
    topBar: 'bg-emerald-500',
  },
  rose: {
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-600',
    valueText: 'text-slate-800',
    deltaBg: 'bg-rose-50',
    deltaText: 'text-rose-700',
    topBar: 'bg-rose-500',
  },
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    valueText: 'text-slate-800',
    deltaBg: 'bg-blue-50',
    deltaText: 'text-blue-700',
    topBar: 'bg-blue-500',
  },
  red: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-700',
    valueText: 'text-slate-800',
    deltaBg: 'bg-red-50',
    deltaText: 'text-red-700',
    topBar: 'bg-red-600',
  },
  orange: {
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    valueText: 'text-slate-800',
    deltaBg: 'bg-orange-50',
    deltaText: 'text-orange-700',
    topBar: 'bg-orange-500',
  },
  indigo: {
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    valueText: 'text-slate-800',
    deltaBg: 'bg-indigo-50',
    deltaText: 'text-indigo-700',
    topBar: 'bg-indigo-500',
  },
};

interface SummaryCardProps {
  label: string;
  value: string;
  accent: string;
  icon?: React.ReactNode;
  sub?: string;
  delta?: number | null;
  invertDelta?: boolean;
}

export function SummaryCard({
  label,
  value,
  accent,
  icon,
  sub,
  delta,
  invertDelta = false,
}: SummaryCardProps) {
  const a = accentMap[accent] ?? accentMap.blue;

  const deltaEl = (() => {
    if (delta === undefined || delta === null) return null;

    const isPositive = delta > 0;
    const isNeutral = delta === 0;
    const positiveIsGood = !invertDelta;
    const isGood = isNeutral ? null : isPositive === positiveIsGood;

    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
    const sign = isPositive ? '+' : '';

    const colorCls = isNeutral
      ? 'bg-slate-100 text-slate-500'
      : isGood
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-rose-100 text-rose-700';

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorCls}`}>
        <Icon className="w-3 h-3" />
        {sign}{delta.toFixed(1)}% vs mes ant.
      </span>
    );
  })();

  return (
    <div className="relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden print:break-inside-avoid">
      {/* Barra de color superior */}
      <div className={`h-1 w-full ${a.topBar}`} />

      <div className="p-5">
        {/* Header: label + icono */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-tight">
            {label}
          </p>
          {icon && (
            <span className={`p-2 rounded-xl ${a.iconBg} ${a.iconText} flex-shrink-0`}>
              {icon}
            </span>
          )}
        </div>

        {/* Valor principal */}
        <p className={`text-2xl font-extrabold ${a.valueText} tabular-nums leading-none mb-3`}>
          {value}
        </p>

        {/* Footer: sub + delta */}
        <div className="flex items-center gap-2 flex-wrap min-h-[22px]">
          {sub && (
            <span className="text-xs font-semibold text-slate-400">{sub}</span>
          )}
          {deltaEl}
        </div>
      </div>
    </div>
  );
}
