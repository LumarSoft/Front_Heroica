"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularTotal, formatMonto } from "@/lib/formatters";
import type { Transaction } from "@/lib/types";

// Clases compartidas para los TabsTrigger (segmented pill)
const TRIGGER_CLASS =
    "!px-5 !py-2.5 !h-auto !rounded-[9px] !text-sm !font-semibold !transition-all !duration-200 !text-[#888888] !border-none !outline-none !ring-0 !ring-offset-0 !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-none focus-visible:!outline-none data-[state=active]:!bg-white data-[state=active]:!text-[#002868] data-[state=active]:!shadow-[0_1px_3px_rgba(0,0,0,0.12)] data-[state=inactive]:hover:!text-[#002868]/70";

interface CajaTabsProps {
    saldoReal: Transaction[];
    saldoNecesario: Transaction[];
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
}

/**
 * Panel de resumen + tabs (Saldo Real / Saldo Necesario)
 * con estilo segmented pill. Recibe children para los TabsContent.
 */
export function CajaTabs({
    saldoReal,
    saldoNecesario,
    children,
    value,
    onValueChange,
}: CajaTabsProps) {
    const totalReal = calcularTotal(saldoReal);
    const totalNecesario = calcularTotal(saldoNecesario);
    const diferenciaTotal = totalReal + totalNecesario;

    const tabsProps = value !== undefined
        ? { value, onValueChange }
        : { defaultValue: "real" };

    return (
        <Tabs {...tabsProps} className="w-full flex-grow flex flex-col">
            {/* Panel de resumen + tabs integrado */}
            <div className="bg-white rounded-2xl border border-[#E0E0E0] shadow-sm mb-6 px-6 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Tabs tipo segmented pill */}
                    <TabsList className="grid grid-cols-2 w-full md:w-auto !bg-[#ECEEF1] !p-[3px] !rounded-xl !h-auto overflow-hidden">
                        <TabsTrigger value="real" className={TRIGGER_CLASS}>
                            <span className="font-bold">Saldo Real</span>{" "}
                            <span
                                className={`font-medium text-xs ${totalReal >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                                {formatMonto(totalReal)}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="necesario" className={TRIGGER_CLASS}>
                            <span className="font-bold">Saldo Necesario</span>{" "}
                            <span
                                className={`font-medium text-xs ${diferenciaTotal >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                            >
                                {formatMonto(diferenciaTotal)}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Total prominente a la derecha */}
                    <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#999999]">
                            Total Saldo Real
                        </p>
                        <p
                            className={`text-3xl font-bold tabular-nums ${totalReal >= 0 ? "text-[#002868]" : "text-rose-600"}`}
                        >
                            {formatMonto(totalReal)}
                        </p>
                    </div>
                </div>
            </div>

            {children}
        </Tabs>
    );
}

// Re-export TabsContent for convenience
export { TabsContent } from "@/components/ui/tabs";
