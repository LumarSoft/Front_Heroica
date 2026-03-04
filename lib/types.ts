// =============================================
// Tipos compartidos del módulo Sucursales
// =============================================

export interface Transaction {
    id: number;
    sucursal_id: number;
    fecha: string;
    concepto: string;
    monto: number | string;
    descripcion?: string;
    prioridad: "baja" | "media" | "alta";
    tipo: "ingreso" | "egreso" | string;
    tipo_movimiento: string;
    estado: string;
    categoria_id?: number | string;
    subcategoria_id?: number | string;
    comprobante?: string;
    banco_id?: number | string;
    medio_pago_id?: number | string;
    banco_nombre?: string;
    medio_pago_nombre?: string;
    es_deuda?: number; // 0 = sin deuda, 1 = en deuda
    fecha_original_vencimiento?: string; // ISO date string, guardada al activar deuda
}

export interface BancoParcial {
    banco_id: number;
    banco_nombre: string;
    total_real: number;
    total_necesario: number;
}

export interface PagoPendiente {
    id: number;
    fecha: string;
    concepto: string;
    monto: number | string;
    descripcion?: string;
    estado: "pendiente" | "aprobado" | "rechazado";
    prioridad: "baja" | "media" | "alta";
    tipo?: string;
    motivo_rechazo?: string;
    usuario_creador_nombre?: string;
    usuario_revisor_nombre?: string;
    created_at?: string;
}

export interface Categoria {
    id: number;
    nombre: string;
    tipo?: "ingreso" | "egreso";
}

export interface Subcategoria {
    id: number;
    categoria_id: number;
    nombre: string;
}

export interface Sucursal {
    id: number;
    nombre: string;
    razon_social: string;
    cuit: string;
    direccion: string;
    email_correspondencia?: string;
    activo: boolean;
}

export interface Documento {
    id: number;
    sucursal_id: number;
    nombre_archivo: string;
    ruta_archivo: string;
    tipo_archivo: string;
    tamano_bytes: number;
    fecha_subida: string;
    tipo_documento?: string; // Nuevo
    fecha_vencimiento?: string; // Nuevo
}

export interface CuentaBancaria {
    id: number;
    sucursal_id: number;
    cbu: string;
    alias?: string;
    tipo_cuenta?: string;
    banco?: string;
}

export interface SelectOption {
    id: number;
    nombre: string;
}
