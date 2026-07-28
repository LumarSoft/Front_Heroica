'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { parseInputMonto } from '@/lib/formatters'
import { isMedioPagoChequeLike, tieneNumeroChequeCargado } from '@/lib/cheque'
import { DateRange } from 'react-day-picker'
import { useAuthStore } from '@/store/authStore'
import { cachedFetch, CATALOG_KEYS } from '@/lib/catalog-cache'
import { buildFiltrosQS, buildPaginaQS, hayFiltrosActivos, PAGE_SIZE } from '@/lib/caja-filtros'
import type { Cursor, SaldoTipo } from '@/lib/caja-filtros'
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

// Orden por fecha y, dentro de la misma fecha, por la posición manual `orden`
// (fallback: id). Habilita inserción "arriba/abajo" y reordenamiento por drag & drop.
// Ascendente: usado en Saldo Necesario — lo más próximo a vencer arriba, lo más lejano abajo.
function sortByFechaOrden(a: Transaction, b: Transaction): number {
  const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
  const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
  if (fechaA !== fechaB) return fechaA - fechaB
  return (a.orden ?? a.id) - (b.orden ?? b.id)
}

// Descendente por fecha (lo más nuevo arriba) — usado en Saldo Real. Dentro de la misma
// fecha se mantiene el orden manual ascendente, así el drag & drop se sigue sintiendo natural.
function sortByFechaOrdenDesc(a: Transaction, b: Transaction): number {
  const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0
  const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0
  if (fechaA !== fechaB) return fechaB - fechaA
  return (a.orden ?? a.id) - (b.orden ?? b.id)
}

async function fetchCatalogo<T>(url: string): Promise<T[]> {
  const response = await apiFetch(url)
  if (!response.ok) throw new Error('Error al cargar el catálogo')
  const data = await response.json()
  return (data.data ?? []) as T[]
}

// =============================================
// Selección de endpoints según tipo de caja
// =============================================

function getEndpoints(tipo: 'efectivo' | 'banco') {
  if (tipo === 'banco') {
    return {
      getMovimientos: (sucursalId: number, moneda: string, qs: string = '') =>
        API_ENDPOINTS.CAJA_BANCO.GET_BY_SUCURSAL(sucursalId, moneda, qs),
      getTotales: (sucursalId: number, moneda: string, qs: string = '') =>
        API_ENDPOINTS.CAJA_BANCO.GET_TOTALES(sucursalId, moneda, qs),
      update: API_ENDPOINTS.CAJA_BANCO.UPDATE,
      updateEstado: API_ENDPOINTS.CAJA_BANCO.UPDATE_ESTADO,
      toggleDeuda: API_ENDPOINTS.CAJA_BANCO.TOGGLE_DEUDA,
      updateOrden: API_ENDPOINTS.CAJA_BANCO.UPDATE_ORDEN,
      deleteMovimiento: API_ENDPOINTS.CAJA_BANCO.DELETE,
    }
  }
  return {
    getMovimientos: (sucursalId: number, moneda: string, qs: string = '') =>
      API_ENDPOINTS.MOVIMIENTOS.GET_BY_SUCURSAL(sucursalId, moneda, qs),
    getTotales: (sucursalId: number, moneda: string, qs: string = '') =>
      API_ENDPOINTS.MOVIMIENTOS.GET_TOTALES(sucursalId, moneda, qs),
    update: API_ENDPOINTS.MOVIMIENTOS.UPDATE,
    updateEstado: API_ENDPOINTS.MOVIMIENTOS.UPDATE_ESTADO,
    toggleDeuda: API_ENDPOINTS.MOVIMIENTOS.TOGGLE_DEUDA,
    updateOrden: API_ENDPOINTS.MOVIMIENTOS.UPDATE_ORDEN,
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
  const [totales, setTotales] = useState<{ total_real: number; total_necesario: number }>({
    total_real: 0,
    total_necesario: 0,
  })

  const [saldoCombinado, setSaldoCombinado] = useState<Transaction[]>([])
  const [combinadaActiva, setCombinadaActiva] = useState(false)
  const [cursorCombinado, setCursorCombinado] = useState<Cursor | null>(null)
  const [hasMoreCombinado, setHasMoreCombinado] = useState(false)
  const [isLoadingMoreCombinado, setIsLoadingMoreCombinado] = useState(false)

  const [cursorReal, setCursorReal] = useState<Cursor | null>(null)
  const [cursorNecesario, setCursorNecesario] = useState<Cursor | null>(null)
  const [hasMoreReal, setHasMoreReal] = useState(false)
  const [hasMoreNecesario, setHasMoreNecesario] = useState(false)
  const [isLoadingMoreReal, setIsLoadingMoreReal] = useState(false)
  const [isLoadingMoreNecesario, setIsLoadingMoreNecesario] = useState(false)
  const requestIdRef = useRef(0)

  // --- Filtro por fechas ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  // --- Filtro por banco (solo relevante en caja banco) ---
  const [bancosFiltro, setBancosFiltro] = useState<string[]>([])
  // --- Búsqueda por texto (concepto, descripción, N° cheque) ---
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // --- Filtro por deuda ---
  const [filtroDeuda, setFiltroDeuda] = useState<'todos' | 'solo_deudas' | 'sin_deudas'>('todos')
  // --- Filtro por cheques pendientes (cheque físico / eCheq sin número) ---
  const [filtroChequesPendientes, setFiltroChequesPendientes] = useState(false)

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

  const filtrosQS = useMemo(
    () =>
      buildFiltrosQS({ dateRange, bancosFiltro, searchText: debouncedSearch, filtroDeuda, filtroChequesPendientes }),
    [dateRange, bancosFiltro, debouncedSearch, filtroDeuda, filtroChequesPendientes],
  )

  const fetchTotales = useCallback(async () => {
    try {
      const response = await apiFetch(endpoints.getTotales(sucursalId, moneda, filtrosQS))
      const data = await response.json()
      if (response.ok) {
        setParciales(data.data?.parciales || [])
        setTotales({
          total_real: Number(data.data?.total_real ?? 0),
          total_necesario: Number(data.data?.total_necesario ?? 0),
        })
      }
    } catch {
      // Non-critical background refresh
    }
  }, [endpoints, sucursalId, moneda, filtrosQS])

  const fetchPagina = useCallback(
    async (saldo: SaldoTipo, cursor: Cursor | null) => {
      const url = endpoints.getMovimientos(sucursalId, moneda, filtrosQS + buildPaginaQS(saldo, cursor))
      const response = await apiFetch(url)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al cargar movimientos')
      return {
        items: (data.data.items || []).map(normalizeTransaction) as Transaction[],
        hasMore: Boolean(data.data.hasMore),
        nextCursor: (data.data.nextCursor ?? null) as Cursor | null,
      }
    },
    [endpoints, sucursalId, moneda, filtrosQS],
  )

  const fetchMovimientos = useCallback(async () => {
    const reqId = ++requestIdRef.current
    try {
      setIsLoading(true)
      setError('')

      const [real, necesario] = await Promise.all([fetchPagina('real', null), fetchPagina('necesario', null)])
      if (reqId !== requestIdRef.current) return

      setSaldoReal(real.items.sort(sortByFechaOrdenDesc))
      setHasMoreReal(real.hasMore)
      setCursorReal(real.nextCursor)

      setSaldoNecesario(necesario.items.sort(sortByFechaOrden))
      setHasMoreNecesario(necesario.hasMore)
      setCursorNecesario(necesario.nextCursor)
    } catch (err: unknown) {
      if (reqId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Error al cargar movimientos')
    } finally {
      if (reqId === requestIdRef.current) setIsLoading(false)
    }
    fetchTotales()
  }, [fetchPagina, fetchTotales])

  const loadMoreReal = useCallback(async () => {
    if (!hasMoreReal || isLoadingMoreReal || !cursorReal) return
    const reqId = requestIdRef.current
    setIsLoadingMoreReal(true)
    try {
      const page = await fetchPagina('real', cursorReal)
      if (reqId !== requestIdRef.current) return
      setSaldoReal(prev => {
        const vistos = new Set(prev.map(m => m.id))
        return [...prev, ...page.items.filter(m => !vistos.has(m.id))].sort(sortByFechaOrdenDesc)
      })
      setHasMoreReal(page.hasMore)
      setCursorReal(page.nextCursor)
    } catch {
      toast.error('No se pudieron cargar más movimientos.')
    } finally {
      setIsLoadingMoreReal(false)
    }
  }, [hasMoreReal, isLoadingMoreReal, cursorReal, fetchPagina])

  const loadMoreNecesario = useCallback(async () => {
    if (!hasMoreNecesario || isLoadingMoreNecesario || !cursorNecesario) return
    const reqId = requestIdRef.current
    setIsLoadingMoreNecesario(true)
    try {
      const page = await fetchPagina('necesario', cursorNecesario)
      if (reqId !== requestIdRef.current) return
      setSaldoNecesario(prev => {
        const vistos = new Set(prev.map(m => m.id))
        return [...prev, ...page.items.filter(m => !vistos.has(m.id))].sort(sortByFechaOrden)
      })
      setHasMoreNecesario(page.hasMore)
      setCursorNecesario(page.nextCursor)
    } catch {
      toast.error('No se pudieron cargar más movimientos.')
    } finally {
      setIsLoadingMoreNecesario(false)
    }
  }, [hasMoreNecesario, isLoadingMoreNecesario, cursorNecesario, fetchPagina])

  // Reordenar un movimiento (drag & drop): actualiza `orden` de forma optimista y persiste.
  const reorderMovimiento = useCallback(
    async (id: number, nuevoOrden: number) => {
      const aplicar = (list: Transaction[], sortFn: typeof sortByFechaOrden) =>
        list.some(m => m.id === id) ? list.map(m => (m.id === id ? { ...m, orden: nuevoOrden } : m)).sort(sortFn) : list

      setSaldoReal(prev => aplicar(prev, sortByFechaOrdenDesc))
      setSaldoNecesario(prev => aplicar(prev, sortByFechaOrden))

      try {
        const res = await apiFetch(endpoints.updateOrden(id), {
          method: 'PATCH',
          body: JSON.stringify({ orden: nuevoOrden }),
        })
        if (!res.ok) throw new Error('Error al guardar el orden')
      } catch {
        toast.error('No se pudo guardar el nuevo orden.')
        fetchMovimientos() // revertir al estado del servidor
      }
    },
    [endpoints, fetchMovimientos],
  )

  /**
   * Edición "en línea" de una celda: aplica el cambio de forma optimista (merge + re-orden
   * por fecha) y persiste el movimiento completo vía PUT. Si el backend falla, revierte
   * recargando desde el servidor. Devuelve true si se guardó correctamente.
   */
  const updateMovimientoInline = useCallback(
    async (id: number, patch: Partial<Transaction>): Promise<boolean> => {
      const source = saldoReal.find(m => m.id === id) || saldoNecesario.find(m => m.id === id)
      if (!source) return false
      const merged: Transaction = { ...source, ...patch }

      const aplicar = (list: Transaction[], sortFn: typeof sortByFechaOrden) =>
        list.some(m => m.id === id) ? list.map(m => (m.id === id ? merged : m)).sort(sortFn) : list

      setSaldoReal(prev => aplicar(prev, sortByFechaOrdenDesc))
      setSaldoNecesario(prev => aplicar(prev, sortByFechaOrden))

      try {
        const response = await apiFetch(endpoints.update(id), {
          method: 'PUT',
          body: JSON.stringify({
            fecha: merged.fecha ? merged.fecha.split('T')[0] : merged.fecha,
            concepto: merged.concepto ?? '',
            monto: Math.abs(Number(merged.monto)),
            comentarios: merged.comentarios ?? '',
            prioridad: merged.prioridad,
            tipo: merged.tipo,
            categoria_id: merged.categoria_id ?? null,
            subcategoria_id: merged.subcategoria_id ?? null,
            descripcion_id: merged.descripcion_id ?? null,
            proveedor_id: merged.proveedor_id ?? null,
            comprobante: merged.comprobante ?? '',
            banco_id: merged.banco_id ?? null,
            medio_pago_id: merged.medio_pago_id ?? null,
            numero_cheque: merged.numero_cheque ?? null,
          }),
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.message || 'Error al actualizar el movimiento')
        }
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo guardar el cambio.')
        fetchMovimientos() // revertir al estado del servidor
        return false
      }
    },
    [saldoReal, saldoNecesario, endpoints, fetchMovimientos],
  )

  /**
   * Cambia el estado de un movimiento reubicándolo de forma optimista entre las listas de
   * saldo real (completado) y saldo necesario (aprobado). Persiste vía el endpoint de estado.
   * Lo usa el arrastre entre columnas de la vista "Dual". Devuelve true si se guardó bien.
   */
  const cambiarEstadoMovimiento = useCallback(
    async (id: number, nuevoEstado: 'completado' | 'aprobado'): Promise<boolean> => {
      const source = saldoReal.find(m => m.id === id) || saldoNecesario.find(m => m.id === id)
      if (!source) return false
      if (source.estado === nuevoEstado) return true
      const updated: Transaction = { ...source, estado: nuevoEstado }

      // Optimista: sacar de ambas listas y reinsertar en la que corresponde al nuevo estado
      if (nuevoEstado === 'completado') {
        setSaldoNecesario(prev => prev.filter(m => m.id !== id))
        setSaldoReal(prev => [...prev.filter(m => m.id !== id), updated].sort(sortByFechaOrdenDesc))
      } else {
        setSaldoReal(prev => prev.filter(m => m.id !== id))
        setSaldoNecesario(prev => [...prev.filter(m => m.id !== id), updated].sort(sortByFechaOrden))
      }

      try {
        const res = await apiFetch(endpoints.updateEstado(id), {
          method: 'PUT',
          body: JSON.stringify({ estado: nuevoEstado }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || 'Error al cambiar el estado')
        }
        fetchTotales()
        return true
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo cambiar el estado.')
        fetchMovimientos() // revertir al estado del servidor
        return false
      }
    },
    [saldoReal, saldoNecesario, endpoints, fetchMovimientos, fetchTotales],
  )

  const loadMoreCombinado = useCallback(async () => {
    if (!hasMoreCombinado || isLoadingMoreCombinado || !cursorCombinado) return
    const reqId = requestIdRef.current
    setIsLoadingMoreCombinado(true)
    try {
      const page = await fetchPagina('combinado', cursorCombinado)
      if (reqId !== requestIdRef.current) return
      setSaldoCombinado(prev => {
        const vistos = new Set(prev.map(m => m.id))
        return [...prev, ...page.items.filter(m => !vistos.has(m.id))].sort(sortByFechaOrden)
      })
      setHasMoreCombinado(page.hasMore)
      setCursorCombinado(page.nextCursor)
    } catch {
      toast.error('No se pudieron cargar más movimientos.')
    } finally {
      setIsLoadingMoreCombinado(false)
    }
  }, [hasMoreCombinado, isLoadingMoreCombinado, cursorCombinado, fetchPagina])

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await cachedFetch(CATALOG_KEYS.CATEGORIAS, () =>
        fetchCatalogo<Categoria>(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL),
      )
      setCategorias(data)
    } catch {
      // Catalogue fetch failure is non-critical
    }
  }, [])

  const fetchSubcategorias = useCallback(async (categoriaId: number) => {
    try {
      const data = await cachedFetch(CATALOG_KEYS.SUBCATEGORIAS(categoriaId), () =>
        fetchCatalogo<Subcategoria>(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId)),
      )
      setSubcategorias(data)
    } catch {
      // Non-critical
    }
  }, [])

  const fetchBancos = useCallback(async () => {
    try {
      const data = await cachedFetch(CATALOG_KEYS.BANCOS, () =>
        fetchCatalogo<SelectOption>(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL),
      )
      setBancos(data)
    } catch {
      // Non-critical
    }
  }, [])

  const fetchMediosPago = useCallback(async () => {
    try {
      const data = await cachedFetch(CATALOG_KEYS.MEDIOS_PAGO, () =>
        fetchCatalogo<SelectOption>(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL),
      )
      setMediosPago(data)
    } catch {
      // Non-critical
    }
  }, [])

  const fetchDescripciones = useCallback(async () => {
    try {
      const data = await cachedFetch(CATALOG_KEYS.DESCRIPCIONES, () =>
        fetchCatalogo<DescripcionOption>(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.GET_ACTIVE),
      )
      setDescripciones(data)
    } catch {
      // Non-critical
    }
  }, [])

  const fetchProveedores = useCallback(async () => {
    try {
      const data = await cachedFetch(CATALOG_KEYS.PROVEEDORES, () =>
        fetchCatalogo<SelectOption>(API_ENDPOINTS.CONFIGURACION.PROVEEDORES.GET_ALL),
      )
      setProveedores(data)
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 400)
    return () => clearTimeout(t)
  }, [searchText])

  useEffect(() => {
    fetchMovimientos()
  }, [filtrosQS])

  useEffect(() => {
    if (!combinadaActiva) return
    let cancelado = false
    fetchPagina('combinado', null)
      .then(page => {
        if (cancelado) return
        setSaldoCombinado(page.items.sort(sortByFechaOrden))
        setHasMoreCombinado(page.hasMore)
        setCursorCombinado(page.nextCursor)
      })
      .catch(() => {
        if (!cancelado) setSaldoCombinado([])
      })
    return () => {
      cancelado = true
    }
  }, [combinadaActiva, fetchPagina])

  // =============================================
  // Handlers de dialogs
  // =============================================

  // Handlers memoizados (sólo usan setters estables) → permiten memoizar las filas/acciones
  const handleOpenDetails = useCallback((transaction: Transaction) => {
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
  }, [])

  const handleOpenStateChange = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setNuevoEstado(transaction.estado || 'pendiente')
    setIsStateDialogOpen(true)
  }, [])

  const handleOpenDelete = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleOpenDeuda = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDeudaDialogOpen(true)
  }, [])

  const handleOpenMover = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsMoverMovimientoDialogOpen(true)
  }, [])

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
    fetchCategorias()
    fetchBancos()
    fetchMediosPago()
    fetchDescripciones()
    fetchProveedores()
  }, [fetchCategorias, fetchBancos, fetchMediosPago, fetchDescripciones, fetchProveedores])

  const saldoRealFiltrado = saldoReal
  const saldoNecesarioFiltrado = saldoNecesario
  const saldoNecesarioSinDeudaFiltrado = useMemo(() => saldoNecesario.filter(m => !m.es_deuda), [saldoNecesario])

  const saldoCombinadoFiltrado = saldoCombinado

  const parcialesFiltrados = parciales

  const limpiarFiltros = () => {
    setDateRange(undefined)
    setBancosFiltro([])
    setSearchText('')
    setFiltroDeuda('todos')
    setFiltroChequesPendientes(false)
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
    saldoCombinadoFiltrado,
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
    filtroChequesPendientes,
    setFiltroChequesPendientes,
    limpiarFiltros,
    hayFiltroActivo: hayFiltrosActivos({
      dateRange,
      bancosFiltro,
      searchText,
      filtroDeuda,
      filtroChequesPendientes,
    }),

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

    hasMoreReal,
    hasMoreNecesario,
    isLoadingMoreReal,
    isLoadingMoreNecesario,
    loadMoreReal,
    loadMoreNecesario,
    loadMoreCombinado,
    hasMoreCombinado,
    isLoadingMoreCombinado,
    setCombinadaActiva,
    pageSize: PAGE_SIZE,

    totalRealServidor: totales.total_real,
    totalNecesarioServidor: totales.total_necesario,

    // Fetchers
    initialize,
    fetchMovimientos,
    fetchDescripciones,
    reorderMovimiento,
    updateMovimientoInline,
    cambiarEstadoMovimiento,
  }
}
