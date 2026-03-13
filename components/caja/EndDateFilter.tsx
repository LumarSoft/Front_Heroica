"use client";

import { Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";

// =============================================
// Barra de filtro por fecha (solo "Hasta")
// =============================================

interface EndDateFilterProps {
    fechaHasta: string;
    onHastaChange: (v: string) => void;
    onLimpiar: () => void;
    hayFiltro: boolean;
}

export function EndDateFilter({
    fechaHasta,
    onHastaChange,
    onLimpiar,
    hayFiltro,
}: EndDateFilterProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white rounded-xl border border-[#E0E0E0] shadow-sm mb-4">
            {/* Icono + label */}
            <div className="flex items-center gap-1.5 text-[#002868]">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                    Filtrar hasta fecha
                </span>
            </div>

            {/* Campo de fecha */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5A6070]">Hasta</span>
                <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => onHastaChange(e.target.value)}
                    className="h-9 w-auto rounded-lg border-[#E0E0E0] text-sm text-[#1A1A1A] hover:border-[#B0B0B0] focus:border-[#002868] focus:ring-[#002868]/20"
                />
            </div>

            {/* Botón limpiar */}
            {hayFiltro && (
                <button
                    onClick={onLimpiar}
                    className="flex items-center gap-1 px-3 h-9 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                    <X className="w-3.5 h-3.5" />
                    Limpiar
                </button>
            )}

            {/* Indicador de filtro activo */}
            {hayFiltro && (
                <span className="ml-auto text-xs font-semibold text-[#002868] bg-[#002868]/10 px-2.5 py-1 rounded-full">
                    Filtro activo
                </span>
            )}
        </div>
    );
}
