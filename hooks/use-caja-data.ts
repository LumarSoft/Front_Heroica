'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { parseInputMonto } from '@/lib/formatters'
import { DateRange } from 'react-day-picker'
import { useAuthStore } from '@/store/authStore'
import type { Transaction, BancoParcial, Categoria, Subcategoria, SelectOption, DescripcionOption } from '@/lib/types'

// =============================================
// Tipos internos del hook
// =============================================

interface TransactionFormData {
  fecha: string
  concepto: string
  monto: string
  comentarios: string
  descripcion_id: string
  proveedor_id: string
  prioridad: 'baja' | 'media' | 'alta'
  tipo: string
  categoria_id: string
  subcategoria_id: string
  comprobante: string
  banco_id: string
  medio_pago_id: string
  numero_cheque: string
}

const INITIAL_FORM: TransactionFormData = {
  fecha: '',
  concepto: '',
  monto: '',
  comentarios: '',
  descripcion_id: '',
  proveedor_id: '',
  prioridad: 'media',
  tipo: 'ingreso',
  categoria_id: '',
  subcategoria_id: '',
  comprobante: '',
  banco_id: '',
  medio_pago_id: '',
  numero_cheque: '',
}

// =============================================
// Helper: Obtiene la parte YYYY-MM-DD de una fecha (string o Date)
// =============================================
function getISODateOnly(dateInput: string | Date | undefined): string | null {
  if (!dateInput) return null
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

  // Si es un string YYYY-MM-DD puro de MySQL, new Date(string) lo toma como UTC.
  // Para evitar desfases, si es un string de 10 caracteres, usamos los componentes UTC.
  // Si viene de un Date picker (Date object), usamos los componentes locales.
  if (typeof dateInput === 'string' && dateInput.length <= 10) {
    return date.toISOString().split('T')[0]
  }

  // Para objetos Date locales (del picker)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// =============================================
// Normaliza un movimiento recibido de la API, coerciendo monto a number
// =============================================

function normalizeTransaction(
  m: Omit<Transaction, 'monto' | 'es_deuda'> & {
    monto?: number | string
    es_deuda?: number
  },
): Transaction {
  return {
    ...m,
    // Normalizamos la fecha a YYYY-MM-DD para evitar problemas de horas/minutos
    fecha: getISODateOnly(m.fecha) || m.fecha,
    monto: Number(m.monto),
    es_deuda: m.es_deuda === 1,
  }
}

// =============================================
// Selección de endpoints según tipo de caja
// =============================================

function getEndpoints(tipo: 'efectivo' | 'banco') {
  if (tipo === 'banco') {
    return {
      getMovimientos: (sucursalId: number, moneda: string) =>
        API_ENDPOINTS.CAJA_BANCO.GET_BY_SUCURSAL(sucursalId, moneda),
      getTotales: (sucursalId: number, moneda: string) => API_ENDPOINTS.CAJA_BANCO.GET_TOTALES(sucursalId, moneda),
      update: API_ENDPOINTS.CAJA_BANCO.UPDATE,
      updateEstado: API_ENDPOINTS.CAJA_BANCO.UPDATE_ESTADO,
      toggleDeuda: API_ENDPOINTS.CAJA_BANCO.TOGGLE_DEUDA,
      deleteMovimiento: API_ENDPOINTS.CAJA_BANCO.DELETE,
    }
  }
  return {
    getMovimientos: (sucursalId: number, moneda: string) =>
      API_ENDPOINTS.MOVIMIENTOS.GET_BY_SUCURSAL(sucursalId, moneda),
    getTotales: (sucursalId: number, moneda: string) => API_ENDPOINTS.MOVIMIENTOS.GET_TOTALES(sucursalId, moneda),
    update: API_ENDPOINTS.MOVIMIENTOS.UPDATE,
    updateEstado: API_ENDPOINTS.MOVIMIENTOS.UPDATE_ESTADO,
    toggleDeuda: API_ENDPOINTS.MOVIMIENTOS.TOGGLE_DEUDA,
    deleteMovimiento: API_ENDPOINTS.MOVIMIENTOS.DELETE,
  }
}

// =============================================
// Hook principal
// =============================================

/**
 * Hook que centraliza la lógica de datos para caja-efectivo y caja-banco.
 * Maneja fetch de movimientos, totales, categorías, bancos, medios de pago,
 * y operaciones CRUD sobre movimientos.
 */
export function useCajaData(tipo: 'efectivo' | 'banco', moneda: 'ARS' | 'USD' = 'ARS') {
  const params = useParams()
  const sucursalId = useMemo(() => Number(params.id), [params.id])
  const endpoints = useMemo(() => getEndpoints(tipo), [tipo])

  // --- Estado principal ---
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // --- Datos de movimientos ---
  const [saldoReal, setSaldoReal] = useState<Transaction[]>([])
  const [saldoNecesario, setSaldoNecesario] = useState<Transaction[]>([])
  const [parciales, setParciales] = useState<BancoParcial[]>([])

  // --- Filtro por fechas ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  // --- Filtro por banco (solo relevante en caja banco) ---
  const [bancosFiltro, setBancosFiltro] = useState<string[]>([])
  // --- Búsqueda por texto (concepto, descripción, N° cheque) ---
  const [searchText, setSearchText] = useState('')
  // --- Filtro por deuda ---
  const [filtroDeuda, setFiltroDeuda] = useState<'todos' | 'solo_deudas' | 'sin_deudas'>('todos')

  // --- Catálogos ---
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [bancos, setBancos] = useState<SelectOption[]>([])
  const [mediosPago, setMediosPago] = useState<SelectOption[]>([])
  const [descripciones, setDescripciones] = useState<DescripcionOption[]>([])
  const [proveedores, setProveedores] = useState<SelectOption[]>([])

  // --- Estado de dialogs ---
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeudaDialogOpen, setIsDeudaDialogOpen] = useState(false)
  const [isNuevoMovimientoDialogOpen, setIsNuevoMovimientoDialogOpen] = useState(false)
  const [isMoverMovimientoDialogOpen, setIsMoverMovimientoDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // --- Formulario de detalles ---
  const [formData, setFormData] = useState<TransactionFormData>(INITIAL_FORM)
  const [nuevoEstado, setNuevoEstado] = useState('')

  // =============================================
  // Fetchers
  // =============================================

  const fetchTotales = useCallback(async () => {
    try {
      const response = await apiFetch(endpoints.getTotales(sucursalId, moneda))
      const data = await response.json()
      if (response.ok) {
        setParciales(data.data?.parciales || [])
      }
    } catch {
      // Non-critical background refresh
    }
  }, [endpoints, sucursalId, moneda])

  const fetchMovimientos = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await apiFetch(endpoints.getMovimientos(sucursalId, moneda))
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar movimientos')
      }

      const allMovimientos: Transaction[] = [...(data.data.saldo_real || []), ...(data.data.saldo_necesario || [])].map(
        normalizeTransaction,
      )

      const movimientosCompletados = allMovimientos.filter(m => m.estado === 'completado').sort((a, b) => b.id - a.id)

      const movimientosAprobados = allMovimientos
        .filter(m => m.estado === 'aprobado' || m.estado === 'pendiente')
        .sort((a, b) => {
          const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
          const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
          return fechaA - fechaB
        })

      setSaldoReal(movimientosCompletados)
      // Saldo necesario incluye TODOS los aprobados/pendientes (incluyendo deuda),
      // pero la deuda se identifica con es_deuda=1 para excluirla del total en UI
      setSaldoNecesario(movimientosAprobados)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar movimientos'
      setError(message)
    } finally {
      setIsLoading(false)
    }
    // Refrescar totales/parciales del API al finalizar
    fetchTotales()
  }, [endpoints, sucursalId, moneda, fetchTotales])

  const fetchCategorias = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL)
      const data = await response.json()
      if (response.ok) setCategorias(data.data || [])
    } catch {
      // Catalogue fetch failure is non-critical
    }
  }, [])

  const fetchSubcategorias = useCallback(async (categoriaId: number) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId))
      const data = await response.json()
      if (response.ok) setSubcategorias(data.data || [])
    } catch {
      // Non-critical
    }
  }, [])

  const fetchBancos = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL)
      const data = await response.json()
      if (response.ok) setBancos(data.data || [])
    } catch {
      // Non-critical
    }
  }, [])

  const fetchMediosPago = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL)
      const data = await response.json()
      if (response.ok) setMediosPago(data.data || [])
    } catch {
      // Non-critical
    }
  }, [])

  const fetchDescripciones = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.GET_ACTIVE)
      const data = await response.json()
      if (response.ok) setDescripciones(data.data || [])
    } catch {
      // Non-critical
    }
  }, [])

  const fetchProveedores = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.PROVEEDORES.GET_ALL)
      const data = await response.json()
      if (response.ok) setProveedores(data.data || [])
    } catch {
      // Non-critical
    }
  }, [])

  // --- Carga subcategorías cuando cambia la categoría seleccionada ---
  useEffect(() => {
    if (formData.categoria_id) {
      fetchSubcategorias(Number(formData.categoria_id))
    } else {
      setSubcategorias([])
    }
  }, [formData.categoria_id, fetchSubcategorias])

  // =============================================
  // Handlers de dialogs
  // =============================================

  const handleOpenDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setFormData({
      fecha: transaction.fecha ? transaction.fecha.split('T')[0] : '',
      concepto: transaction.concepto,
      monto: transaction.monto.toString(),
      comentarios: transaction.comentarios || '',
      prioridad: transaction.prioridad || 'media',
      tipo: transaction.tipo || (Number(transaction.monto) < 0 ? 'egreso' : 'ingreso'),
      categoria_id: transaction.categoria_id ? transaction.categoria_id.toString() : '',
      subcategoria_id: transaction.subcategoria_id ? transaction.subcategoria_id.toString() : '',
      descripcion_id: transaction.descripcion_id ? transaction.descripcion_id.toString() : '',
      proveedor_id: transaction.proveedor_id ? transaction.proveedor_id.toString() : '',
      comprobante: transaction.comprobante || '',
      banco_id: transaction.banco_id ? transaction.banco_id.toString() : '',
      medio_pago_id: transaction.medio_pago_id ? transaction.medio_pago_id.toString() : '',
      numero_cheque: transaction.numero_cheque || '',
    })
    setIsDetailsDialogOpen(true)
  }

  const handleOpenStateChange = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setNuevoEstado(transaction.estado || 'pendiente')
    setIsStateDialogOpen(true)
  }

  const handleOpenDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }

  const handleOpenDeuda = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDeudaDialogOpen(true)
  }

  const handleOpenMover = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsMoverMovimientoDialogOpen(true)
  }

  // =============================================
  // Operaciones CRUD
  // =============================================

  const handleSaveDetails = async () => {
    if (!selectedTransaction) return

    try {
      setIsSaving(true)
      setError('')

      const authStore = useAuthStore.getState()
      const canEditInfo = authStore.hasPermiso('editar_movimientos')
      const canEditComment = authStore.hasPermiso('agregar_comentarios')

      if (!canEditInfo && canEditComment) {
        // Solo actualizar comentario
        const response = await apiFetch(
          endpoints
            .update(selectedTransaction.id)
            .replace(
              `/api/movimientos/${selectedTransaction.id}`,
              `/api/movimientos/${selectedTransaction.id}/comentario`,
            )
            .replace(
              `/api/caja-banco/${selectedTransaction.id}`,
              `/api/caja-banco/${selectedTransaction.id}/comentario`,
            ),
          {
            method: 'PATCH',
            body: JSON.stringify({
              comentarios: formData.comentarios,
            }),
          },
        )

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Error al actualizar comentario')
        }
      } else {
        // Actualizar información completa
        const response = await apiFetch(endpoints.update(selectedTransaction.id), {
          method: 'PUT',
          body: JSON.stringify({
            fecha: formData.fecha,
            concepto: formData.concepto,
            monto: parseFloat(formData.monto),
            comentarios: formData.comentarios,
            prioridad: formData.prioridad,
            tipo: formData.tipo,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
            descripcion_id: formData.descripcion_id ? Number(formData.descripcion_id) : null,
            proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
            comprobante: formData.comprobante,
            banco_id: formData.banco_id ? Number(formData.banco_id) : null,
            medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
            numero_cheque: formData.numero_cheque || null,
          }),
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Error al actualizar movimiento')
        }
      }

      toast.success('Movimiento actualizado exitosamente')
      setIsDetailsDialogOpen(false)
      await fetchMovimientos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar movimiento'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveStateChange = async () => {
    if (!selectedTransaction) return

    try {
      setIsSaving(true)
      setError('')

      const response = await apiFetch(endpoints.updateEstado(selectedTransaction.id), {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar estado')
      }

      toast.success('Estado actualizado exitosamente')
      setIsStateDialogOpen(false)
      await fetchMovimientos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTransaction) return

    try {
      setIsSaving(true)
      setError('')

      const response = await apiFetch(endpoints.deleteMovimiento(selectedTransaction.id), { method: 'DELETE' })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar movimiento')
      }

      toast.success('Movimiento eliminado exitosamente')
      setIsDeleteDialogOpen(false)
      await fetchMovimientos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar movimiento'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDeuda = async (esDeuda: boolean, fechaOriginalVencimiento?: string) => {
    if (!selectedTransaction) return

    try {
      setIsSaving(true)
      setError('')

      const body: Record<string, unknown> = { es_deuda: esDeuda ? 1 : 0 }
      if (esDeuda && fechaOriginalVencimiento) {
        body.fecha_original_vencimiento = fechaOriginalVencimiento
      }

      const response = await apiFetch(endpoints.toggleDeuda(selectedTransaction.id), {
        method: 'PUT',
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar deuda')
      }

      toast.success(esDeuda ? 'Deuda activada exitosamente' : 'Deuda desactivada exitosamente')
      setIsDeudaDialogOpen(false)
      await fetchMovimientos()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar deuda'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'monto' || name === 'tipo_cambio') {
      setFormData(prev => ({ ...prev, [name]: parseInputMonto(value) }))
      return
    }
    if (name === 'tipo') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        categoria_id: '',
        subcategoria_id: '',
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // =============================================
  // Inicialización
  // =============================================

  const initialize = useCallback(() => {
    fetchMovimientos() // fetchMovimientos ya llama fetchTotales al finalizar
    fetchCategorias()
    fetchBancos()
    fetchMediosPago()
    fetchDescripciones()
    fetchProveedores()
  }, [fetchMovimientos, fetchCategorias, fetchBancos, fetchMediosPago, fetchDescripciones, fetchProveedores])

  // =============================================
  // Filtro por fechas (client-side)
  // =============================================

  const bancosFiltroSet = useMemo(() => {
    const ids = bancosFiltro.map(id => id.trim()).filter(Boolean)
    return new Set(ids)
  }, [bancosFiltro])

  const matchesSearch = useCallback((m: Transaction, q: string): boolean => {
    if (!q) return true
    const lower = q.toLowerCase()
    return (
      (m.concepto?.toLowerCase().includes(lower) ?? false) ||
      (m.comentarios?.toLowerCase().includes(lower) ?? false) ||
      (m.numero_cheque?.toLowerCase().includes(lower) ?? false) ||
      (m.comprobante?.toLowerCase().includes(lower) ?? false)
    )
  }, [])

  const saldoRealFiltrado = useMemo(() => {
    let filteredByDate = saldoReal
    const fromStr = getISODateOnly(dateRange?.from)
    const toStr = getISODateOnly(dateRange?.to)

    if (fromStr || toStr) {
      filteredByDate = saldoReal.filter(m => {
        if (!m.fecha) return true
        const movStr = getISODateOnly(m.fecha)
        if (!movStr) return true

        if (fromStr && movStr < fromStr) return false
        if (toStr && movStr > toStr) return false

        return true
      })
    }

    const filteredByBanco =
      bancosFiltroSet.size === 0
        ? filteredByDate
        : filteredByDate.filter(m => {
            const id = m.banco_id?.toString()
            return id ? bancosFiltroSet.has(id) : false
          })

    const filteredBySearch = searchText.trim() ? filteredByBanco.filter(m => matchesSearch(m, searchText.trim())) : filteredByBanco
    if (filtroDeuda === 'solo_deudas') return filteredBySearch.filter(m => m.es_deuda)
    if (filtroDeuda === 'sin_deudas') return filteredBySearch.filter(m => !m.es_deuda)
    return filteredBySearch
  }, [saldoReal, dateRange, bancosFiltroSet, searchText, matchesSearch, filtroDeuda])

  const { saldoNecesarioFiltrado, saldoNecesarioSinDeudaFiltrado } = useMemo(() => {
    let filteredByDate = saldoNecesario
    const fromStr = getISODateOnly(dateRange?.from)
    const toStr = getISODateOnly(dateRange?.to)

    if (fromStr || toStr) {
      filteredByDate = saldoNecesario.filter(m => {
        if (!m.fecha) return true
        const movStr = getISODateOnly(m.fecha)
        if (!movStr) return true

        if (fromStr && movStr < fromStr) return false
        if (toStr && movStr > toStr) return false

        return true
      })
    }

    const filteredByBanco =
      bancosFiltroSet.size === 0
        ? filteredByDate
        : filteredByDate.filter(m => {
            const id = m.banco_id?.toString()
            return id ? bancosFiltroSet.has(id) : false
          })

    const filteredBySearch = searchText.trim()
      ? filteredByBanco.filter(m => matchesSearch(m, searchText.trim()))
      : filteredByBanco

    let filtered = filteredBySearch
    if (filtroDeuda === 'solo_deudas') filtered = filteredBySearch.filter(m => m.es_deuda)
    else if (filtroDeuda === 'sin_deudas') filtered = filteredBySearch.filter(m => !m.es_deuda)

    return {
      saldoNecesarioFiltrado: filtered,
      saldoNecesarioSinDeudaFiltrado: filtered.filter(m => !m.es_deuda),
    }
  }, [saldoNecesario, dateRange, bancosFiltroSet, searchText, matchesSearch, filtroDeuda])

  // Parciales filtrados: agrupar saldoReal + saldoNecesarioSinDeudaFiltrado por banco_id
  const parcialesFiltrados = useMemo<BancoParcial[]>(() => {
    const map = new Map<number | string, BancoParcial>()
    const addToBanco = (m: Transaction, tipoEntry: 'real' | 'necesario') => {
      const key = m.banco_id ?? 'otros'
      if (!map.has(key)) {
        map.set(key, {
          banco_id: m.banco_id ?? 0,
          banco_nombre: m.banco_nombre ?? 'OTROS',
          total_real: 0,
          total_necesario: 0,
        })
      }
      const entry = map.get(key)!
      if (tipoEntry === 'real') entry.total_real += m.monto
      else entry.total_necesario += m.monto
    }
    saldoRealFiltrado.forEach(m => addToBanco(m, 'real'))
    saldoNecesarioSinDeudaFiltrado.forEach(m => addToBanco(m, 'necesario'))
    return Array.from(map.values())
  }, [saldoRealFiltrado, saldoNecesarioSinDeudaFiltrado])

  const limpiarFiltros = () => {
    setDateRange(undefined)
    setBancosFiltro([])
    setSearchText('')
    setFiltroDeuda('todos')
  }

  return {
    // Estado
    isLoading,
    error,
    sucursalId,
    moneda,

    // Datos (todos los movimientos, sin filtro)
    saldoReal,
    saldoRealFiltrado,
    saldoNecesario,
    saldoNecesarioSinDeuda: saldoNecesario.filter(m => !m.es_deuda),
    parciales,
    categorias,
    subcategorias,
    descripciones,
    proveedores,
    bancos,
    mediosPago,

    // Datos filtrados por fecha
    saldoNecesarioFiltrado,
    saldoNecesarioSinDeudaFiltrado,
    parcialesFiltrados,

    // Filtros
    dateRange,
    setDateRange,
    bancosFiltro,
    setBancosFiltro,
    searchText,
    setSearchText,
    filtroDeuda,
    setFiltroDeuda,
    limpiarFiltros,
    hayFiltroActivo: dateRange !== undefined || bancosFiltro.length > 0 || searchText !== '' || filtroDeuda !== 'todos',

    // Estado de dialogs
    isDetailsDialogOpen,
    setIsDetailsDialogOpen,
    isStateDialogOpen,
    setIsStateDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeudaDialogOpen,
    setIsDeudaDialogOpen,
    isNuevoMovimientoDialogOpen,
    setIsNuevoMovimientoDialogOpen,
    isMoverMovimientoDialogOpen,
    setIsMoverMovimientoDialogOpen,
    selectedTransaction,
    isSaving,

    // Formulario
    formData,
    nuevoEstado,
    setNuevoEstado,
    handleInputChange,

    // Acciones
    handleOpenDetails,
    handleOpenStateChange,
    handleOpenDelete,
    handleOpenDeuda,
    handleOpenMover,
    handleSaveDetails,
    handleSaveStateChange,
    handleDelete,
    handleSaveDeuda,

    // Fetchers
    initialize,
    fetchMovimientos,
    fetchDescripciones,
  }
}
