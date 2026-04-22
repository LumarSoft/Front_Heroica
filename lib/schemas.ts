import { z } from 'zod'

// ── Login ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

// ── Sucursal ───────────────────────────────────────────────────────────────
export const sucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  razon_social: z.string().optional(),
  cuit: z.union([z.string().regex(/^\d{2}-\d{8}-\d$/, 'CUIT inválido (XX-XXXXXXXX-X)'), z.literal('')]),
  direccion: z.string().optional(),
})
export type SucursalFormValues = z.infer<typeof sucursalSchema>

// ── Movimiento ─────────────────────────────────────────────────────────────
export const movimientoBaseSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  concepto: z.string().optional(),
  monto: z
    .string()
    .min(1, 'El monto es obligatorio')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) !== 0, 'El monto debe ser diferente de cero'),
  categoria_id: z.string().min(1, 'Debes seleccionar una categoría'),
  subcategoria_id: z.string().min(1, 'Debes seleccionar una subcategoría'),
  descripcion_id: z.string().min(1, 'Debes seleccionar una descripción'),
  proveedor_id: z.string().optional(), // oculto temporalmente a pedido del cliente
  comentarios: z.string().optional(),
  prioridad: z.enum(['baja', 'media', 'alta']),
})

export const movimientoBancoSchema = movimientoBaseSchema.extend({
  banco_id: z.string().min(1, 'Debes seleccionar un banco'),
  medio_pago_id: z.string().min(1, 'Debes seleccionar un medio de pago'),
})

// ── Configuración ──────────────────────────────────────────────────────────
export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  tipo: z.enum(['ingreso', 'egreso']),
})
export type CategoriaFormValues = z.infer<typeof categoriaSchema>

export const subcategoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  categoria_id: z.number().int().positive('Debes seleccionar una categoría'),
})
export type SubcategoriaFormValues = z.infer<typeof subcategoriaSchema>

export const bancoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  codigo: z.string().optional(),
})
export type BancoFormValues = z.infer<typeof bancoSchema>

export const medioPagoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
})
export type MedioPagoFormValues = z.infer<typeof medioPagoSchema>
