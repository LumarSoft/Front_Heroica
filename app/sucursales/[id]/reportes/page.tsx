"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/config";
import { useAuthGuard } from "@/hooks/auth/use-auth-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatMonto } from "@/lib/formatters";
import type { Sucursal } from "@/lib/types";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#d0ed57",
  "#a4de6c",
];

export default function ReportesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isGuardLoading } = useAuthGuard();

  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar fechas (último mes por default)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(
    thirtyDaysAgo.toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  useEffect(() => {
    if (isGuardLoading) return;
    fetchSucursal();
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuardLoading, params.id, startDate, endDate]);

  const fetchSucursal = async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)),
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSucursal(data.data);
    } catch (err: any) {
      console.error("Error al cargar sucursal:", err);
      toast.error(err.message || "Error al cargar sucursal");
    }
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const url = `http://localhost:3001/api/reportes/${params.id}?startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setReportData(data.data);
    } catch (err: any) {
      console.error("Error al cargar reportes:", err);
      toast.error(err.message || "Error al cargar reportes");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isGuardLoading || (!sucursal && isLoading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E8EAED] pb-24">
      {/* Header */}
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
                <Label htmlFor="start" className="text-sm font-medium">
                  Desde
                </Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto h-9"
                />
              </div>
              <span className="text-slate-300">-</span>
              <div className="flex items-center gap-2">
                <Label htmlFor="end" className="text-sm font-medium">
                  Hasta
                </Label>
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
            <div className="w-10 h-10 border-4 border-[#002868]/30 border-t-[#002868] rounded-full animate-spin"></div>
          </div>
        ) : reportData ? (
          <div className="space-y-8 print:space-y-4">
            {/* INICIO REPORTE IMPRIMIBLE */}
            <div className="hidden print:block text-center mb-6">
              <h2 className="text-3xl font-bold text-slate-800">
                Reporte de Resultados
              </h2>
              <p className="text-slate-600">Sucursal: {sucursal?.nombre}</p>
              <p className="text-slate-500 text-sm">
                Período: {new Date(startDate).toLocaleDateString()} -{" "}
                {new Date(endDate).toLocaleDateString()}
              </p>
            </div>

            {/* 1 - Resumen General */}
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                <span>1️⃣ Resumen General del Período</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-l-4 border-l-emerald-500 shadow-md transform hover:-translate-y-1 transition duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                      Ingresos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-extrabold text-emerald-600">
                      {formatMonto(reportData.resumen.ingresos)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500 shadow-md transform hover:-translate-y-1 transition duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                      Egresos Totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-extrabold text-rose-600">
                      {formatMonto(reportData.resumen.egresos)}
                    </p>
                  </CardContent>
                </Card>
                <Card
                  className={`border-l-4 shadow-md transform hover:-translate-y-1 transition duration-300 ${reportData.resumen.resultado >= 0 ? "border-l-blue-500" : "border-l-red-600"}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-widest">
                      Resultado Neto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={`text-4xl font-extrabold ${reportData.resumen.resultado >= 0 ? "text-blue-600" : "text-red-700"}`}
                    >
                      {formatMonto(reportData.resumen.resultado)}
                    </p>
                    <p className="text-xs font-semibold mt-1 opacity-70">
                      {reportData.resumen.resultado > 0
                        ? "Ganancia"
                        : reportData.resumen.resultado < 0
                          ? "Pérdida"
                          : "Equilibrio"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 2 - Discriminado de Ingresos */}
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 mt-12 flex items-center gap-2">
                <span>2️⃣ Discriminado de Ingresos</span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="h-80 flex items-center justify-center">
                  {reportData.ingresosBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.ingresosBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: any) =>
                            `${name} ${((percent || 0) * 100).toFixed(0)}%`
                          }
                        >
                          {reportData.ingresosBreakdown.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: any) => formatMonto(value || 0)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400">
                      No hay ingresos registrados en el período
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-5 overflow-auto max-h-80">
                  <h3 className="font-semibold text-slate-700 mb-3 border-b pb-2">
                    Distribución de Ingresos
                  </h3>
                  <div className="space-y-3">
                    {reportData.ingresosBreakdown.map(
                      (item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center group"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            ></span>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-black">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-800">
                              {formatMonto(item.value)}
                            </span>
                            <span className="text-xs text-slate-500 ml-2 block w-10 text-right">
                              {(
                                (item.value / reportData.resumen.ingresos) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3 - Discriminado de Egresos */}
            <div className="page-break-before">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 mt-12 flex items-center gap-2">
                <span>3️⃣ Discriminado de Egresos</span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="h-80 flex items-center justify-center">
                  {reportData.egresosBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.egresosBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.egresosBreakdown.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[(index + 4) % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: any) => formatMonto(value || 0)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-slate-400">No hay egresos registrados</p>
                  )}
                </div>

                <div className="h-80">
                  {reportData.egresosBreakdown.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={reportData.egresosBreakdown.slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          type="number"
                          tickFormatter={(v) => `$${v / 1000}k`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <RechartsTooltip
                          cursor={{ fill: "#f3f4f6" }}
                          formatter={(value: any) => formatMonto(value || 0)}
                        />
                        <Bar
                          dataKey="value"
                          fill="#ef4444"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        >
                          {reportData.egresosBreakdown.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[(index + 4) % COLORS.length]}
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="lg:col-span-2 mt-4 bg-slate-50 rounded-lg p-5">
                  <h3 className="font-semibold text-slate-700 mb-3 border-b pb-2">
                    Top 10 Egresos (Categorías)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {reportData.egresosBreakdown
                      .slice(0, 10)
                      .map((item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center border-b border-white pb-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-slate-200 text-slate-500 w-5 h-5 flex items-center justify-center rounded-full">
                              {i + 1}
                            </span>
                            <span className="text-sm text-slate-700">
                              {item.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-rose-600">
                              {formatMonto(item.value)}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              {(
                                (item.value / reportData.resumen.egresos) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4 - Detalle Extendido (Opcional si es mucho, al imprimir sirve) */}
            <div className="page-break-before mt-12 hidden print:block">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 border-b-2 border-slate-200 pb-2">
                Detalle de Movimientos Principales
              </h2>
              <div className="text-sm">
                <p className="text-center italic text-slate-500 mt-10">
                  En esta sección impresa podría ir el listado detallado de
                  movimientos (Ingresos y Egresos) de requerirse por el analista
                  temporalmente limitados a top 50, u omitida en vistas
                  resumidas.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { background: white !important; }
          .page-break-before { page-break-before: always; }
          .shadow-sm, .shadow-md { box-shadow: none !important; }
          .border { border: 1px solid #e2e8f0 !important; }
        }
      `,
        }}
      />
    </div>
  );
}
