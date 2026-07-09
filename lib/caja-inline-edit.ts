import type { Categoria, DescripcionOption, SelectOption, Transaction } from '@/lib/types'

/**
 * Lógica pura (sin JSX) de la edición "estilo Excel" de las celdas de la lista de
 * movimientos. Cada campo editable declara cómo leer su valor crudo, qué opciones ofrece
 * (para los selects) y cómo construir el patch parcial que se aplicará al movimiento.
 *
 * El patch incluye tanto los ids que persiste el backend como los `*_nombre` que la UI usa
 * para el render optimista, de modo que el cambio se ve al instante sin re-fetch.
 */

export type EditFieldKey = 'fecha' | 'monto' | 'categoria' | 'descripcion' | 'banco' | 'medio_pago'

export type EditFieldType = 'date' | 'monto' | 'select'

export interface InlineEditContext {
  categorias: Categoria[]
  descripciones: DescripcionOption[]
  bancos: SelectOption[]
  mediosPago: SelectOption[]
}

export interface EditOption {
  value: string
  label: string
}

export interface EditFieldSpec {
  type: EditFieldType
  /** Placeholder / hint del editor */
  placeholder?: string
  /** Valor crudo actual del campo, listo para el input o el select */
  getRaw: (t: Transaction) => string
  /** Opciones para los campos de tipo `select` */
  getOptions?: (t: Transaction, ctx: InlineEditContext) => EditOption[]
  /** Construye el patch parcial (ids + nombres) a partir del valor elegido */
  buildPatch: (value: string, t: Transaction, ctx: InlineEditContext) => Partial<Transaction>
}

function toOptions(items: SelectOption[]): EditOption[] {
  return items.map(i => ({ value: String(i.id), label: i.nombre }))
}

export const EDIT_FIELD_SPECS: Record<EditFieldKey, EditFieldSpec> = {
  fecha: {
    type: 'date',
    getRaw: t => (t.fecha ? t.fecha.split('T')[0] : ''),
    buildPatch: value => ({ fecha: value }),
  },

  monto: {
    type: 'monto',
    placeholder: '0,00',
    // Se edita la magnitud; el signo lo determina el tipo (ingreso/egreso) del movimiento
    getRaw: t => String(Math.abs(Number(t.monto)) || ''),
    buildPatch: (value, t) => {
      const magnitud = Math.abs(parseFloat(value) || 0)
      return { monto: t.tipo === 'egreso' ? -magnitud : magnitud }
    },
  },

  categoria: {
    type: 'select',
    placeholder: 'Categoría',
    getRaw: t => (t.categoria_id ? String(t.categoria_id) : ''),
    getOptions: (t, ctx) => toOptions(ctx.categorias.filter(c => !c.tipo || c.tipo === t.tipo)),
    buildPatch: (value, t, ctx) => {
      const nuevoId = value ? Number(value) : undefined
      const opcion = ctx.categorias.find(c => String(c.id) === value)
      const patch: Partial<Transaction> = {
        categoria_id: nuevoId,
        categoria_nombre: opcion?.nombre ?? '',
      }
      // Al cambiar de categoría la subcategoría anterior deja de ser válida
      if (nuevoId !== t.categoria_id) {
        patch.subcategoria_id = undefined
        patch.subcategoria_nombre = undefined
      }
      return patch
    },
  },

  descripcion: {
    type: 'select',
    placeholder: 'Descripción',
    getRaw: t => (t.descripcion_id ? String(t.descripcion_id) : ''),
    getOptions: (t, ctx) => toOptions(ctx.descripciones.filter(d => !d.tipo || d.tipo === t.tipo)),
    buildPatch: (value, t, ctx) => {
      const desc = ctx.descripciones.find(d => String(d.id) === value)
      if (!desc) {
        return { descripcion_id: undefined, descripcion_nombre: '' }
      }
      const categoria = ctx.categorias.find(c => c.id === desc.categoria_id)
      // La descripción arrastra su categoría/subcategoría configuradas
      return {
        descripcion_id: desc.id,
        descripcion_nombre: desc.nombre,
        categoria_id: desc.categoria_id ?? t.categoria_id,
        categoria_nombre: categoria?.nombre ?? desc.categoria_nombre ?? t.categoria_nombre ?? '',
        subcategoria_id: desc.subcategoria_id ?? undefined,
        subcategoria_nombre: desc.subcategoria_nombre ?? undefined,
      }
    },
  },

  banco: {
    type: 'select',
    placeholder: 'Banco',
    getRaw: t => (t.banco_id ? String(t.banco_id) : ''),
    getOptions: (_t, ctx) => toOptions(ctx.bancos),
    buildPatch: (value, _t, ctx) => {
      const opcion = ctx.bancos.find(b => String(b.id) === value)
      return { banco_id: value ? Number(value) : undefined, banco_nombre: opcion?.nombre ?? '' }
    },
  },

  medio_pago: {
    type: 'select',
    placeholder: 'Medio de pago',
    getRaw: t => (t.medio_pago_id ? String(t.medio_pago_id) : ''),
    getOptions: (_t, ctx) => toOptions(ctx.mediosPago),
    buildPatch: (value, _t, ctx) => {
      const opcion = ctx.mediosPago.find(m => String(m.id) === value)
      return { medio_pago_id: value ? Number(value) : undefined, medio_pago_nombre: opcion?.nombre ?? '' }
    },
  },
}
