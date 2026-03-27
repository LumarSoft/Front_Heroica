"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown, FilterX, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { SelectOption } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface EndDateFilterProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    onLimpiar: () => void;
    hayFiltro: boolean;
    bancos?: SelectOption[];
    bancosSeleccionados?: string[];
    onBancosChange?: (ids: string[]) => void;
}

export function EndDateFilter({
    dateRange,
    onDateRangeChange,
    onLimpiar,
    hayFiltro,
    bancos,
    bancosSeleccionados = [],
    onBancosChange,
}: EndDateFilterProps) {
    const showBancoFilter = Boolean(bancos?.length && onBancosChange);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bancosSeleccionadosSet = useMemo(
        () => new Set(bancosSeleccionados),
        [bancosSeleccionados]
    );

    const handleFromSelect = (day: Date | undefined) => {
        const to = dateRange?.to;
        // Si el 'desde' es posterior al 'hasta', resetear hasta
        if (day && to && day > to) {
            onDateRangeChange({ from: day, to: undefined });
        } else {
            onDateRangeChange({ from: day, to });
        }
    };

    const handleToSelect = (day: Date | undefined) => {
        onDateRangeChange({ from: dateRange?.from, to: day });
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleBanco = (id: string) => {
        if (!onBancosChange) return;
        const next = new Set(bancosSeleccionados);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onBancosChange(Array.from(next));
    };

    const bancosLabel = useMemo(() => {
        if (!bancos?.length || bancosSeleccionadosSet.size === 0) return "Todos los bancos";
        const names = bancos
            .filter((b) => bancosSeleccionadosSet.has(b.id.toString()))
            .map((b) => b.nombre);
        if (names.length <= 2) return names.join(", ");
        return `${names.length} seleccionados`;
    }, [bancos, bancosSeleccionadosSet]);

    const triggerClass = cn(
        "h-9 min-w-[150px] justify-start text-left font-normal rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] px-3 text-sm flex items-center gap-2 transition-all hover:bg-white hover:border-[#002868]/60 hover:shadow-sm cursor-pointer"
    );

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-[#E0E0E0] shadow-sm mb-6">
            {/* Desde */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide whitespace-nowrap">
                    Desde
                </span>
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className={triggerClass}>
                            <CalendarDays className="w-4 h-4 text-[#002868] flex-shrink-0" />
                            <span className={dateRange?.from ? "text-[#1A1A1A] font-medium" : "text-[#9AA0AC]"}>
                                {dateRange?.from
                                    ? format(dateRange.from, "d MMM yyyy", { locale: es })
                                    : "dd/mm/aaaa"}
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateRange?.from}
                            onSelect={handleFromSelect}
                            disabled={(date) =>
                                dateRange?.to ? date > dateRange.to : false
                            }
                            initialFocus
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <span className="text-[#D0D0D0] text-lg font-light select-none">→</span>

            {/* Hasta */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5A6070] uppercase tracking-wide whitespace-nowrap">
                    Hasta
                </span>
                <Popover>
                    <PopoverTrigger asChild>
                        <button type="button" className={triggerClass}>
                            <CalendarDays className="w-4 h-4 text-[#002868] flex-shrink-0" />
                            <span className={dateRange?.to ? "text-[#1A1A1A] font-medium" : "text-[#9AA0AC]"}>
                                {dateRange?.to
                                    ? format(dateRange.to, "d MMM yyyy", { locale: es })
                                    : "dd/mm/aaaa"}
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateRange?.to}
                            onSelect={handleToSelect}
                            disabled={(date) =>
                                dateRange?.from ? date < dateRange.from : false
                            }
                            defaultMonth={dateRange?.from ?? dateRange?.to}
                            initialFocus
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Separador con filtro banco */}
            {showBancoFilter && (
                <div className="hidden sm:block w-px h-7 bg-[#E0E0E0]" />
            )}

            {/* Filtro Banco */}
            {showBancoFilter && (
                <div ref={containerRef} className="relative flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#002868] flex-shrink-0" />
                    <button
                        type="button"
                        onClick={() => setIsOpen((p) => !p)}
                        className="h-9 min-w-[150px] rounded-lg border border-[#E0E0E0] bg-[#F8F9FA] hover:bg-white px-3 text-sm text-[#1A1A1A] flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-[#B0B0B0]"
                    >
                        <span className="truncate">{bancosLabel}</span>
                        <ChevronDown className={`w-4 h-4 text-[#5A6070] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white border border-[#E0E0E0] rounded-xl shadow-xl p-2 z-50">
                            <div className="max-h-52 overflow-y-auto">
                                {bancos?.map((banco) => {
                                    const id = banco.id.toString();
                                    return (
                                        <label key={banco.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F6F8] cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={bancosSeleccionadosSet.has(id)}
                                                onChange={() => toggleBanco(id)}
                                                className="h-4 w-4 rounded border-[#E0E0E0] accent-[#002868] cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-[#1A1A1A] truncate">{banco.nombre}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Botón Limpiar */}
            {hayFiltro && (
                <Button
                    variant="ghost"
                    onClick={onLimpiar}
                    className="h-9 px-4 text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2 rounded-lg font-semibold transition-colors cursor-pointer ml-auto"
                >
                    <FilterX className="w-4 h-4" />
                    Limpiar
                </Button>
            )}
        </div>
    );
}
