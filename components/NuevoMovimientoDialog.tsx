'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import { AlertTriangle, Upload, X, FileText, Download } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { trackCreatedPago } from '@/hooks/use-employee-notifications'
import type { Categoria, Subcategoria, SelectOption, BancoParcial, DescripcionOption } from '@/lib/types'
import { selectClasses, labelClasses, inputClasses } from '@/lib/dialog-styles'
import { movimientoBaseSchema, movimientoBancoSchema } from '@/lib/schemas'
import { parseInputMonto, formatInputMonto } from '@/lib/formatters'

interface InitialValues {
  concepto?: string
  monto?: string
  comentarios?: string
  fecha?: string
  prioridad?: 'baja' | 'media' | 'alta'
  categoria_id?: string
  subcategoria_id?: string
  descripcion_id?: string
  proveedor_id?: string
}

interface NuevoMovimientoDialogProps {
  isOpen: boolean
  onClose: () => void
  sucursalId: number
  onSuccess: () => void
  cajaTipo?: 'efectivo' | 'banco'
  isPagoPendiente?: boolean
  /** Cuando se provee, el dialog opera en modo "aprobar pago pendiente" */
  pagoIdToApprove?: number
  usuarioRevisorId?: number
  initialValues?: InitialValues
  /** Catálogos opcionales — si se proveen, el dialog no los re-fetchea */
  categoriasExternas?: Categoria[]
  bancosExternos?: SelectOption[]
  mediosPagoExternos?: SelectOption[]
  descripcionesExternas?: DescripcionOption[]
  proveedoresExternas?: SelectOption[]
  moneda?: 'ARS' | 'USD'
  /** Parciales de saldo real por banco (para validar transferencias internas) */
  parcialesBancos?: BancoParcial[]
}

export default function NuevoMovimientoDialog({
  isOpen,
  onClose,
  sucursalId,
  onSuccess,
  cajaTipo = 'efectivo',
  isPagoPendiente = false,
  pagoIdToApprove,
  usuarioRevisorId,
  initialValues,
  categoriasExternas,
  bancosExternos,
  mediosPagoExternos,
  descripcionesExternas,
  proveedoresExternas,
  moneda = 'ARS',
  parcialesBancos = [],
}: NuevoMovimientoDialogProps) {
  const isApprovalMode = pagoIdToApprove !== undefined
  const { user } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  // --- Transferencia interna entre bancos ---
  const [isTransferenciaInterna, setIsTransferenciaInterna] = useState(false)
  const [transferenciaData, setTransferenciaData] = useState({
    fecha: (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })(),
    concepto: '',
    descripcion: '',
    monto: '',
    banco_origen_id: '',
    banco_destino_id: '',
  })
  // ------------------------------------------
  const [formData, setFormData] = useState({
    fecha: (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })(),
    concepto: '',
    monto: '',
    comentarios: '',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    estado: (isPagoPendiente ? 'pendiente' : 'aprobado') as 'pendiente' | 'aprobado' | 'rechazado' | 'completado',
    tipo: isPagoPendiente ? 'egreso' : 'ingreso',
    tipo_movimiento: cajaTipo as 'efectivo' | 'banco',
    categoria_id: '',
    subcategoria_id: '',
    descripcion_id: '',
    descripcion_nombre: '', // nombre pendiente cuando el usuario quiere crear una nueva
    proveedor_id: '',
    comprobante: '',
    banco_id: '',
    medio_pago_id: '',
    numero_cheque: '',
    tipo_cambio: '',
  })

  const [categoriasInternas, setCategoriasInternas] = useState<Categoria[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [bancosInternos, setBancosInternos] = useState<SelectOption[]>([])
  const [mediosPagoInternos, setMediosPagoInternos] = useState<SelectOption[]>([])
  const [descripcionesInternas, setDescripcionesInternas] = useState<DescripcionOption[]>([])
  const [proveedoresInternos, setProveedoresInternos] = useState<SelectOption[]>([])

  // Usa los catálogos externos si se proveen, si no usa los internos (fetched)
  const categorias = categoriasExternas?.length ? categoriasExternas : categoriasInternas
  const bancos = bancosExternos?.length ? bancosExternos : bancosInternos
  const mediosPago = mediosPagoExternos?.length ? mediosPagoExternos : mediosPagoInternos
  const descripciones = descripcionesExternas?.length ? descripcionesExternas : descripcionesInternas
  const proveedores = proveedoresExternas?.length ? proveedoresExternas : proveedoresInternos

  const fetchCategorias = useCallback(async () => {
    if (categoriasExternas?.length) return
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.CATEGORIAS.GET_ALL)
      const data = await response.json()
      if (response.ok) setCategoriasInternas(data.data || [])
    } catch {
      // Non-critical
    }
  }, [categoriasExternas])

  const fetchBancos = useCallback(async () => {
    if (bancosExternos?.length) return
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.BANCOS.GET_ALL)
      const data = await response.json()
      if (response.ok) setBancosInternos(data.data || [])
    } catch {
      // Non-critical
    }
  }, [bancosExternos])

  const fetchMediosPago = useCallback(async () => {
    if (mediosPagoExternos?.length) return
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.MEDIOS_PAGO.GET_ALL)
      const data = await response.json()
      if (response.ok) setMediosPagoInternos(data.data || [])
    } catch {
      // Non-critical
    }
  }, [mediosPagoExternos])

  const fetchDescripciones = useCallback(async () => {
    if (descripcionesExternas?.length) return
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.GET_ACTIVE)
      const data = await response.json()
      if (response.ok) setDescripcionesInternas(data.data || [])
    } catch {
      // Non-critical
    }
  }, [descripcionesExternas])

  const fetchProveedores = useCallback(async () => {
    if (proveedoresExternas?.length) return
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.PROVEEDORES.GET_ALL)
      const data = await response.json()
      if (response.ok) setProveedoresInternos(data.data || [])
    } catch {
      // Non-critical
    }
  }, [proveedoresExternas])

  // Usamos ref para capturar initialValues e isApprovalMode sin hacerlos deps del effect.
  // El effect solo debe correr cuando el dialog se ABRE (isOpen cambia a true).
  const initialValuesRef = useRef(initialValues)
  const isApprovalModeRef = useRef(isApprovalMode)
  useEffect(() => {
    initialValuesRef.current = initialValues
    isApprovalModeRef.current = isApprovalMode
  })

  // Cargar datos y pre-poblar cuando se abre el dialog
  useEffect(() => {
    if (!isOpen) return

    fetchCategorias()
    fetchDescripciones()
    fetchProveedores()
    if (cajaTipo === 'banco') {
      fetchBancos()
      fetchMediosPago()
    }

    if (isApprovalModeRef.current && initialValuesRef.current) {
      const iv = initialValuesRef.current
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      setFormData(prev => ({
        ...prev,
        fecha: iv.fecha ?? todayStr,
        concepto: iv.concepto ?? '',
        monto: iv.monto ?? '',
        comentarios: iv.comentarios ?? '',
        prioridad: iv.prioridad ?? 'media',
        categoria_id: iv.categoria_id ?? '',
        subcategoria_id: iv.subcategoria_id ?? '',
        descripcion_id: iv.descripcion_id ?? '',
        proveedor_id: iv.proveedor_id ?? '',
        tipo: 'egreso',
        estado: 'aprobado',
      }))
    }
  }, [isOpen, cajaTipo, fetchCategorias, fetchBancos, fetchMediosPago, fetchDescripciones, fetchProveedores])

  // Cargar bancos/mediosPago cuando el usuario elige "banco" en tipo_movimiento
  useEffect(() => {
    if (formData.tipo_movimiento === 'banco' && bancos.length === 0) {
      fetchBancos()
      fetchMediosPago()
    }
  }, [formData.tipo_movimiento, bancos.length, fetchBancos, fetchMediosPago])

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (formData.categoria_id) {
      fetchSubcategorias(Number(formData.categoria_id))
    } else {
      setSubcategorias([])
    }
  }, [formData.categoria_id])

  const fetchSubcategorias = async (categoriaId: number) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.CONFIGURACION.SUBCATEGORIAS.GET_BY_CATEGORIA(categoriaId))
      const data = await response.json()
      if (response.ok) setSubcategorias(data.data || [])
    } catch {
      // Non-critical
    }
  }

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'monto' || name === 'tipo_cambio') {
      setFormData(prev => ({ ...prev, [name]: parseInputMonto(value) }))
      return
    }
    if (name === 'tipo') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        descripcion_id: '',
        descripcion_nombre: '',
        categoria_id: '',
        subcategoria_id: '',
      }))
    } else if (name === 'tipo_movimiento') {
      setFormData(prev => ({
        ...prev,
        tipo_movimiento: value as 'efectivo' | 'banco',
        banco_id: '',
        medio_pago_id: '',
        comprobante: '',
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      fecha: (() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })(),
      concepto: '',
      monto: '',
      comentarios: '',
      prioridad: 'media',
      estado: isPagoPendiente ? 'pendiente' : 'aprobado',
      tipo: isPagoPendiente ? 'egreso' : 'ingreso',
      tipo_movimiento: cajaTipo,
      categoria_id: '',
      subcategoria_id: '',
      descripcion_id: '',
      descripcion_nombre: '',
      proveedor_id: '',
      comprobante: '',
      banco_id: '',
      medio_pago_id: '',
      numero_cheque: '',
      tipo_cambio: '',
    })
    setSelectedFiles([])
    setError('')
  }

  // Cerrar dialog
  const handleClose = () => {
    resetForm()
    setIsTransferenciaInterna(false)
    setTransferenciaData({
      fecha: (() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })(),
      concepto: '',
      descripcion: '',
      monto: '',
      banco_origen_id: '',
      banco_destino_id: '',
    })
    onClose()
  }

  // Manejar selección de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/jpg'
      const isValidSize = file.size <= 10 * 1024 * 1024
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Solo se permiten PDF y JPG menores a 10MB')
      setTimeout(() => setError(''), 3000)
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Subir documentos después de crear el movimiento
  const uploadDocuments = async (movimientoId: number) => {
    if (selectedFiles.length === 0) return

    const endpoint =
      cajaTipo === 'banco'
        ? API_ENDPOINTS.CAJA_BANCO.UPLOAD_DOCUMENTO(movimientoId)
        : API_ENDPOINTS.MOVIMIENTOS.UPLOAD_DOCUMENTO(movimientoId)

    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        await apiFetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: {},
        })
      } catch (error) {
        console.error('Error al subir documento:', error)
      }
    }
  }

  // Guardar transferencia interna entre bancos
  const handleSaveTransferencia = async () => {
    if (!transferenciaData.banco_origen_id || !transferenciaData.banco_destino_id) {
      setError('Seleccioná banco origen y banco destino.')
      return
    }
    if (transferenciaData.banco_origen_id === transferenciaData.banco_destino_id) {
      setError('El banco origen y destino no pueden ser el mismo.')
      return
    }
    if (!transferenciaData.monto || parseFloat(transferenciaData.monto) <= 0) {
      setError('El monto debe ser mayor a cero.')
      return
    }
    // Validación de saldo real en el frontend (si tenemos los parciales)
    if (parcialesBancos.length > 0) {
      const parcial = parcialesBancos.find(p => p.banco_id?.toString() === transferenciaData.banco_origen_id)
      const saldoDisponible = Number(parcial?.total_real ?? 0)
      const montoSolicitado = parseFloat(transferenciaData.monto)
      if (montoSolicitado > saldoDisponible) {
        const simbolo = moneda === 'USD' ? 'US$' : '$'
        setError(
          `Saldo insuficiente. El banco origen tiene ${simbolo} ${saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de saldo real y no puede cubrir ${simbolo} ${montoSolicitado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        )
        return
      }
    }
    try {
      setIsSaving(true)
      setError('')
      const res = await apiFetch(API_ENDPOINTS.CAJA_BANCO.TRANSFERENCIA_INTERNA, {
        method: 'POST',
        body: JSON.stringify({
          sucursal_id: sucursalId,
          user_id: user?.id,
          fecha: transferenciaData.fecha,
          concepto: transferenciaData.concepto || 'Transferencia interna entre bancos',
          descripcion: transferenciaData.descripcion || null,
          monto: parseFloat(transferenciaData.monto),
          banco_origen_id: Number(transferenciaData.banco_origen_id),
          banco_destino_id: Number(transferenciaData.banco_destino_id),
          moneda: moneda,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al realizar transferencia')
      handleClose()
      onSuccess()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al realizar transferencia'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  // Guardar nuevo movimiento
  const handleSave = async () => {
    const isBanco = isApprovalMode ? cajaTipo === 'banco' : formData.tipo_movimiento === 'banco'
    const schema = isBanco ? movimientoBancoSchema : movimientoBaseSchema

    // Si hay una descripción nueva pendiente (sin ID), crearla antes de validar
    let descripcionId = formData.descripcion_id
    if (!descripcionId && formData.descripcion_nombre.trim()) {
      try {
        const res = await apiFetch(API_ENDPOINTS.CONFIGURACION.DESCRIPCIONES.CREATE, {
          method: 'POST',
          body: JSON.stringify({
            nombre: formData.descripcion_nombre.trim(),
            tipo: formData.tipo,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Error al crear descripción')
        descripcionId = data.data.id.toString()
        // Actualizar el estado para que la descripción quede persistida
        setFormData(prev => ({ ...prev, descripcion_id: descripcionId, descripcion_nombre: '' }))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear la descripción')
        return
      }
    }

    const validation = schema.safeParse({
      fecha: formData.fecha,
      concepto: formData.concepto,
      monto: formData.monto,
      categoria_id: formData.categoria_id,
      subcategoria_id: formData.subcategoria_id,
      descripcion_id: descripcionId,
      proveedor_id: formData.proveedor_id,
      comentarios: formData.comentarios,
      prioridad: formData.prioridad,
      ...(isBanco && {
        banco_id: formData.banco_id,
        medio_pago_id: formData.medio_pago_id,
      }),
    })

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Error de validación')
      return
    }

    if (moneda === 'USD' && (!formData.tipo_cambio || Number(formData.tipo_cambio) <= 0)) {
      setError('Debes ingresar un tipo de cambio válido')
      return
    }

    try {
      setIsSaving(true)
      setError('')

      // ── Modo aprobación: llama SOLO a APROBAR (que crea el movimiento internamente) ──
      if (isApprovalMode) {
        const aprobarRes = await apiFetch(API_ENDPOINTS.PAGOS_PENDIENTES.APROBAR(pagoIdToApprove!), {
          method: 'PUT',
          body: JSON.stringify({
            usuario_revisor_id: usuarioRevisorId ?? user?.id,
            tipo_caja: cajaTipo,
            fecha: formData.fecha,
            concepto: formData.concepto,
            comentarios: formData.comentarios,
            monto: parseFloat(formData.monto),
            prioridad: formData.prioridad,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
            descripcion_id: descripcionId ? Number(descripcionId) : null,
            proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
            comprobante: formData.comprobante || null,
            banco_id: formData.banco_id ? Number(formData.banco_id) : null,
            medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
          }),
        })
        const aprobarData = await aprobarRes.json()
        if (!aprobarRes.ok) throw new Error(aprobarData.message || 'Error al aprobar pago')

        // Subir documentos si hay alguno
        if (aprobarData.data?.movimiento_id) {
          await uploadDocuments(aprobarData.data.movimiento_id)
        }

        resetForm()
        onSuccess()
        onClose()
        return
      }

      // ── Modo normal: crear pago pendiente o movimiento directo ──
      const endpoint = isPagoPendiente
        ? API_ENDPOINTS.PAGOS_PENDIENTES.CREATE
        : cajaTipo === 'banco'
          ? API_ENDPOINTS.CAJA_BANCO.CREATE
          : API_ENDPOINTS.MOVIMIENTOS.CREATE_EFECTIVO

      const body = isPagoPendiente
        ? {
            sucursal_id: sucursalId,
            user_id: user?.id,
            fecha: formData.fecha,
            concepto: formData.concepto,
            comentarios: formData.comentarios,
            monto: parseFloat(formData.monto),
            tipo_movimiento: formData.tipo_movimiento,
            prioridad: formData.prioridad,
            tipo: formData.tipo,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
            descripcion_id: descripcionId ? Number(descripcionId) : null,
            proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
            banco_id: formData.banco_id ? Number(formData.banco_id) : null,
            medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
            numero_cheque: formData.numero_cheque || null,
            moneda,
            tipo_cambio: moneda === 'USD' && formData.tipo_cambio ? parseFloat(formData.tipo_cambio) : null,
          }
        : {
            sucursal_id: sucursalId,
            user_id: user?.id,
            fecha: formData.fecha,
            concepto: formData.concepto,
            monto: parseFloat(formData.monto),
            comentarios: formData.comentarios,
            prioridad: formData.prioridad,
            estado: formData.estado,
            tipo: formData.tipo,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
            descripcion_id: descripcionId ? Number(descripcionId) : null,
            proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
            comprobante: formData.comprobante,
            banco_id: formData.banco_id ? Number(formData.banco_id) : null,
            medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
            numero_cheque: formData.numero_cheque || null,
            moneda: moneda,
            tipo_cambio: moneda === 'USD' && formData.tipo_cambio ? parseFloat(formData.tipo_cambio) : null,
          }

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al crear movimiento')

      // Subir documentos si el movimiento se creó exitosamente y no es pago pendiente
      if (!isPagoPendiente && data.data?.id) {
        await uploadDocuments(data.data.id)
      }

      // Guardar el pago creado en localStorage para detectar cambios de fecha al aprobar
      if (isPagoPendiente && user?.id && data.data?.id) {
        trackCreatedPago(user.id, {
          id: data.data.id,
          fecha_original: formData.fecha,
          concepto: formData.concepto,
          sucursal_id: sucursalId,
        })
      }

      resetForm()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear movimiento'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden flex flex-col">
        {/* ─── Header ─── */}
        <div className="px-8 pt-8 pb-5 border-b border-[#F0F0F0] flex-shrink-0">
          <DialogHeader className="p-0 border-0">
            <DialogTitle className="text-xl font-bold text-[#1A1A1A] tracking-tight">
              {isApprovalMode ? 'Aprobar pago pendiente' : 'Nuevo movimiento'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#8A8F9C] mt-1">
              {isApprovalMode
                ? `Registra el egreso en caja ${cajaTipo === 'banco' ? 'banco' : 'efectivo'} para confirmar el pago`
                : `Registra un nuevo movimiento de ${cajaTipo === 'banco' ? 'banco' : 'efectivo'}`}
            </DialogDescription>
          </DialogHeader>
          {isApprovalMode && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 text-emerald-600 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-emerald-700 font-medium">
                Caja destino: <span className="font-bold">{cajaTipo === 'banco' ? 'Caja Banco' : 'Caja Efectivo'}</span>{' '}
                · Tipo fijo: <span className="font-bold">Egreso</span>
              </p>
            </div>
          )}
        </div>

        {/* ─── Body ─── */}
        <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          {/* ── Checkbox: Transferencia interna (solo en caja banco, no aprobación) ── */}
          {cajaTipo === 'banco' && !isApprovalMode && !isPagoPendiente && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all ${
                isTransferenciaInterna
                  ? 'border-[#002868] bg-[#EEF3FF]'
                  : 'border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#002868]/40'
              }`}
              onClick={() => setIsTransferenciaInterna(v => !v)}
            >
              <Checkbox
                id="transferencia_interna"
                checked={isTransferenciaInterna}
                onCheckedChange={v => setIsTransferenciaInterna(Boolean(v))}
                className="pointer-events-none"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#002868]">Transferencia entre bancos</span>
                <span className="text-xs text-[#8A8F9C]">Mover dinero de un banco a otro dentro de esta sucursal</span>
              </div>
            </div>
          )}

          {/* ── Formulario de transferencia interna ── */}
          {isTransferenciaInterna ? (
            <section className="space-y-4">
              <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-4 bg-[#002868] rounded-full" />
                Movimiento entre bancos
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="transferencia_fecha" className={labelClasses}>
                    Fecha
                  </Label>
                  <Input
                    id="transferencia_fecha"
                    type="date"
                    value={transferenciaData.fecha}
                    onChange={e =>
                      setTransferenciaData(p => ({
                        ...p,
                        fecha: e.target.value,
                      }))
                    }
                    className={inputClasses}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="transferencia_monto" className={labelClasses}>
                    Monto *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                      {moneda === 'USD' ? 'US$' : '$'}
                    </span>
                    <Input
                      id="transferencia_monto"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formatInputMonto(transferenciaData.monto)}
                      onChange={e =>
                        setTransferenciaData(p => ({
                          ...p,
                          monto: parseInputMonto(e.target.value),
                        }))
                      }
                      className={`${inputClasses} ${moneda === 'USD' ? 'pl-12' : 'pl-8'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transferencia_concepto" className={labelClasses}>
                  Concepto
                </Label>
                <Input
                  id="transferencia_concepto"
                  placeholder="Ej: Transferencia Galicia → BBVA"
                  value={transferenciaData.concepto}
                  onChange={e =>
                    setTransferenciaData(p => ({
                      ...p,
                      concepto: e.target.value,
                    }))
                  }
                  className={inputClasses}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transferencia_descripcion" className={labelClasses}>
                  Descripción
                </Label>
                <Input
                  id="transferencia_descripcion"
                  placeholder="Detalles adicionales (opcional)"
                  value={transferenciaData.descripcion}
                  onChange={e =>
                    setTransferenciaData(p => ({
                      ...p,
                      descripcion: e.target.value,
                    }))
                  }
                  className={inputClasses}
                />
              </div>

              {/* Origen → Destino */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="transferencia_origen" className={labelClasses}>
                    Banco Origen *
                  </Label>
                  <select
                    id="transferencia_origen"
                    value={transferenciaData.banco_origen_id}
                    onChange={e =>
                      setTransferenciaData(p => ({
                        ...p,
                        banco_origen_id: e.target.value,
                      }))
                    }
                    className={selectClasses}
                  >
                    <option value="">Seleccione banco origen</option>
                    {bancos
                      .filter(b => b.id.toString() !== transferenciaData.banco_destino_id)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="transferencia_destino" className={labelClasses}>
                    Banco Destino *
                  </Label>
                  <select
                    id="transferencia_destino"
                    value={transferenciaData.banco_destino_id}
                    onChange={e =>
                      setTransferenciaData(p => ({
                        ...p,
                        banco_destino_id: e.target.value,
                      }))
                    }
                    className={selectClasses}
                  >
                    <option value="">Seleccione banco destino</option>
                    {bancos
                      .filter(b => b.id.toString() !== transferenciaData.banco_origen_id)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Saldo real del banco origen */}
              {transferenciaData.banco_origen_id &&
                (() => {
                  const parcial = parcialesBancos.find(
                    p => p.banco_id?.toString() === transferenciaData.banco_origen_id,
                  )
                  const saldoOrigen = Number(parcial?.total_real ?? 0)
                  const montoSolicitado = parseFloat(transferenciaData.monto) || 0
                  const excede = montoSolicitado > 0 && montoSolicitado > saldoOrigen
                  const colorBg = excede ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                  const colorText = excede ? 'text-rose-700' : 'text-emerald-700'
                  const colorLabel = excede ? 'text-rose-500' : 'text-emerald-500'
                  return (
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border ${colorBg} transition-all`}
                    >
                      <div className="flex items-center gap-2">
                        {excede ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-white" />
                          </span>
                        )}
                        <span className={`text-xs font-semibold uppercase tracking-wide ${colorLabel}`}>
                          Saldo real disponible
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${colorText}`}>
                          {moneda === 'USD' ? 'US$' : '$'}{' '}
                          {saldoOrigen.toLocaleString('es-AR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {excede && (
                          <p className="text-xs text-rose-500 mt-0.5">
                            Faltan {moneda === 'USD' ? 'US$' : '$'}{' '}
                            {(montoSolicitado - saldoOrigen).toLocaleString('es-AR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}

              {/* Flecha visual */}
              {transferenciaData.banco_origen_id && transferenciaData.banco_destino_id && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="text-sm font-bold text-[#002868]">
                    {bancos.find(b => b.id.toString() === transferenciaData.banco_origen_id)?.nombre}
                  </span>
                  <span className="text-[#002868] text-lg">→</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {bancos.find(b => b.id.toString() === transferenciaData.banco_destino_id)?.nombre}
                  </span>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* ── Sección: Información General ── */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#002868] rounded-full" />
                  Información general
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fecha" className={labelClasses}>
                      Fecha
                    </Label>
                    <Input
                      id="fecha"
                      name="fecha"
                      type="date"
                      value={formData.fecha}
                      onChange={handleInputChange}
                      className={inputClasses}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo" className={labelClasses}>
                      Tipo *
                    </Label>
                    <select
                      id="tipo"
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      className={`${selectClasses} ${isPagoPendiente || isApprovalMode ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
                      disabled={isPagoPendiente || isApprovalMode}
                    >
                      {!isPagoPendiente && !isApprovalMode && <option value="ingreso">Ingreso</option>}
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelClasses}>
                    Descripción (Clasificación) *
                  </Label>
                  <Combobox
                    options={descripciones
                      .filter(d => !d.tipo || d.tipo === formData.tipo)
                      .map(d => ({ value: d.id.toString(), label: d.nombre }))}
                    value={formData.descripcion_id}
                    onChange={value => {
                      const selectedDesc = descripciones.find(d => d.id.toString() === value)
                      setFormData(prev => ({
                        ...prev,
                        descripcion_id: value,
                        descripcion_nombre: '',
                        ...(selectedDesc?.categoria_id && { categoria_id: selectedDesc.categoria_id.toString() }),
                        subcategoria_id: selectedDesc?.subcategoria_id
                          ? selectedDesc.subcategoria_id.toString()
                          : '',
                      }))
                    }}
                    onCreateOption={nombre => {
                      setFormData(prev => ({
                        ...prev,
                        descripcion_id: '',
                        descripcion_nombre: nombre,
                      }))
                    }}
                    pendingLabel={formData.descripcion_nombre || undefined}
                    placeholder="Seleccione o escriba una descripción"
                    searchPlaceholder="Buscar o crear descripción..."
                    emptyText="No hay descripciones para este tipo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="categoria_id" className={labelClasses}>
                      Categoría
                    </Label>
                    <select
                      id="categoria_id"
                      name="categoria_id"
                      value={formData.categoria_id}
                      onChange={handleInputChange}
                      className={selectClasses}
                    >
                      <option value="">Seleccione categoría</option>
                      {categorias
                        .filter(c => c.tipo === formData.tipo)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subcategoria_id" className={labelClasses}>
                      Subcategoría
                    </Label>
                    <select
                      id="subcategoria_id"
                      name="subcategoria_id"
                      value={formData.subcategoria_id}
                      onChange={handleInputChange}
                      disabled={!formData.categoria_id}
                      className={`${selectClasses} disabled:opacity-40 disabled:bg-[#FAFAFA] disabled:cursor-not-allowed`}
                    >
                      <option value="">Seleccione subcategoría</option>
                      {subcategorias.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comentarios" className={labelClasses}>
                    Comentarios
                  </Label>
                  <Input
                    id="comentarios"
                    name="comentarios"
                    placeholder="Comentarios adicionales (opcional)"
                    value={formData.comentarios}
                    onChange={handleInputChange}
                    className={inputClasses}
                  />
                </div>
              </section>

              {/* ── Separador ── */}
              <div className="border-t border-dashed border-[#E8E8E8]" />

              {/* ── Sección: Detalles Financieros ── */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#002868] rounded-full" />
                  Detalles financieros
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="monto" className={labelClasses}>
                      Monto *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                        {moneda === 'USD' ? 'US$' : '$'}
                      </span>
                      <Input
                        id="monto"
                        name="monto"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={formatInputMonto(formData.monto)}
                        onChange={handleInputChange}
                        className={`${inputClasses} ${moneda === 'USD' ? 'pl-12' : 'pl-8'}`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prioridad" className={labelClasses}>
                      Prioridad
                    </Label>
                    <select
                      id="prioridad"
                      name="prioridad"
                      value={formData.prioridad}
                      onChange={handleInputChange}
                      className={selectClasses}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                {moneda === 'USD' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo_cambio" className={labelClasses}>
                      Tipo de Cambio *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8A8F9C] select-none pointer-events-none">
                        $
                      </span>
                      <Input
                        id="tipo_cambio"
                        name="tipo_cambio"
                        type="text"
                        inputMode="decimal"
                        placeholder="Ej: 1.050,00"
                        value={formatInputMonto(formData.tipo_cambio)}
                        onChange={handleInputChange}
                        className={`${inputClasses} pl-8`}
                      />
                    </div>
                    <p className="text-xs text-[#8A8F9C]">Cotización del dólar al momento de la operación</p>
                  </div>
                )}

                {(cajaTipo === 'banco' || formData.tipo_movimiento === 'banco') && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="comprobante" className={labelClasses}>
                        N° Comprobante
                      </Label>
                      <Input
                        id="comprobante"
                        name="comprobante"
                        placeholder="Ej: 0001-00012345"
                        value={formData.comprobante}
                        onChange={handleInputChange}
                        className={inputClasses}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="banco_id" className={labelClasses}>
                          Banco
                        </Label>
                        <select
                          id="banco_id"
                          name="banco_id"
                          value={formData.banco_id}
                          onChange={handleInputChange}
                          className={selectClasses}
                        >
                          <option value="">Seleccione un banco</option>
                          {bancos.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="medio_pago_id" className={labelClasses}>
                          Medio de Pago
                        </Label>
                        <select
                          id="medio_pago_id"
                          name="medio_pago_id"
                          value={formData.medio_pago_id}
                          onChange={handleInputChange}
                          className={selectClasses}
                        >
                          <option value="">Seleccione medio de pago</option>
                          {mediosPago.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(() => {
                      const selectedMedio = mediosPago.find(m => m.id.toString() === formData.medio_pago_id)
                      const isCheque = selectedMedio && /cheque|echeq/i.test(selectedMedio.nombre)
                      return isCheque ? (
                        <div className="space-y-1.5">
                          <Label htmlFor="numero_cheque" className={labelClasses}>
                            N° de Cheque
                          </Label>
                          <Input
                            id="numero_cheque"
                            name="numero_cheque"
                            placeholder="Ej: 00012345"
                            value={formData.numero_cheque}
                            onChange={handleInputChange}
                            className={inputClasses}
                          />
                        </div>
                      ) : null
                    })()}
                  </>
                )}
              </section>

              {/* ── Separador ── */}
              <div className="border-t border-dashed border-[#E8E8E8]" />

              {/* ── Sección: Detalles adicionales ── */}
              <section className="space-y-4">
                <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#002868] rounded-full" />
                  Detalles adicionales
                </h4>

                {/* CAMPO PROVEEDOR — oculto temporalmente a pedido del cliente. Descomentar para reactivar.
                <div className="space-y-1.5">
                  <Label htmlFor="proveedor_id" className={labelClasses}>
                    Proveedor *
                  </Label>
                  <select
                    id="proveedor_id"
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleInputChange}
                    className={selectClasses}
                  >
                    <option value="">Seleccione proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                */}

                {!isPagoPendiente && (
                  <div className="space-y-1.5">
                    <Label htmlFor="estado" className={labelClasses}>
                      Estado
                    </Label>
                    <select
                      id="estado"
                      name="estado"
                      value={formData.estado}
                      onChange={handleInputChange}
                      className={selectClasses}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="completado">Completado</option>
                      <option value="rechazado">Rechazado</option>
                    </select>
                  </div>
                )}
              </section>
            </> /* end normal form */
          )}

          {/* ─── Sección de Comprobantes ─── */}
          <div className="px-8 py-4 border-t border-dashed border-[#E8E8E8] flex-shrink-0">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#002868] uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-4 bg-[#002868] rounded-full" />
                Adjuntar comprobantes
              </h4>
              <p className="text-xs text-[#8A8F9C]">
                Podés adjuntar facturas u órdenes de pago en formato PDF o JPG (máx. 10MB cada uno)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/jpg"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-10 border-dashed border-2 border-[#E0E0E0] text-[#5A6070] hover:border-[#002868] hover:text-[#002868] hover:bg-[#F0F8FF] transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar archivos
              </Button>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#E0E0E0]"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-[#002868] flex-shrink-0" />
                        <span className="text-sm text-[#1A1A1A] truncate">{file.name}</span>
                        <span className="text-xs text-[#8A8F9C] flex-shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-6 w-6 p-0 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="px-8 py-5 border-t border-[#F0F0F0] bg-[#FAFBFC] space-y-3 flex-shrink-0">
          {/* Error visible siempre en el footer */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-sm text-rose-600 font-medium">{error}</p>
            </div>
          )}
          <DialogFooter className="sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="h-10 px-5 rounded-lg border-[#E0E0E0] text-[#5A6070] font-medium hover:bg-[#F0F0F0] hover:text-[#1A1A1A] hover:border-[#C0C0C0] transition-all cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={isTransferenciaInterna ? handleSaveTransferencia : handleSave}
              disabled={
                isSaving ||
                (() => {
                  if (!isTransferenciaInterna || !transferenciaData.banco_origen_id || !transferenciaData.monto)
                    return false
                  const parcial = parcialesBancos.find(
                    p => p.banco_id?.toString() === transferenciaData.banco_origen_id,
                  )
                  const saldo = Number(parcial?.total_real ?? 0)
                  return parseFloat(transferenciaData.monto) > saldo
                })()
              }
              className={`h-10 px-6 rounded-lg text-white font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isTransferenciaInterna
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isApprovalMode
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#002868] hover:bg-[#003d8f]'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isTransferenciaInterna ? 'Transfiriendo…' : isApprovalMode ? 'Aprobando…' : 'Creando…'}
                </span>
              ) : isTransferenciaInterna ? (
                'Confirmar transferencia'
              ) : isApprovalMode ? (
                'Confirmar y aprobar'
              ) : (
                'Crear movimiento'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
