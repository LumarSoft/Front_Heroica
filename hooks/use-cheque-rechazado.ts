'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { API_ENDPOINTS } from '@/lib/config'
import { apiFetch } from '@/lib/api'
import type { Transaction } from '@/lib/types'

/** Estado y guardado de la marca "cheque rechazado" de la caja banco */
export function useChequeRechazado(onSaved: () => void | Promise<void>) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const abrir = useCallback((t: Transaction) => setTransaction(t), [])
  const cerrar = useCallback(() => setTransaction(null), [])

  const confirmar = useCallback(
    async (motivo: string) => {
      if (!transaction) return
      const rechazado = !transaction.cheque_rechazado
      try {
        setIsSaving(true)
        const res = await apiFetch(API_ENDPOINTS.CAJA_BANCO.CHEQUE_RECHAZADO(transaction.id), {
          method: 'PATCH',
          body: JSON.stringify({ rechazado, motivo: rechazado ? motivo.trim() : undefined }),
        })
        const data: { message?: string } = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'No se pudo actualizar el cheque')
        toast.success(data.message || (rechazado ? 'Cheque marcado como rechazado' : 'Se quitó la marca'))
        setTransaction(null)
        await onSaved()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el cheque')
      } finally {
        setIsSaving(false)
      }
    },
    [transaction, onSaved],
  )

  return { transaction, isSaving, abrir, cerrar, confirmar }
}
