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
}

export interface Categoria {
    id: number;
    nombre: string;
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
}

export interface SelectOption {
    id: number;
    nombre: string;
}
