'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { movimientoBaseSchema, movimientoBancoSchema } from '@/lib/schemas'
import type { Categoria, Subcategoria, SelectOption, DescripcionOption } from '@/lib/types'
import { toast } from 'sonner'

interface UseInlineMovimientoParams {
  cajaTipo: 'efectivo' | 'banco'
  moneda: 'ARS' | 'USD'
  sucursalId: number
  userId?: number
  estado: 'completado' | 'aprobado'
  defaultFecha: string
  orden: number
  categorias: Categoria[]
  descripciones: DescripcionOption[]
  bancos: SelectOption[]
  mediosPago: SelectOption[]
  onCreated: (createdId: number) => void
}

interface SubcategoriasResponse {
  data?: Subcategoria[]
}

/**
 * Lógica de la creación de movimientos "en línea": estado del formulario compacto,
 * cascada categoría/subcategoría/descripción, validación Zod y submit a los endpoints
 * de creación existentes. El componente sólo se encarga del render.
 */
export function useInlineMovimiento({
  cajaTipo,
  moneda,
  sucursalId,
  userId,
  estado,
  defaultFecha,
  orden,
  categorias,
  descripciones,
  bancos,
  mediosPago,
  onCreated,
}: UseInlineMovimientoParams) {
  const isBanco = cajaTipo === 'banco'
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso')
  const [fecha, setFecha] = useState(defaultFecha)
  const [categoriaId, setCategoriaId] = useState('')
  const [subcategoriaId, setSubcategoriaId] = useState('')
  const [descripcionId, setDescripcionId] = useState('')
  const [monto, setMonto] = useState('')
  const [prioridad, setPrioridad] = useState<'baja' | 'media' | 'alta'>('media')
  const [bancoId, setBancoId] = useState('')
  const [medioPagoId, setMedioPagoId] = useState('')

  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Cargar subcategorías al cambiar la categoría (on-demand, igual que NuevoMovimientoDialog)
  useEffect(() => {
    if (!categoriaId) {
      setSubcategorias([])
      return
    }
    let cancelado = false
    apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(Number(categoriaId)))
      .then(r => r.json())
      .then((data: SubcategoriasResponse) => {
        if (!cancelado) setSubcategorias(data.data || [])
      })
      .catch(() => {
        if (!cancelado) setSubcategorias([])
      })
    return () => {
      cancelado = true
    }
  }, [categoriaId])

  const categoriaOptions = useMemo(
    () => categorias.filter(c => c.tipo === tipo).map(c => ({ value: c.id.toString(), label: c.nombre })),
    [categorias, tipo],
  )
  const subcategoriaOptions = useMemo(
    () => subcategorias.map(s => ({ value: s.id.toString(), label: s.nombre })),
    [subcategorias],
  )
  const descripcionOptions = useMemo(
    () => descripciones.filter(d => !d.tipo || d.tipo === tipo).map(d => ({ value: d.id.toString(), label: d.nombre })),
    [descripciones, tipo],
  )
  const bancoOptions = useMemo(() => bancos.map(b => ({ value: b.id.toString(), label: b.nombre })), [bancos])
  const medioPagoOptions = useMemo(
    () => mediosPago.map(m => ({ value: m.id.toString(), label: m.nombre })),
    [mediosPago],
  )

  const handleTipoChange = (nuevoTipo: 'ingreso' | 'egreso') => {
    setTipo(nuevoTipo)
    // Categoría/subcategoría/descripción dependen del tipo → resetear
    setCategoriaId('')
    setSubcategoriaId('')
    setDescripcionId('')
  }

  const handleCategoriaChange = (value: string) => {
    setCategoriaId(value)
    setSubcategoriaId('')
  }

  const handleDescripcionChange = (value: string) => {
    const selected = descripciones.find(d => d.id.toString() === value)
    setDescripcionId(value)
    if (selected?.categoria_id) setCategoriaId(selected.categoria_id.toString())
    setSubcategoriaId(selected?.subcategoria_id ? selected.subcategoria_id.toString() : '')
  }

  const handleGuardar = useCallback(async () => {
    const schema = isBanco ? movimientoBancoSchema : movimientoBaseSchema
    const validation = schema.safeParse({
      fecha,
      concepto: '',
      monto,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId,
      descripcion_id: descripcionId,
      comentarios: '',
      prioridad,
      ...(isBanco && { banco_id: bancoId, medio_pago_id: medioPagoId }),
    })

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      toast.error(validation.error.issues[0]?.message ?? 'Faltan campos obligatorios')
      return
    }
    setErrors({})

    try {
      setIsSaving(true)
      const endpoint = isBanco ? API_ENDPOINTS.CAJA_BANCO.CREATE : API_ENDPOINTS.MOVIMIENTOS.CREATE_EFECTIVO
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          sucursal_id: sucursalId,
          user_id: userId,
          fecha,
          orden,
          concepto: '',
          monto: parseFloat(monto),
          comentarios: '',
          prioridad,
          estado,
          tipo,
          categoria_id: Number(categoriaId),
          subcategoria_id: Number(subcategoriaId),
          descripcion_id: Number(descripcionId),
          proveedor_id: null,
          comprobante: '',
          banco_id: isBanco && bancoId ? Number(bancoId) : null,
          medio_pago_id: isBanco && medioPagoId ? Number(medioPagoId) : null,
          numero_cheque: null,
          moneda,
          tipo_cambio: null,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al crear movimiento')
      toast.success('Movimiento creado')
      onCreated(Number(data.data?.id))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear movimiento')
    } finally {
      setIsSaving(false)
    }
  }, [
    isBanco,
    fecha,
    orden,
    monto,
    categoriaId,
    subcategoriaId,
    descripcionId,
    prioridad,
    bancoId,
    medioPagoId,
    sucursalId,
    userId,
    estado,
    tipo,
    moneda,
    onCreated,
  ])

  const errorRing = (field: string) => (errors[field] ? 'ring-2 ring-rose-400 rounded-lg' : '')

  return {
    isBanco,
    tipo,
    fecha,
    setFecha,
    categoriaId,
    subcategoriaId,
    setSubcategoriaId,
    descripcionId,
    monto,
    setMonto,
    prioridad,
    setPrioridad,
    bancoId,
    setBancoId,
    medioPagoId,
    setMedioPagoId,
    categoriaOptions,
    subcategoriaOptions,
    descripcionOptions,
    bancoOptions,
    medioPagoOptions,
    isSaving,
    handleTipoChange,
    handleCategoriaChange,
    handleDescripcionChange,
    handleGuardar,
    errorRing,
  }
}
