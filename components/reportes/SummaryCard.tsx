import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// =============================================
// Tarjeta de resumen con acento de color
// =============================================

const accentMap: Record<string, { border: string; text: string }> = {
  emerald: { border: "border-l-emerald-500", text: "text-emerald-600" },
  rose: { border: "border-l-rose-500", text: "text-rose-600" },
  blue: { border: "border-l-blue-500", text: "text-blue-600" },
  red: { border: "border-l-red-600", text: "text-red-700" },
  orange: { border: "border-l-orange-500", text: "text-orange-600" },
};

interface SummaryCardProps {
  label: string;
  value: string;
  accent: string;
  icon?: React.ReactNode;
  sub?: string;
}

export function SummaryCard({
  label,
  value,
  accent,
  icon,
  sub,
}: SummaryCardProps) {
  const a = accentMap[accent] ?? accentMap.blue;
  return (
    <Card
      className={`border-l-4 ${a.border} shadow-sm hover:shadow-md transition-shadow duration-200 print:break-inside-avoid`}
    >
      <CardHeader className="pb-1 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            {label}
          </CardTitle>
          {icon && <span className={`${a.text} opacity-40`}>{icon}</span>}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <p className={`text-3xl font-extrabold ${a.text} tabular-nums`}>
          {value}
        </p>
        {sub && (
          <p className="text-xs font-semibold mt-1 text-slate-400">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
