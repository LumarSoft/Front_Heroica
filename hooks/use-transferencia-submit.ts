'use client'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/config'
import type { NuevoMovimientoContext, TransferenciaSubmitActions } from '@/lib/types'
export function useTransferenciaSubmit(ctx: NuevoMovimientoContext): TransferenciaSubmitActions {
  const {
    transferenciaData,
    setError,
    parcialesBancos,
    moneda,
    setIsSaving,
    sucursalId,
    userId,
    handleClose,
    onSuccess,
  } = ctx
  const handleSaveTransferencia = async (): Promise<void> => {
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
          user_id: userId,
          fecha: transferenciaData.fecha,
          concepto: transferenciaData.concepto || 'Transferencia interna entre bancos',
          descripcion: transferenciaData.descripcion || null,
          monto: parseFloat(transferenciaData.monto),
          banco_origen_id: Number(transferenciaData.banco_origen_id),
          banco_destino_id: Number(transferenciaData.banco_destino_id),
          moneda: moneda,
        }),
      })
      const data: { message?: string } = await res.json()
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
  return { handleSaveTransferencia }
}
