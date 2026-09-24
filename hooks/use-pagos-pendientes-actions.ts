'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { PagoPendiente } from '@/lib/types'

interface AprobarMasivoDatos {
  tipo_caja: 'efectivo' | 'banco'
  banco_id?: number
  medio_pago_id?: number
  numero_cheque?: string
}

interface UsePagosPendientesActionsOptions {
  userId?: number
  selectedIds: Set<number>
  refreshPendientes: () => Promise<void>
  refreshSeguimiento: () => Promise<void>
  onPagoRechazado: (pagoId: number) => void
}

interface UsePagosPendientesActionsResult {
  actionError: string
  isSaving: boolean
  selectedPago: PagoPendiente | null
  tipoCaja: 'efectivo' | 'banco'
  motivoRechazo: string
  isAprobarDialogOpen: boolean
  isRechazarDialogOpen: boolean
  isAprobacionMovimientoOpen: boolean
  isAprobarMasivoOpen: boolean
  setMotivoRechazo: (value: string) => void
  setSelectedPago: (pago: PagoPendiente | null) => void
  setIsAprobarDialogOpen: (open: boolean) => void
  setIsRechazarDialogOpen: (open: boolean) => void
  setIsAprobacionMovimientoOpen: (open: boolean) => void
  setIsAprobarMasivoOpen: (open: boolean) => void
  openAprobar: (pago: PagoPendiente) => void
  selectCaja: (caja: 'efectivo' | 'banco') => void
  openRechazar: (pago: PagoPendiente) => void
  openRechazoMasivo: () => void
  rechazar: () => Promise<void>
  aprobarMasivo: (datos: AprobarMasivoDatos) => Promise<void>
}

export function usePagosPendientesActions({
  userId,
  selectedIds,
  refreshPendientes,
  refreshSeguimiento,
  onPagoRechazado,
}: UsePagosPendientesActionsOptions): UsePagosPendientesActionsResult {
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedPago, setSelectedPago] = useState<PagoPendiente | null>(null)
  const [tipoCaja, setTipoCaja] = useState<'efectivo' | 'banco'>('efectivo')
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [isAprobarDialogOpen, setIsAprobarDialogOpen] = useState(false)
  const [isRechazarDialogOpen, setIsRechazarDialogOpen] = useState(false)
  const [isAprobacionMovimientoOpen, setIsAprobacionMovimientoOpen] = useState(false)
  const [isAprobarMasivoOpen, setIsAprobarMasivoOpen] = useState(false)
  const [isRechazoMasivo, setIsRechazoMasivo] = useState(false)

  const openAprobar = useCallback((pago: PagoPendiente): void => {
    setSelectedPago(pago)
    setTipoCaja('efectivo')
    setIsAprobarDialogOpen(true)
  }, [])

  const selectCaja = useCallback((caja: 'efectivo' | 'banco'): void => {
    setTipoCaja(caja)
    setIsAprobarDialogOpen(false)
    setIsAprobacionMovimientoOpen(true)
  }, [])

  const openRechazar = useCallback((pago: PagoPendiente): void => {
    setSelectedPago(pago)
    setMotivoRechazo('')
    setIsRechazoMasivo(false)
    setIsRechazarDialogOpen(true)
  }, [])

  const openRechazoMasivo = useCallback((): void => {
    setSelectedPago(null)
    setMotivoRechazo('')
    setIsRechazoMasivo(true)
    setIsRechazarDialogOpen(true)
  }, [])

  const rechazar = useCallback(async (): Promise<void> => {
    if ((!selectedPago && !isRechazoMasivo) || !userId || !motivoRechazo.trim()) {
      setActionError('Debe proporcionar un motivo de rechazo')
      setTimeout(() => setActionError(''), 3000)
      return
    }

    try {
      setIsSaving(true)
      setActionError('')
      const response = await apiFetch(
        isRechazoMasivo
          ? API_ENDPOINTS.PAGOS_PENDIENTES.RECHAZAR_BULK
          : API_ENDPOINTS.PAGOS_PENDIENTES.RECHAZAR(selectedPago!.id),
        {
          method: 'PUT',
          body: JSON.stringify({
            usuario_revisor_id: userId,
            motivo_rechazo: motivoRechazo,
            ...(isRechazoMasivo && { ids: Array.from(selectedIds) }),
          }),
        },
      )
      const data: { message?: string } = await response.json()
      if (!response.ok) throw new Error(data.message || 'Error al rechazar pago')

      toast.success(isRechazoMasivo ? `${selectedIds.size} pagos rechazados` : 'Pago rechazado exitosamente')
      setIsRechazarDialogOpen(false)
      const pagoId = selectedPago?.id
      setIsRechazoMasivo(false)
      await Promise.all([refreshPendientes(), refreshSeguimiento()])
      if (pagoId) onPagoRechazado(pagoId)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Error al rechazar pago')
    } finally {
      setIsSaving(false)
    }
  }, [
    isRechazoMasivo,
    motivoRechazo,
    onPagoRechazado,
    refreshPendientes,
    refreshSeguimiento,
    selectedIds,
    selectedPago,
    userId,
  ])

  const aprobarMasivo = useCallback(
    async (datos: AprobarMasivoDatos): Promise<void> => {
      if (!userId || selectedIds.size === 0) return

      try {
        setIsSaving(true)
        setActionError('')
        const response = await apiFetch(API_ENDPOINTS.PAGOS_PENDIENTES.APROBAR_BULK, {
          method: 'PUT',
          body: JSON.stringify({ ids: Array.from(selectedIds), usuario_revisor_id: userId, ...datos }),
        })
        const data: { message?: string } = await response.json()
        if (!response.ok) throw new Error(data.message || 'Error al aprobar pagos')

        toast.success(`${selectedIds.size} pagos aprobados`)
        setIsAprobarMasivoOpen(false)
        await Promise.all([refreshPendientes(), refreshSeguimiento()])
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Error al aprobar pagos')
      } finally {
        setIsSaving(false)
      }
    },
    [refreshPendientes, refreshSeguimiento, selectedIds, userId],
  )

  return {
    actionError,
    isSaving,
    selectedPago,
    tipoCaja,
    motivoRechazo,
    isAprobarDialogOpen,
    isRechazarDialogOpen,
    isAprobacionMovimientoOpen,
    isAprobarMasivoOpen,
    setMotivoRechazo,
    setSelectedPago,
    setIsAprobarDialogOpen,
    setIsRechazarDialogOpen,
    setIsAprobacionMovimientoOpen,
    setIsAprobarMasivoOpen,
    openAprobar,
    selectCaja,
    openRechazar,
    openRechazoMasivo,
    rechazar,
    aprobarMasivo,
  }
}
