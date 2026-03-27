"use client";

import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

interface PageHeaderProps {
    title: string;
    subtitle: string;
    onNewMovimiento: () => void;
    onCompraVentaDivisas?: () => void;
    isReadOnly?: boolean;
}

/**
 * Cabecera compartida con título y botones de acción.
 * Opcionalmente muestra el botón de Compra-Venta de Divisas (solo para caja ARS).
 */
export function PageHeader({
    title,
    subtitle,
    onNewMovimiento,
    onCompraVentaDivisas,
    isReadOnly = false,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
            <div>
                <h1 className="text-3xl font-bold text-[#002868] mb-1">{title}</h1>
                <p className="text-sm text-[#666666]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
                {onCompraVentaDivisas && (
                    <Button
                        onClick={!isReadOnly ? onCompraVentaDivisas : undefined}
                        disabled={isReadOnly}
                        variant="outline"
                        className="cursor-pointer border-[#002868] text-[#002868] hover:bg-[#002868] hover:text-white font-semibold px-5 py-3 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Compra-Venta de Divisas
                    </Button>
                )}
                <Button
                    onClick={!isReadOnly ? onNewMovimiento : undefined}
                    disabled={isReadOnly}
                    className="cursor-pointer bg-[#002868] hover:bg-[#003d8f] text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                        />
                    </svg>
                    Nuevo Movimiento
                </Button>
            </div>
        </div>
    );
}
