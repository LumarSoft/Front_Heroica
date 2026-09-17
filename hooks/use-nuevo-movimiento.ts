'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { parseInputMonto } from '@/lib/formatters'
import { isMedioPagoChequeLike } from '@/lib/cheque'
import { initialMovimientoForm, initialTransferenciaForm, fechaHoyMovimiento } from '@/lib/movimiento-form'
import { useMovimientoCatalogos } from './use-movimiento-catalogos'
import type { NuevoMovimientoDialogProps, NuevoMovimientoContext, MovimientoInputEvent } from '@/lib/types'
export function useNuevoMovimiento(props: NuevoMovimientoDialogProps): NuevoMovimientoContext {
  const {
    cajaTipo = 'efectivo',
    isPagoPendiente = false,
    moneda = 'ARS',
    parcialesBancos = [],
    isOpen,
    initialValues,
    pagoIdToApprove,
    onClose,
  } = props
  const isApprovalMode = pagoIdToApprove !== undefined
  const { user } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTransferenciaInterna, setIsTransferenciaInterna] = useState(false)
  const [transferenciaData, setTransferenciaData] = useState(initialTransferenciaForm)
  const [formData, setFormData] = useState(() => initialMovimientoForm(cajaTipo, isPagoPendiente))
  const catalogos = useMovimientoCatalogos({ ...props, cajaTipo }, formData.categoria_id, formData.tipo_movimiento)
  const { mediosPago } = catalogos
  const valuesRef = useRef(initialValues)
  useEffect(() => {
    valuesRef.current = initialValues
  }, [initialValues])
  useEffect(() => {
    if (!isOpen) return
    const iv = valuesRef.current
    setFormData({
      ...initialMovimientoForm(cajaTipo, isPagoPendiente),
      ...(isApprovalMode && iv
        ? {
            fecha: iv.fecha ?? fechaHoyMovimiento(),
            concepto: iv.concepto ?? '',
            monto: iv.monto ?? '',
            comentarios: iv.comentarios ?? '',
            prioridad: iv.prioridad ?? 'media',
            categoria_id: iv.categoria_id ?? '',
            subcategoria_id: iv.subcategoria_id ?? '',
            descripcion_id: iv.descripcion_id ?? '',
            proveedor_id: iv.proveedor_id ?? '',
            tipo: 'egreso' as const,
            estado: 'aprobado' as const,
          }
        : {}),
    })
  }, [isOpen, cajaTipo, isPagoPendiente, isApprovalMode])
  const handleInputChange = useCallback(
    (e: MovimientoInputEvent) => {
      const { name, value } = e.target
      if (name === 'monto' || name === 'tipo_cambio') {
        setFormData(prev => ({ ...prev, [name]: parseInputMonto(value) }))
        return
      }
      if (name === 'tipo') {
        setFormData(prev => ({
          ...prev,
          tipo: value === 'egreso' ? 'egreso' : 'ingreso',
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
          numero_cheque: '',
        }))
      } else if (name === 'medio_pago_id') {
        const medioSeleccionado = mediosPago.find(medio => String(medio.id) === value)
        setFormData(prev => ({
          ...prev,
          medio_pago_id: value,
          numero_cheque: isMedioPagoChequeLike(medioSeleccionado?.nombre) ? prev.numero_cheque : '',
        }))
      } else {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
    },
    [mediosPago],
  )
  const resetForm = useCallback(() => {
    setFormData(initialMovimientoForm(cajaTipo, isPagoPendiente))
    setSelectedFiles([])
    setError('')
  }, [cajaTipo, isPagoPendiente])
  const handleClose = useCallback(() => {
    resetForm()
    setIsTransferenciaInterna(false)
    setTransferenciaData(initialTransferenciaForm())
    onClose()
  }, [resetForm, onClose])
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])
  return {
    ...props,
    cajaTipo,
    isPagoPendiente,
    moneda,
    parcialesBancos,
    isApprovalMode,
    userId: user?.id,
    isSaving,
    setIsSaving,
    error,
    setError,
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    formData,
    setFormData,
    transferenciaData,
    setTransferenciaData,
    isTransferenciaInterna,
    setIsTransferenciaInterna,
    ...catalogos,
    handleInputChange,
    resetForm,
    handleClose,
    handleFileSelect,
    handleRemoveFile,
  }
}
