// =============================================
// Funciones utilitarias de formateo compartidas
// =============================================

/**
 * Formatea una fecha ISO a formato dd/mm/aaaa
 */
export function formatFecha(fechaISO: string): string {
    if (!fechaISO) return "-";
    // Si viene completa con hora, nos quedamos con la porción de fecha 'YYYY-MM-DD'
    const datePart = fechaISO.includes('T') ? fechaISO.split("T")[0] : fechaISO;
    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) return fechaISO; // Fallback si el formato no es el esperado
    return `${day}/${month}/${year.substring(0, 4)}`;
}

/**
 * Formatea un monto numérico a formato de moneda ARS
 */
export function formatMonto(monto: number | string): string {
    const montoNum = typeof monto === "string" ? parseFloat(monto) : monto;
    const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
    }).format(Math.abs(montoNum));

    return montoNum < 0 ? `-${formatted}` : formatted;
}

/**
 * Calcula el total de un array de transacciones
 */
export function calcularTotal(
    transactions: { monto: number | string }[]
): number {
    return transactions.reduce((sum, t) => {
        const monto = typeof t.monto === "string" ? parseFloat(t.monto) : t.monto;
        return sum + monto;
    }, 0);
}

/** Mapa de colores para badges de estado */
export const ESTADO_COLOR_MAP: Record<string, string> = {
    completado: "bg-emerald-100 text-emerald-800",
    aprobado: "bg-blue-100 text-blue-800",
    rechazado: "bg-rose-100 text-rose-800",
    pendiente: "bg-amber-100 text-amber-800",
};

/** Mapa de colores para badges de prioridad */
export const PRIORIDAD_COLOR_MAP: Record<string, string> = {
    alta: "bg-rose-100 text-rose-800",
    media: "bg-amber-100 text-amber-800",
    baja: "bg-gray-100 text-gray-800",
};

/**
 * Devuelve clases CSS para el badge de estado
 */
export function getEstadoColor(estado: string): string {
    return ESTADO_COLOR_MAP[estado] ?? "bg-gray-100 text-gray-800";
}

/**
 * Devuelve clases CSS para el badge de prioridad
 */
export function getPrioridadColor(prioridad: string): string {
    return PRIORIDAD_COLOR_MAP[prioridad] ?? "bg-gray-100 text-gray-800";
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
