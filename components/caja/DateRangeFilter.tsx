"use client";

// =============================================
// Barra de filtro por fecha (solo "Hasta")
// =============================================

interface DateRangeFilterProps {
    fechaHasta: string;
    onHastaChange: (v: string) => void;
    onLimpiar: () => void;
    hayFiltro: boolean;
}

export function DateRangeFilter({
    fechaHasta,
    onHastaChange,
    onLimpiar,
    hayFiltro,
}: DateRangeFilterProps) {
    const inputClass =
        "h-9 rounded-lg border border-[#E0E0E0] bg-white px-3 text-sm text-[#1A1A1A] transition-colors hover:border-[#B0B0B0] focus:border-[#002868] focus:outline-none focus:ring-2 focus:ring-[#002868]/20";

    return (
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white rounded-xl border border-[#E0E0E0] shadow-sm mb-4">
            {/* Icono */}
            <div className="flex items-center gap-1.5 text-[#002868]">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                    />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">
                    Filtrar hasta fecha
                </span>
            </div>

            {/* Hasta */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5A6070]">Hasta</span>
                <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => onHastaChange(e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* Limpiar filtro */}
            {hayFiltro && (
                <button
                    onClick={onLimpiar}
                    className="flex items-center gap-1 px-3 h-9 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
