"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { SelectOption } from "@/lib/types";

// =============================================
// Barra de filtros (fecha y bancos)
// =============================================

interface EndDateFilterProps {
    fechaHasta: string;
    onHastaChange: (v: string) => void;
    onLimpiar: () => void;
    hayFiltro: boolean;
    bancos?: SelectOption[];
    bancosSeleccionados?: string[];
    onBancosChange?: (ids: string[]) => void;
    showFecha?: boolean;
}

export function EndDateFilter({
    fechaHasta,
    onHastaChange,
    onLimpiar,
    hayFiltro,
    bancos,
    bancosSeleccionados = [],
    onBancosChange,
    showFecha = true,
}: EndDateFilterProps) {
    const showBancoFilter = Boolean(bancos?.length && onBancosChange);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bancosSeleccionadosSet = useMemo(
        () => new Set(bancosSeleccionados),
        [bancosSeleccionados]
    );

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    const toggleBanco = (id: string) => {
        if (!onBancosChange) return;
        const next = new Set(bancosSeleccionados);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onBancosChange(Array.from(next));
    };

    const bancosLabel = useMemo(() => {
        if (!bancos?.length || bancosSeleccionadosSet.size === 0) {
            return "Todos los bancos";
        }
        const names = bancos
            .filter((b) => bancosSeleccionadosSet.has(b.id.toString()))
            .map((b) => b.nombre);
        if (names.length <= 2) return names.join(", ");
        return `${names.length} bancos seleccionados`;
    }, [bancos, bancosSeleccionadosSet]);
    return (
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white rounded-xl border border-[#E0E0E0] shadow-sm mb-4">
            {/* Icono + label */}
            {showFecha && (
                <div className="flex items-center gap-1.5 text-[#002868]">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Filtrar hasta fecha
                    </span>
                </div>
            )}

            {/* Campo de fecha */}
            {showFecha && (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#5A6070]">Hasta</span>
                    <Input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => onHastaChange(e.target.value)}
                        className="h-9 w-auto rounded-lg border-[#E0E0E0] text-sm text-[#1A1A1A] hover:border-[#B0B0B0] focus:border-[#002868] focus:ring-[#002868]/20"
                    />
                </div>
            )}

            {/* Filtro por banco */}
            {showBancoFilter && (
                <div ref={containerRef} className="relative flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#5A6070]">Banco</span>
                    <button
                        type="button"
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="h-9 min-w-[220px] rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A1A] transition-colors hover:border-[#B0B0B0] focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20 flex items-center justify-between gap-2"
                    >
                        <span className="truncate">{bancosLabel}</span>
                        <ChevronDown className="w-4 h-4 text-[#5A6070]" />
                    </button>
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full min-w-[260px] bg-white border border-[#E0E0E0] rounded-lg shadow-lg p-2 z-20">
                            <div className="max-h-56 overflow-auto">
                                {bancos?.map((banco) => {
                                    const id = banco.id.toString();
                                    const checked = bancosSeleccionadosSet.has(id);
                                    return (
                                        <label
                                            key={banco.id}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#F5F6F8] cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleBanco(id)}
                                                className="h-4 w-4 accent-[#002868]"
                                            />
                                            <span className="text-sm text-[#1A1A1A]">{banco.nombre}</span>
                                        </label>
                                    );
                                })}
                                {bancos?.length === 0 && (
                                    <p className="text-sm text-[#8A8F9C] px-2 py-1">Sin bancos</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
