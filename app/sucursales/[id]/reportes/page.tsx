'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { formatMonto } from '@/lib/formatters';
import type { Sucursal } from '@/lib/types';
import {
  Printer,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { SectionHeading } from '@/components/reportes/SectionHeading';
import { SummaryCard } from '@/components/reportes/SummaryCard';
import { BreakdownPanel } from '@/components/reportes/BreakdownPanel';
import { DeudaPanel } from '@/components/reportes/DeudaPanel';
import { CreditoPanel } from '@/components/reportes/CreditoPanel';
import type { ReportData } from '@/components/reportes/types';

export default function ReportesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const moneda = (searchParams.get('moneda') as 'ARS' | 'USD') || 'ARS';
  const { isGuardLoading } = useAuthGuard();

  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedIngresoCategory, setSelectedIngresoCategory] = useState<
    string | null
  >(null);
  const [selectedEgresoCategory, setSelectedEgresoCategory] = useState<
    string | null
  >(null);

  // Selector mensual con debounce para evitar fetches por cada tecla
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [debouncedMonth, setDebouncedMonth] = useState(selectedMonth);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMonth(selectedMonth), 500);
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  const isClosedMonth = useMemo(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return debouncedMonth < currentMonthStr;
  }, [debouncedMonth]);

  const { startDate, endDate } = useMemo(() => {
    const [year, month] = debouncedMonth.split('-');
    const start = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const end = `${year}-${month}-${lastDay}`;
    return { startDate: start, endDate: end };
  }, [debouncedMonth]);

  const fetchSucursal = useCallback(async () => {
    try {
      const response = await apiFetch(
        API_ENDPOINTS.SUCURSALES.GET_BY_ID(Number(params.id)),
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSucursal(data.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar sucursal';
      toast.error(message);
    }
  }, [params.id]);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setSelectedIngresoCategory(null);
    setSelectedEgresoCategory(null);
    try {
      const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
      const safeId = rawId != null ? encodeURIComponent(String(rawId)) : '';
      if (!safeId) return;
      const url = API_ENDPOINTS.REPORTES.GET_BY_SUCURSAL(
        safeId,
        startDate,
        endDate,
        moneda,
      );
      const response = await apiFetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setReportData(data.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar reportes';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, startDate, endDate, moneda]);

  useEffect(() => {
    if (isGuardLoading) return;
    fetchSucursal();
    fetchReportData();
  }, [isGuardLoading, fetchSucursal, fetchReportData]);

  // ── Computed data ────────────────────────────────────────────────────────────
  const currentIngresosData = useMemo(() => {
    if (!reportData?.ingresosBreakdown) return [];
    if (selectedIngresoCategory) {
      const cat = reportData.ingresosBreakdown.find(
        (c) => c.name === selectedIngresoCategory,
      );
      return cat?.subcategorias ?? [];
    }
    return reportData.ingresosBreakdown;
  }, [reportData, selectedIngresoCategory]);

  const currentIngresosTotal = useMemo(() => {
    if (!reportData?.ingresosBreakdown) return 0;
    if (selectedIngresoCategory) {
      const cat = reportData.ingresosBreakdown.find(
        (c) => c.name === selectedIngresoCategory,
      );
      return cat?.value ?? 0;
    }
    return reportData.resumen.ingresos;
  }, [reportData, selectedIngresoCategory]);

  const currentEgresosData = useMemo(() => {
    if (!reportData?.egresosBreakdown) return [];
    if (selectedEgresoCategory) {
      const cat = reportData.egresosBreakdown.find(
        (c) => c.name === selectedEgresoCategory,
      );
      return cat?.subcategorias ?? [];
    }
    return reportData.egresosBreakdown;
  }, [reportData, selectedEgresoCategory]);

  const currentEgresosTotal = useMemo(() => {
    if (!reportData?.egresosBreakdown) return 0;
    if (selectedEgresoCategory) {
      const cat = reportData.egresosBreakdown.find(
        (c) => c.name === selectedEgresoCategory,
      );
      return cat?.value ?? 0;
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
                onClick={() =>
                  router.push(`/sucursales/${params.id}?moneda=${moneda}`)
                }
                variant="outline"
                size="sm"
                className="border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] hover:border-[#666666] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#002868]">
                  Reportes — {moneda}
                </h1>
                <p className="text-sm text-slate-500">{sucursal?.nombre}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="month"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Mes a consultar:
                </Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-auto h-9"
                />
              </div>

              {isClosedMonth ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                  🧊 Mes Cerrado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Mes en Curso
                </span>
              )}

              <Button
                variant="default"
                className="ml-2 h-9 bg-[#002868] text-white hover:bg-[#003d8f] flex items-center gap-2"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Imprimir
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
            <div className="hidden print:flex flex-col mb-8 border-b-2 border-[#002868] pb-4">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-[#002868] tracking-tight">
                    Reporte de Resultados
                  </h2>
                  <p className="text-slate-600 font-medium text-lg mt-1">
                    Sucursal: {sucursal?.nombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800 capitalize">
                    {new Date(startDate + 'T12:00:00').toLocaleDateString(
                      'es-AR',
                      { month: 'long', year: 'numeric' },
                    )}
                  </p>
                  <p
                    className={`text-sm font-bold mt-1 uppercase tracking-widest ${isClosedMonth ? 'text-blue-600' : 'text-emerald-600'}`}
                  >
                    {isClosedMonth
                      ? 'Período Cerrado'
                      : 'Mes en Curso (Parcial)'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 1 · Resumen General ──────────────────────────────────────── */}
            <section>
              <SectionHeading number="1" title="Resumen General del Período" />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <SummaryCard
                  label="Ingresos Totales"
                  value={formatMonto(reportData.resumen.ingresos, moneda)}
                  accent="emerald"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <SummaryCard
                  label="Egresos Totales"
                  value={formatMonto(reportData.resumen.egresos, moneda)}
                  accent="rose"
                  icon={<TrendingDown className="w-5 h-5" />}
                />
                <SummaryCard
                  label="Resultado Neto"
                  value={formatMonto(reportData.resumen.resultado, moneda)}
                  accent={reportData.resumen.resultado >= 0 ? 'blue' : 'red'}
                  icon={
                    reportData.resumen.resultado >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )
                  }
                  sub={
                    reportData.resumen.resultado > 0
                      ? 'Ganancia'
                      : reportData.resumen.resultado < 0
                        ? 'Pérdida'
                        : 'Equilibrio'
                  }
                />
                <SummaryCard
                  label="Deudas (A Pagar)"
                  value={formatMonto(reportData.resumen.deudas || 0, moneda)}
                  accent="orange"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  sub="Histórico total"
                />
                <SummaryCard
                  label="Créditos (A Cobrar)"
                  value={formatMonto(reportData.resumen.creditos || 0, moneda)}
                  accent="indigo"
                  icon={<TrendingUp className="w-5 h-5" />}
                  sub="A favor nuestro"
                />
              </div>
            </section>

            {/* ── 2 · Ingresos ─────────────────────────────────────────────── */}
            <section className="page-break-before">
              <SectionHeading
                number="2"
                title="Discriminado de Ingresos"
                className="mt-4"
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
                drillDownRoot="Todas las categorías"
                drillDownColorClass="text-emerald-600 hover:text-emerald-700"
                moneda={moneda}
              />
            </section>

            {/* ── 3 · Egresos ──────────────────────────────────────────────── */}
            <section className="page-break-before">
              <SectionHeading
                number="3"
                title="Discriminado de Egresos"
                className="mt-4"
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
                drillDownRoot="Todas las categorías"
                drillDownColorClass="text-rose-500 hover:text-rose-600"
                moneda={moneda}
              />
            </section>

            {/* ── 4 · Deudas (A Pagar) ──────────────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading
                number="4"
                title="Listado de Deudas (A Pagar)"
                className="mt-4"
              />
              <DeudaPanel
                deudas={reportData.detalles?.deudas || []}
                moneda={moneda}
              />
            </section>

            {/* ── 5 · Créditos (A Cobrar) ──────────────────────────────────────── */}
            <section className="mt-8 page-break-before">
              <SectionHeading
                number="5"
                title="Listado de Créditos (A Cobrar)"
                className="mt-4"
              />
              <CreditoPanel
                creditos={reportData.detalles?.creditos || []}
                moneda={moneda}
              />
            </section>

            {/* ── Print: Detalle extendido ──────────────────────────────────── */}
            <div className="page-break-before mt-12 hidden print:block">
              <h2 className="text-xl font-bold text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">
                Detalle de Movimientos Principales
              </h2>
              {(() => {
                const allMovs = [
                  ...(reportData.detalles?.ingresos ?? []),
                  ...(reportData.detalles?.egresos ?? []),
                ].sort(
                  (a, b) =>
                    new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
                );
                if (allMovs.length === 0)
                  return (
                    <p className="text-center italic text-slate-500 mt-10 text-sm">
                      No hay movimientos en este período.
                    </p>
                  );

                return (
                  <table className="w-full text-sm text-left border-collapse mt-4">
                    <thead>
                      <tr className="border-b-2 border-slate-300 text-slate-700">
                        <th className="py-2 px-2 font-bold uppercase text-xs tracking-wider">
                          Fecha
                        </th>
                        <th className="py-2 px-2 font-bold uppercase text-xs tracking-wider">
                          Concepto
                        </th>
                        <th className="py-2 px-2 font-bold uppercase text-xs tracking-wider">
                          Categoría / Subcategoría
                        </th>
                        <th className="py-2 px-2 text-right font-bold uppercase text-xs tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allMovs.map((mov, i) => (
                        <tr
                          key={mov.id ?? i}
                          className="print:break-inside-avoid"
                        >
                          <td className="py-2 px-2 text-slate-500 whitespace-nowrap">
                            {new Date(mov.fecha).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-2 px-2 font-medium text-slate-800">
                            {mov.concepto || 'Sin concepto'}
                          </td>
                          <td className="py-2 px-2 text-slate-500 text-xs">
                            {mov.categoria_nombre || 'General'}
                            {mov.subcategoria_nombre
                              ? ` / ${mov.subcategoria_nombre}`
                              : ''}
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-bold tabular-nums whitespace-nowrap ${mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}
                          >
                            {mov.tipo === 'ingreso' ? '+' : '-'}
                            {formatMonto(Math.abs(mov.monto), moneda)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
