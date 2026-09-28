'use client'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import { movimientoBaseSchema, movimientoBancoSchema } from '@/lib/schemas'
import { trackCreatedPago } from '@/hooks/use-employee-notifications'
import type { NotificarEventoData } from '@/components/notificaciones/NotificarEventoDialog'
import type { NuevoMovimientoContext, MovimientoSubmitActions } from '@/lib/types'
export function useMovimientoSubmit(ctx: NuevoMovimientoContext): MovimientoSubmitActions {
  const {
    isApprovalMode,
    cajaTipo,
    formData,
    setFormData,
    isPagoPendiente,
    moneda,
    setError,
    setIsSaving,
    pagoIdToApprove,
    usuarioRevisorId,
    userId,
    resetForm,
    onSuccess,
    onClose,
    sucursalId,
    selectedFiles,
  } = ctx
  const uploadDocuments = async (movimientoId: number): Promise<void> => {
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al subir documento')
      }
    }
  }
  const handleSave = async (): Promise<void> => {
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
        const data: { message?: string; data?: { id: number } } = await res.json()
        if (!res.ok) throw new Error(data.message || 'Error al crear descripción')
        if (!data.data) throw new Error('Respuesta de descripción inválida')
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

    if (isPagoPendiente && !formData.comentarios.trim()) {
      setError('Las observaciones son obligatorias para un pago pendiente')
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
            usuario_revisor_id: usuarioRevisorId ?? userId,
            tipo_caja: cajaTipo,
            fecha: formData.fecha,
            concepto: formData.concepto,
            comentarios: formData.comentarios,
            monto: parseFloat(formData.monto),
            prioridad: formData.prioridad,
            estado: formData.estado,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            subcategoria_id: formData.subcategoria_id ? Number(formData.subcategoria_id) : null,
            descripcion_id: descripcionId ? Number(descripcionId) : null,
            proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
            comprobante: formData.comprobante || null,
            banco_id: formData.banco_id ? Number(formData.banco_id) : null,
            medio_pago_id: formData.medio_pago_id ? Number(formData.medio_pago_id) : null,
            numero_cheque: formData.numero_cheque?.trim() || null,
          }),
        })
        const aprobarData: { message?: string; data?: { id?: number; movimiento_id?: number } } =
          await aprobarRes.json()
        if (!aprobarRes.ok) throw new Error(aprobarData.message || 'Error al aprobar pago')

        // Subir documentos si hay alguno
        const movimientoId = aprobarData.data?.movimiento_id ?? aprobarData.data?.id
        if (movimientoId) {
          await uploadDocuments(movimientoId)
        }

        resetForm()
        onSuccess(pagoIdToApprove ? { tipo: 'pago_pendiente_aprobado', entidadId: pagoIdToApprove } : undefined)
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
            user_id: userId,
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
            user_id: userId,
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

      const data: { message?: string; data?: { id: number } } = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al crear movimiento')

      // Subir documentos si el movimiento se creó exitosamente y no es pago pendiente
      if (!isPagoPendiente && data.data?.id) {
        await uploadDocuments(data.data.id)
      }

      // Guardar el pago creado en localStorage para detectar cambios de fecha al aprobar
      if (isPagoPendiente && userId && data.data?.id) {
        trackCreatedPago(userId, {
          id: data.data.id,
          fecha_original: formData.fecha,
          concepto: formData.concepto,
          sucursal_id: sucursalId,
        })
      }

      const createdId = Number(data?.data?.id)
      const notify: NotificarEventoData | undefined =
        isPagoPendiente && Number.isFinite(createdId) && createdId > 0
          ? { tipo: 'pago_pendiente_creado', entidadId: createdId }
          : undefined

      resetForm()
      onSuccess(notify)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear movimiento'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }
  return { handleSave }
}
