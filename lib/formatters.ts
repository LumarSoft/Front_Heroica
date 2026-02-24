// =============================================
// Funciones utilitarias de formateo compartidas
// =============================================

/**
 * Formatea una fecha ISO a formato dd/mm/aaaa
 */
export function formatFecha(fechaISO: string): string {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

/**
 * Devuelve clases CSS para el badge de estado
 */
export function getEstadoColor(estado: string): string {
    switch (estado) {
        case "completado":
            return "bg-emerald-100 text-emerald-800";
        case "aprobado":
            return "bg-blue-100 text-blue-800";
        case "rechazado":
            return "bg-rose-100 text-rose-800";
        case "pendiente":
            return "bg-amber-100 text-amber-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

/**
 * Devuelve clases CSS para el badge de prioridad
 */
export function getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
        case "alta":
            return "bg-rose-100 text-rose-800";
        case "media":
            return "bg-amber-100 text-amber-800";
        case "baja":
            return "bg-gray-100 text-gray-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
