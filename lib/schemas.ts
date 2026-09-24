import { z } from 'zod'
import { isValidCuit } from './validators'

// ── CBU / CVU ─────────────────────────────────────────────────────────────
export const CBU_DIGITOS = 22

// Para campos CBU obligatorios (ej: cuentas bancarias de sucursal)
export const cbuRequeridoSchema = z
  .string()
  .regex(/^\d+$/, 'El CBU o CVU solo debe contener dígitos')
  .length(CBU_DIGITOS, `El CBU o CVU debe tener exactamente ${CBU_DIGITOS} dígitos`)

// Para campos CBU opcionales (ej: datos bancarios de un empleado)
export const cbuOpcionalSchema = z
  .string()
  .refine(val => val === '' || (val.length === CBU_DIGITOS && /^\d+$/.test(val)), {
    message: `El CBU o CVU debe tener exactamente ${CBU_DIGITOS} dígitos`,
  })

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
  cuit: z.union([z.string().refine(v => isValidCuit(v), 'El CUIT debe tener exactamente 11 dígitos'), z.literal('')]),
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

// ── Seguimiento personal de pagos ─────────────────────────────────────────
const nullableString = z
  .string()
  .nullish()
  .transform(value => value ?? undefined)

const nullableNumber = z.coerce
  .number()
  .nullish()
  .transform(value => value ?? undefined)

export const pagoPendienteSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    user_id: z.coerce.number().int().positive().optional(),
    sucursal_id: nullableNumber,
    fecha: z.string(),
    concepto: z.string(),
    monto: z.coerce.number(),
    comentarios: nullableString,
    descripcion_id: nullableNumber,
    proveedor_id: nullableNumber,
    categoria_id: nullableNumber,
    subcategoria_id: nullableNumber,
    descripcion_nombre: nullableString,
    proveedor_nombre: nullableString,
    sucursal_nombre: nullableString,
    moneda: z.enum(['ARS', 'USD']).optional(),
    estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'completado']),
    prioridad: z
      .enum(['baja', 'media', 'alta'])
      .nullish()
      .transform(value => value ?? 'media'),
    tipo: nullableString,
    motivo_rechazo: nullableString,
    usuario_creador_nombre: nullableString,
    usuario_revisor_nombre: nullableString,
    fecha_revision: nullableString,
    created_at: nullableString,
    updated_at: nullableString,
  })
  .passthrough()

export const misSolicitudesPagoResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(pagoPendienteSchema),
  message: z.string().optional(),
})
