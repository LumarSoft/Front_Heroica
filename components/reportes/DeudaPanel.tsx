import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatMonto } from "@/lib/formatters";
import type { ReportDeuda } from "./types";

// =============================================
// Calcula la antigüedad de una deuda y su color
// =============================================

function getAntiguedad(fechaStr: string): { label: string; colorClass: string; dotClass: string } {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const dias = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));

    if (dias <= 7) return { label: "Esta semana", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200", dotClass: "bg-emerald-400" };
    if (dias <= 30) return { label: `Hace ${dias}d`, colorClass: "text-amber-600 bg-amber-50 border-amber-200", dotClass: "bg-amber-400" };
    if (dias <= 90) return { label: `Hace ${dias}d`, colorClass: "text-orange-600 bg-orange-50 border-orange-200", dotClass: "bg-orange-400" };
    return { label: `Hace ${dias}d`, colorClass: "text-rose-600 bg-rose-50 border-rose-200", dotClass: "bg-rose-400" };
}

// =============================================
// Panel de listado de deudas activas
// =============================================

interface DeudaPanelProps {
    deudas: ReportDeuda[];
}

export function DeudaPanel({ deudas }: DeudaPanelProps) {
    const total = deudas.reduce((acc, d) => acc + Math.abs(d.monto), 0);

    if (deudas.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
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
                    <AlertTriangle className="w-7 h-7 text-orange-500" />
                    <div>
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Total adeudado</p>
                        <p className="text-2xl font-extrabold text-orange-600 tabular-nums">{formatMonto(total)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-orange-500 font-medium">
                        {deudas.length} deuda{deudas.length !== 1 ? "s" : ""} pendiente{deudas.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 justify-end flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />≤7 días</span>
                        <span className="flex items-center gap-1 text-xs text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />≤30 días</span>
                        <span className="flex items-center gap-1 text-xs text-orange-600"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />≤90 días</span>
                        <span className="flex items-center gap-1 text-xs text-rose-600"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />90+ días</span>
                    </div>
                </div>
            </div>

            {/* Deuda cards */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                {deudas.map((deuda, i) => {
                    const antig = getAntiguedad(deuda.fecha);
                    return (
                        <div key={deuda.id ?? i} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors print:break-inside-avoid">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${antig.dotClass}`} />
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
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${antig.colorClass}`}>
                                {antig.label}
                            </span>
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
