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
 * Formatea un monto numérico a formato de moneda (ARS o USD)
 */
export function formatMonto(monto: number | string, moneda: "ARS" | "USD" = "ARS"): string {
    const montoNum = typeof monto === "string" ? parseFloat(monto) : monto;
    const formatted = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: moneda,
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
 * Trunca un texto a la cantidad de caracteres indicada y agrega "..."
 */
export function truncarTexto(texto: string | null | undefined, max = 50): string {
    if (!texto) return "-";
    return texto.length > max ? `${texto.slice(0, max)}...` : texto;
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

/**
 * Mantiene solo números y evalúa un único punto decimal (desde una coma del usuario)
 * Útil para limpiar el input en tiempo real y prepararlo para el estado (parseFloat).
 */
export function parseInputMonto(value: string): string {
    if (!value) return "";
    // Remover puntos (separador de miles local)
    let clean = value.replace(/\./g, "");
    // Cambiar coma por punto (para JS)
    clean = clean.replace(/,/g, ".");
    // Remover caracteres no válidos (quedan solo números y punto decimal)
    clean = clean.replace(/[^0-9.]/g, "");
    
    // Asegurar que solo haya un punto decimal
    const parts = clean.split(".");
    if (parts.length > 2) {
        clean = parts[0] + "." + parts.slice(1).join("");
    }
    
    // Limitar a máximo 2 decimales
    const finalParts = clean.split(".");
    if (finalParts.length === 2 && finalParts[1].length > 2) {
       clean = finalParts[0] + "." + finalParts[1].substring(0, 2);
    }
    
    // Si empieza por punto, añadir el cero inicial
    if (clean.startsWith(".")) clean = "0" + clean;
    
    return clean;
}

/**
 * Convierte un valor numérico/cadena puro (ej: "1000.5") a un formato visible (ej: "1.000,5")
 * Mantiene la coma final si el usuario recién la escribió.
 */
export function formatInputMonto(value: string | number): string {
    if (value === null || value === undefined || value === "") return "";
    
    const strValue = value.toString();
    const [integerPart, decimalPart] = strValue.split(".");
    
    // Aplicar separador de miles a la parte entera
    const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
    
    // Retornar con coma decimal si existe parte decimal o si el string original termina en punto
    if (decimalPart !== undefined) {
        return `${formattedInteger},${decimalPart}`;
    }
    
    return formattedInteger;
}
