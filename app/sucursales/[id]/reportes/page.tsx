"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatMonto } from "@/lib/formatters";
import type { Sucursal } from "@/lib/types";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

// ─── Custom Tooltip for Pie Charts ───────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-slate-800">{item.name}</p>
        <p className="text-slate-600">{formatMonto(item.value)}</p>
      </div>
    );
  }
  return null;
};

// ─── Progress Row Component ───────────────────────────────────────────────────
function DistributionRow({
  item,
  index,
  total,
  color,
  isClickable,
  isBack = false,
  onClick,
}: {
  item: any;
  index: number;
  total: number;
  color: string;
  isClickable: boolean;
  isBack?: boolean;
  onClick?: () => void;
}) {
  const pct = total > 0 ? (item.value / total) * 100 : 0;

  return (
    <div
      className={`group rounded-lg p-3 transition-all duration-150 ${isClickable ? "cursor-pointer hover:bg-slate-100 active:scale-[0.99]" : ""
        }`}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span
            className={`text-sm font-medium text-slate-700 truncate ${isClickable ? "group-hover:text-slate-900" : ""
              }`}
          >
            {item.name}
            {isClickable && !isBack && (
              <span className="ml-1 text-xs text-slate-400 group-hover:text-slate-500">▸</span>
            )}
            {isClickable && isBack && (
              <span className="ml-1 text-xs text-slate-400 group-hover:text-slate-500">↩</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-xs font-mono text-slate-500 w-10 text-right">
            {pct.toFixed(1)}%
          </span>
          <span className="text-sm font-bold text-slate-800 w-28 text-right tabular-nums">
            {formatMonto(item.value)}
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Breadcrumb for drill-down ────────────────────────────────────────────────
function DrillDownBreadcrumb({
  root,
  selected,
  onBack,
  colorClass,
}: {
  root: string;
  selected: string | null;
  onBack: () => void;
  colorClass: string;
}) {
  if (!selected) return null;
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
  );
}

export default function ReportesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isGuardLoading } = useAuthGuard();

  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIngresoCategory, setSelectedIngresoCategory] = useState<string | null>(null);
  const [selectedEgresoCategory, setSelectedEgresoCategory] = useState<string | null>(null);

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  useEffect(() => {
    if (isGuardLoading) return;
    fetchSucursal();
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuardLoading, params.id, startDate, endDate]);

  const fetchSucursal = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)));
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSucursal(data.data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar sucursal");
    }
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    setSelectedIngresoCategory(null);
    setSelectedEgresoCategory(null);
    try {
      const url = API_ENDPOINTS.REPORTES.GET_BY_SUCURSAL(params.id as string, startDate, endDate);
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setReportData(data.data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar reportes");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Computed data ────────────────────────────────────────────────────────────
  const currentIngresosData = useMemo(() => {
    if (!reportData?.ingresosBreakdown) return [];
    if (selectedIngresoCategory) {
      const cat = reportData.ingresosBreakdown.find((c: any) => c.name === selectedIngresoCategory);
      return cat ? cat.subcategorias : [];
    }
    return reportData.ingresosBreakdown;
  }, [reportData, selectedIngresoCategory]);

  const currentIngresosTotal = useMemo(() => {
    if (!reportData?.ingresosBreakdown) return 0;
    if (selectedIngresoCategory) {
      const cat = reportData.ingresosBreakdown.find((c: any) => c.name === selectedIngresoCategory);
      return cat ? cat.value : 0;
    }
    return reportData.resumen.ingresos;
  }, [reportData, selectedIngresoCategory]);

  const currentEgresosData = useMemo(() => {
    if (!reportData?.egresosBreakdown) return [];
    if (selectedEgresoCategory) {
      const cat = reportData.egresosBreakdown.find((c: any) => c.name === selectedEgresoCategory);
      return cat ? cat.subcategorias : [];
    }
    return reportData.egresosBreakdown;
  }, [reportData, selectedEgresoCategory]);

  const currentEgresosTotal = useMemo(() => {
    if (!reportData?.egresosBreakdown) return 0;
    if (selectedEgresoCategory) {
      const cat = reportData.egresosBreakdown.find((c: any) => c.name === selectedEgresoCategory);
      return cat ? cat.value : 0;
    }
    return reportData.resumen.egresos;
  }, [reportData, selectedEgresoCategory]);

  const handlePrint = () => window.print();

  if (isGuardLoading || (!sucursal && isLoading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED] pb-24">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0]/50 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push(`/sucursales/${params.id}`)}
                variant="outline"
                size="sm"
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                ← Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#002868]">Reportes</h1>
                <p className="text-sm text-slate-500">{sucursal?.nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Label htmlFor="start" className="text-sm font-medium whitespace-nowrap">Desde</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto h-9"
                />
              </div>
              <span className="text-slate-300">–</span>
              <div className="flex items-center gap-2">
                <Label htmlFor="end" className="text-sm font-medium whitespace-nowrap">Hasta</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto h-9"
                />
              </div>
              <Button
                variant="default"
                className="ml-2 h-9 bg-[#002868] text-white hover:bg-[#003d8f]"
                onClick={handlePrint}
              >
                🖨️ Imprimir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {isLoading && !reportData ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin" />
          </div>
        ) : reportData ? (
          <div className="space-y-10 print:space-y-4">
            {/* Print header */}
            <div className="hidden print:block text-center mb-6">
              <h2 className="text-3xl font-bold text-slate-800">Reporte de Resultados</h2>
              <p className="text-slate-600">Sucursal: {sucursal?.nombre}</p>
              <p className="text-slate-500 text-sm">
                Período: {new Date(startDate).toLocaleDateString()} – {new Date(endDate).toLocaleDateString()}
              </p>
            </div>

            {/* ── 1 · Resumen General ──────────────────────────────────────── */}
            <section>
              <SectionHeading number="1" title="Resumen General del Período" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <SummaryCard
                  label="Ingresos Totales"
                  value={formatMonto(reportData.resumen.ingresos)}
                  accent="emerald"
                  icon="↑"
                />
                <SummaryCard
                  label="Egresos Totales"
                  value={formatMonto(reportData.resumen.egresos)}
                  accent="rose"
                  icon="↓"
                />
                <SummaryCard
                  label="Resultado Neto"
                  value={formatMonto(reportData.resumen.resultado)}
                  accent={reportData.resumen.resultado >= 0 ? "blue" : "red"}
                  icon={reportData.resumen.resultado >= 0 ? "=" : "!"}
                  sub={
                    reportData.resumen.resultado > 0
                      ? "Ganancia"
                      : reportData.resumen.resultado < 0
                        ? "Pérdida"
                        : "Equilibrio"
                  }
                />
                <SummaryCard
                  label="Deudas Activas"
                  value={formatMonto(reportData.resumen.deudas || 0)}
                  accent="orange"
                  icon="⚠️"
                  sub="Histórico total"
                />
              </div>
            </section>

            {/* ── 2 · Ingresos ─────────────────────────────────────────────── */}
            <section>
              <SectionHeading number="2" title="Discriminado de Ingresos" className="mt-4" />
              <DrillDownBreadcrumb
                root="Todas las categorías"
                selected={selectedIngresoCategory}
                onBack={() => setSelectedIngresoCategory(null)}
                colorClass="text-emerald-600 hover:text-emerald-700"
              />
              <BreakdownPanel
                breakdownData={reportData.ingresosBreakdown}
                currentData={currentIngresosData}
                currentTotal={currentIngresosTotal}
                selectedCategory={selectedIngresoCategory}
                onSliceClick={(name) => setSelectedIngresoCategory(name)}
                onBack={() => setSelectedIngresoCategory(null)}
                colorOffset={0}
                emptyMessage="No hay ingresos registrados en el período"
                valueColorClass="text-emerald-700"
              />
            </section>

            {/* ── 3 · Egresos ──────────────────────────────────────────────── */}
            <section className="page-break-before">
              <SectionHeading number="3" title="Discriminado de Egresos" className="mt-4" />
              <DrillDownBreadcrumb
                root="Todas las categorías"
                selected={selectedEgresoCategory}
                onBack={() => setSelectedEgresoCategory(null)}
                colorClass="text-rose-500 hover:text-rose-600"
              />
              <BreakdownPanel
                breakdownData={reportData.egresosBreakdown}
                currentData={currentEgresosData}
                currentTotal={currentEgresosTotal}
                selectedCategory={selectedEgresoCategory}
                onSliceClick={(name) => setSelectedEgresoCategory(name)}
                onBack={() => setSelectedEgresoCategory(null)}
                colorOffset={4}
                emptyMessage="No hay egresos registrados"
                valueColorClass="text-rose-600"
              />
            </section>

            {/* ── 4 · Deudas ──────────────────────────────────────── */}
            <section className="mt-8">
              <SectionHeading number="4" title="Listado de Deudas" className="mt-4" />
              <DeudaPanel deudas={reportData.detalles?.deudas || []} />
            </section>

            {/* ── Print: Detalle extendido ──────────────────────────────────── */}
            <div className="page-break-before mt-12 hidden print:block">
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">
                Detalle de Movimientos Principales
              </h2>
              <p className="text-center italic text-slate-500 mt-10 text-sm">
                En esta sección podría ir el listado detallado de movimientos (Ingresos y Egresos).
              </p>
            </div>
          </div>
        ) : null}
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { background: white !important; }
            .page-break-before { page-break-before: always; }
            .shadow-sm, .shadow-md { box-shadow: none !important; }
          }
        `,
      }} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({
  number,
  title,
  className = "",
}: {
  number: string;
  title: string;
  className?: string;
}) {
  return (
    <h2 className={`text-lg font-bold text-slate-800 mb-4 flex items-center gap-2.5 ${className}`}>
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#002868] text-white text-xs font-bold">
        {number}
      </span>
      {title}
    </h2>
  );
}

const accentMap: Record<string, { border: string; text: string; bg: string }> = {
  emerald: { border: "border-l-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" },
  rose: { border: "border-l-rose-500", text: "text-rose-600", bg: "bg-rose-50" },
  blue: { border: "border-l-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
  red: { border: "border-l-red-600", text: "text-red-700", bg: "bg-red-50" },
  orange: { border: "border-l-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
};

function SummaryCard({
  label,
  value,
  accent,
  icon,
  sub,
}: {
  label: string;
  value: string;
  accent: string;
  icon?: string;
  sub?: string;
}) {
  const a = accentMap[accent] ?? accentMap.blue;
  return (
    <Card className={`border-l-4 ${a.border} shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardHeader className="pb-1 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            {label}
          </CardTitle>
          {icon && (
            <span className={`text-lg font-bold ${a.text} opacity-40`}>{icon}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <p className={`text-3xl font-extrabold ${a.text} tabular-nums`}>{value}</p>
        {sub && <p className="text-xs font-semibold mt-1 text-slate-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BreakdownPanel({
  breakdownData,
  currentData,
  currentTotal,
  selectedCategory,
  onSliceClick,
  colorOffset,
  emptyMessage,
  valueColorClass,
  onBack,
}: {
  breakdownData: any[];
  currentData: any[];
  currentTotal: number;
  selectedCategory: string | null;
  onSliceClick: (name: string) => void;
  onBack: () => void;
  colorOffset: number;
  emptyMessage: string;
  valueColorClass: string;
}) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      {/* Pie */}
      <div className="h-72 flex items-center justify-center">
        {breakdownData?.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {breakdownData.map((entry: any, index: number) => {
                  const color = COLORS[(index + colorOffset) % COLORS.length];
                  const isSelected = selectedCategory === entry.name;
                  const isDimmed = selectedCategory && !isSelected;
                  const hasSubs = entry.subcategorias?.length > 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isDimmed ? "#E5E7EB" : color}
                      stroke={isSelected ? "#1e293b" : "transparent"}
                      strokeWidth={isSelected ? 2 : 0}
                      style={{
                        cursor: hasSubs ? "pointer" : "default",
                        transition: "opacity 0.2s",
                        opacity: isDimmed ? 0.5 : 1,
                      }}
                      onClick={() => hasSubs && onSliceClick(entry.name)}
                    />
                  );
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
          {selectedCategory
            ? `Subcategorías de "${selectedCategory}"`
            : "Por categoría — clic para desglosar ▸"}
        </p>
        <div className="space-y-1 overflow-auto max-h-64 pr-1">
          {currentData.map((item: any, i: number) => {
            const color = selectedCategory
              ? COLORS[
              (breakdownData.findIndex((c: any) => c.name === selectedCategory) + colorOffset) %
              COLORS.length
              ]
              : COLORS[(i + colorOffset) % COLORS.length];
            const isClickable = !selectedCategory && item.subcategorias?.length > 0;
            return (
              <DistributionRow
                key={i}
                item={item}
                index={i}
                total={currentTotal}
                color={color}
                isClickable={isClickable}
                onClick={() => onSliceClick(item.name)}
              />
            );
          })}
        </div>
        {/* Total row + back button */}
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
            {formatMonto(currentTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── DeudaPanel ───────────────────────────────────────────────────────────────
function getAntiguedad(fechaStr: string): { label: string; colorClass: string; dotClass: string } {
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

  if (dias <= 7) return { label: "Esta semana", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200", dotClass: "bg-emerald-400" };
  if (dias <= 30) return { label: `Hace ${dias}d`, colorClass: "text-amber-600 bg-amber-50 border-amber-200", dotClass: "bg-amber-400" };
  if (dias <= 90) return { label: `Hace ${dias}d`, colorClass: "text-orange-600 bg-orange-50 border-orange-200", dotClass: "bg-orange-400" };
  return { label: `Hace ${dias}d`, colorClass: "text-rose-600 bg-rose-50 border-rose-200", dotClass: "bg-rose-400" };
}

function DeudaPanel({ deudas }: { deudas: any[] }) {
  const total = deudas.reduce((acc: number, d: any) => acc + Math.abs(d.monto), 0);

  if (deudas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center gap-3">
        <span className="text-4xl">✅</span>
        <p className="text-slate-500 font-medium">Sin deudas registradas</p>
        <p className="text-slate-400 text-sm">No hay deudas pendientes en este período.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Total adeudado</p>
            <p className="text-2xl font-extrabold text-orange-600 tabular-nums">{formatMonto(total)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-orange-500 font-medium">{deudas.length} deuda{deudas.length !== 1 ? "s" : ""} pendiente{deudas.length !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2 mt-1.5 justify-end flex-wrap">
            <span className="flex items-center gap-1 text-xs text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />≤7 días</span>
            <span className="flex items-center gap-1 text-xs text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />≤30 días</span>
            <span className="flex items-center gap-1 text-xs text-orange-600"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />≤90 días</span>
            <span className="flex items-center gap-1 text-xs text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />90 días</span>
          </div>
        </div>
      </div>

      {/* Deuda cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {deudas.map((deuda: any, i: number) => {
          const antig = getAntiguedad(deuda.fecha);
          return (
            <div key={deuda.id ?? i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              {/* Dot indicator */}
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${antig.dotClass}`} />

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {deuda.concepto || "Sin concepto"}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">
                    {new Date(deuda.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  {deuda.categoria_nombre && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-medium">{deuda.categoria_nombre}</span>
                    </>
                  )}
                  {deuda.subcategoria_nombre && (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs text-slate-400">{deuda.subcategoria_nombre}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Antiguedad badge */}
              <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${antig.colorClass}`}>
                {antig.label}
              </span>

              {/* Amount */}
              <div className="text-right flex-shrink-0 w-28">
                <span className="font-bold text-orange-600 tabular-nums text-sm">
                  {formatMonto(Math.abs(deuda.monto))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}